import { NextResponse } from 'next/server';

const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
const JOOBLE_URL = 'https://fr.jooble.org/api';
const ADZUNA_URL = 'https://api.adzuna.com/v1/api/jobs/fr/search/1';

// Petit cache mémoire pour économiser le quota Jooble sur les recherches identiques.
// Il est volontairement court : une offre ancienne ne reste pas affichée trop longtemps.
const JOOBLE_TTL = 2 * 60 * 60 * 1000; // 2 h
const joobleCache = globalThis.__jobelyoJoobleCache || new Map();
globalThis.__jobelyoJoobleCache = joobleCache;
const ADZUNA_TTL = 2 * 60 * 60 * 1000;
const adzunaCache = globalThis.__jobelyoAdzunaCache || new Map();
globalThis.__jobelyoAdzunaCache = adzunaCache;

const JOB_TERMS = [
  'livreur','chauffeur livreur','chauffeur-livreur','chauffeur','conducteur','conducteur livreur',
  'préparateur de commandes','preparateur de commandes','cariste','magasinier','agent de quai','logistique',
  'vendeur','vendeuse','vente','caissier','caissière','serveur','serveuse','cuisinier','cuisinière',
  'ménage','menage','agent d entretien','agent d\'entretien','aide ménagère','aide menagere',
  'assistant administratif','secrétaire','secretaire','comptable','commercial','technicien','mécanicien','mecanicien'
];

function normalizeText(value='') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}

function distance(a,b){
  a=normalizeText(a); b=normalizeText(b);
  const m=a.length,n=b.length;
  const d=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)d[i][0]=i;
  for(let j=0;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
    const cost=a[i-1]===b[j-1]?0:1;
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[m][n];
}

function suggestJob(query){
  const q=normalizeText(query);
  if(!q || q.length<4) return null;
  let best=null, bestScore=Infinity;
  for(const term of JOB_TERMS){
    const score=distance(q,term);
    if(score<bestScore){best=term;bestScore=score;}
  }
  const limit=q.length<=6?1:q.length<=12?2:3;
  return bestScore<=limit?best:null;
}


async function getToken() {
  const id = process.env.FT_CLIENT_ID;
  const secret = process.env.FT_CLIENT_SECRET;
  if (!id || !secret) throw new Error('CONFIG_MISSING');
  const body = new URLSearchParams({
    grant_type: 'client_credentials', client_id: id, client_secret: secret,
    scope: 'api_offresdemploiv2 o2dsoffre'
  });
  const r = await fetch(TOKEN_URL, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body, cache:'no-store' });
  if (!r.ok) throw new Error(`TOKEN_${r.status}`);
  return (await r.json()).access_token;
}

async function communeCode(city) {
  if (!city) return null;
  const u = new URL('https://geo.api.gouv.fr/communes');
  u.searchParams.set('nom', city);
  u.searchParams.set('fields', 'nom,code,population');
  u.searchParams.set('boost', 'population');
  u.searchParams.set('limit', '1');
  const r = await fetch(u, { next:{revalidate:86400} });
  if (!r.ok) return null;
  const data = await r.json();
  return data?.[0]?.code || null;
}

function joobleRadius(radius) {
  const allowed = [0,4,8,16,26,40,80];
  const n = Number(radius || 30);
  return String(allowed.reduce((best, v) => Math.abs(v-n) < Math.abs(best-n) ? v : best, allowed[0]));
}

