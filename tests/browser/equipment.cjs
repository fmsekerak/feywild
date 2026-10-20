/* Local-only browser integration: real API handlers + an in-memory SQLite D1 adapter.
   Requires Node 22+, Playwright, and Chromium. Never contacts the production API. */
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const database=require('../helpers/equipment-db.cjs');
(async()=>{
 const ctx=database();
 const profile={str:'12',dex:'16',con:'14',wis:'16',int:'12',cha:'16',characterLevel:'3',hpCalculationMode:'manual',manualMaxHp:'30',maxHp:'30',currentHp:'20',temporaryHp:'5',equipment:'Keep my equipment notes',customLegacy:'Keep this too'};
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
  const ac=async expected=>page.waitForFunction(n=>document.querySelector('[name="armorClass"]').value===String(n),expected);
  const row=id=>page.locator('.inventory-row[data-item-id="'+id+'"]');
  const equip=async(id,expected)=>{await row(id).locator('.equipment-toggle').click();await ac(expected);await page.waitForFunction(()=>document.getElementById('equipment-status').textContent==='Equipment saved.');};
  await page.goto(url,{waitUntil:'domcontentloaded'});await ac(13);
  assert.equal(await page.locator('#sheet-change-status').textContent(),'♡ All changes saved');
  await page.locator('#tab-inventory').click();await equip('leather',15);await equip('shield',18);
  await page.locator('#tab-stats').click();assert.match(await page.locator('#equipped-gear').textContent(),/Studded Leather/);
  assert.equal(await page.locator('#sheet-change-status').textContent(),'♡ All changes saved','Autosaved equipment does not create profile edits');
  await page.reload({waitUntil:'domcontentloaded'});await ac(18);
  await page.locator('#tab-inventory').click();await equip('weapon',18);
  await equip('plate',21);assert.equal(await row('leather').locator('.equipment-toggle').getAttribute('aria-pressed'),'false');
  await equip('shield2',20);assert.equal(await row('shield').locator('.equipment-toggle').getAttribute('aria-pressed'),'false');
  await row('shield2').getByRole('button',{name:'Decrease Shield',exact:true}).click();await ac(18);
  await row('shield2').getByRole('button',{name:'Increase Shield',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-item-id="shield2"] strong').textContent.includes('× 1'));
  assert.equal(await row('shield2').locator('.equipment-toggle').getAttribute('aria-pressed'),'false');
  await row('custom').locator('summary').click();await row('custom').getByLabel('Moonweave Vest equipment type').selectOption('breastplate');
  await row('custom').getByLabel('Moonweave Vest magic AC bonus').fill('1');await row('custom').getByRole('button',{name:'Save settings'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-item-id="custom"] .equipment-effect').textContent.includes('15 + DEX'));
  await equip('custom',17);
  // Failed writes leave the last confirmed equipment and AC untouched.
  await page.route('**/api/inventory/equipment',route=>route.fulfill({status:500,json:{error:'Simulated equipment save failure'}}));
  await row('plate').locator('.equipment-toggle').click();
  await page.waitForFunction(()=>document.getElementById('equipment-status').textContent.includes('Simulated'));
  assert.equal(await page.locator('[name="armorClass"]').inputValue(),'17');
  await page.unroute('**/api/inventory/equipment');
  // Successful write + failed refresh must not silently show stale AC.
  await page.route('**/api/inventory/items?*',route=>route.fulfill({status:500,json:{error:'Refresh failed'}}));
  await row('plate').locator('.equipment-toggle').click();
  await page.waitForFunction(()=>document.getElementById('equipment-status').textContent.includes('Change saved'));
  assert.equal(await page.locator('[name="armorClass"]').inputValue(),'');
  await page.unroute('**/api/inventory/items?*');await page.locator('#inventory-retry').click();await ac(18);
  await equip('custom',17);await page.locator('#tab-stats').click();
  await page.locator('[name="dex"]').fill('6');await ac(13);
  await page.locator('#saveProfile').click();await page.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Saved to'));
  await page.reload({waitUntil:'domcontentloaded'});await ac(13);assert.equal(await page.locator('[name="equipment"]').inputValue(),'Keep my equipment notes');
  assert.equal(JSON.parse(ctx.db.prepare("SELECT data_json FROM character_data WHERE section='profile'").get().data_json).customLegacy,'Keep this too');
  await page.locator('#tab-inventory').click();page.once('dialog',dialog=>dialog.accept());
  await row('custom').getByRole('button',{name:'Remove',exact:true}).click();await ac(8);
  await equip('leather',10);await equip('shield',13);
  await page.locator('#tab-stats').click();await page.locator('[name="dex"]').fill('16');await ac(18);
  if(process.env.SHEET_SCREENSHOTS_DIR){await page.locator('.stats-slot-equipped').screenshot({path:path.join(process.env.SHEET_SCREENSHOTS_DIR,'equipped-gear.png')});await page.locator('#tab-inventory').click();await page.screenshot({path:path.join(process.env.SHEET_SCREENSHOTS_DIR,'inventory-equipment.png'),fullPage:true});}
  await page.setViewportSize({width:390,height:844});
  for(const tab of ['inventory','stats']){await page.locator('#tab-'+tab).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,tab+' fits mobile');}
  assert.deepEqual(errors,[]);
  console.log('PASS: real API/SQLite equip, replacement, shield caps, quantity/deletion, custom armor, failure recovery, DEX recalculation, save/reload, legacy notes, mobile layout.');
 }finally{await browser?.close();server.close();ctx.db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
