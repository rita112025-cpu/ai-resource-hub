// search.js - global search across both datasets
export function normalize(s){
  return (s||'').toString().toLowerCase();
}

export function matchesAstra(item, q){
  if(!q) return true;
  const nq = normalize(q);
  const hay = [
    item.title, item.description, item.category, item.useCase,
    (item.tags||[]).join(' '), item.source||'', item.notes||'', item.id||''
  ].map(normalize).join(' ');
  return hay.includes(nq);
}
export function matchesCodex(item, q){
  if(!q) return true;
  const nq = normalize(q);
  const hay = [
    item.name, item.title, item.description, item.category,
    (item.useCase||[]).join(' '), (item.tags||[]).join(' '),
    item.sourceName||'', (item.requires||[]).join(' '), item.notes||'', item.risk||'', item.id||''
  ].map(normalize).join(' ');
  return hay.includes(nq);
}

export function globalSearch(astraData, codexData, q){
  if(!q) return [];
  const results = [];
  astraData.forEach(item=>{
    if(matchesAstra(item,q)) results.push({source:'astra', item, score: scoreAstra(item,q)});
  });
  codexData.forEach(item=>{
    if(matchesCodex(item,q)) results.push({source:'codex', item, score: scoreCodex(item,q)});
  });
  // simple sort by featured + title
  results.sort((a,b)=>{
    const af = a.item.featured ? 1:0, bf = b.item.featured ? 1:0;
    if(bf!==af) return bf-af;
    return (a.item.title||a.item.name||'').localeCompare(b.item.title||b.item.name||'');
  });
  return results;
}

function scoreAstra(item,q){
  let s=0;
  const nq=normalize(q);
  if(normalize(item.title).includes(nq)) s+=10;
  if(normalize(item.category).includes(nq)) s+=5;
  return s;
}
function scoreCodex(item,q){
  let s=0;
  const nq=normalize(q);
  if(normalize(item.title).includes(nq) || normalize(item.name).includes(nq)) s+=10;
  if(normalize(item.category).includes(nq)) s+=5;
  return s;
}