async function franceTravailJobs(q, city, radius) {
  const commune = await communeCode(city);
  if (city && !commune) return { jobs: [], cityError: true };

  const params = new URLSearchParams({ range:'0-29' });
  if (q) params.set('motsCles', q);
  if (commune) { params.set('commune', commune); params.set('distance', String(radius)); }

  const token = await getToken();
  let r = await fetch(`${SEARCH_URL}?${params}`, { headers:{Authorization:`Bearer ${token}`, Accept:'application/json'}, cache:'no-store' });

  if (!r.ok && r.status === 400 && commune) {
    const fallback = new URLSearchParams({ range:'0-29' });
    if (q) fallback.set('motsCles', q);
    const departement = commune.startsWith('97') ? commune.slice(0,3) : commune.slice(0,2);
    if (departement) fallback.set('departement', departement);
    r = await fetch(`${SEARCH_URL}?${fallback}`, { headers:{Authorization:`Bearer ${token}`, Accept:'application/json'}, cache:'no-store' });
  }

  if (!r.ok) throw new Error(`FT_${r.status}`);
  const contentRange = r.headers.get('content-range') || '';
  const rangeMatch = contentRange.match(/\/(\d+)\s*$/);
  const data = await r.json();
  const total = rangeMatch ? Number(rangeMatch[1]) : (data.resultats || []).length;
  const jobs = (data.resultats || []).map(o => ({
    id:`ft-${o.id}`, source:'France Travail', sourceKey:'francetravail',
    title:o.intitule || 'Offre d’emploi', company:o.entreprise?.nom || 'Entreprise',
    city:o.lieuTravail?.libelle || '', contract:o.typeContratLibelle || o.typeContrat || '',
    salary:o.salaire?.libelle || '', description:o.description || '', created:o.dateCreation || '',
    url:o.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(o.id)}`
  }));
  return { jobs, cityError:false, total };
}

async function joobleJobs(q, city, radius) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey || !q || !city) return { jobs: [], total:0, available:false };

  const key = `${q.toLowerCase()}|${city.toLowerCase()}|${joobleRadius(radius)}`;
  const cached = joobleCache.get(key);
  if (cached && Date.now() - cached.time < JOOBLE_TTL) return { jobs: cached.jobs, total:cached.total ?? cached.jobs.length, available:true, cached:true };

  try {
    const r = await fetch(`${JOOBLE_URL}/${encodeURIComponent(apiKey)}`, {
      method:'POST',
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      body:JSON.stringify({ keywords:q, location:city, radius:joobleRadius(radius), page:1, ResultOnPage:40, companysearch:false }),
      cache:'no-store'
    });

    // Clé refusée / quota épuisé / erreur Jooble : on ne renvoie AUCUNE offre Jooble.
    // Ainsi les anciennes annonces ne restent pas visibles à l'utilisateur.
    if (!r.ok) {
      joobleCache.delete(key);
      return { jobs: [], total:0, available:false, status:r.status };
    }

    const data = await r.json();
    const jobs = (data.jobs || []).map(o => ({
      id:`jooble-${o.id}`, source:'Jooble', sourceKey:'jooble',
      title:o.title || 'Offre d’emploi', company:o.company || 'Entreprise',
      city:o.location || '', contract:o.type || '', salary:o.salary || '',
      description:(o.snippet || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),
      created:o.updated || '', url:o.link || ''
    })).filter(o=>o.url);
    const total = Number(data.totalCount ?? data.totalcount ?? data.total ?? jobs.length) || jobs.length;
    joobleCache.set(key, { time:Date.now(), jobs, total });
    return { jobs, total, available:true };
  } catch {
    joobleCache.delete(key);
    return { jobs: [], total:0, available:false };
  }
}

async function adzunaJobs(q, city, radius) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return { jobs:[], total:0, available:false };

  const key = `${q.toLowerCase()}|${city.toLowerCase()}|${radius}`;
  const cached = adzunaCache.get(key);
  if (cached && Date.now() - cached.time < ADZUNA_TTL) return { ...cached, available:true, cached:true };

  try {
    const u = new URL(ADZUNA_URL);
    u.searchParams.set('app_id', appId);
    u.searchParams.set('app_key', appKey);
    u.searchParams.set('results_per_page', '40');
    u.searchParams.set('content-type', 'application/json');
    u.searchParams.set('sort_by', 'date');
    if (q) u.searchParams.set('what', q);
    if (city) { u.searchParams.set('where', city); u.searchParams.set('distance', String(Math.max(1, Math.min(100, Number(radius)||30)))); }
    const r = await fetch(u, { headers:{Accept:'application/json'}, cache:'no-store' });
    if (!r.ok) { adzunaCache.delete(key); return {jobs:[],total:0,available:false,status:r.status}; }
    const data = await r.json();
    const jobs = (data.results || []).map(o => {
      const min = Number(o.salary_min); const max = Number(o.salary_max);
      let salary = '';
      if (Number.isFinite(min) && Number.isFinite(max) && min >= 1000) salary = `${Math.round(min).toLocaleString('fr-FR')}–${Math.round(max).toLocaleString('fr-FR')} € annuel`;
      else if (Number.isFinite(min) && min >= 1000) salary = `À partir de ${Math.round(min).toLocaleString('fr-FR')} € annuel`;
      return {
        id:`adzuna-${o.id}`, source:'Adzuna', sourceKey:'adzuna',
        title:o.title || 'Offre d’emploi', company:o.company?.display_name || 'Entreprise',
        city:o.location?.display_name || city || '', contract:o.contract_type || o.contract_time || '',
        salary, description:(o.description || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),
        created:o.created || '', url:o.redirect_url || ''
      };
    }).filter(o=>o.url).filter(o => {
      if (!q) return true;
      const wanted = meaningfulTokens(q);
      if (!wanted.size) return true;
      const hay = normalizeText(`${o.title} ${o.description}`);
      return [...wanted].some(token => hay.includes(token));
    });
    const total = Number(data.count || jobs.length) || jobs.length;
    adzunaCache.set(key,{time:Date.now(),jobs,total});
    return {jobs,total,available:true};
  } catch { adzunaCache.delete(key); return {jobs:[],total:0,available:false}; }
}

function meaningfulTokens(value='') {
  const stop=new Set(['de','du','des','la','le','les','un','une','et','en','au','aux','pour','sur','dans','avec']);
  return new Set(normalizeText(value).split(' ').filter(x=>x.length>2&&!stop.has(x)));
}
function similarity(a,b) {
  const A=meaningfulTokens(a),B=meaningfulTokens(b); if(!A.size||!B.size)return 0;
  let common=0; for(const x of A)if(B.has(x))common++;
  return common/Math.min(A.size,B.size);
}
function companyComparable(a,b) {
  const A=normalizeText(a),B=normalizeText(b),generic=new Set(['','entreprise','confidentiel','non communique']);
  if(generic.has(A)||generic.has(B))return true;
  return A===B||A.includes(B)||B.includes(A)||similarity(A,B)>=0.75;
}
function sameArea(a,b) {
  const A=meaningfulTokens(a),B=meaningfulTokens(b); if(!A.size||!B.size)return true;
  for(const x of A)if(B.has(x)&&!/^\d+$/.test(x))return true;
  return false;
}
function isDuplicate(a,b) {
  const titleSim=similarity(a.title,b.title); if(titleSim<0.82)return false;
  const companyOk=companyComparable(a.company,b.company),areaOk=sameArea(a.city,b.city);
  const descSim=similarity(String(a.description||'').slice(0,900),String(b.description||'').slice(0,900));
  if(descSim>=0.72&&areaOk)return true;
  if(titleSim>=0.92&&companyOk&&areaOk)return true;
  if(titleSim>=0.92&&descSim>=0.58&&areaOk)return true;
  return false;
}
function dedupeJobs(jobs) {
  const kept=[];
  for(const job of jobs)if(!kept.some(existing=>isDuplicate(existing,job)))kept.push(job);
  return kept;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const city = (searchParams.get('city') || '').trim();
    const radius = Math.min(100, Math.max(0, Number(searchParams.get('radius') || 30)));

    let effectiveQ = q;
    let correctedQuery = '';

    async function runSources(term){
      return Promise.allSettled([
        franceTravailJobs(term, city, radius),
        joobleJobs(term, city, radius),
        adzunaJobs(term, city, radius)
      ]);
    }

    let [ft, jooble, adzuna] = await runSources(effectiveQ);

    let ftJobs = [], ftTotal = 0, cityError = false, ftError = null;
    if (ft.status === 'fulfilled') { ftJobs = ft.value.jobs; ftTotal = ft.value.total ?? ft.value.jobs.length; cityError = ft.value.cityError; }
    else ftError = ft.reason;

    let joobleResult = jooble.status === 'fulfilled' ? jooble.value : { jobs:[], total:0, available:false };
    let adzunaResult = adzuna.status === 'fulfilled' ? adzuna.value : { jobs:[], total:0, available:false };
    let jobs = dedupeJobs([...ftJobs, ...joobleResult.jobs, ...adzunaResult.jobs]);

    // Si aucune annonce ne sort, on essaie une correction légère du métier (ex. "livreue" -> "livreur").
    if (!jobs.length && q) {
      const suggestion = suggestJob(q);
      if (suggestion && normalizeText(suggestion) !== normalizeText(q)) {
        effectiveQ = suggestion;
        correctedQuery = suggestion;
        [ft, jooble, adzuna] = await runSources(effectiveQ);
        ftJobs = []; ftTotal = 0; cityError = false; ftError = null;
        if (ft.status === 'fulfilled') { ftJobs = ft.value.jobs; ftTotal = ft.value.total ?? ft.value.jobs.length; cityError = ft.value.cityError; }
        else ftError = ft.reason;
        joobleResult = jooble.status === 'fulfilled' ? jooble.value : { jobs:[], total:0, available:false };
        adzunaResult = adzuna.status === 'fulfilled' ? adzuna.value : { jobs:[], total:0, available:false };
        jobs = dedupeJobs([...ftJobs, ...joobleResult.jobs, ...adzunaResult.jobs]);
      }
    }

    if (!jobs.length && cityError) return NextResponse.json({ error:'Ville introuvable.' }, {status:400});
    if (!jobs.length && ftError && !joobleResult.available && !adzunaResult.available) {
      if (ftError?.message === 'CONFIG_MISSING') return NextResponse.json({ error:'Les identifiants France Travail ne sont pas encore configurés.' }, {status:503});
      return NextResponse.json({ error:'Les sources d’offres sont temporairement indisponibles.' }, {status:502});
    }

    return NextResponse.json({
      jobs, count:jobs.length, correctedQuery: correctedQuery || null,
      totalAvailable: Math.max(jobs.length, ftTotal + (joobleResult.total || 0) + (adzunaResult.total || 0)),
      totals:{ franceTravail:ftTotal, jooble:joobleResult.total || 0, adzuna:adzunaResult.total || 0 },
      sources:{ franceTravail:ftJobs.length, jooble:joobleResult.jobs.length, adzuna:adzunaResult.jobs.length, joobleAvailable:joobleResult.available, adzunaAvailable:adzunaResult.available }
    });
  } catch (e) {
    return NextResponse.json({ error:'Erreur temporaire lors de la recherche.' }, {status:500});
  }
}
