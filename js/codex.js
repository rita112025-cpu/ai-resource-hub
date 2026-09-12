// codex.js - Codex module
import { getCodexFavorites, setCodexFavorites, getCodexInstalled, setCodexInstalled } from './storage.js';
import { matchesCodex } from './search.js';

const CATEGORIES = ["全部","Skill Development","CI / Debug","GitHub / PR","Code Migration","Productivity","Spreadsheet / Data","Research"];
const USECASES = ["全部","建立 Skill","整理文件","修 CI","分析錯誤","審 PR","程式遷移","重構","日常自動化","處理 Excel","資料分析","研究"];
const RISKS = ["全部","low","medium","high"];
const DEPS = ["全部","git","GitHub access","gh CLI","Composio CLI","Sentry access","Linear or Jira access"];

let data=[];
let filtered=[];
let state={
  q:'',
  category:'全部',
  useCase:'全部',
  risk:'全部',
  tags:new Set(),
  sort:'featured',
  favOnly:false,
  installedOnly:false,
  tagsExpanded:false,
  depsExpanded:false
};
let favSet=new Set();
let installedSet=new Set();
let els={};
let allTags=[];
let onUpdate=null;

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function $(id){ return document.getElementById(id); }

export function initCodex(elements, initialState, updateCb){
  els=elements; onUpdate=updateCb;
  if(initialState){
    state.q=initialState.q||'';
    state.category=initialState.category||'全部';
    state.useCase=initialState.useCase||'全部';
    state.risk=initialState.risk||'全部';
    state.tags=new Set(initialState.tag||[]);
    state.sort=initialState.sort||'featured';
    state.favOnly=!!initialState.fav;
    state.installedOnly=!!initialState.installed;
  }
  favSet=getCodexFavorites();
  installedSet=getCodexInstalled();
  bindEvents();
}
export function setCodexData(arr){
  data=arr.filter(x=>x && x.id && (x.title||x.name) && x.category);
  collectTags();
  renderChips();
  filterAndSort();
  renderFeatured();
  renderMySkills();
}
function collectTags(){
  const map={};
  data.forEach(r=> (r.tags||[]).forEach(t=> map[t]=(map[t]||0)+1));
  allTags=Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([tag,count])=>({tag,count}));
}
function renderChips(){
  if(!els.categoryFilters) return;
  els.categoryFilters.innerHTML='';
  CATEGORIES.forEach(cat=>{
    const b=document.createElement('button'); b.className='chip'+(state.category===cat?' active codex':''); b.textContent=cat;
    b.addEventListener('click',()=>{ state.category=cat; filterAndSort(); sync(); });
    els.categoryFilters.appendChild(b);
  });
  if(els.useCaseFilters){
    els.useCaseFilters.innerHTML='';
    USECASES.forEach(uc=>{
      const b=document.createElement('button'); b.className='chip'+(state.useCase===uc?' active codex':''); b.textContent=uc;
      b.addEventListener('click',()=>{ state.useCase=uc; filterAndSort(); sync(); });
      els.useCaseFilters.appendChild(b);
    });
  }
  if(els.riskFilters){
    els.riskFilters.innerHTML='';
    RISKS.forEach(r=>{
      const b=document.createElement('button'); b.className='chip'+(state.risk===r?' active codex':''); b.textContent=r==='全部'?'全部風險':r;
      b.addEventListener('click',()=>{ state.risk=r; filterAndSort(); sync(); });
      els.riskFilters.appendChild(b);
    });
  }
  if(els.dependencyFilters){
    els.dependencyFilters.innerHTML='';
    const list = state.depsExpanded ? DEPS : DEPS.slice(0,6);
    list.forEach(d=>{
      const b=document.createElement('button'); b.className='chip'+(state.tags.has(d)|| (state.q && d.toLowerCase().includes(state.q.toLowerCase())) ? '' : ''); // dependency is separate, use requires matching
      // Actually dependency filter uses requires, not tags. We'll filter via requires.
      b.textContent=d;
      b.classList.add('tag');
      if(state.tags.has(d)) b.classList.add('active','codex');
      b.addEventListener('click',()=>{
        if(state.tags.has(d)) state.tags.delete(d); else state.tags.add(d);
        filterAndSort(); renderChips(); sync();
      });
      els.dependencyFilters.appendChild(b);
    });
    if(els.toggleDepsBtn) els.toggleDepsBtn.textContent = state.depsExpanded ? '收合' : '顯示全部';
  }
  if(els.tagFilters){
    els.tagFilters.innerHTML='';
    els.tagFilters.classList.toggle('collapsed', !state.tagsExpanded);
    allTags.forEach(({tag,count})=>{
      const b=document.createElement('button'); b.className='chip tag'+(state.tags.has(tag)?' active codex':''); b.textContent=`${tag} ${count}`;
      b.addEventListener('click',()=>{
        if(state.tags.has(tag)) state.tags.delete(tag); else state.tags.add(tag);
        filterAndSort(); renderChips(); sync();
      });
      els.tagFilters.appendChild(b);
    });
    if(els.toggleTagsBtn) els.toggleTagsBtn.textContent = state.tagsExpanded ? '收合' : `顯示全部 (${allTags.length})`;
  }
}

