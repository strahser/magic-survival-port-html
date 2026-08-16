'use strict';
(function(){
 const b=document.getElementById('simBtn');
 if(b)b.onclick=()=>{document.getElementById('simPane').textContent=runSuite();
  document.getElementById('simOv').classList.remove('hide');};
 const c=document.getElementById('simClose');
 if(c)c.onclick=()=>document.getElementById('simOv').classList.add('hide');
 const j=document.getElementById('simJson');
 if(j)j.onclick=()=>{const r=getReport();if(!r)return;
  const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='balance-report.json';a.click();};
})();