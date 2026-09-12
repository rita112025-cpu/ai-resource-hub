// astra.js - Astra module
import { getAstraFavorites, setAstraFavorites } from './storage.js';
import { matchesAstra } from './search.js';

const CATEGORIES = ["全部","Astra","Blender","CAD","BIM","BIM / Revit","Three.js","WebGPU","Unreal Engine","Unity","3D Printing","AI Agent","Prompt","Tutorial","GitHub Repo"];
const USECASES = ["全部","平面圖轉 3D","建築建模","室內建模","機電 / MEP","參數化建模","自動化建模","模型驗證","Web 3D","遊戲場景","3D 列印","模型轉換","Agent 操作","Prompt Engineering"];

let data = [];
let filtered = [];
let state = {
  q: '',
  category: '全部',
  useCase: '全部',
  tags: new Set(),
  sort: 'featured',
  favOnly: false,
  tagsExpanded: false
};
let favSet = new Set();
let els = {};
let allTags = [];
let onUpdate = null;

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function $(id){ return document.getElementById(id); }

export function initAstra(elements, initialState, updateCb){
  els = elements;
  onUpdate = updateCb;
  if(initialState){
    state.q = initialState.q || '';
    state.category = initialState.category || '全部';
    state.useCase = initialState.useCase || '全部';
    state.tags = new Set(initialState.tag || []);
    state.sort = initialState.sort || 'featured';
    state.favOnly = !!initialState.fav;
  }
  favSet = getAstraFavorites();
  bindEvents();
}

export function setAstraData(arr){
  data = arr.filter(x=>x && x.id && x.title && x.category && x.description);
  collectTags();
  renderChips();
  filterAndSort();
  renderFeatured();
}

function collectTags(){
  const map={};
  data.forEach(r=> (r.tags||[]).forEach(t=> map[t]=(map[t]||0)+1));
  allTags = Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([tag,count])=>({tag,count}));
}

