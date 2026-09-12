// app.js - main entry
import { KEYS, getTheme, setTheme, migrateIfNeeded, getAstraFavorites, getCodexFavorites, getCodexInstalled } from './storage.js';
import { parseQuery, buildQuery, syncURL, HUBS } from './router.js';
import { globalSearch, matchesAstra, matchesCodex } from './search.js';
import { initAstra, setAstraData, getAstraStats, getAllAstra } from './astra.js';
import { initCodex, setCodexData, getCodexStats, getAllCodex } from './codex.js';

const DATA_ASTRA = './data/astra-resources.json';
const DATA_CODEX = './data/codex-skills.json';

let astraData = [];
let codexData = [];
let currentHub = 'home';
let globalQ = '';
let favQ = '';

const els = {};
function $(id){ return document.getElementById(id); }

function initEls(){
  els.header = $('site-header');
  els.hamburger = $('hamburger');
  els.mobileMenu = $('mobileMenu');
  els.themeToggle = $('themeToggle');
  els.themeToggleMobile = $('themeToggleMobile');
  els.toast = $('toast');

  // home
  els.globalSearch = $('globalSearch');
  els.globalResultCount = $('globalResultCount');
  els.globalResults = $('globalResults');
  els.globalEmpty = $('globalEmpty');
  els.clearGlobalBtn = $('clearGlobalBtn');

  els.hubGrid = $('hubGrid');
  els.astraTotal = $('astraTotal');
  els.astraFeatured = $('astraFeatured');
  els.astraCategories = $('astraCategories');
  els.astraRecent = $('astraRecent');
  els.codexTotal = $('codexTotal');
  els.codexFeatured = $('codexFeatured');
  els.codexCategories = $('codexCategories');
  els.codexRisks = $('codexRisks');

  // astra section
  els.astraSection = $('astraSection');
  els.astraSearch = $('astraSearch');
  els.astraResultCount = $('astraResultCount');
  els.astraCategoryFilters = $('astraCategoryFilters');
  els.astraUseCaseFilters = $('astraUseCaseFilters');
  els.astraTagFilters = $('astraTagFilters');
  els.astraResourceGrid = $('astraResourceGrid');
  els.astraFeaturedGrid = $('astraFeaturedGrid');
  els.astraEmpty = $('astraEmpty');
  els.astraError = $('astraError');
  els.astraErrorMsg = $('astraErrorMsg');
  els.astraSort = $('astraSort');
  els.astraFavOnly = $('astraFavOnly');
  els.astraClear = $('astraClear');
  els.astraClear2 = $('astraClear2');
  els.astraEmptyClear = $('astraEmptyClear');
  els.astraToggleTags = $('astraToggleTags');

  // codex section
  els.codexSection = $('codexSection');
  els.codexSearch = $('codexSearch');
  els.codexResultCount = $('codexResultCount');
  els.codexCategoryFilters = $('codexCategoryFilters');
  els.codexUseCaseFilters = $('codexUseCaseFilters');
  els.codexRiskFilters = $('codexRiskFilters');
  els.codexDepFilters = $('codexDepFilters');
  els.codexTagFilters = $('codexTagFilters');
  els.codexGrid = $('codexGrid');
  els.codexFeaturedGrid = $('codexFeaturedGrid');
  els.codexMyGrid = $('codexMyGrid');
  els.codexEmpty = $('codexEmpty');
  els.codexMyEmpty = $('codexMyEmpty');
  els.codexError = $('codexError');
  els.codexErrorMsg = $('codexErrorMsg');
  els.codexSort = $('codexSort');
  els.codexFavOnly = $('codexFavOnly');
  els.codexInstalledOnly = $('codexInstalledOnly');
  els.codexClear = $('codexClear');
  els.codexClear2 = $('codexClear2');
  els.codexEmptyClear = $('codexEmptyClear');
  els.codexToggleTags = $('codexToggleTags');
  els.codexToggleDeps = $('codexToggleDeps');

  // favorites
  els.favSection = $('favoritesSection');
  els.favSearch = $('favSearch');
  els.favResultCount = $('favResultCount');
  els.clearFavBtn = $('clearFavBtn');
  els.favAstraGrid = $('favAstraGrid');
  els.favCodexGrid = $('favCodexGrid');
  els.favAstraEmpty = $('favAstraEmpty');
  els.favCodexEmpty = $('favCodexEmpty');
  els.favAstraEmptySearch = $('favAstraEmptySearch');
  els.favCodexEmptySearch = $('favCodexEmptySearch');

  // nav links
  els.navLinks = document.querySelectorAll('.nav-link[data-hub]');
  els.mobileNavLinks = document.querySelectorAll('.mobile-menu .nav-link[data-hub]');
}

