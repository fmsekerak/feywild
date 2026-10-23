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
  const speed=async n=>page.waitForFunction(value=>document.querySelector('[name="speed"]').value===String(value),n);
  const search=async text=>{await page.locator('#choose-race').click();await page.locator('#race-search').fill(text);};
  const choose=async(name,source)=>{await search(name);await page.getByRole('button',{name:'Choose '+name+' — '+source,exact:true}).click();};
  const save=async()=>{await page.locator('#saveProfile').click();await page.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Saved to'));};
  const saved=()=>JSON.parse(ctx.db.prepare("SELECT data_json FROM character_data WHERE character_id='1' AND section='profile'").get().data_json);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.getElementById('race-search').disabled&&!document.getElementById('saveProfile').disabled);
  await speed(30);assert.equal(await page.locator('#profile-race').textContent(),'Firbolg');
  assert.equal(await page.locator('#raceSelection2014').inputValue(),'','Legacy profiles are not assigned a source version');
  assert.equal(await page.locator('#race-source option').count(),30);
  await search('');assert.equal(await page.locator('.race-card').count(),20);await page.locator('#race-more').click();assert.equal(await page.locator('.race-card').count(),40);
  await search('Fairy');assert.equal(await page.locator('.race-card').count(),2);
  await page.locator('#race-source').selectOption('WBtW');assert.equal(await page.locator('.race-card').count(),1);
  await page.locator('#race-results summary').click();assert.match(await page.locator('#race-results').textContent(),/Fly equal to walking speed/);
  await page.locator('#race-source').selectOption('');await search('doesnotexist');assert.match(await page.locator('#race-results').textContent(),/No races match/);
  await choose('Satyr','MOT');await speed(35);
  assert.equal(await page.locator('#profile-race').textContent(),'Satyr');assert.equal(await page.locator('#profile-race-source').textContent(),'MOT');
  await page.waitForFunction(()=>document.getElementById('sheet-change-status').textContent.includes('Unsaved'));
  assert.equal(await page.locator('[name="dex"]').inputValue(),'16','Choosing a race does not double-count ability bonuses');
  assert.equal(await page.locator('[name="features"]').inputValue(),profile.features);
  const skillsBefore=await page.locator('[name="proficiencies"]').inputValue();
  await save();assert.equal(saved().customLegacy,'Keep this too');assert.equal(saved().features,profile.features);assert.equal(saved().proficiencies,skillsBefore);
  assert.equal(saved().currentHp,'20');assert.equal(saved().temporaryHp,'5');assert.equal(saved().equipment,'Keep my equipment notes');
  assert.equal(JSON.parse(saved().raceSelection2014).id,'satyr|MOT');
  await page.reload({waitUntil:'domcontentloaded'});await speed(35);
  await page.waitForFunction(()=>document.getElementById('sheet-change-status').textContent==='♡ All changes saved');
  assert.equal(await page.locator('#profile-race').textContent(),'Satyr');
  await choose('Fairy','WBtW');await speed(30);await choose('Elf (Wood)','PHB');await speed(35);
  await page.locator('#race-selected summary').click();assert.match(await page.locator('#race-selected').textContent(),/Mask of the Wild/);
  assert.match(await page.locator('#race-selected').textContent(),/Fey Ancestry/);
  await page.locator('#race-reset').click();await speed(30);assert.equal(await page.locator('#profile-race').textContent(),'Firbolg');
  await choose('Satyr','MPMM');await save();
  await page.route('**/assets/data/races-2014.json',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#race-retry').waitFor();await speed('');
  assert.equal(JSON.parse(await page.locator('#raceSelection2014').inputValue()).id,'satyr|MPMM');
  assert.equal(await page.locator('#profile-race').textContent(),'Satyr');
  await page.unroute('**/assets/data/races-2014.json');await page.locator('#race-retry').click();await speed(35);
  await page.waitForFunction(()=>document.getElementById('sheet-change-status').textContent==='♡ All changes saved');
  // A future/removed catalog ID stays intact and never silently applies a different race.
  const future={...saved(),raceSelection2014:JSON.stringify({id:'unknown|FUTURE',name:'Future race'})};
  ctx.db.prepare("UPDATE character_data SET data_json=? WHERE character_id='1' AND section='profile'").run(JSON.stringify(future));
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!document.getElementById('race-search').disabled&&!document.getElementById('saveProfile').disabled);await speed('');
  assert.equal(await page.locator('#profile-race').textContent(),'Future race');await save();assert.equal(JSON.parse(saved().raceSelection2014).id,'unknown|FUTURE');
  await choose('Satyr','MOT');await page.locator('#race-selected summary').click();
  if(process.env.SHEET_SCREENSHOTS_DIR)await page.locator('#race-panel').screenshot({path:path.join(process.env.SHEET_SCREENSHOTS_DIR,'race-panel.png')});
  await page.setViewportSize({width:390,height:844});await search('Firbolg');await page.locator('.race-card').first().locator('summary').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Race picker fits mobile');
  if(process.env.SHEET_SCREENSHOTS_DIR)await page.screenshot({path:path.join(process.env.SHEET_SCREENSHOTS_DIR,'race-mobile.png'),fullPage:true});
  const mion=await browser.newPage();await mion.addInitScript(()=>{sessionStorage.setItem('feywild-character-id','2');sessionStorage.setItem('feywild-character-name','Mion');});
  await mion.goto(url,{waitUntil:'domcontentloaded'});await mion.waitForFunction(()=>!document.getElementById('race-search').disabled&&!document.getElementById('saveProfile').disabled);
  assert.equal(await mion.locator('#profile-race').textContent(),'Puca');assert.equal(await mion.locator('#raceSelection2014').inputValue(),'');
  assert.deepEqual(errors,[]);
  console.log('PASS: race search/source filter, paging, selection/speed, no duplicated bonuses or overwritten traits, real D1 save/reload, reset, failed catalog/retry, unknown IDs, custom Puca, mobile layout.');
 }finally{await browser?.close();server.close();ctx.db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
