import { getLatestFranceTravailJobIds } from '../lib/franceTravailDetail';
import { allLandingPaths } from '../lib/seoLanding';

export const revalidate = 3600;

export default async function sitemap() {
  const base = 'https://www.jobelyo.fr';
  const latest = await getLatestFranceTravailJobIds(500);
  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    ...['a-propos','contact','mentions-legales','confidentialite','conseils-emploi','conseils-emploi/faire-un-bon-cv','conseils-emploi/preparer-entretien-embauche','conseils-emploi/organiser-recherche-emploi','conseils-emploi/repondre-offre-emploi'].map(path => ({
      url: `${base}/${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    })),
    { url: `${base}/emploi`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/offres`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    ...allLandingPaths().map(p => ({ url: `${base}/emploi/${p.jobSlug}/${p.citySlug}`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 })),
    ...latest.map(job => ({
      url: `${base}/offres/france-travail/${encodeURIComponent(job.id)}`,
      lastModified: job.updated ? new Date(job.updated) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8
    }))
  ];
}
