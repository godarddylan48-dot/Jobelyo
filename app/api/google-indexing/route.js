import { getLatestFranceTravailJobIds } from '../../../lib/franceTravailDetail';
import { notifyGoogleUrls } from '../../../lib/googleIndexing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: 'CRON_SECRET_MISSING' }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const latest = await getLatestFranceTravailJobIds(50);
    const urls = latest.map(job => `https://www.jobelyo.fr/offres/france-travail/${encodeURIComponent(job.id)}`);
    const results = await notifyGoogleUrls(urls, 'URL_UPDATED');
    const sent = results.filter(r => r.ok).length;
    const failed = results.length - sent;
    return Response.json({ ok: failed === 0, checked: urls.length, sent, failed });
  } catch (error) {
    console.error('Google indexing cron failed:', error);
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}
