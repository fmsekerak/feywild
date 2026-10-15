/* Three illuminated crystals for each death-save track.
   Store a simple JSON value in the existing deathSaves D1 field. */
(() => {
 const field=document.querySelector('#combat [name="deathSaves"]');
 const successRoot=document.getElementById('death-success-gems');
 const failureRoot=document.getElementById('death-failure-gems');
 if(!field||!successRoot||!failureRoot)return;
 let successes=0,failures=0;
 const clamp=n=>Number.isInteger(n)?Math.min(3,Math.max(0,n)):0;
 function read(){
   try{
     const value=JSON.parse(field.value||'{}');
     if(value&&typeof value==='object'){
       successes=clamp(value.successes);
       failures=clamp(value.failures);
     }
   }catch{
     // Preserve old freeform death-save notes until the user interacts.
     successes=0;failures=0;
   }
   render();
 }
 function render(){
   for(const [root,count,label] of [[successRoot,successes,'success'],[failureRoot,failures,'failure']]){
     root.replaceChildren();
     for(let i=1;i<=3;i++){
       const button=document.createElement('button');
       button.type='button';
       button.className='combat-save-gem'+(i<=count?' lit':'');
       button.textContent='◆';
       button.setAttribute('aria-label',label+' '+i+' of 3');
       button.setAttribute('aria-pressed',String(i<=count));
       button.title=(i<=count?'Clear':'Mark')+' '+label+' '+i;
       button.addEventListener('click',()=>{
         const next=i===count?i-1:i;
         if(label==='success')successes=next;else failures=next;
         field.value=JSON.stringify({successes,failures});
         render();
       });
       root.append(button);
     }
   }
 }
 document.addEventListener('feywild:profile-loaded',read);
 read();
})();
