export const dynamic = 'force-static';

export function GET() {
  return new Response('google.com, pub-1644017583933283, DIRECT, f08c47fec0942fa0', {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