function loadTheme(){
  const saved = getTheme();
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  else if(window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme','dark');
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme');
  const isDark = cur==='dark' || (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  setTheme(next);
}

function showHub(hub){
  currentHub = HUBS.includes(hub) ? hub : 'home';
  // hide all
  document.querySelectorAll('[data-hub-section]').forEach(s=> s.hidden=true);
  if(currentHub==='home'){
    $('homeSection').hidden=false;
  } else if(currentHub==='astra'){
    els.astraSection.hidden=false;
  } else if(currentHub==='codex'){
    els.codexSection.hidden=false;
  } else if(currentHub==='favorites'){
    els.favSection.hidden=false;
    renderFavorites();
  } else if(currentHub==='sources'){
    $('sourcesSection').hidden=false;
  }
  // nav active
  document.querySelectorAll('.nav-link[data-hub]').forEach(l=>{
    l.classList.toggle('active', l.dataset.hub===currentHub);
  });
  // sync URL hub
  const q = parseQuery();
  syncURL({hub: currentHub, q: q.q, category: q.category, useCase: q.useCase, risk: q.risk, tags: new Set(q.tag), sort: q.sort, fav: q.fav, installed: q.installed});
}

function bindNav(){
  document.querySelectorAll('[data-hub]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      const hub = el.dataset.hub;
      showHub(hub);
      // close mobile
      if(els.mobileMenu) els.mobileMenu.classList.remove('open');
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });
  if(els.hamburger){
    els.hamburger.addEventListener('click', ()=> els.mobileMenu.classList.toggle('open'));
  }
}

function renderHubCards(){
  const aStats = getAstraStats();
  const cStats = getCodexStats();
  if(els.astraTotal) els.astraTotal.textContent = `總數 ${aStats.total}`;
  if(els.astraFeatured) els.astraFeatured.textContent = `精選 ${aStats.featured}`;
  if(els.astraCategories) els.astraCategories.textContent = `${aStats.categories.length} 分類`;
  if(els.astraRecent) els.astraRecent.textContent = aStats.recent.map(r=>r.title).slice(0,2).join('、') || '最近新增';

  if(els.codexTotal) els.codexTotal.textContent = `總數 ${cStats.total}`;
  if(els.codexFeatured) els.codexFeatured.textContent = `精選 ${cStats.featured}`;
  if(els.codexCategories) els.codexCategories.textContent = `${cStats.categories.length} 分類`;
  if(els.codexRisks) els.codexRisks.textContent = `low ${cStats.risks.low} / med ${cStats.risks.medium} / high ${cStats.risks.high}`;
}

function renderGlobalResults(q){
  if(!els.globalResults) return;
  els.globalResults.innerHTML='';
  if(!q){
    if(els.globalResultCount) els.globalResultCount.textContent='輸入關鍵字搜尋 Astra 與 Codex';
    if(els.globalEmpty) els.globalEmpty.hidden=true;
    return;
  }
  const results = globalSearch(astraData, codexData, q);
  if(els.globalResultCount) els.globalResultCount.textContent=`全站：${results.length} 筆符合 "${q}"`;
  if(results.length===0){
    if(els.globalEmpty) els.globalEmpty.hidden=false;
    return;
  }
  if(els.globalEmpty) els.globalEmpty.hidden=true;
  results.slice(0,20).forEach(({source,item})=>{
    const card=document.createElement('article'); card.className='card';
    const top=document.createElement('div'); top.className='card-top';
    const title=document.createElement('h3'); title.className='card-title'; title.textContent=item.title||item.name;
    const srcBadge=document.createElement('span'); srcBadge.className='result-source '+(source); srcBadge.textContent= source==='astra' ? 'Astra 3D' : 'Codex Skill';
    top.appendChild(title); top.appendChild(srcBadge);
    const desc=document.createElement('p'); desc.className='desc'; desc.textContent=item.description||'';
    const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${item.category} · ${source}`;
    const actions=document.createElement('div'); actions.className='card-actions';
    const btn=document.createElement('button'); btn.className='btn small'; btn.textContent='前往查看';
    btn.addEventListener('click',()=>{
      if(source==='astra'){ showHub('astra'); setTimeout(()=>{ const el=document.getElementById('astraSearch'); if(el){ el.value=q; el.dispatchEvent(new Event('input')); } window.scrollTo({top: document.getElementById('astraSection').offsetTop-80, behavior:'smooth'}); }, 100); }
      else { showHub('codex'); setTimeout(()=>{ const el=document.getElementById('codexSearch'); if(el){ el.value=q; el.dispatchEvent(new Event('input')); } window.scrollTo({top: document.getElementById('codexSection').offsetTop-80, behavior:'smooth'}); }, 100); }
    });
    actions.appendChild(btn);
    card.appendChild(top); card.appendChild(desc); card.appendChild(meta); card.appendChild(actions);
    els.globalResults.appendChild(card);
  });
}

function renderFavorites(query = favQ){
  const aFav = getAstraFavorites();
  const cFav = getCodexFavorites();
  const cInst = getCodexInstalled();
  const q = (query||'').trim();
  
  // Update result count
  if(els.favResultCount){
    if(!q) els.favResultCount.textContent = `共收藏 ${aFav.size} Astra / ${cFav.size + cInst.size} Codex，輸入關鍵字過濾`;
    else els.favResultCount.textContent = `收藏中搜尋 "${q}"`;
  }

  // Astra favs
  if(els.favAstraGrid){
    els.favAstraGrid.innerHTML='';
    let list = astraData.filter(x=> aFav.has(x.id));
    const totalAstra = list.length;
    if(q) list = list.filter(x=> matchesAstra(x, q));
    
    // reset empty states
    if(els.favAstraEmpty) els.favAstraEmpty.hidden=true;
    if(els.favAstraEmptySearch) els.favAstraEmptySearch.hidden=true;
    
    if(totalAstra===0){
      if(els.favAstraEmpty) els.favAstraEmpty.hidden=false;
    } else if(list.length===0 && q){
      if(els.favAstraEmptySearch) els.favAstraEmptySearch.hidden=false;
    } else {
      list.forEach(item=>{
        const card=document.createElement('article'); card.className='card';
        const h=document.createElement('h3'); h.className='card-title'; h.textContent=item.title;
        const d=document.createElement('p'); d.className='desc'; d.textContent=item.description;
        const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${item.category} · ${item.useCase||''}`;
        card.appendChild(h); card.appendChild(d); card.appendChild(meta);
        els.favAstraGrid.appendChild(card);
      });
    }
    const countEl = document.getElementById('favAstraCount');
    if(countEl) countEl.textContent = q ? `(${list.length}/${totalAstra})` : `(${totalAstra})`;
  }
  if(els.favCodexGrid){
    els.favCodexGrid.innerHTML='';
    let list = codexData.filter(x=> cFav.has(x.id) || cInst.has(x.id));
    const totalCodex = list.length;
    if(q) list = list.filter(x=> matchesCodex(x, q));
    
    if(els.favCodexEmpty) els.favCodexEmpty.hidden=true;
    if(els.favCodexEmptySearch) els.favCodexEmptySearch.hidden=true;
    
    if(totalCodex===0){
      if(els.favCodexEmpty) els.favCodexEmpty.hidden=false;
    } else if(list.length===0 && q){
      if(els.favCodexEmptySearch) els.favCodexEmptySearch.hidden=false;
    } else {
      list.forEach(item=>{
        const card=document.createElement('article'); card.className='card';
        const h=document.createElement('h3'); h.className='card-title'; h.textContent=item.title||item.name;
        const d=document.createElement('p'); d.className='desc'; d.textContent=item.description;
        const badges=document.createElement('div'); badges.className='badges';
        if(cFav.has(item.id)){ const b=document.createElement('span'); b.className='badge'; b.textContent='收藏'; badges.appendChild(b); }
        if(cInst.has(item.id)){ const b=document.createElement('span'); b.className='badge'; b.textContent='已安裝 (手動標記)'; badges.appendChild(b); }
        const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${item.category} · ${item.risk||''}`;
        card.appendChild(h); card.appendChild(badges); card.appendChild(d); card.appendChild(meta);
        els.favCodexGrid.appendChild(card);
      });
    }
    const countEl = document.getElementById('favCodexCount');
    if(countEl) countEl.textContent = q ? `(${list.length}/${totalCodex})` : `(${totalCodex})`;
  }
}

function onAstraUpdate(partial){
  // sync URL when Astra filters change, but keep hub=astra
  const cur = parseQuery();
  syncURL({hub:'astra', q: partial.q ?? cur.q, category: partial.category ?? cur.category, useCase: partial.useCase ?? cur.useCase, risk: cur.risk, tags: partial.tags ?? new Set(cur.tag), sort: partial.sort ?? cur.sort, fav: partial.fav ?? cur.fav, installed: cur.installed});
}
function onCodexUpdate(partial){
  const cur = parseQuery();
  syncURL({hub:'codex', q: partial.q ?? cur.q, category: partial.category ?? cur.category, useCase: partial.useCase ?? cur.useCase, risk: partial.risk ?? cur.risk, tags: partial.tags ?? new Set(cur.tag), sort: partial.sort ?? cur.sort, fav: partial.fav ?? cur.fav, installed: partial.installed ?? cur.installed});
}

async function loadData(){
  try{
    const [aRes, cRes] = await Promise.all([
      fetch(DATA_ASTRA, {cache:'no-store'}),
      fetch(DATA_CODEX, {cache:'no-store'})
    ]);
    if(!aRes.ok) throw new Error(`Astra JSON HTTP ${aRes.status}`);
    if(!cRes.ok) throw new Error(`Codex JSON HTTP ${cRes.status}`);
    astraData = await aRes.json();
    codexData = await cRes.json();
    // validate minimal
    if(!Array.isArray(astraData)) throw new Error('astra-resources.json 不是陣列');
    if(!Array.isArray(codexData)) throw new Error('codex-skills.json 不是陣列');
    // init modules
    setAstraData(astraData);
    setCodexData(codexData);
    renderHubCards();
    // if global q exists, render
    const q = parseQuery();
    if(q.q){
      globalQ = q.q;
      if(els.globalSearch) els.globalSearch.value = q.q;
      renderGlobalResults(q.q);
    }
    // handle initial hub
    showHub(q.hub);
    // set search inputs from query
    if(q.q){
      if(els.astraSearch) els.astraSearch.value = q.hub==='astra' ? q.q : '';
      if(els.codexSearch) els.codexSearch.value = q.hub==='codex' ? q.q : '';
    }
  } catch(e){
    console.error(e);
    if(els.astraError){ els.astraError.hidden=false; if(els.astraErrorMsg) els.astraErrorMsg.textContent=e.message; }
    if(els.codexError){ els.codexError.hidden=false; if(els.codexErrorMsg) els.codexErrorMsg.textContent=e.message; }
    const toast = document.getElementById('toast');
    if(toast){ toast.textContent='資料載入失敗：'+e.message; toast.hidden=false; setTimeout(()=>toast.hidden=true, 3000); }
  }
}

function bindEvents(){
  // theme
  if(els.themeToggle) els.themeToggle.addEventListener('click', ()=>{ toggleTheme(); });
  if(els.themeToggleMobile) els.themeToggleMobile.addEventListener('click', ()=>{ toggleTheme(); });

  // back-to-top arrows
  document.querySelectorAll('a.back-to-top').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });

  // global search (home)
  let gTimer;
  if(els.globalSearch){
    els.globalSearch.addEventListener('input', e=>{
      globalQ = e.target.value;
      clearTimeout(gTimer);
      gTimer = setTimeout(()=>{
        renderGlobalResults(globalQ);
        // if on favorites, also filter favorites with same query
        if(currentHub==='favorites'){
          favQ = globalQ;
          if(els.favSearch) els.favSearch.value = globalQ;
          renderFavorites(favQ);
        }
        // sync URL
        const cur = parseQuery();
        syncURL({hub: currentHub, q: globalQ, category: cur.category, useCase: cur.useCase, risk: cur.risk, tags: new Set(cur.tag), sort: cur.sort, fav: cur.fav, installed: cur.installed});
      }, 200);
    });
  }
  if(els.clearGlobalBtn){
    els.clearGlobalBtn.addEventListener('click', ()=>{
      globalQ=''; if(els.globalSearch) els.globalSearch.value=''; renderGlobalResults(''); 
      if(currentHub==='favorites'){ favQ=''; if(els.favSearch) els.favSearch.value=''; renderFavorites(''); }
      syncURL({hub: currentHub, q:'', category:'全部', useCase:'全部', risk:'全部', tags:new Set(), sort:'', fav:false, installed:false});
    });
  }

  // favorites search
  let fTimer;
  if(els.favSearch){
    els.favSearch.addEventListener('input', e=>{
      favQ = e.target.value;
      // sync global search as well for consistency
      if(els.globalSearch) els.globalSearch.value = favQ;
      globalQ = favQ;
      clearTimeout(fTimer);
      fTimer = setTimeout(()=>{
        renderFavorites(favQ);
        renderGlobalResults(favQ);
        const cur = parseQuery();
        syncURL({hub: currentHub, q: favQ, category: cur.category, useCase: cur.useCase, risk: cur.risk, tags: new Set(cur.tag), sort: cur.sort, fav: cur.fav, installed: cur.installed});
      }, 200);
    });
  }
  if(els.clearFavBtn){
    els.clearFavBtn.addEventListener('click', ()=>{
      favQ=''; globalQ=''; 
      if(els.favSearch) els.favSearch.value=''; 
      if(els.globalSearch) els.globalSearch.value='';
      renderFavorites(''); renderGlobalResults('');
      syncURL({hub: currentHub, q:'', category:'全部', useCase:'全部', risk:'全部', tags:new Set(), sort:'', fav:false, installed:false});
    });
  }

  // toast listener
  window.addEventListener('show-toast', e=>{
    const toast = $('toast');
    if(!toast) return;
    toast.textContent = e.detail || '已複製';
    toast.hidden=false;
    setTimeout(()=> toast.hidden=true, 2000);
  });

  // popstate
  window.addEventListener('popstate', ()=>{
    const q = parseQuery();
    showHub(q.hub);
    if(q.q){
      if(els.globalSearch) els.globalSearch.value=q.q;
      if(els.favSearch) els.favSearch.value=q.q;
      favQ = q.q; globalQ = q.q;
      renderGlobalResults(q.q);
      renderFavorites(q.q);
    } else {
      favQ=''; globalQ='';
      if(els.favSearch) els.favSearch.value='';
      if(els.globalSearch) els.globalSearch.value='';
      renderFavorites('');
    }
  });
}

function init(){
  initEls();
  migrateIfNeeded();
  loadTheme();
  const q = parseQuery();
  // 立即顯示正確 hub，避免 favorites 頁面還看到 home 的 hub-cards（修 PointIt 標註的兩個按鈕在 ?hub=favorites 還出現的問題）
  showHub(q.hub);
  if(q.q){
    globalQ = q.q;
    favQ = q.q;
    if($('globalSearch')) $('globalSearch').value = q.q;
    if($('favSearch')) $('favSearch').value = q.q;
  }

  // init modules with elements
  initAstra({
    searchInput: $('astraSearch'),
    resultCount: $('astraResultCount'),
    categoryFilters: $('astraCategoryFilters'),
    useCaseFilters: $('astraUseCaseFilters'),
    tagFilters: $('astraTagFilters'),
    resourceGrid: $('astraResourceGrid'),
    featuredGrid: $('astraFeaturedGrid'),
    emptyState: $('astraEmpty'),
    errorState: $('astraError'),
    errorMsg: $('astraErrorMsg'),
    sortSelect: $('astraSort'),
    favBtn: $('astraFavOnly'),
    clearBtn: $('astraClear'),
    clearBtn2: $('astraClear2'),
    emptyClearBtn: $('astraEmptyClear'),
    toggleTagsBtn: $('astraToggleTags')
  }, q.hub==='astra' ? q : null, onAstraUpdate);

  initCodex({
    searchInput: $('codexSearch'),
    resultCount: $('codexResultCount'),
    categoryFilters: $('codexCategoryFilters'),
    useCaseFilters: $('codexUseCaseFilters'),
    riskFilters: $('codexRiskFilters'),
    dependencyFilters: $('codexDepFilters'),
    tagFilters: $('codexTagFilters'),
    resourceGrid: $('codexGrid'),
    featuredGrid: $('codexFeaturedGrid'),
    mySkillsGrid: $('codexMyGrid'),
    emptyState: $('codexEmpty'),
    myEmptyState: $('codexMyEmpty'),
    errorState: $('codexError'),
    errorMsg: $('codexErrorMsg'),
    sortSelect: $('codexSort'),
    favBtn: $('codexFavOnly'),
    installedBtn: $('codexInstalledOnly'),
    clearBtn: $('codexClear'),
    clearBtn2: $('codexClear2'),
    emptyClearBtn: $('codexEmptyClear'),
    toggleTagsBtn: $('codexToggleTags'),
    toggleDepsBtn: $('codexToggleDeps')
  }, q.hub==='codex' ? q : null, onCodexUpdate);

  bindNav();
  bindEvents();
  loadData();
}

document.addEventListener('DOMContentLoaded', init);
