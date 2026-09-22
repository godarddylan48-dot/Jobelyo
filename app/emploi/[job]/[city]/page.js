import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { landingConfig, landingJobs, SEO_CITIES, SEO_JOBS } from '../../../../lib/seoLanding';
export const revalidate=1800;

function dateFr(value){
  if(!value)return'';
  try{return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));}catch{return'';}
}
function pageStats(jobs){
  const employers=new Set(jobs.map(j=>j.company).filter(Boolean));
  const contracts={};
  for(const j of jobs){const c=(j.contract||'Non précisé').trim();contracts[c]=(contracts[c]||0)+1;}
  const topContracts=Object.entries(contracts).sort((a,b)=>b[1]-a[1]).slice(0,3);
  return {employers:employers.size,topContracts};
}

export async function generateMetadata({params}){
  const p=await params,c=landingConfig(p.job,p.city);
  if(!c)return{robots:{index:false,follow:true}};
  const jobs=await landingJobs(c.query,c.city);
  const hasJobs=jobs.length>0;
  const label=c.seoJobName||c.jobName;
  return{
    title:`Emploi ${label} à ${c.city} : ${hasJobs?`${jobs.length} offres`:'offres'} | Jobelyo`,
    description:`${hasJobs?`${jobs.length} offres`:'Offres'} d’emploi ${label.toLowerCase()} à ${c.city} et autour. Annonces actualisées, contrats, entreprises et accès direct pour candidater.`,
    alternates:{canonical:`/emploi/${c.jobSlug}/${c.citySlug}`},
    robots:{index:hasJobs,follow:true,googleBot:{index:hasJobs,follow:true}}
  };
}

export default async function Page({params}){
  const p=await params,c=landingConfig(p.job,p.city);if(!c)notFound();
  if(c.requestedJobSlug!==c.jobSlug) permanentRedirect(`/emploi/${c.jobSlug}/${c.citySlug}`);
  const jobs=await landingJobs(c.query,c.city);
  const stats=pageStats(jobs);
  const nearby=SEO_CITIES.filter(x=>x[0]!==c.citySlug).slice(0,6);
  const related=SEO_JOBS.filter(x=>x[0]!==c.jobSlug).slice(0,5);
  const label=c.seoJobName||c.jobName;
  const updated=new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'long',year:'numeric'}).format(new Date());
  const schema={
    '@context':'https://schema.org','@type':'CollectionPage',
    name:`Emploi ${label} à ${c.city}`,
    url:`https://www.jobelyo.fr/emploi/${c.jobSlug}/${c.citySlug}`,
    description:`Offres d’emploi ${label.toLowerCase()} à ${c.city} et dans les environs.`,
    mainEntity:{'@type':'ItemList',numberOfItems:jobs.length,itemListElement:jobs.slice(0,20).map((j,i)=>({'@type':'ListItem',position:i+1,url:`https://www.jobelyo.fr/offres/france-travail/${encodeURIComponent(j.id)}`,name:j.title}))}
  };
  return <main className="seoPage"><div className="seoShell">
    <Link href="/" className="jobDetailBack">← Rechercher toutes les offres</Link>
    <h1>Emploi {label} à {c.city}</h1>
    <p className="seoIntro">Vous cherchez un emploi de {label.toLowerCase()} à {c.city} ? Jobelyo regroupe les annonces récentes disponibles autour de {c.city}, dans un rayon d’environ 30 km. Les résultats sont actualisés automatiquement à partir des offres disponibles.</p>
    {c.aliases?.length>0&&<p>Les recruteurs peuvent utiliser plusieurs intitulés pour ces postes : <strong>livreur</strong>, <strong>coursier</strong> ou <strong>chauffeur-livreur</strong>. Cette page regroupe ces recherches proches pour vous éviter de manquer une annonce pertinente.</p>}
    <div className="seoInfo"><strong>Offres actualisées le {updated}</strong><span>{jobs.length?`${jobs.length} offre${jobs.length>1?'s':''} actuellement affichée${jobs.length>1?'s':''} • ${stats.employers} employeur${stats.employers>1?'s':''}`:'Aucune offre disponible pour le moment'}</span></div>
    {jobs.length>0&&stats.topContracts.length>0&&<p><strong>Contrats actuellement proposés :</strong> {stats.topContracts.map(([name,count])=>`${name} (${count})`).join(' • ')}.</p>}
    <h2>{jobs.length?`Offres ${label} à ${c.city}`:'Offres en cours de mise à jour'}</h2>
    {jobs.length?<div className="seoJobs">{jobs.map(j=><Link key={j.id} href={`/offres/france-travail/${j.id}`} className="seoJob"><strong>{j.title}</strong><span>{j.company}</span><small>📍 {j.location}{j.contract?` • ${j.contract}`:''}{j.created?` • publiée le ${dateFr(j.created)}`:''}</small></Link>)}</div>:<p>Il n’y a pas d’annonce correspondant exactement à cette recherche actuellement. Cette page n’est pas proposée à l’indexation tant qu’elle ne contient aucune offre.</p>}
    <section className="seoRelated"><h2>Autres métiers recherchés à {c.city}</h2><div className="seoLinks">{related.map(x=><Link key={x[0]} href={`/emploi/${x[0]}/${c.citySlug}`}>Emploi {x[2]} à {c.city}</Link>)}</div>
    <h2>{label} dans d’autres villes</h2><div className="seoLinks">{nearby.map(x=><Link key={x[0]} href={`/emploi/${c.jobSlug}/${x[0]}`}>Emploi {label} à {x[1]}</Link>)}</div></section>
    <section className="seoGuide"><h2>Comment trouver un emploi de {label.toLowerCase()} à {c.city} ?</h2><p>Comparez les annonces récentes, le type de contrat et la distance avant de candidater. Répondre rapidement avec un CV à jour augmente vos chances lorsqu’une entreprise recrute autour de {c.city}.</p><p><Link href="/conseils-emploi/faire-un-bon-cv">Préparer un bon CV</Link> · <Link href="/conseils-emploi/preparer-entretien-embauche">Préparer un entretien</Link> · <Link href="/conseils-emploi/organiser-recherche-emploi">Organiser sa recherche d’emploi</Link></p></section>
    <p className="seoFoot">Jobelyo facilite la recherche d’emploi en regroupant des annonces et vous redirige vers le site d’origine pour candidater.</p>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />
  </div></main>;
}
