import { getLatestFranceTravailJobIds } from '../../../lib/franceTravailDetail';
import { notifyIndexNow } from '../../../lib/indexNow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!process.env.CRON_SECRET) return Response.json({ ok: false, error: 'CRON_SECRET_MISSING' }, { status: 503 });
  if (!isAuthorized(request)) return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const latest = await getLatestFranceTravailJobIds(100);
    const urls = latest.map(job => `https://www.jobelyo.fr/offres/france-travail/${encodeURIComponent(job.id)}`);
    const result = await notifyIndexNow(urls);
    return Response.json({ ok: result.ok, checked: urls.length, submitted: result.submitted, indexNowStatus: result.status }, { status: result.ok ? 200 : 502 });
  } catch (error) {
    console.error('IndexNow cron failed:', error);
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}
