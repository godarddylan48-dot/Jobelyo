import { getLatestFranceTravailJobIds } from '../lib/franceTravailDetail';
import { SEO_JOBS, SEO_CITIES } from '../lib/seoLanding';

// Keep the sitemap focused on URLs that are likely to remain live.
// France Travail offers can expire quickly, so we deliberately use the same
// 150-offer window as the public /offres page instead of exposing 500 URLs.
export const revalidate = 3600;

function norm(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugCity(value = '') {
  const n = norm(value);
  const hit = SEO_CITIES.find(([, name]) => norm(name) === n);
  return hit?.[0] || null;
}

function matchJob(title = '') {
  const n = norm(title);
  for (const [slug, query] of SEO_JOBS) {
    const q = norm(query);
    if (n.includes(q)) return slug;
  }
  return null;
}

function buildLandingPathsFromRecentJobs(jobs) {
  const seen = new Set();
  for (const job of jobs) {
    const jobSlug = matchJob(job.title);
    const citySlug = slugCity(job.location);
    if (!jobSlug || !citySlug) continue;
    seen.add(`${jobSlug}/${citySlug}`);
  }
  return [...seen].map((key) => {
    const [jobSlug, citySlug] = key.split('/');
    return { jobSlug, citySlug };
  });
}

export default async function sitemap() {
  const base = 'https://www.jobelyo.fr';
  // Offers are volatile. Limiting this to the freshest 150 reduces stale URLs
  // in Google's crawl queue while keeping the sitemap useful for discovery.
  const latest = await getLatestFranceTravailJobIds(150);

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    ...[
      'a-propos',
      'contact',
      'mentions-legales',
      'confidentialite',
      'conseils-emploi',
      'conseils-emploi/faire-un-bon-cv',
      'conseils-emploi/preparer-entretien-embauche',
      'conseils-emploi/organiser-recherche-emploi',
      'conseils-emploi/repondre-offre-emploi'
    ].map((path) => ({
      url: `${base}/${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    })),
    {
      url: `${base}/emploi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${base}/emploi-type`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    },
    {
      url: `${base}/offres`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9
    },
    ...buildLandingPathsFromRecentJobs(latest).map((p) => ({
      url: `${base}/emploi/${p.jobSlug}/${p.citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7
    })),
    ...latest.map((job) => ({
      url: `${base}/offres/france-travail/${encodeURIComponent(job.id)}`,
      lastModified: job.updated ? new Date(job.updated) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8
    }))
  ];
}