function filterAndSort(){
  let res=data.slice();
  if(state.favOnly) res=res.filter(r=> favSet.has(r.id));
  if(state.installedOnly) res=res.filter(r=> installedSet.has(r.id));
  if(state.category!=='全部') res=res.filter(r=> r.category===state.category);
  if(state.useCase!=='全部') res=res.filter(r=> (r.useCase||[]).includes(state.useCase));
  if(state.risk!=='全部') res=res.filter(r=> r.risk===state.risk);
  // tags AND (tags or requires)
  if(state.tags.size){
    res=res.filter(r=>{
      const combined = [...(r.tags||[]), ...(r.requires||[])];
      return [...state.tags].every(t=> combined.includes(t) || (r.requires||[]).some(req=> req.toLowerCase().includes(t.toLowerCase())));
    });
  }
  if(state.q) res=res.filter(r=> matchesCodex(r, state.q));
  if(state.sort==='name') res.sort((a,b)=>(a.title||a.name||'').localeCompare(b.title||b.name||''));
  else if(state.sort==='newest') res.sort((a,b)=>(b.added||'').localeCompare(a.added||''));
  else if(state.sort==='risk'){ const order={low:0, medium:1, high:2}; res.sort((a,b)=>(order[a.risk]??9)-(order[b.risk]??9)); }
  else res.sort((a,b)=>{ const fa=a.featured?1:0, fb=b.featured?1:0; if(fb!==fa) return fb-fa; return (a.title||a.name||'').localeCompare(b.title||b.name||''); });
  filtered=res;
  renderResources();
  renderMySkills();
  updateResultCount();
}
function updateResultCount(){
  if(els.resultCount) els.resultCount.textContent = `Codex：${filtered.length} / ${data.length}`;
}
function createCard(r){
  const card=document.createElement('article'); card.className='card'; card.dataset.id=r.id;
  const top=document.createElement('div'); top.className='card-top';
  const title=document.createElement('h3'); title.className='card-title'; title.textContent=r.title||r.name;
  const favBtn=document.createElement('button'); favBtn.className='fav-btn'+(favSet.has(r.id)?' active':''); favBtn.textContent=favSet.has(r.id)?'★':'☆'; favBtn.setAttribute('aria-label','收藏');
  favBtn.addEventListener('click',()=>{ toggleFav(r.id); });
  top.appendChild(title); top.appendChild(favBtn);
  const badges=document.createElement('div'); badges.className='badges';
  const catBadge=document.createElement('span'); catBadge.className='badge cat codex'; catBadge.textContent=r.category; badges.appendChild(catBadge);
  if(r.risk){ const riskBadge=document.createElement('span'); riskBadge.className='badge risk-'+r.risk; riskBadge.textContent=`risk: ${r.risk}`; badges.appendChild(riskBadge); }
  if(r.featured){ const f=document.createElement('span'); f.className='badge'; f.textContent='精選'; f.style.borderColor='var(--accent-codex)'; f.style.color='var(--accent-codex)'; badges.appendChild(f); }
  if(installedSet.has(r.id)){ const ins=document.createElement('span'); ins.className='badge'; ins.textContent='已安裝 (手動標記)'; ins.style.borderColor='var(--accent)'; ins.style.color='var(--accent)'; badges.appendChild(ins); }
  // capabilities
  if(r.capabilities){
    Object.entries(r.capabilities).forEach(([k,v])=>{
      if(v===true){ const b=document.createElement('span'); b.className='badge'; b.textContent=k; badges.appendChild(b); }
    });
  }
  const desc=document.createElement('p'); desc.className='desc'; desc.textContent=r.description||'';
  const tagsRow=document.createElement('div'); tagsRow.className='tags-row';
  (r.tags||[]).forEach(t=>{
    const el=document.createElement('button'); el.className='tag'; el.textContent=t;
    el.addEventListener('click',()=>{ if(!state.tags.has(t)){ state.tags.add(t); filterAndSort(); renderChips(); sync(); } });
    tagsRow.appendChild(el);
  });
  const meta=document.createElement('div'); meta.className='meta';
  if(r.requires && r.requires.length) meta.innerHTML+=`<span>依賴：${escapeHtml(r.requires.join(', '))}</span>`;
  if(r.added) meta.innerHTML+=`<span>加入：${escapeHtml(r.added)}</span>`;
  if(r.sourceRepo) meta.innerHTML+=`<span>來源：${escapeHtml(r.sourceName||'')}</span>`;
  const actions=document.createElement('div'); actions.className='card-actions';
  if(r.skillUrl){ const a=document.createElement('a'); a.href=r.skillUrl; a.target='_blank'; a.rel='noopener noreferrer'; a.className='btn secondary small'; a.textContent='查看 Skill'; actions.appendChild(a); }
  if(r.sourceRepo){ const a=document.createElement('a'); a.href=r.sourceRepo; a.target='_blank'; a.rel='noopener noreferrer'; a.className='btn secondary small'; a.textContent='Source Repo'; actions.appendChild(a); }
  if(r.installCommand){
    const b=document.createElement('button'); b.className='btn small'; b.textContent='複製安裝指令';
    b.addEventListener('click',()=> copy(r.installCommand));
    actions.appendChild(b);
  }
  const instBtn=document.createElement('button'); instBtn.className='btn secondary small'; instBtn.textContent= installedSet.has(r.id) ? '取消已安裝標記' : '標記已安裝';
  instBtn.addEventListener('click',()=>{ toggleInstalled(r.id); });
  actions.appendChild(instBtn);

  card.appendChild(top); card.appendChild(badges); card.appendChild(desc); card.appendChild(tagsRow); card.appendChild(meta);
  if(actions.children.length) card.appendChild(actions);
  // safety note
  if(r.notes){
    const note=document.createElement('div'); note.className='muted'; note.style.fontSize='12px'; note.textContent=`備註：${r.notes}`;
    card.appendChild(note);
  }
  return card;
}
function renderResources(){
  if(!els.resourceGrid) return;
  els.resourceGrid.innerHTML='';
  if(filtered.length===0){
    if(els.emptyState) els.emptyState.hidden=false;
  } else {
    if(els.emptyState) els.emptyState.hidden=true;
    filtered.forEach(r=> els.resourceGrid.appendChild(createCard(r)));
  }
}
function renderFeatured(){
  if(!els.featuredGrid) return;
  els.featuredGrid.innerHTML='';
  data.filter(r=>r.featured).forEach(r=> els.featuredGrid.appendChild(createCard(r)));
}
function renderMySkills(){
  if(!els.mySkillsGrid) return;
  els.mySkillsGrid.innerHTML='';
  const mine = data.filter(r=> favSet.has(r.id) || installedSet.has(r.id));
  if(mine.length===0){
    if(els.myEmptyState) els.myEmptyState.hidden=false;
  } else {
    if(els.myEmptyState) els.myEmptyState.hidden=true;
    mine.forEach(r=> els.mySkillsGrid.appendChild(createCard(r)));
  }
}
function toggleFav(id){
  if(favSet.has(id)) favSet.delete(id); else favSet.add(id);
  setCodexFavorites(favSet);
  renderChips(); filterAndSort(); renderFeatured();
}
function toggleInstalled(id){
  if(installedSet.has(id)) installedSet.delete(id); else installedSet.add(id);
  setCodexInstalled(installedSet);
  filterAndSort(); renderFeatured();
}
function copy(text){
  navigator.clipboard.writeText(text).then(()=> window.dispatchEvent(new CustomEvent('show-toast',{detail:'已複製安裝指令'}))).catch(()=>{
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    window.dispatchEvent(new CustomEvent('show-toast',{detail:'已複製'}));
  });
}
function sync(){
  if(onUpdate) onUpdate({category: state.category, useCase: state.useCase, risk: state.risk, tags: state.tags, q: state.q, fav: state.favOnly, installed: state.installedOnly, sort: state.sort, hub:'codex'});
}
function bindEvents(){
  if(els.searchInput) els.searchInput.addEventListener('input', e=>{ state.q=e.target.value; filterAndSort(); sync(); });
  if(els.sortSelect) els.sortSelect.addEventListener('change', e=>{ state.sort=e.target.value; filterAndSort(); sync(); });
  if(els.favBtn) els.favBtn.addEventListener('click', ()=>{ state.favOnly=!state.favOnly; els.favBtn.setAttribute('aria-pressed', state.favOnly?'true':'false'); els.favBtn.textContent= state.favOnly ? '★ 只看收藏' : '☆ 只看收藏'; filterAndSort(); sync(); });
  if(els.installedBtn) els.installedBtn.addEventListener('click', ()=>{ state.installedOnly=!state.installedOnly; els.installedBtn.setAttribute('aria-pressed', state.installedOnly?'true':'false'); els.installedBtn.textContent= state.installedOnly ? '◆ 只看已安裝' : '◇ 只看已安裝'; filterAndSort(); sync(); });
  const clear = ()=>{ state.q=''; state.category='全部'; state.useCase='全部'; state.risk='全部'; state.tags.clear(); state.favOnly=false; state.installedOnly=false; state.sort='featured'; if(els.searchInput) els.searchInput.value=''; if(els.sortSelect) els.sortSelect.value='featured'; if(els.favBtn){ els.favBtn.textContent='☆ 只看收藏'; els.favBtn.setAttribute('aria-pressed','false'); } if(els.installedBtn){ els.installedBtn.textContent='◇ 只看已安裝'; els.installedBtn.setAttribute('aria-pressed','false'); } renderChips(); filterAndSort(); sync(); };
  if(els.clearBtn) els.clearBtn.addEventListener('click', clear);
  if(els.clearBtn2) els.clearBtn2.addEventListener('click', clear);
  if(els.emptyClearBtn) els.emptyClearBtn.addEventListener('click', clear);
  if(els.toggleTagsBtn) els.toggleTagsBtn.addEventListener('click', ()=>{ state.tagsExpanded=!state.tagsExpanded; renderChips(); });
  if(els.toggleDepsBtn) els.toggleDepsBtn.addEventListener('click', ()=>{ state.depsExpanded=!state.depsExpanded; renderChips(); });
}
export function getCodexStats(){
  const cats=[...new Set(data.map(d=>d.category))];
  const featured=data.filter(d=>d.featured).length;
  const risks={low:data.filter(d=>d.risk==='low').length, medium:data.filter(d=>d.risk==='medium').length, high:data.filter(d=>d.risk==='high').length};
  return {total:data.length, featured, categories:cats, risks};
}
export function getFilteredCodex(){ return filtered; }
export function getAllCodex(){ return data; }
