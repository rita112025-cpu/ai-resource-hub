// router.js - SPA routing via ?hub= and filters
export const HUBS = ['home','astra','codex','favorites','sources'];

export function parseQuery(){
  const params = new URLSearchParams(location.search);
  const hub = params.get('hub') || 'home';
  return {
    hub: HUBS.includes(hub) ? hub : 'home',
    q: params.get('q') || '',
    category: params.get('category') || '全部',
    useCase: params.get('useCase') || '全部',
    tag: params.getAll('tag'),
    risk: params.get('risk') || '全部',
    sort: params.get('sort') || '',
    fav: params.get('fav') === '1',
    installed: params.get('installed') === '1',
    raw: params
  };
}

export function buildQuery(state){
  const p = new URLSearchParams();
  if(state.hub && state.hub !== 'home') p.set('hub', state.hub);
  if(state.q) p.set('q', state.q);
  if(state.category && state.category !== '全部') p.set('category', state.category);
  if(state.useCase && state.useCase !== '全部') p.set('useCase', state.useCase);
  if(state.risk && state.risk !== '全部') p.set('risk', state.risk);
  if(state.sort) p.set('sort', state.sort);
  if(state.fav) p.set('fav','1');
  if(state.installed) p.set('installed','1');
  if(state.tags && state.tags.size){
    state.tags.forEach(t=> p.append('tag', t));
  }
  return p;
}

export function syncURL(state, replace=true){
  const params = buildQuery(state);
  const qs = params.toString();
  const newUrl = qs ? `${location.pathname}?${qs}` : location.pathname;
  if(replace) history.replaceState(null, '', newUrl);
  else history.pushState(null, '', newUrl);
}

export function onPopState(cb){
  window.addEventListener('popstate', cb);
}
