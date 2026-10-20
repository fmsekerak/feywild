/* Hayden-only Halfwit tracker.
   Source-derived class facts live in assets/data/halfwit-class.json.
   Unverified class progression is deliberately not invented. */
(() => {
 const pane=document.getElementById('halfwit-panel');
 if(!pane)return;
 const selected=(sessionStorage.getItem('feywild-character-name')||'').trim().toLowerCase();
 if(selected!=='hayden')return;
 pane.hidden=false;
 const remaining=document.getElementById('halfwitStupidityRemaining');
 const maximum=document.getElementById('halfwitStupidityMax');
 const guidance=document.getElementById('halfwit-resource-guidance');
 const milestoneList=document.getElementById('halfwit-milestones');
 const apply=document.getElementById('halfwit-use-listed-max');
 const level=document.getElementById('characterLevel');
 // Dynamically name inputs so unrelated character saves gain no Halfwit keys.
 remaining.name='halfwitStupidityRemaining';
 maximum.name='halfwitStupidityMax';
 let rules=null;
 const number=input=>{
  if(input.value.trim()==='')return null;
  const value=Number(input.value);
  return Number.isInteger(value)&&value>=0&&value<=99?value:null;
 };
 const emit=input=>input.dispatchEvent(new Event('input',{bubbles:true}));
 function notify(message){guidance.textContent=message+' · Select Save Character to keep changes.';}
 function clamp(){
  const max=number(maximum);
  if(max===null)return;
  const current=number(remaining);
  if(current!==null&&current>max){remaining.value=String(max);emit(remaining);}
 }
 function render(){
  if(!rules){guidance.textContent='Loading Halfwit reference…';return;}
  const currentLevel=Number(level?.value);
  const listed=rules.resource?.knownMaximumByLevel?.[String(currentLevel)];
  const hasListed=Number.isInteger(listed);
  apply.hidden=!hasListed;
  if(hasListed){
   apply.textContent='✧ Set verified maximum to '+listed;
   guidance.textContent='D&D Wiki lists '+listed+' Stupidity '+(listed===1?'Point':'Points')+' at level '+currentLevel+'. Apply explicitly; saved values are never overwritten automatically.';
  }else{
   guidance.textContent='Full level '+currentLevel+' Stupidity Point progression could not be verified. Set the maximum manually from the source.';
  }
  milestoneList.replaceChildren();
  const entries=(rules.knownMilestones||[]).filter(entry=>entry.level<=currentLevel);
  for(const entry of entries){
   const li=document.createElement('li');
   const label=document.createElement('strong');
   label.textContent='Level '+entry.level+': ';
   li.append(label,document.createTextNode(entry.features.join(', ')));
   milestoneList.append(li);
  }
  if(!entries.length){
   const li=document.createElement('li');
   li.textContent='No verified milestones for this level.';
   milestoneList.append(li);
  }
 }
 function updateValue(input,offset){
  const max=number(maximum);
  if(max===null){notify('Set the maximum first');return;}
  const current=number(remaining)??max;
  const next=Math.max(0,Math.min(max,current+offset));
  remaining.value=String(next);emit(remaining);
  notify(next+' of '+max+' Stupidity Points remaining');
 }
 document.getElementById('halfwit-spend-point')?.addEventListener('click',()=>updateValue(remaining,-1));
 document.getElementById('halfwit-restore-point')?.addEventListener('click',()=>updateValue(remaining,+1));
 for(const input of [maximum,remaining]){
  input.addEventListener('change',()=>{
   const valid=number(input);
   if(valid===null&&input.value.trim()!==''){input.value='';notify('Enter a whole number from 0 to 99');return;}
   clamp();
   notify('Halfwit resource updated');
  });
 }
 apply.addEventListener('click',()=>{
  if(!rules)return;
  const suggested=rules.resource?.knownMaximumByLevel?.[String(level.value)];
  if(!Number.isInteger(suggested))return;
  const previousMax=number(maximum),previousRemaining=number(remaining);
  const spent=previousMax===null||previousRemaining===null?0:Math.max(0,previousMax-previousRemaining);
  maximum.value=String(suggested);
  remaining.value=String(Math.max(0,suggested-spent));
  emit(maximum);emit(remaining);
  notify('Applied the verified level '+level.value+' maximum and preserved spent points where possible');
 });
 level?.addEventListener('input',render);
 document.addEventListener('feywild:profile-loaded',()=>{if(rules)render();});
 fetch('assets/data/halfwit-class.json').then(response=>{
  if(!response.ok)throw Error('Could not load Halfwit class data');
  return response.json();
 }).then(data=>{
  rules=data;
  render();
 }).catch(error=>{
  milestoneList.textContent='Class reference unavailable. Use the D&D Wiki link below.';
  guidance.textContent=error.message;
 });
})();
