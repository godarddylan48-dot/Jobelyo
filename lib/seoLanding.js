const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

export const SEO_JOBS = [
  ['chauffeur-livreur','chauffeur livreur','Chauffeur-livreur'],
  ['preparateur-commandes','préparateur de commandes','Préparateur de commandes'],
  ['vendeur','vendeur','Vendeur'],
  ['agent-entretien','agent entretien','Agent d’entretien'],
  ['serveur','serveur','Serveur'],
  ['cuisinier','cuisinier','Cuisinier'],
  ['magasinier','magasinier','Magasinier'],
  ['assistant-administratif','assistant administratif','Assistant administratif']
];
export const SEO_CITIES = [
  ['paris','Paris'],['marseille','Marseille'],['lyon','Lyon'],['toulouse','Toulouse'],['nice','Nice'],
  ['nantes','Nantes'],['montpellier','Montpellier'],['strasbourg','Strasbourg'],['bordeaux','Bordeaux'],['lille','Lille'],
  ['rennes','Rennes'],['reims','Reims'],['saint-etienne','Saint-Étienne'],['toulon','Toulon'],['le-havre','Le Havre'],
  ['grenoble','Grenoble'],['dijon','Dijon'],['angers','Angers'],['nimes','Nîmes'],['villeurbanne','Villeurbanne'],
  ['clermont-ferrand','Clermont-Ferrand'],['aix-en-provence','Aix-en-Provence'],['le-mans','Le Mans'],['brest','Brest'],['tours','Tours'],
  ['amiens','Amiens'],['limoges','Limoges'],['annecy','Annecy'],['perpignan','Perpignan'],['boulogne-billancourt','Boulogne-Billancourt'],
  ['metz','Metz'],['besancon','Besançon'],['orleans','Orléans'],['rouen','Rouen'],['saint-denis','Saint-Denis'],
  ['montreuil','Montreuil'],['mulhouse','Mulhouse'],['caen','Caen'],['nancy','Nancy'],['argenteuil','Argenteuil'],
  ['roubaix','Roubaix'],['tourcoing','Tourcoing'],['nanterre','Nanterre'],['vitry-sur-seine','Vitry-sur-Seine'],['creteil','Créteil'],
  ['avignon','Avignon'],['poitiers','Poitiers'],['aubervilliers','Aubervilliers'],['asnieres-sur-seine','Asnières-sur-Seine'],['colombes','Colombes'],
  ['versailles','Versailles'],['aulnay-sous-bois','Aulnay-sous-Bois'],['rueil-malmaison','Rueil-Malmaison'],['pau','Pau'],['la-rochelle','La Rochelle'],
  ['champigny-sur-marne','Champigny-sur-Marne'],['antibes','Antibes'],['saint-maur-des-fosses','Saint-Maur-des-Fossés'],['calais','Calais'],['beziers','Béziers'],
  ['dunkerque','Dunkerque'],['cannes','Cannes'],['merignac','Mérignac'],['saint-nazaire','Saint-Nazaire'],['colmar','Colmar'],
  ['valence','Valence'],['quimper','Quimper'],['bourges','Bourges'],['la-seyne-sur-mer','La Seyne-sur-Mer'],['chambery','Chambéry'],
  ['lorient','Lorient'],['troyes','Troyes'],['bayonne','Bayonne'],['niort','Niort'],['vannes','Vannes']
];
export function landingConfig(jobSlug, citySlug){
  const deliveryAliases=new Set(['livreur','coursier']);
  const canonicalJobSlug=deliveryAliases.has(jobSlug)?'chauffeur-livreur':jobSlug;
  const job=SEO_JOBS.find(x=>x[0]===canonicalJobSlug); const city=SEO_CITIES.find(x=>x[0]===citySlug);
  if(!job||!city) return null;
  const isDelivery=canonicalJobSlug==='chauffeur-livreur';
  return {jobSlug:canonicalJobSlug,requestedJobSlug:jobSlug,citySlug,query:isDelivery?'livreur':job[1],jobName:job[2],city:city[1],seoJobName:isDelivery?'Livreur et coursier':job[2],aliases:isDelivery?['livreur','coursier','chauffeur-livreur']:[]};
}
async function token(){
  if(!process.env.FT_CLIENT_ID||!process.env.FT_CLIENT_SECRET) return null;
  const body=new URLSearchParams({grant_type:'client_credentials',client_id:process.env.FT_CLIENT_ID,client_secret:process.env.FT_CLIENT_SECRET,scope:'api_offresdemploiv2 o2dsoffre'});
  const r=await fetch(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,cache:'no-store'}); if(!r.ok)return null; return (await r.json()).access_token;
}
async function commune(city){ const u=new URL('https://geo.api.gouv.fr/communes');u.searchParams.set('nom',city);u.searchParams.set('fields','nom,code,population');u.searchParams.set('boost','population');u.searchParams.set('limit','1');const r=await fetch(u,{next:{revalidate:86400}});if(!r.ok)return null;return (await r.json())?.[0]?.code||null; }
export async function landingJobs(query,city){
  try{const [t,c]=await Promise.all([token(),commune(city)]);if(!t||!c)return[];const p=new URLSearchParams({motsCles:query,commune:c,distance:'30',range:'0-19',sort:'1'});const r=await fetch(`${SEARCH_URL}?${p}`,{headers:{Authorization:`Bearer ${t}`,Accept:'application/json'},next:{revalidate:1800}});if(!r.ok)return[];const d=await r.json();return(d.resultats||[]).map(o=>({id:o.id,title:o.intitule||'Offre d’emploi',company:o.entreprise?.nom||'Entreprise',location:o.lieuTravail?.libelle||'',contract:o.typeContratLibelle||o.typeContrat||'',created:o.dateCreation||''}));}catch{return[];}
}
export function allLandingPaths(){return SEO_JOBS.flatMap(j=>SEO_CITIES.map(c=>({jobSlug:j[0],citySlug:c[0],jobName:j[2],city:c[1]})));}

export const SEO_INTENTS = [
  ['sans-diplome','sans diplôme','Sans diplôme'],
  ['debutant-accepte','débutant accepté','Débutant accepté'],
  ['temps-partiel','temps partiel','Temps partiel'],
  ['alternance','alternance','Alternance'],
  ['teletravail','télétravail','Télétravail']
];
export function intentConfig(intentSlug, citySlug){
  const intent=SEO_INTENTS.find(x=>x[0]===intentSlug);
  const city=SEO_CITIES.find(x=>x[0]===citySlug);
  return intent&&city ? {intentSlug,citySlug,query:intent[1],intentName:intent[2],city:city[1]} : null;
}
export function allIntentPaths(){
  return SEO_INTENTS.flatMap(i=>SEO_CITIES.map(c=>({intentSlug:i[0],citySlug:c[0],intentName:i[2],city:c[1]})));
}
