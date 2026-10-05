const choices=[...document.querySelectorAll('.row input')];
const selection=document.getElementById('selection');
const compare=document.getElementById('compare-button');
choices.forEach(input=>input.addEventListener('change',()=>{
  const selected=choices.filter(x=>x.checked);
  if(selected.length>2){input.checked=false;selection.textContent='每次最多比較兩個方向';return;}
  selection.textContent=selected.length?selected.map(x=>x.value.toUpperCase()).join(' + ')+' / 選擇兩個方向':'選擇兩個方向';
  compare.disabled=selected.length!==2;
}));
compare.addEventListener('click',()=>{const selected=choices.filter(x=>x.checked);if(selected.length===2)location.href=`compare.html?a=${selected[0].value}&b=${selected[1].value}`;});
