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
  const page=await browser.newPage({viewport:{width:1440,height:1050}});page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const legacy={...profile,int:'16',classSpecialist2014:'',customLegacy:'Do not change my notes'};
  ctx.db.prepare("INSERT INTO character_data(character_id,section,data_json) VALUES('2','profile',?)").run(JSON.stringify(legacy));
  await page.addInitScript(()=>{sessionStorage.setItem('feywild-character-id','2');sessionStorage.setItem('feywild-character-name','Mion');});
  const url='http://127.0.0.1:'+server.address().port+'/character-profile.html#class-details';
  const loaded=()=>page.waitForFunction(()=>!document.getElementById('saveProfile').disabled&&!document.getElementById('artificer-reference').hidden);
  const clean=()=>page.waitForFunction(()=>document.getElementById('sheet-change-status').textContent==='♡ All changes saved');
  const save=async()=>{await page.locator('#saveProfile').click();await page.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Saved to'));return JSON.parse(ctx.db.prepare("SELECT data_json FROM character_data WHERE character_id='2' AND section='profile'").get().data_json);};
  const summary=()=>page.locator('#class-summary').innerText();
  await page.goto(url,{waitUntil:'domcontentloaded'});await loaded();await clean();
  assert.equal(await page.locator('#tab-class').getAttribute('aria-selected'),'true');
  assert.match(await summary(),/Prepared spells¹\n4/);
  assert.match(await summary(),/Spell save DC\n13/);
  assert.equal(await page.locator('#classSpecialist2014').inputValue(),'');
  assert.equal(await page.locator('#class-features summary').filter({hasText:'Flash of Genius'}).count(),0);
  await page.locator('#class-level-filter').selectOption('all');
  assert.equal(await page.locator('#class-features summary').filter({hasText:'Soul of Artifice'}).count(),1);
  assert.match(await page.locator('#class-features summary').filter({hasText:'Soul of Artifice'}).innerText(),/Later.*Level 20/);
  assert.equal(await page.locator('#class-progression tbody tr').count(),20);
  assert.equal(await page.locator('#class-infusions summary').count(),16);
  await page.locator('#class-infusion-search').fill('concentration');assert.equal(await page.locator('#class-infusions summary').count(),1);
  assert.match(await page.locator('#class-infusions').innerText(),/Mind Sharpener/);
  await page.locator('#class-infusion-search').fill('no such infusion');assert.match(await page.locator('#class-infusion-count').innerText(),/No matches/);
  await page.locator('#class-infusion-search').fill('');
  for(const id of ['alchemist','armorer','artillerist','battle-smith']){
   await page.locator('#class-specialist-view').selectOption(id);
   assert.equal(await page.locator('#class-specialists>.class-specialist').count(),1);
   assert.equal(await page.locator('#class-specialists tbody tr').count(),5);
   await clean();assert.equal(await page.locator('#classSpecialist2014').inputValue(),'','Browsing does not choose');
  }
  await page.locator('#class-specialist-view').selectOption('armorer');await page.locator('#class-use-specialist').click();
  assert.equal(await page.locator('#classSpecialist2014').inputValue(),'artificer:armorer');
  await page.waitForFunction(()=>document.getElementById('sheet-change-status').textContent.includes('Unsaved'));
  let saved=await save();assert.equal(saved.classSpecialist2014,'artificer:armorer');
  for(const key of ['features','proficiencies','equipment','customLegacy','currentHp','temporaryHp'])assert.equal(saved[key],legacy[key]);
  assert.ok(Object.keys(saved).length<=120,'Within profile field limit');
  await page.reload({waitUntil:'domcontentloaded'});await loaded();await clean();
  assert.equal(await page.locator('#class-specialist-view').inputValue(),'armorer');
  assert.match(await page.locator('#class-specialist-status').innerText(),/Chosen specialist: Armorer/);
  await page.locator('#characterLevel').selectOption('9');assert.match(await summary(),/Infused items\n3 \+ 2 armor/);
  await page.locator('#characterLevel').selectOption('20');assert.match(await summary(),/Prepared spells¹\n13/);assert.match(await summary(),/Cantrips known\n4/);
  assert.equal(await page.locator('#class-progression tr[aria-current="true"] td').first().textContent(),'20');
  await page.locator('#tab-stats').click();await page.locator('[name="int"]').fill('18');await page.locator('#tab-class').click();
  assert.match(await summary(),/Spell save DC\n18/);assert.match(await summary(),/Prepared spells¹\n14/);
  await page.locator('#characterLevel').selectOption('1');assert.equal(await page.locator('#class-use-specialist').isDisabled(),true);assert.match(await summary(),/Infused items\n0/);
  assert.equal(await page.locator('#classSpecialist2014').inputValue(),'artificer:armorer','Lowering level preserves choice');
  await page.locator('#characterLevel').selectOption('15');await page.locator('#class-specialist-view').selectOption('battle-smith');await page.locator('#class-use-specialist').click();
  assert.match(await page.locator('#class-companions').textContent(),/HP 81 · AC 17 · Attack \+9/);
  assert.equal(await page.locator('[name="armorClass"]').inputValue(),'13','Preview choices do not silently apply equipment bonuses');
  await page.locator('#class-open-spells').click();assert.equal(await page.locator('#tab-spells').getAttribute('aria-selected'),'true');await page.locator('#tab-class').click();
  await page.locator('#class-level-filter').selectOption('all');await page.locator('#class-specialists summary').filter({hasText:'Steel Defender'}).click();
  if(process.env.FEYWILD_TEST_SCREENSHOT_DIR){fs.mkdirSync(process.env.FEYWILD_TEST_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.FEYWILD_TEST_SCREENSHOT_DIR,'class-details-desktop.png'),fullPage:true});}
  await page.setViewportSize({width:390,height:844});
  for(const locator of ['#class-progression','#class-spell-index','#class-companions','#class-basics','#class-casting'])await page.locator(locator).evaluate(n=>n.closest('details').open=true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Reference fits mobile');
  assert.ok(await page.locator('#class-progression .class-table-scroll').evaluate(n=>n.scrollWidth>n.clientWidth),'Progression scrolls locally');
  if(process.env.FEYWILD_TEST_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.FEYWILD_TEST_SCREENSHOT_DIR,'class-details-mobile.png'),fullPage:true});
  await save();
  await page.route('**/assets/data/artificer-2014.json',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#class-retry').waitFor();await page.waitForFunction(()=>!document.getElementById('saveProfile').disabled);
  assert.equal(await page.locator('#classSpecialist2014').inputValue(),'artificer:battle-smith');saved=await save();assert.equal(saved.classSpecialist2014,'artificer:battle-smith');
  await page.unroute('**/assets/data/artificer-2014.json');await page.locator('#class-retry').click();await loaded();await clean();
  // A future/unknown saved ID survives load and save, including an unusually slow data response.
  ctx.db.prepare("UPDATE character_data SET data_json=? WHERE character_id='2' AND section='profile'").run(JSON.stringify({...saved,classSpecialist2014:'artificer:custom-future'}));
  await page.route('**/assets/data/artificer-2014.json',async route=>{await new Promise(resolve=>setTimeout(resolve,400));await route.continue();});
  await page.reload({waitUntil:'domcontentloaded'});await loaded();assert.match(await page.locator('#class-specialist-status').textContent(),/not recognized/);saved=await save();assert.equal(saved.classSpecialist2014,'artificer:custom-future');await clean();
  // Other characters retain their own class and never show Artificer features.
  const ruin=await browser.newPage();ruin.setDefaultTimeout(10000);ruin.on('pageerror',e=>errors.push(e.message));await ruin.addInitScript(()=>{sessionStorage.setItem('feywild-character-id','1');sessionStorage.setItem('feywild-character-name','Ruin');});
  await ruin.goto(url,{waitUntil:'domcontentloaded'});await ruin.waitForFunction(()=>!document.getElementById('saveProfile').disabled);
  assert.match(await ruin.locator('#class-details-title').innerText(),/Druid/);assert.equal(await ruin.locator('#artificer-reference').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: Artificer coverage/filtering, preview vs choice, profile save/reload, unknown values, level/INT updates, no implicit bonuses, failure/retry, mobile overflow, other classes.');
 }finally{await browser?.close();server.close();ctx.db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
