import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFranceTravailJob, getSimilarFranceTravailJobs } from '../../../../lib/franceTravailDetail';
import TrackedApplyLink from './TrackedApplyLink';

export const revalidate = 1800;

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function employmentType(contract = '') {
  const c = contract.toLowerCase();
  if (c.includes('cdi')) return 'FULL_TIME';
  if (c.includes('cdd')) return 'FULL_TIME';
  if (c.includes('intérim') || c.includes('interim')) return 'TEMPORARY';
  if (c.includes('alternance') || c.includes('apprentissage')) return 'INTERN';
  return undefined;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const job = await getFranceTravailJob(id);
    if (!job) return { title: 'Offre introuvable' };
    const description = cleanText(job.description).slice(0, 155) || `${job.title} chez ${job.company}${job.location ? ` à ${job.location}` : ''}.`;
    const canonical = `/offres/france-travail/${encodeURIComponent(job.id)}`;
    return {
      title: `${job.title} – ${job.company}`,
      description,
      alternates: { canonical },
      openGraph: {
        type: 'article',
        url: `https://www.jobelyo.fr${canonical}`,
        title: `${job.title} – ${job.company}`,
        description
      }
    };
  } catch {
    return { title: 'Offre d’emploi' };
  }
}

export default async function JobPage({ params }) {
  const { id } = await params;
  let job;
  try { job = await getFranceTravailJob(id); } catch { job = null; }
  if (!job) notFound();
  const similarJobs = await getSimilarFranceTravailJobs(job, 6);

  const canonical = `https://www.jobelyo.fr/offres/france-travail/${encodeURIComponent(job.id)}`;
  const jobPosting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted || undefined,
    employmentType: employmentType(job.contract),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company
    },
    jobLocation: job.location ? {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city || job.location,
        postalCode: job.postalCode || undefined,
        addressCountry: 'FR'
      }
    } : undefined,
    url: canonical,
    directApply: false
  };

  return (
    <main className="jobDetailPage">
      <div className="jobDetailShell">
        <Link className="jobDetailBack" href="/">← Retour à la recherche</Link>
        <article className="jobDetailArticle">
          <div className="jobDetailSource">France Travail</div>
          <h1>{job.title}</h1>
          <p className="jobDetailCompany">{job.company}</p>
          <div className="jobDetailMeta">
            {job.location && <span>📍 {job.location}</span>}
            {job.contract && <span>{job.contract}</span>}
            {job.salary && <span>{job.salary}</span>}
            {job.datePosted && <span>Publiée le {new Date(job.datePosted).toLocaleDateString('fr-FR')}</span>}
          </div>
          <h2>Description du poste</h2>
          <div className="jobDetailDescription">{job.description}</div>
          <TrackedApplyLink href={job.url} title={job.title} city={job.city || job.location} />
          <p className="jobDetailNote">Jobelyo référence cette offre et vous redirige vers le site d’origine pour candidater.</p>
        </article>
        {similarJobs.length > 0 && <section className="similarJobs">
          <h2>Offres similaires près de chez vous</h2>
          <p className="similarJobsIntro">Continuez votre recherche avec d’autres offres récentes dans le même secteur.</p>
          <div className="similarJobsGrid">{similarJobs.map(o => <Link className="similarJobCard" key={o.id} href={`/offres/france-travail/${encodeURIComponent(o.id)}`}>
            <strong>{o.title}</strong><span>{o.company}</span>{o.location && <span>📍 {o.location}</span>}{o.contract && <small>{o.contract}</small>}
          </Link>)}</div>
        </section>}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPosting) }} />
    </main>
  );
}
