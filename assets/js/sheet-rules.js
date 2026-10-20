/* 2014 sheet helpers. UI-independent so HP, rest, and resource arithmetic can be tested. */
(function(root){
 'use strict';
 const integer=(value,min=0,max=99999)=>{
  if(value===null||value===undefined||String(value).trim()==='')return null;
  const n=Number(value);return Number.isInteger(n)&&n>=min&&n<=max?n:null;
 };
 const modifier=value=>{const n=integer(value,1,99);return n===null?null:Math.floor((n-10)/2);};
 const signed=n=>n>=0?'+'+n:String(n);
 function hpChange(current,temporary,maximum,amount,kind){
  const hp=integer(current),temp=String(temporary??'').trim()===''?0:integer(temporary),max=integer(maximum,1),n=integer(amount,1);
  if([hp,temp,max,n].includes(null))throw Error('Enter valid current, temporary, maximum HP and a positive whole-number amount.');
  if(kind==='damage'){const absorbed=Math.min(temp,n);return {current:Math.max(0,hp-(n-absorbed)),temporary:temp-absorbed};}
  if(kind==='heal')return {current:hp>=max?hp:Math.min(max,hp+n),temporary:temp};
  throw Error('Unknown HP action');
 }
 function attack(card,scores,proficiency){
  const mod=modifier(scores[card.ability]);
  const prof=integer(proficiency,0,20),hit=integer(card.hitBonus,-99,99),damage=integer(card.damageBonus,-99,99);
  if(mod===null||prof===null||hit===null||damage===null)return null;
  return {hit:mod+(card.proficient?prof:0)+hit,damage:(card.addAbilityDamage?mod:0)+damage,mod,prof};
 }
 function classResources(className,level,cha){
  const name=String(className).trim().toLowerCase(),l=integer(level,1,20);
  if(l===null)return [];
  if(name==='bard'){
   const m=modifier(cha);if(m===null)return [];
   return [{id:'bard-inspiration',name:'Bardic Inspiration',max:Math.max(1,m),recharge:l>=5?'short':'long',detail:'d'+(l>=15?12:l>=10?10:l>=5?8:6)+' · bonus action; refresh '+(l>=5?'short or long rest':'long rest')}];
  }
  if(name==='druid'&&l>=2)return [{id:'druid-wild-shape',name:'Wild Shape',max:l>=20?null:2,recharge:'short',detail:l>=20?'Unlimited uses (Archdruid)':'2 uses · refresh short or long rest; beast form limits still apply'}];
  return [];
 }
 const remaining=(max,spent)=>max===null?null:Math.max(0,max-Math.max(0,Number(spent)||0));
 const restRecovers=(recharge,kind)=>recharge==='short'||(kind==='long'&&recharge==='long');
 function hitDiceAfterLongRest(level,spent){return Math.max(0,spent-Math.max(1,Math.floor(level/2)));}
 function hitDieHealing(roll,con,durable=false){return Math.max(durable?Math.max(2,2*con):0,roll+con);}
 const CONDITIONS={
  Blinded:'You cannot see and automatically fail sight-based checks. Your attacks have disadvantage; attacks against you have advantage.',
  Charmed:'You cannot attack the charmer or target them with harmful abilities or magic. The charmer has advantage on social checks involving you.',
  Deafened:'You cannot hear and automatically fail hearing-based checks.',
  Frightened:'While the source of your fear is in sight, ability checks and attacks have disadvantage. You cannot willingly move closer to it.',
  Grappled:'Your speed is 0 and cannot benefit from bonuses. The grapple ends if the grappler is incapacitated or you are moved beyond its reach.',
  Incapacitated:'You cannot take actions or reactions. This also prevents bonus actions and ends concentration.',
  Invisible:'You cannot be seen without magic or a special sense, but noise and tracks can reveal your location. Your attacks have advantage and attacks against you have disadvantage; special senses may change this.',
  Paralyzed:'You are incapacitated, cannot move or speak, and automatically fail STR and DEX saves. Attacks against you have advantage; hits from within 5 feet are critical.',
  Petrified:'You become an unmoving substance, weigh ten times as much, and stop aging. You are incapacitated, unaware, and cannot move or speak; fail STR/DEX saves; attackers have advantage. Resist all damage; immune to poison/disease, with existing effects suspended.',
  Poisoned:'Your attack rolls and ability checks have disadvantage.',
  Prone:'You can crawl or stand by spending half your speed. Your attacks have disadvantage. Attacks against you have advantage from within 5 feet and disadvantage from farther away.',
  Restrained:'Your speed is 0 and cannot benefit from bonuses. Your attacks and DEX saves have disadvantage; attacks against you have advantage.',
  Stunned:'You are incapacitated, cannot move, and can speak only falteringly. You fail STR/DEX saves automatically, and attacks against you have advantage.',
  Unconscious:'You are incapacitated, unaware, cannot move or speak, drop held items, and fall prone. Fail STR/DEX saves; attacks against you have advantage and hits from within 5 feet are critical.'
 };
 const EXHAUSTION=['None','Disadvantage on ability checks','Speed halved','Disadvantage on attacks and saving throws','Hit point maximum halved','Speed becomes 0','Death'];
 const api={integer,modifier,signed,hpChange,attack,classResources,remaining,restRecovers,hitDiceAfterLongRest,hitDieHealing,CONDITIONS,EXHAUSTION};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.FEYWILD_SHEET_RULES=api;
})(typeof window==='object'?window:null);
