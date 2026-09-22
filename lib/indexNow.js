const INDEXNOW_KEY = 'bcb1e247a1805688e675eedc6d659787';
const HOST = 'www.jobelyo.fr';
const KEY_LOCATION = `https://${HOST}/indexnow-key.txt`;

export async function notifyIndexNow(urls) {
  const unique = [...new Set((urls || []).filter(Boolean))].slice(0, 10000);
  if (!unique.length) return { ok: true, submitted: 0, status: 200 };

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList: unique }),
    cache: 'no-store'
  });

  return { ok: response.ok, submitted: unique.length, status: response.status };
}
