'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { track } from '@vercel/analytics';
import Link from 'next/link';
import './styles.css';

const supabase=createClient('https://bobmcfcthocluoctrpre.supabase.co','sb_publishable_lBsHenmwJydQC6Vo5_jasw_FpX5rCtb');


function AdBanner({slot}){
 const client=process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
 useEffect(()=>{
  if(!client||!slot)return;
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch{}
 },[client,slot]);
 if(!client||!slot)return null;
 return <aside className="adBlock" aria-label="Publicité"><span>Publicité</span><ins className="adsbygoogle" style={{display:'block'}} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" /></aside>;
}


function LingzioPartner(){
 return <aside className="partnerCard" aria-label="Offre partenaire">
  <div className="partnerIcon" aria-hidden="true">🌍</div>
  <div className="partnerContent">
   <span className="partnerLabel">Lien partenaire</span>
   <strong>Améliorez vos langues pour votre carrière</strong>
   <p>Anglais, espagnol, allemand, français et italien avec Lingzio.</p>
  </div>
  <a className="partnerButton" href="https://www.awin1.com/cread.php?awinmid=127997&awinaffid=3073515&ued=https%3A%2F%2Flingzio.com" target="_blank" rel="sponsored noopener noreferrer" onClick={()=>track('affiliate_click',{partner:'lingzio',placement:'job_results'})}>Découvrir Lingzio</a>
 </aside>;
}

