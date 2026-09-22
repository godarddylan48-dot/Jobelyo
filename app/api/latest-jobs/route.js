import { NextResponse } from 'next/server';
import { getLatestFranceTravailJobIds } from '../../../lib/franceTravailDetail';

export const dynamic = 'force-dynamic';

export async function GET() {
  const jobs = await getLatestFranceTravailJobIds(4);
  return NextResponse.json(
    { jobs },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } }
  );
}
