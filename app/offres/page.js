import Link from 'next/link';
import { getLatestFranceTravailJobIds } from '../../lib/franceTravailDetail';

export const revalidate = 3600;

export const metadata = {
  title: 'Offres d’emploi récentes partout en France',
  description: 'Découvrez les offres d’emploi récemment publiées partout en France sur Jobelyo.',
  alternates: { canonical: '/offres' }
};

export default async function LatestJobsPage() {
  const jobs = await getLatestFranceTravailJobIds(150);
  return (
    <main className="jobDetailPage">
      <div className="jobDetailShell">
        <Link className="jobDetailBack" href="/">← Rechercher un emploi</Link>
        <article className="jobDetailArticle">
          <div className="jobDetailSource">Jobelyo</div>
          <h1>Offres d’emploi récentes</h1>
          <p className="jobDetailCompany">Les dernières offres publiées partout en France.</p>
          <div style={{display:'grid',gap:'12px',marginTop:'24px'}}>
            {jobs.map(job => (
              <Link key={job.id} href={`/offres/france-travail/${encodeURIComponent(job.id)}`} style={{display:'block',padding:'16px',border:'1px solid #e5e7eb',borderRadius:'12px',textDecoration:'none',color:'inherit'}}>
                <strong>{job.title}</strong>
                <div style={{marginTop:'5px',fontSize:'14px',color:'#64748b'}}>{job.company}{job.location ? ` · ${job.location}` : ''}{job.contract ? ` · ${job.contract}` : ''}</div>
              </Link>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