export default function Home(){
 const [job,setJob]=useState(''),[place,setPlace]=useState(''),[radius,setRadius]=useState('30');
 const [jobs,setJobs]=useState([]),[loading,setLoading]=useState(false),[searched,setSearched]=useState(false),[error,setError]=useState('');
 const [selected,setSelected]=useState(null);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [contract,setContract]=useState('all');
 const [minSalary,setMinSalary]=useState('');
 const [salaryOnly,setSalaryOnly]=useState(false);
 const [dateRange,setDateRange]=useState('all');
 const [sourceFilter,setSourceFilter]=useState('all');
 const [sort,setSort]=useState('recent');
 const [favoritesOnly,setFavoritesOnly]=useState(false);
 const [favorites,setFavorites]=useState([]);
 const [correctedQuery,setCorrectedQuery]=useState('');
 const [sourceCounts,setSourceCounts]=useState({franceTravail:0,jooble:0,adzuna:0});
 const [alertOpen,setAlertOpen]=useState(false),[alertEmail,setAlertEmail]=useState(''),[alertStatus,setAlertStatus]=useState(''),[alertSaving,setAlertSaving]=useState(false);
 const [nationalTotal,setNationalTotal]=useState(null);
 const [accountOpen,setAccountOpen]=useState(false),[authMode,setAuthMode]=useState('login'),[authEmail,setAuthEmail]=useState(''),[authPassword,setAuthPassword]=useState(''),[authStatus,setAuthStatus]=useState(''),[authBusy,setAuthBusy]=useState(false);
 const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[myAlerts,setMyAlerts]=useState([]);
 const [adminData,setAdminData]=useState(null),[adminBusy,setAdminBusy]=useState(false),[adminError,setAdminError]=useState('');
 const [appOpen,setAppOpen]=useState(false),[installPrompt,setInstallPrompt]=useState(null),[appInstalled,setAppInstalled]=useState(false);
 const [latestJobs,setLatestJobs]=useState([]);
 const [showMoreCities,setShowMoreCities]=useState(false),[showMoreJobs,setShowMoreJobs]=useState(false);

 useEffect(()=>{
  let alive=true;
  fetch('/api/latest-jobs').then(r=>r.ok?r.json():null).then(data=>{if(alive&&Array.isArray(data?.jobs))setLatestJobs(data.jobs)}).catch(()=>{});
  return()=>{alive=false};
 },[]);

 useEffect(()=>{
  // Les raccourcis "Emplois par ville" et "Emplois par métier" ouvrent
  // directement une vraie recherche, sans imposer un métier ou une ville arbitraire.
  const params=new URLSearchParams(window.location.search);
  if(params.get('search')!=='1')return;
  const initialJob=params.get('q')||'';
  const initialCity=params.get('city')||'';
  const initialRadius=params.get('radius')||'30';
  setJob(initialJob);setPlace(initialCity);setRadius(initialRadius);
  setLoading(true);setError('');setSearched(true);setSelected(null);setFavoritesOnly(false);setCorrectedQuery('');
  const apiParams=new URLSearchParams({q:initialJob,city:initialCity,radius:initialRadius});
  fetch(`/api/jobs?${apiParams}`).then(async r=>{
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||'Recherche impossible');
   const foundJobs=d.jobs||[];
   setJobs(foundJobs);
   setSourceCounts({franceTravail:d.sources?.franceTravail||0,jooble:d.sources?.jooble||0,adzuna:d.sources?.adzuna||0});
   track('popular_search_open',{query:initialJob||'(tous)',city:initialCity||'(France)',results_count:foundJobs.length});
   if(d.correctedQuery&&d.correctedQuery.toLowerCase()!==initialJob.trim().toLowerCase()){setCorrectedQuery(d.correctedQuery);setJob(d.correctedQuery)}
  }).catch(err=>{setJobs([]);setError(err.message)}).finally(()=>setLoading(false));
 },[]);

 useEffect(()=>{
  document.body.style.overflow=(selected||filtersOpen||alertOpen||accountOpen||appOpen)?'hidden':'';
  return()=>{document.body.style.overflow=''};
 },[selected,filtersOpen,alertOpen,accountOpen,appOpen]);
 useEffect(()=>{
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(standalone)setAppInstalled(true);
  const onPrompt=e=>{e.preventDefault();setInstallPrompt(e)};
  const onInstalled=async()=>{setAppInstalled(true);setInstallPrompt(null);track('app_installed',{source:'pwa'});try{await supabase.from('app_install_events').insert({source:'pwa'})}catch{}};
  window.addEventListener('beforeinstallprompt',onPrompt);
  window.addEventListener('appinstalled',onInstalled);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').then(r=>r.update()).catch(()=>{});
  return()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled)};
 },[]);

 async function installApp(){
  track('app_install_click',{available:Boolean(installPrompt)});
  if(!installPrompt)return;
  await installPrompt.prompt();
  const choice=await installPrompt.userChoice.catch(()=>null);
  if(choice?.outcome==='accepted')setAppInstalled(true);
  setInstallPrompt(null);
 }

 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem('jobelyo_favorites')||'[]');
   // Nouvelle version : on sauvegarde l'offre complète pour pouvoir la retrouver plus tard.
   setFavorites(Array.isArray(saved)?saved.filter(x=>x&&typeof x==='object'&&x.id):[]);
  }catch{setFavorites([])}
 },[]);
 useEffect(()=>{
  try{localStorage.setItem('jobelyo_favorites',JSON.stringify(favorites))}catch{}
 },[favorites]);
 useEffect(()=>{
  let alive=true;
  fetch('/api/stats').then(r=>r.json()).then(d=>{if(alive&&Number(d.total)>0)setNationalTotal(Number(d.total))}).catch(()=>{});
  return()=>{alive=false};
 },[]);

 useEffect(()=>{
  let mounted=true;
  async function loadSession(){
   const {data}=await supabase.auth.getSession();
   if(mounted) await applySession(data.session);
  }
  loadSession();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
   if(event==='PASSWORD_RECOVERY'){setAuthMode('reset');setAccountOpen(true);setAuthStatus('Choisissez votre nouveau mot de passe.')}
   await applySession(session);
  });
  return()=>{mounted=false;subscription.unsubscribe()};
 },[]);

 async function applySession(session){
  const u=session?.user||null; setUser(u);
  if(!u){setProfile(null);setMyAlerts([]);return}
  await supabase.from('profiles').insert({id:u.id,email:u.email,role:'user'});
  const [{data:p},{data:saved},{data:alerts}]=await Promise.all([
   supabase.from('profiles').select('id,email,role').eq('id',u.id).maybeSingle(),
   supabase.from('saved_jobs').select('job_data').eq('user_id',u.id).order('created_at',{ascending:false}),
   supabase.from('job_alerts').select('id,email,query,city,radius,active,created_at').eq('user_id',u.id).order('created_at',{ascending:false})
  ]);
  setProfile(p||null); setMyAlerts(alerts||[]);
  const remote=(saved||[]).map(x=>x.job_data).filter(x=>x&&x.id);
  if(remote.length){setFavorites(v=>{const m=new Map([...remote,...v].map(x=>[x.id,x]));return [...m.values()]})}
 }

 async function submitAuth(e){
  e.preventDefault();setAuthBusy(true);setAuthStatus('');
  try{
   if(authMode==='signup'){
    if(authPassword.length<8)throw new Error('Choisissez un mot de passe d’au moins 8 caractères.');
    const {data,error}=await supabase.auth.signUp({email:authEmail.trim(),password:authPassword});
    if(error)throw error;
    if(data.session){setAuthStatus('✓ Compte créé et connecté.');await applySession(data.session)}else setAuthStatus('✓ Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.');
   }else if(authMode==='login'){
    const {data,error}=await supabase.auth.signInWithPassword({email:authEmail.trim(),password:authPassword});
    if(error)throw error;setAuthStatus('✓ Connexion réussie.');await applySession(data.session);
   }else if(authMode==='reset'){
    if(authPassword.length<8)throw new Error('Choisissez un mot de passe d’au moins 8 caractères.');
    const {error}=await supabase.auth.updateUser({password:authPassword});if(error)throw error;setAuthStatus('✓ Mot de passe modifié.');setAuthMode('login');
   }
  }catch(err){setAuthStatus(err.message||'Une erreur est survenue.')}finally{setAuthBusy(false)}
 }
 async function sendReset(){
  if(!/^\S+@\S+\.\S+$/.test(authEmail)){setAuthStatus('Entrez votre adresse e-mail.');return}
  setAuthBusy(true);const {error}=await supabase.auth.resetPasswordForEmail(authEmail.trim(),{redirectTo:window.location.origin});setAuthBusy(false);setAuthStatus(error?error.message:'✓ E-mail de réinitialisation envoyé.');
 }
 async function logout(){
  // Déconnexion robuste, y compris dans la PWA Android.
  setAuthBusy(true);setAuthStatus('');
  // L'interface passe immédiatement en mode déconnecté : le bouton répond même
  // si Supabase ou le réseau met quelques secondes à répondre.
  setUser(null);setProfile(null);setMyAlerts([]);setAdminData(null);setAccountOpen(false);
  try{
   // Le signOut normal invalide également la session côté Supabase.
   const {error}=await supabase.auth.signOut();
   if(error)console.warn('Déconnexion Supabase :',error.message);
  }catch(err){
   console.warn('Déconnexion Supabase :',err?.message||err);
  }
  try{
   // Supprime toutes les anciennes variantes de clés Supabase pouvant subsister
   // après une mise à jour de l'application/PWA.
   for(const storage of [localStorage,sessionStorage]){
    for(let i=storage.length-1;i>=0;i--){
     const key=storage.key(i)||'';
     if(key.startsWith('sb-')||key.toLowerCase().includes('supabase'))storage.removeItem(key);
    }
   }
  }catch{}
  setAuthPassword('');setAuthBusy(false);
  // Recharge la page depuis le serveur afin qu'aucun ancien état React/PWA ne
  // puisse réafficher le compte après la déconnexion.
  window.location.replace('/?signedout=1');
 }
 async function refreshAlerts(){if(!user)return;const {data}=await supabase.from('job_alerts').select('id,email,query,city,radius,active,created_at').eq('user_id',user.id).order('created_at',{ascending:false});setMyAlerts(data||[])}
 async function deleteAlert(id){if(!user)return;await supabase.from('job_alerts').delete().eq('id',id).eq('user_id',user.id);await refreshAlerts()}
 async function toggleAlert(id,active){if(!user)return;await supabase.from('job_alerts').update({active:!active}).eq('id',id).eq('user_id',user.id);await refreshAlerts()}
 async function loadAdmin(){
  if(profile?.role!=='admin')return; setAdminBusy(true);setAdminError('');
  try{
   const {data:{session}}=await supabase.auth.getSession();
   const token=session?.access_token;if(!token)throw new Error('Session expirée.');
   const r=await fetch('https://bobmcfcthocluoctrpre.supabase.co/functions/v1/admin-dashboard',{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
   const d=await r.json();if(!r.ok)throw new Error(d.error||'Impossible de charger l’administration');setAdminData(d);
  }catch(e){setAdminError(e.message)}finally{setAdminBusy(false)}
 }


 async function saveAlert(e){
  e.preventDefault(); setAlertStatus('');
  if(!job.trim()||!place.trim()){setAlertStatus('Faites d’abord une recherche avec un métier et une ville.');return}
  if(!user){
   setAlertOpen(false);
   setAccountOpen(true);
   setAuthMode('login');
   setAuthStatus('Connectez-vous ou créez un compte pour activer une alerte.');
   return;
  }
  setAlertSaving(true);
  try{
   const {error}=await supabase.from('job_alerts').insert({email:user.email,query:job,city:place,radius:Number(radius),active:true,user_id:user.id});
   if(error)throw error;
   await refreshAlerts();
   setAlertStatus('✓ Alerte ajoutée à votre compte !');
  }catch(err){setAlertStatus(err.message)}finally{setAlertSaving(false)}
 }

 async function search(e){
  if(e)e.preventDefault();
  setLoading(true);setError('');setSearched(true);setSelected(null);setFavoritesOnly(false);setCorrectedQuery('');
  try{
   const p=new URLSearchParams({q:job,city:place,radius});
   const r=await fetch(`/api/jobs?${p}`);
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||'Recherche impossible');
   const foundJobs=d.jobs||[];
   const ftCount=d.sources?.franceTravail||0;
   const joobleCount=d.sources?.jooble||0;
   const adzunaCount=d.sources?.adzuna||0;
   setJobs(foundJobs);
   setSourceCounts({franceTravail:ftCount,jooble:joobleCount,adzuna:adzunaCount});
   track('job_search',{
    query:job.trim().slice(0,80)||'(vide)',
    city:place.trim().slice(0,80)||'(vide)',
    radius_km:Number(radius),
    results_count:foundJobs.length,
    france_travail_count:ftCount,
    jooble_count:joobleCount,
    adzuna_count:adzunaCount,
    corrected:Boolean(d.correctedQuery&&d.correctedQuery.toLowerCase()!==job.trim().toLowerCase())
   });

   if(d.correctedQuery&&d.correctedQuery.toLowerCase()!==job.trim().toLowerCase()){
    setCorrectedQuery(d.correctedQuery);
    setJob(d.correctedQuery);
   }
  }catch(err){setJobs([]);setError(err.message)}finally{setLoading(false)}
 }

 function salaryNumber(text=''){
  const nums=(text.match(/\d+(?:[.,]\d+)?/g)||[]).map(n=>Number(n.replace(',','.'))).filter(Number.isFinite);
  if(!nums.length)return null;
  const value=Math.max(...nums);
  const lower=text.toLowerCase();
  if(lower.includes('horaire'))return value*151.67;
  if(lower.includes('annuel'))return value/12;
  return value;
 }
 const sourceJobs=favoritesOnly?favorites:jobs;
 const favoriteIds=new Set(favorites.map(o=>o.id));
 const filteredJobs=sourceJobs.filter(o=>{
  const c=(o.contract||'').toLowerCase();
  const contractOk=contract==='all'||(contract==='cdi'&&c.includes('cdi'))||(contract==='cdd'&&c.includes('cdd'))||(contract==='interim'&&(c.includes('intérim')||c.includes('interim')));
  const min=Number(minSalary||0);
  const s=salaryNumber(o.salary||'');
  const salaryOk=(!salaryOnly||s!==null)&&(!min||(s!==null&&s>=min));
  const sourceOk=sourceFilter==='all'||(sourceFilter==='francetravail'&&o.sourceKey==='francetravail')||(sourceFilter==='jooble'&&o.sourceKey==='jooble')||(sourceFilter==='adzuna'&&o.sourceKey==='adzuna');
  let dateOk=true;
  if(dateRange!=='all'){
   const created=new Date(o.created||0).getTime();
   const days=Number(dateRange);
   dateOk=created>0&&(Date.now()-created)<=days*86400000;
  }
  return contractOk&&salaryOk&&sourceOk&&dateOk;
 }).sort((a,b)=>{
  if(sort==='recent') return new Date(b.created||0)-new Date(a.created||0);
  if(sort==='salary') return (salaryNumber(b.salary||'')||0)-(salaryNumber(a.salary||'')||0);
  return 0;
 });
 const activeFilters=(contract!=='all'?1:0)+(minSalary?1:0)+(salaryOnly?1:0)+(dateRange!=='all'?1:0)+(sourceFilter!=='all'?1:0);
 function resetFilters(){setContract('all');setMinSalary('');setSalaryOnly(false);setDateRange('all');setSourceFilter('all')}
 function formatDate(value){
  if(!value)return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
 }
 async function toggleFavorite(offer){
  const exists=favorites.some(x=>x.id===offer.id);
  track('favorite_change',{action:exists?'remove':'add',source:offer.sourceKey||offer.source||'unknown',job_title:String(offer.title||'').slice(0,100),city:String(offer.city||'').slice(0,80)});
  setFavorites(v=>exists?v.filter(x=>x.id!==offer.id):[offer,...v]);
  if(user){
   if(exists) await supabase.from('saved_jobs').delete().eq('user_id',user.id).eq('job_id',String(offer.id));
   else await supabase.from('saved_jobs').upsert({user_id:user.id,job_id:String(offer.id),job_data:offer},{onConflict:'user_id,job_id'});
  }
 }
 function openFavorites(){
  setFavoritesOnly(true);setSearched(true);setError('');setCorrectedQuery('');
  setTimeout(()=>document.getElementById('results')?.scrollIntoView({behavior:'smooth',block:'start'}),0);
 }
 function backToResults(){
  setFavoritesOnly(false);
  setTimeout(()=>document.getElementById('results')?.scrollIntoView({behavior:'smooth',block:'start'}),0);
 }

 return <main>
  <section className="hero"><div className="nav"><div className="brand">Job<span>elyo</span></div><div className="navActions"><button className="appButton" onClick={()=>{track('app_menu_open');setAppOpen(true)}}>📱 <span>Installer l’app</span></button><button className={favoritesOnly?'navFavorite active':'navFavorite'} onClick={()=>favoritesOnly?backToResults():openFavorites()}>♥ <span>Mes favoris</span>{favorites.length>0&&<b>{favorites.length}</b>}</button><button className="accountButton" onClick={()=>{setAccountOpen(true);if(profile?.role==='admin')setTimeout(loadAdmin,0)}}>{user?`👤 ${profile?.role==='admin'?'Admin':'Mon compte'}`:'👤 Se connecter'}</button><div className="pill">🇫🇷 France entière</div></div></div><div className="heroContent">
   <div className="eyebrow">Simple • rapide • sans compte</div><h1>Trouvez un emploi<br/><span>près de chez vous.</span></h1><p>Des offres partout en France. Recherchez, consultez les détails et postulez directement sur le site prévu par l’annonce.</p>{nationalTotal&&<div className="nationalStat"><div><strong>+{nationalTotal.toLocaleString('fr-FR')}</strong><span>offres disponibles partout en France</span></div><small>Compteur national France Travail • Jooble ajoute encore d’autres annonces dans vos recherches</small></div>}
   <form id="searchForm" className="search" onSubmit={search}><label>🔎<input value={job} onChange={e=>setJob(e.target.value)} placeholder="Métier, ex. chauffeur-livreur"/></label><label>📍<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Ville, ex. Amiens"/></label><select value={radius} onChange={e=>setRadius(e.target.value)}><option value="5">5 km</option><option value="10">10 km</option><option value="20">20 km</option><option value="30">30 km</option><option value="50">50 km</option><option value="100">100 km</option></select><button disabled={loading}>{loading?'Recherche…':'Trouver un emploi'}</button></form>
   <div className="searchTools"><button className="alertTrigger" onClick={()=>setAlertOpen(true)}>🔔 Créer une alerte</button><button className="filterTrigger" onClick={()=>setFiltersOpen(true)}>☰ Filtres{activeFilters?` (${activeFilters})`:''}</button><div className="sortWrap"><span>Trier :</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Plus récentes</option><option value="salary">Salaire le plus élevé</option><option value="default">Pertinence</option></select></div><div className="activeFilterPills">{contract!=='all'&&<span>{contract==='interim'?'Intérim':contract.toUpperCase()}</span>}{minSalary&&<span>≥ {minSalary} €/mois</span>}{salaryOnly&&<span>Salaire indiqué</span>}{dateRange!=='all'&&<span>Moins de {dateRange} j</span>}{sourceFilter!=='all'&&<span>{sourceFilter==='jooble'?'Jooble':sourceFilter==='adzuna'?'Adzuna':'France Travail'}</span>}</div></div>
  </div></section>

  <section className="popularJobs" aria-labelledby="popular-title"><div className="popularShell"><div className="popularHead"><span className="small">RECHERCHES POPULAIRES</span><h2 id="popular-title">Emplois populaires en France</h2><p>Accédez rapidement aux recherches les plus utiles, sans surcharger la page.</p></div><div className="popularGroups"><div><h3>Emplois par ville</h3><div className="popularLinks">{[['paris','Paris'],['marseille','Marseille'],['lyon','Lyon'],['toulouse','Toulouse'],['nice','Nice'],['nantes','Nantes'],['bordeaux','Bordeaux'],['lille','Lille'],...(showMoreCities?[['strasbourg','Strasbourg'],['rennes','Rennes'],['rouen','Rouen'],['amiens','Amiens']]:[])].map(([slug,city])=><a key={slug} href={`/?city=${encodeURIComponent(city)}&search=1`} onClick={()=>track('seo_popular_click',{type:'city_all_jobs',value:city})}>Emploi à {city}</a>)}</div><button type="button" className="popularMore" onClick={()=>setShowMoreCities(v=>!v)} aria-expanded={showMoreCities}>{showMoreCities?'Voir moins':'Voir toutes les villes'}</button></div><div><h3>Emplois par métier</h3><div className="popularLinks">{[['chauffeur-livreur','Chauffeur-livreur'],['preparateur-commandes','Préparateur de commandes'],['vendeur','Vendeur'],['agent-entretien','Agent d’entretien'],['serveur','Serveur'],['cuisinier','Cuisinier'],...(showMoreJobs?[['magasinier','Magasinier'],['assistant-administratif','Assistant administratif']]:[])].map(([slug,label])=><a key={slug} href={`/?q=${encodeURIComponent(label)}&search=1`} onClick={()=>track('seo_popular_click',{type:'job_all_france',value:label})}>{label}</a>)}</div><button type="button" className="popularMore" onClick={()=>setShowMoreJobs(v=>!v)} aria-expanded={showMoreJobs}>{showMoreJobs?'Voir moins':'Voir tous les métiers'}</button></div></div><Link className="popularAll" href="/emploi">Toutes les recherches métier × ville →</Link></div></section>

  <section id="results" className="content"><div className="headline"><div><span className="small">{favoritesOnly?'MES FAVORIS':searched?'OFFRES D’EMPLOI':'OFFRES RÉCENTES'}</span><h2>{loading?'Recherche en cours…':favoritesOnly?`${filteredJobs.length} favori${filteredJobs.length!==1?'s':''}`:searched?`${filteredJobs.length} offre${filteredJobs.length!==1?'s':''} trouvée${filteredJobs.length!==1?'s':''}`:'Les dernières offres publiées'}</h2></div>{favoritesOnly&&<button className="backResultsTop" onClick={backToResults}>← Revenir aux offres</button>}</div>{!favoritesOnly&&searched&&!loading&&!error&&(sourceCounts.franceTravail||sourceCounts.jooble||sourceCounts.adzuna)?<div className="sourceSummary"><span>France Travail <b>{sourceCounts.franceTravail}</b></span><span>Jooble <b>{sourceCounts.jooble}</b></span><span>Adzuna <b>{sourceCounts.adzuna}</b></span></div>:null}
   {!searched&&!favoritesOnly&&latestJobs.length>0&&<div className="latestOffers">{latestJobs.map(o=><Link className="latestOfferCard" key={o.id} href={`/offres/france-travail/${encodeURIComponent(o.id)}`} onClick={()=>track('job_view',{source:'francetravail',job_title:String(o.title||'').slice(0,100),city:String(o.location||'').slice(0,80),placement:'homepage_latest'})}><div className="latestOfferIcon">💼</div><div className="latestOfferBody"><h3>{o.title}</h3><p>{o.company}</p><div><span>📍 {o.location||'France'}</span>{o.contract&&<span>• {o.contract}</span>}</div></div><strong className="latestOfferArrow">›</strong></Link>)}</div>}
   {correctedQuery&&<div className="correctionNotice">✓ Recherche corrigée automatiquement en <strong>{correctedQuery}</strong></div>}
   {error&&<div className="empty">⚠️ {error}</div>}
   <div className="offers">{filteredJobs.map((o,index)=>{const internalUrl=o.sourceKey==='francetravail'?`/offres/france-travail/${encodeURIComponent(String(o.id).replace(/^ft-/,''))}`:null;return <div className="offerWithAd" key={o.id}><article className="card"><button className={favoriteIds.has(o.id)?'heart active':'heart'} aria-label="Ajouter aux favoris" onClick={()=>toggleFavorite(o)}>♥</button><div className="icon">💼</div><div className="cardMain"><div className="cardTop"><div><h3>{internalUrl?<Link href={internalUrl} onClick={()=>track('job_view',{source:o.sourceKey||'francetravail',job_title:String(o.title||'').slice(0,100),city:String(o.city||'').slice(0,80),placement:'title'})}>{o.title}</Link>:o.title}</h3><p>{o.company}</p></div><span className="distance">📍 {o.city}</span></div><div className="meta">{o.source&&<span className="sourceBadge">{o.source}</span>}{o.sourceKey==='adzuna'&&<a href="https://www.adzuna.fr/" target="_blank" rel="noopener noreferrer" className="adzunaAttribution">Jobs by Adzuna</a>}{o.contract&&<span>{o.contract}</span>}{o.salary&&<span>{o.salary}</span>}{o.created&&<span>Publié le {formatDate(o.created)}</span>}</div>{o.description&&<p className="previewText">{o.description.slice(0,180)}{o.description.length>180?'…':''}</p>}<div className="actions">{internalUrl?<><Link className="jobButton" href={internalUrl} onClick={()=>track('job_view',{source:o.sourceKey||'francetravail',job_title:String(o.title||'').slice(0,100),city:String(o.city||'').slice(0,80),placement:'button'})}>Voir l’offre sur Jobelyo</Link><span>Consultez l’offre puis postulez sur le site officiel</span></>:<><button className="detailButton" onClick={()=>{track('job_view',{source:o.sourceKey||o.source||'unknown',job_title:String(o.title||'').slice(0,100),city:String(o.city||'').slice(0,80),placement:'modal'});setSelected(o)}}>Voir les détails</button><a className="jobButton secondary" href={o.url} target="_blank" rel="noopener noreferrer" onClick={()=>track('apply_click',{source:o.sourceKey||o.source||'unknown',job_title:String(o.title||'').slice(0,100),city:String(o.city||'').slice(0,80),placement:'card'})}>Postuler</a><span>Candidature externe • aucun compte Jobelyo requis</span></>}</div></div></article>{!favoritesOnly&&searched&&index===3&&<AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_1}/>} {!favoritesOnly&&searched&&index===6&&<LingzioPartner/>} {!favoritesOnly&&searched&&index===11&&<AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_2}/>}</div>})}
   {favoritesOnly&&!loading&&filteredJobs.length===0&&<div className="empty favoritesEmpty"><strong>♥ Aucun favori pour le moment</strong><span>Enregistrez une offre avec le cœur pour la retrouver ici, même après avoir fermé le site.</span><button className="resetInline" onClick={backToResults}>Revenir aux offres</button></div>}
   {!favoritesOnly&&searched&&!loading&&!error&&filteredJobs.length===0&&<div className="empty">{jobs.length?<>Aucune offre ne correspond à vos filtres. <button className="resetInline" onClick={resetFilters}>Réinitialiser les filtres</button></>:<>Aucune offre trouvée. Vérifiez le métier ou essayez un rayon plus large.</>}</div>}</div>
  </section>

  <section className="promise"><div><strong>1.</strong><span>Vous recherchez</span><small>Métier + ville + rayon</small></div><div><strong>2.</strong><span>Vous consultez</span><small>Les détails de l’offre</small></div><div><strong>3.</strong><span>Vous postulez</span><small>Sur le site officiel de l’annonce</small></div></section>
  <footer><div className="brand">Job<span>elyo</span></div><p>Recherche d’offres en France • candidature sans compte Jobelyo.</p><nav className="footerLinks" aria-label="Informations"><Link href="/conseils-emploi">Conseils emploi</Link><Link href="/a-propos">À propos</Link><Link href="/contact">Contact</Link><Link href="/mentions-legales">Mentions légales</Link><Link href="/confidentialite">Confidentialité</Link></nav></footer>


  {appOpen&&<div className="modalBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAppOpen(false)}}>
   <section className="filterModal appModal" role="dialog" aria-modal="true" aria-label="Application Jobelyo">
    <button className="closeButton" aria-label="Fermer" onClick={()=>setAppOpen(false)}>×</button>
    <div className="appIcon">J</div>
    <div className="modalLabel">APPLICATION JOBELYO</div><h2>Jobelyo sur votre téléphone</h2>
    {appInstalled?<><div className="installSuccess">✓ Jobelyo est déjà installé sur cet appareil.</div><p className="filterIntro">Ouvrez Jobelyo depuis l’icône ajoutée à votre écran d’accueil.</p></>:<>
     <p className="filterIntro">Ajoutez Jobelyo à votre écran d’accueil pour l’ouvrir comme une application et retrouver rapidement vos recherches d’emploi.</p>
     {installPrompt?<button className="installAppButton" onClick={installApp}>📲 Installer Jobelyo</button>:<div className="installHelp"><strong>Installation rapide</strong><p><b>Android :</b> ouvrez le menu de votre navigateur ⋮ puis choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ».</p><p><b>iPhone :</b> appuyez sur Partager puis « Sur l’écran d’accueil ».</p></div>}
    </>}
    <p className="appNote">Gratuit • aucun téléchargement depuis un store nécessaire.</p>
   </section>
  </div>}

  {accountOpen&&<div className="modalBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAccountOpen(false)}}>
   <section className="filterModal accountModal" role="dialog" aria-modal="true" aria-label="Compte Jobelyo">
    <button className="closeButton" aria-label="Fermer" onClick={()=>setAccountOpen(false)}>×</button>
    {!user?<>
     <div className="modalLabel">COMPTE JOBELYO</div><h2>{authMode==='signup'?'Créer mon compte':authMode==='reset'?'Nouveau mot de passe':'Se connecter'}</h2>
     <div className="authTabs">{authMode!=='reset'&&<><button className={authMode==='login'?'active':''} onClick={()=>{setAuthMode('login');setAuthStatus('')}}>Connexion</button><button className={authMode==='signup'?'active':''} onClick={()=>{setAuthMode('signup');setAuthStatus('')}}>Créer un compte</button></>}</div>
     <form className="alertForm" onSubmit={submitAuth}>
      {authMode!=='reset'&&<><label>Adresse e-mail</label><input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="vous@email.fr" required/></>}
      <label>{authMode==='reset'?'Nouveau mot de passe':'Mot de passe'}</label><input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="8 caractères minimum" required/>
      <button className="applyFilters" disabled={authBusy}>{authBusy?'Patientez…':authMode==='signup'?'Créer mon compte':authMode==='reset'?'Enregistrer le mot de passe':'Se connecter'}</button>
     </form>
     {authMode==='login'&&<button className="forgotButton" onClick={sendReset}>Mot de passe oublié ?</button>}
     {authStatus&&<div className={authStatus.startsWith('✓')?'alertStatus success':'alertStatus'}>{authStatus}</div>}
    </>:<>
     <div className="modalLabel">MON COMPTE</div><h2>{profile?.role==='admin'?'Compte administrateur':'Mon compte Jobelyo'}</h2>
     <div className="accountEmail">{user.email}{profile?.role==='admin'&&<span className="adminBadge">ADMIN</span>}</div>
     <div className="accountStats"><div><strong>{favorites.length}</strong><span>favoris</span></div><div><strong>{myAlerts.length}</strong><span>alertes</span></div></div>
     <h3 className="accountSectionTitle">Mes alertes</h3>
     <div className="myAlerts">{myAlerts.length?myAlerts.map(a=><div className="myAlert" key={a.id}><div><strong>{a.query}</strong><span>{a.city} • {a.radius} km • {a.active?'Active':'En pause'}</span></div><div className="alertRowActions"><button className={a.active?'pauseAlert':'resumeAlert'} onClick={()=>toggleAlert(a.id,a.active)}>{a.active?'Pause':'Activer'}</button><button onClick={()=>deleteAlert(a.id)}>Supprimer</button></div></div>):<p className="accountEmpty">Aucune alerte liée à ce compte.</p>}</div>

     {profile?.role==='admin'&&<div className="adminPanel"><div className="adminPanelHead"><h3>Administration Jobelyo</h3><button onClick={loadAdmin} disabled={adminBusy}>{adminBusy?'Actualisation…':'Actualiser'}</button></div>{adminError&&<div className="alertStatus">{adminError}</div>}{adminData&&<><div className="adminStats"><div><strong>{adminData.stats?.users||0}</strong><span>utilisateurs</span></div><div><strong>{adminData.stats?.activeAlerts||0}</strong><span>alertes actives</span></div><div><strong>{adminData.stats?.alerts||0}</strong><span>alertes totales</span></div><div><strong>{adminData.stats?.savedJobs||0}</strong><span>favoris enregistrés</span></div><div><strong>{adminData.stats?.appInstalls||0}</strong><span>installations appli</span></div></div><h4>Dernières inscriptions</h4><div className="adminList">{(adminData.recentUsers||[]).map(u=><div key={u.id}><span>{u.email}</span><b>{u.role}</b></div>)}</div><h4>Dernières alertes</h4><div className="adminList">{(adminData.recentAlerts||[]).slice(0,8).map(a=><div key={a.id}><span>{a.query} • {a.city}</span><b>{a.active?'Active':'Pause'}</b></div>)}</div></>}</div>}
     <button className="logoutButton" onClick={logout}>Se déconnecter</button>
    </>}
   </section>
  </div>}

  {alertOpen&&<div className="modalBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAlertOpen(false)}}>
   <section className="filterModal alertModal" role="dialog" aria-modal="true" aria-label="Créer une alerte emploi">
    <button className="closeButton" aria-label="Fermer" onClick={()=>setAlertOpen(false)}>×</button>
    <div className="modalLabel">ALERTE EMPLOI</div><h2>Recevez les nouvelles offres</h2>
    <p className="filterIntro">Jobelyo enregistrera votre recherche <strong>{job||'Métier'}</strong> à <strong>{place||'Ville'}</strong> dans un rayon de <strong>{radius} km</strong>.</p>
    <form onSubmit={saveAlert} className="alertForm">{user?<div className="signedEmail">Alerte liée à <strong>{user.email}</strong></div>:<div className="signedEmail">Un compte Jobelyo est nécessaire pour recevoir des alertes.</div>}<button className="applyFilters" disabled={alertSaving}>{alertSaving?'Enregistrement…':user?'🔔 Activer mon alerte':'👤 Se connecter pour créer l’alerte'}</button></form>
    {alertStatus&&<div className={alertStatus.startsWith('✓')?'alertStatus success':'alertStatus'}>{alertStatus}</div>}
    <p className="externalNote">Les recherches et candidatures restent accessibles sans compte.</p>
   </section>
  </div>}

  {filtersOpen&&<div className="modalBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setFiltersOpen(false)}}>
   <section className="filterModal" role="dialog" aria-modal="true" aria-label="Filtres des offres">
    <button className="closeButton" aria-label="Fermer" onClick={()=>setFiltersOpen(false)}>×</button>
    <div className="modalLabel">AFFINER LA RECHERCHE</div>
    <h2>Filtres</h2>
    <p className="filterIntro">Choisissez vos critères sans alourdir la page.</p>
    <div className="filterGroup"><label>Type de contrat</label><div className="contractChoices">
     {[["all","Tous"],["cdi","CDI"],["cdd","CDD"],["interim","Intérim"]].map(([v,l])=><button key={v} className={contract===v?'active':''} onClick={()=>setContract(v)}>{l}</button>)}
    </div></div>
    <div className="filterGroup"><label>Source de l’offre</label><div className="contractChoices sourceChoices">
     {[["all","Toutes"],["francetravail","France Travail"],["jooble","Jooble"],["adzuna","Adzuna"]].map(([v,l])=><button key={v} className={sourceFilter===v?'active':''} onClick={()=>setSourceFilter(v)}>{l}</button>)}
    </div></div>
    <div className="filterGroup"><label>Date de publication</label><div className="contractChoices dateChoices">
     {[["all","Toutes"],["1","24 h"],["3","3 jours"],["7","7 jours"],["30","30 jours"]].map(([v,l])=><button key={v} className={dateRange===v?'active':''} onClick={()=>setDateRange(v)}>{l}</button>)}
    </div></div>
    <div className="filterGroup"><label>Favoris</label><button className={favoritesOnly?'favoritesChoice active':'favoritesChoice'} onClick={()=>setFavoritesOnly(v=>!v)}>♥ {favoritesOnly?'Afficher toutes les offres':'Afficher uniquement mes favoris'}</button></div>
    <div className="filterGroup"><label htmlFor="minSalary">Salaire minimum mensuel</label><div className="salaryInput"><span>€</span><input id="minSalary" inputMode="numeric" type="number" min="0" step="100" placeholder="Ex. 1800" value={minSalary} onChange={e=>setMinSalary(e.target.value)}/></div><small>Pour les salaires horaires ou annuels, Jobelyo fait une estimation mensuelle.</small></div>
    <div className="filterGroup"><label className="checkRow"><input type="checkbox" checked={salaryOnly} onChange={e=>setSalaryOnly(e.target.checked)}/><span>Afficher uniquement les offres avec salaire indiqué</span></label></div>
    <div className="filterActions"><button className="resetButton" onClick={resetFilters}>Réinitialiser</button><button className="applyFilters" onClick={()=>setFiltersOpen(false)}>Afficher {filteredJobs.length} offre{filteredJobs.length!==1?'s':''}</button></div>
   </section>
  </div>}

  {selected&&<div className="modalBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
   <section className="jobModal" role="dialog" aria-modal="true" aria-label={`Offre ${selected.title}`}>
    <button className="closeButton" aria-label="Fermer" onClick={()=>setSelected(null)}>×</button>
    <div className="modalLabel">OFFRE D’EMPLOI</div>
    <h2>{selected.title}</h2>
    <p className="modalCompany">{selected.company}</p>
    <div className="modalMeta">{selected.source&&<span>🔗 {selected.source}</span>}<span>📍 {selected.city}</span>{selected.contract&&<span>💼 {selected.contract}</span>}{selected.salary&&<span>💶 {selected.salary}</span>}{selected.created&&<span>🗓️ Publié le {formatDate(selected.created)}</span>}</div>
    <div className="descriptionBlock"><h3>Description du poste</h3><p>{selected.description||'Consultez l’annonce originale pour voir tous les détails du poste.'}</p></div>
    <div className="modalActions"><a className="applyButton" href={selected.url} target="_blank" rel="noopener noreferrer" onClick={()=>track('apply_click',{source:selected.sourceKey||selected.source||'unknown',job_title:String(selected.title||'').slice(0,100),city:String(selected.city||'').slice(0,80),placement:'modal'})}>Postuler sur le site de l’annonce ↗</a><button className={favoriteIds.has(selected.id)?'favoriteModal active':'favoriteModal'} onClick={()=>toggleFavorite(selected)}>♥ {favoriteIds.has(selected.id)?'Retirer des favoris':'Ajouter aux favoris'}</button><button className="backButton" onClick={()=>setSelected(null)}>Retour aux offres</button></div>
    <p className="externalNote">Vous quittez Jobelyo pour poursuivre votre candidature sur le site de l’annonce.</p>
   </section>
  </div>}
 </main>
}