function renderChips(){
  // category
  if(!els.categoryFilters) return;
  els.categoryFilters.innerHTML='';
  CATEGORIES.forEach(cat=>{
    const b=document.createElement('button');
    b.className='chip'+(state.category===cat?' active astra':'');
    b.textContent=cat;
    b.addEventListener('click',()=>{ state.category=cat; filterAndSort(); sync(); });
    els.categoryFilters.appendChild(b);
  });
  // useCase
  if(els.useCaseFilters){
    els.useCaseFilters.innerHTML='';
    USECASES.forEach(uc=>{
      const b=document.createElement('button');
      b.className='chip'+(state.useCase===uc?' active astra':'');
      b.textContent=uc;
      b.addEventListener('click',()=>{ state.useCase=uc; filterAndSort(); sync(); });
      els.useCaseFilters.appendChild(b);
    });
  }
  // tags
  if(els.tagFilters){
    els.tagFilters.innerHTML='';
    els.tagFilters.classList.toggle('collapsed', !state.tagsExpanded);
    allTags.forEach(({tag,count})=>{
      const b=document.createElement('button');
      b.className='chip tag'+(state.tags.has(tag)?' active astra':'');
      b.textContent=`${tag} ${count}`;
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
  let res = data.slice();
  // fav
  if(state.favOnly) res = res.filter(r=> favSet.has(r.id));
  // category
  if(state.category!=='全部') res = res.filter(r=> r.category===state.category || (state.category==='BIM' && r.category.includes('BIM')));
  // useCase
  if(state.useCase!=='全部') res = res.filter(r=> r.useCase===state.useCase);
  // tags AND
  if(state.tags.size){ res = res.filter(r=> [...state.tags].every(t=> (r.tags||[]).includes(t))); }
  // search
  if(state.q) res = res.filter(r=> matchesAstra(r, state.q));
  // sort
  if(state.sort==='name') res.sort((a,b)=>a.title.localeCompare(b.title));
  else if(state.sort==='newest') res.sort((a,b)=> (b.added||'').localeCompare(a.added||''));
  else res.sort((a,b)=>{ const fa=a.featured?1:0, fb=b.featured?1:0; if(fb!==fa) return fb-fa; return a.title.localeCompare(b.title); });
  filtered=res;
  renderResources();
  updateResultCount();
}

function updateResultCount(){
  if(els.resultCount) els.resultCount.textContent = `Astra：${filtered.length} / ${data.length}`;
}

function createCard(r){
  const card=document.createElement('article');
  card.className='card';
  card.dataset.id=r.id;
  const top=document.createElement('div'); top.className='card-top';
  const title=document.createElement('h3'); title.className='card-title'; title.textContent=r.title;
  const favBtn=document.createElement('button'); favBtn.className='fav-btn'+(favSet.has(r.id)?' active':''); favBtn.textContent=favSet.has(r.id)?'★':'☆'; favBtn.setAttribute('aria-label','收藏');
  favBtn.addEventListener('click',()=>{ toggleFav(r.id); });
  top.appendChild(title); top.appendChild(favBtn);
  const badges=document.createElement('div'); badges.className='badges';
  const catBadge=document.createElement('span'); catBadge.className='badge cat'; catBadge.textContent=r.category;
  badges.appendChild(catBadge);
  if(r.useCase){ const u=document.createElement('span'); u.className='badge'; u.textContent=r.useCase; badges.appendChild(u); }
  if(r.featured){ const f=document.createElement('span'); f.className='badge'; f.textContent='精選'; f.style.borderColor='var(--accent)'; f.style.color='var(--accent)'; badges.appendChild(f); }
  const desc=document.createElement('p'); desc.className='desc'; desc.textContent=r.description;
  const tagsRow=document.createElement('div'); tagsRow.className='tags-row';
  (r.tags||[]).forEach(t=>{
    const el=document.createElement('button'); el.className='tag'; el.textContent=t;
    el.addEventListener('click',()=>{ if(!state.tags.has(t)){ state.tags.add(t); filterAndSort(); renderChips(); sync(); } });
    tagsRow.appendChild(el);
  });
  const meta=document.createElement('div'); meta.className='meta';
  if(r.source) meta.innerHTML+=`<span>來源：${escapeHtml(r.source)}</span>`;
  if(r.added) meta.innerHTML+=`<span>加入：${escapeHtml(r.added)}</span>`;
  const actions=document.createElement('div'); actions.className='card-actions';
  function addLink(label,url){
    if(!url) return;
    const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; a.className='btn secondary small'; a.textContent=label;
    actions.appendChild(a);
  }
  addLink('GitHub', r.github);
  addLink('Demo', r.demo);
  addLink('Source', r.sourceCode);
  addLink('Reference', r.reference);
  if(r.prompt){
    if(r.prompt.startsWith('http')) addLink('Prompt', r.prompt);
    else {
      const b=document.createElement('button'); b.className='btn secondary small'; b.textContent='複製 Prompt';
      b.addEventListener('click',()=> copy(r.prompt));
      actions.appendChild(b);
    }
  }
  card.appendChild(top); card.appendChild(badges); card.appendChild(desc); card.appendChild(tagsRow); card.appendChild(meta);
  if(actions.children.length) card.appendChild(actions);
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

function toggleFav(id){
  if(favSet.has(id)) favSet.delete(id); else favSet.add(id);
  setAstraFavorites(favSet);
  renderChips();
  filterAndSort();
  renderFeatured();
}

function copy(text){
  navigator.clipboard.writeText(text).then(()=> window.dispatchEvent(new CustomEvent('show-toast',{detail:'已複製'}))).catch(()=>{
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    window.dispatchEvent(new CustomEvent('show-toast',{detail:'已複製'}));
  });
}

function sync(){
  if(onUpdate) onUpdate({category: state.category, useCase: state.useCase, tags: state.tags, q: state.q, fav: state.favOnly, sort: state.sort, hub: 'astra'});
}

function bindEvents(){
  if(els.searchInput) els.searchInput.addEventListener('input', e=>{ state.q=e.target.value; filterAndSort(); sync(); });
  if(els.sortSelect) els.sortSelect.addEventListener('change', e=>{ state.sort=e.target.value; filterAndSort(); sync(); });
  if(els.favBtn) els.favBtn.addEventListener('click', ()=>{ state.favOnly=!state.favOnly; els.favBtn.setAttribute('aria-pressed', state.favOnly?'true':'false'); els.favBtn.textContent= state.favOnly ? '★ 只看收藏' : '☆ 只看收藏'; filterAndSort(); sync(); });
  const clear = ()=>{ state.q=''; state.category='全部'; state.useCase='全部'; state.tags.clear(); state.favOnly=false; state.sort='featured'; if(els.searchInput) els.searchInput.value=''; if(els.sortSelect) els.sortSelect.value='featured'; if(els.favBtn){ els.favBtn.textContent='☆ 只看收藏'; els.favBtn.setAttribute('aria-pressed','false'); } renderChips(); filterAndSort(); sync(); };
  if(els.clearBtn) els.clearBtn.addEventListener('click', clear);
  if(els.clearBtn2) els.clearBtn2.addEventListener('click', clear);
  if(els.emptyClearBtn) els.emptyClearBtn.addEventListener('click', clear);
  if(els.toggleTagsBtn) els.toggleTagsBtn.addEventListener('click', ()=>{ state.tagsExpanded=!state.tagsExpanded; renderChips(); });
}

export function getAstraStats(){
  const cats = [...new Set(data.map(d=>d.category))];
  const featured = data.filter(d=>d.featured).length;
  const recent = data.slice().sort((a,b)=> (b.added||'').localeCompare(a.added||'')).slice(0,3);
  return {total:data.length, featured, categories:cats, recent};
}

export function getFilteredAstra(){ return filtered; }
export function getAllAstra(){ return data; }
