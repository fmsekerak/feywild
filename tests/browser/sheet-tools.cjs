/* Optional browser regression: requires Playwright + Chromium. API requests are mocked; no live character writes. */
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const assert=require('node:assert/strict');
(async()=>{
 const fs=require('fs'),http=require('http'),path=require('path');
 const server=http.createServer((req,res)=>{const p=path.join(__dirname,'../..',req.url.split('?')[0]);try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':p.endsWith('.html')?'text/html':'image/png');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end('missing');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));

 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote','--single-process'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 page.setDefaultTimeout(8000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('JS ERROR',e.message)});
 let saved={str:'12',dex:'16',con:'14',int:'12',wis:'16',cha:'16',characterLevel:'3',hpCalculationMode:'manual',manualMaxHp:'30',maxHp:'30',currentHp:'20',temporaryHp:'5',attacks:'Legacy weapon notes',backstory:'Preserve my story',customLegacy:'Do not delete',spellSlotMode:'manual',spellSlotTracker:JSON.stringify({1:{total:4,used:2},2:{total:2,used:1}}),'skill-Perception':true,'skillExpert-Perception':true};
 let character='Ruin';let failSave=false;
 await page.addInitScript(()=>{sessionStorage.setItem('feywild-character-id','2');sessionStorage.setItem('feywild-character-name','Ruin');});
 await page.route('**/api/**',async route=>{
  if(route.request().url().includes('/api/character-profile')){
   if(route.request().method()==='PUT'){
    if(failSave)return route.fulfill({status:500,json:{error:'Simulated save failure'}});
    saved=route.request().postDataJSON().data;return route.fulfill({json:{ok:true}});
   }
   return route.fulfill({json:{character:{name:character},data:saved}});
  }
  return route.fulfill({json:{items:[],characters:[],ok:true}});
 });
 const val=name=>page.locator('[name="'+name+'"]');
 await page.goto('http://127.0.0.1:'+server.address().port+'/character-profile.html',{timeout:10000});
 await page.waitForFunction(()=>window.FEYWILD_SESSION_TOOLS?.ready());
 await page.waitForTimeout(250);
 assert.equal(await page.locator('#sheet-change-status').textContent(),'♡ All changes saved');
 assert.equal(await val('passivePerception').inputValue(),'17');
 await page.locator('#sheet-hp-amount').fill('8');await page.locator('#sheet-damage').click();
 assert.equal(await val('currentHp').inputValue(),'17');assert.equal(await val('temporaryHp').inputValue(),'0');
 await page.waitForTimeout(80);assert.match(await page.locator('#sheet-change-status').textContent(),/Unsaved/);
 await page.locator('#sheet-hp-amount').fill('99');await page.locator('#sheet-heal').click();assert.equal(await val('currentHp').inputValue(),'30');
 await page.locator('#sheet-conditions select').first().selectOption('Poisoned');
 await val('inspiration2014').check();
 await page.getByRole('button',{name:'STR saving throw proficiency',exact:true}).click();
 await page.getByRole('button',{name:'Spend Wild Shape',exact:true}).click();
 await page.getByRole('button',{name:'+ Add attack',exact:true}).click();
 const attack=page.locator('.sheet-attack');await attack.getByLabel('Name',{exact:true}).fill('Rapier');
 await attack.getByLabel('Ability',{exact:true}).selectOption('dex');await attack.getByLabel('Proficient',{exact:true}).check();
 await attack.getByLabel('Damage dice (e.g. 1d8)',{exact:true}).fill('1d8');
 assert.match(await attack.locator('output').textContent(),/To hit \+5 · Damage 1d8\+3/);
 failSave=true;await page.locator('#saveProfile').click();await page.waitForTimeout(100);
 assert.match(await page.locator('#sheet-change-status').textContent(),/Unsaved/);
 failSave=false;await page.locator('#saveProfile').click();await page.waitForTimeout(100);
 assert.ok(Object.keys(saved).length<=120,'Payload fits existing field count limit');assert.ok(Object.values(saved).every(x=>typeof x==='boolean'||typeof x==='string'&&x.length<=8000),'Payload fits existing per-field limits');assert.equal(saved.customLegacy,'Do not delete');assert.equal(saved.attacks,'Legacy weapon notes');assert.equal(saved.backstory,'Preserve my story');
 assert.equal(saved['savingThrowProficient-str'],true);assert.equal(saved.inspiration2014,true);
 await page.reload();await page.waitForFunction(()=>window.FEYWILD_SESSION_TOOLS?.ready());
 assert.equal(await val('inspiration2014').isChecked(),true);assert.match(await page.locator('#sheet-conditions').textContent(),/Poisoned/);
 assert.match(await page.locator('#sheet-resources').textContent(),/1 \/ 2 remaining/);
 assert.match(await page.locator('.sheet-attack output').textContent(),/To hit \+5/);
 await val('currentHp').fill('10');
 await page.locator('#sheet-short-rest').click();await page.locator('#sheet-rest-dice').fill('1');await page.locator('#sheet-rest-dice').dispatchEvent('change');
 assert.equal(await val('currentHp').inputValue(),'10');
 await page.locator('#sheet-rest-cancel').click();assert.equal(await val('currentHp').inputValue(),'10');
 await page.locator('#sheet-short-rest').click();await page.locator('#sheet-rest-dice').fill('1');await page.locator('#sheet-rest-dice').dispatchEvent('change');
 assert.match(await page.locator('#sheet-rest-preview').textContent(),/Wild Shape: 1 → 2/);
 await page.locator('#sheet-rest-apply').click();assert.ok(Number(await val('currentHp').inputValue())>10);
 assert.match(await page.locator('#sheet-resources').textContent(),/2 \/ 2 remaining/);
 let state=JSON.parse(await val('sheetSessionTools').inputValue());assert.equal(state.hitDiceSpent,1);
 assert.equal(JSON.parse(await page.locator('#spellSlotTracker').inputValue())[1].used,2);
 await page.locator('#sheet-long-rest').click();await page.locator('#sheet-rest-apply').click();
 assert.equal(await val('currentHp').inputValue(),'30');
 assert.equal(JSON.parse(await page.locator('#spellSlotTracker').inputValue())[1].used,0);
 assert.equal(JSON.parse(await val('sheetSessionTools').inputValue()).hitDiceSpent,0);
 assert.match(await page.locator('#sheet-conditions').textContent(),/Poisoned/);
 assert.equal(await val('inspiration2014').isChecked(),true);
 if(process.env.SHEET_SCREENSHOTS_DIR)await page.screenshot({path:path.join(process.env.SHEET_SCREENSHOTS_DIR,'sheet-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow on mobile');
 if(process.env.SHEET_SCREENSHOTS_DIR)await page.screenshot({path:path.join(process.env.SHEET_SCREENSHOTS_DIR,'sheet-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: HP, conditions, Inspiration, saves, attack math, resource spend, failed save, persistence/legacy values, cancel/apply rests, spell recharge, mobile overflow, no JS errors.');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
