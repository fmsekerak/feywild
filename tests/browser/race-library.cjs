/* Local-only browser integration: real API handlers + an in-memory SQLite D1 adapter.
   Requires Node 22+, Playwright, and Chromium. Never contacts the production API. */
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const database=require('../helpers/equipment-db.cjs');
(async()=>{
 const ctx=database();
 const profile={str:'12',dex:'16',con:'14',wis:'16',int:'12',cha:'16',characterLevel:'3',hpCalculationMode:'manual',manualMaxHp:'30',maxHp:'30',currentHp:'20',temporaryHp:'5',equipment:'Keep my equipment notes',customLegacy:'Keep this too',features:JSON.stringify({version:1,items:[{id:'Feat:Alert',name:'Alert',category:'Feat',description:'Saved feat'}],notes:'My old feature notes'}),proficiencies:JSON.stringify({proficiencies:['Perception'],languages:['Sylvan']})};
 ctx.db.prepare("INSERT INTO character_data(character_id,section,data_json) VALUES('1','profile',?)").run(JSON.stringify(profile));
 for(const [id,name] of [['leather','Studded Leather'],['plate','Plate'],['shield','Shield +1'],['shield2','Shield'],['weapon','Rapier'],['custom','Moonweave Vest']])ctx.add(id,name);
 const modules={
  '/api/character-profile':await import('../../functions/api/character-profile.js'),
  '/api/inventory/characters':await import('../../functions/api/inventory/characters.js'),
  '/api/inventory/catalog':await import('../../functions/api/inventory/catalog.js'),
  '/api/inventory/items':await import('../../functions/api/inventory/items.js'),
  '/api/inventory/equipment':await import('../../functions/api/inventory/equipment.js')
 };
 const itemModule=await import('../../functions/api/inventory/items/[id].js');
 const root=path.resolve(__dirname,'../..');
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1');
   if(url.pathname.startsWith('/api/')){
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const id=url.pathname.startsWith('/api/inventory/items/')?url.pathname.split('/').at(-1):null;
    const endpoint=id?itemModule:modules[url.pathname];
    const method='onRequest'+req.method[0]+req.method.slice(1).toLowerCase();
    if(!endpoint?.[method]){res.statusCode=404;res.end();return;}
    const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const response=await endpoint[method]({request,env:ctx.env,params:{id}});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
   }
   const file=path.resolve(root,'.'+url.pathname);
   if(!file.startsWith(root+path.sep)){res.statusCode=403;res.end();return;}
   res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.html')?'text/html':'image/png');res.end(fs.readFileSync(file));
  }catch(error){res.statusCode=500;res.end('Local test error');console.error(error);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
  const page=await browser.newPage({viewport:{width:1440,height:1050}});page.setDefaultTimeout(8000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{sessionStorage.setItem('feywild-character-id','1');sessionStorage.setItem('feywild-character-name','Ruin');});
  const url='http://127.0.0.1:'+server.address().port+'/character-profile.html';
  ctx.db.prepare("INSERT INTO characters(id,name) VALUES('3','Crotus'),('4','Hayden')").run();
  const legacy={...profile,race:'Fairy',raceSelection2014:JSON.stringify({id:'fairy|WBtW',name:'Fairy'})};
  for(const id of ['1','2','3','4'])ctx.db.prepare("INSERT INTO character_data(character_id,section,data_json) VALUES(?,'profile',?) ON CONFLICT(character_id,section) DO UPDATE SET data_json=excluded.data_json").run(id,JSON.stringify(legacy));
  for(const [id,name,race,speed,source] of [['1','Ruin','Firbolg',30,'MPMM'],['2','Mion','Puca',30,''],['3','Crotus','Satyr',35,'MPMM'],['4','Hayden','Human',30,'PHB']]){
   const sheet=await browser.newPage({viewport:{width:1440,height:1050}});sheet.setDefaultTimeout(8000);sheet.on('pageerror',e=>errors.push(e.message));
   await sheet.addInitScript(({id,name})=>{sessionStorage.setItem('feywild-character-id',id);sessionStorage.setItem('feywild-character-name',name);},{id,name});
   await sheet.goto(url,{waitUntil:'domcontentloaded'});
   await sheet.waitForFunction(({race,speed,source})=>!document.getElementById('saveProfile').disabled&&document.getElementById('profile-race').textContent===race&&document.querySelector('[name="speed"]').value===String(speed)&&document.getElementById('profile-race-source').textContent===source,{race,speed,source});
   assert.equal(await sheet.locator('#choose-race,#race-browse,#race-reset,#race-search,#race-source,[name="raceSelection2014"]').count(),0,'No race-changing controls remain');
   assert.match(await sheet.locator('#race-selected').textContent(),name==='Mion'?/Custom race.*details will be added later/:new RegExp(race));
   assert.equal(await sheet.locator('[name="dex"]').inputValue(),'16');
   assert.equal(await sheet.locator('[name="features"]').inputValue(),legacy.features);
   await sheet.waitForFunction(()=>document.getElementById('sheet-change-status').textContent==='♡ All changes saved');
   await sheet.locator('#saveProfile').click();await sheet.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Saved to'));
   const saved=JSON.parse(ctx.db.prepare("SELECT data_json FROM character_data WHERE character_id=? AND section='profile'").get(id).data_json);
   assert.equal(saved.raceSelection2014,legacy.raceSelection2014,'Legacy choice retained as inert data');assert.equal(saved.race,legacy.race);
   for(const key of ['customLegacy','features','equipment','currentHp','temporaryHp'])assert.equal(saved[key],legacy[key]);
   await sheet.reload({waitUntil:'domcontentloaded'});await sheet.waitForFunction(speed=>!document.getElementById('saveProfile').disabled&&document.querySelector('[name="speed"]').value===String(speed),speed);
   assert.equal(await sheet.locator('#profile-race').textContent(),race,'Hardcoded race wins after save/reload');
   if(name==='Crotus'){
    await sheet.route('**/assets/data/races-2014.json',route=>route.fulfill({status:503,body:'Unavailable'}));
    await sheet.reload({waitUntil:'domcontentloaded'});await sheet.locator('#race-retry').waitFor();
    assert.equal(await sheet.locator('#profile-race').textContent(),'Satyr');assert.equal(await sheet.locator('[name="speed"]').inputValue(),'');
    await sheet.unroute('**/assets/data/races-2014.json');await sheet.locator('#race-retry').click();await sheet.waitForFunction(()=>document.querySelector('[name="speed"]').value==='35');
    await sheet.waitForFunction(()=>document.getElementById('sheet-change-status').textContent==='♡ All changes saved');
   }
   await sheet.setViewportSize({width:390,height:844});
   if(name!=='Mion')await sheet.locator('#race-selected summary').click();
   assert.equal(await sheet.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name+' fits mobile');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: all four fixed race assignments, no picker, stale saved choices ignored, correct base speed, save/reload preserves data, custom Puca, catalog failure/retry, mobile layout.');
 }finally{await browser?.close();server.close();ctx.db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
