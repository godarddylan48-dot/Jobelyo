import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INDEXING_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function getCredentials() {
  const raw = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (!raw) throw new Error('GOOGLE_INDEXING_CREDENTIALS_MISSING');

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    try {
      credentials = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      throw new Error('GOOGLE_INDEXING_CREDENTIALS_INVALID');
    }
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GOOGLE_INDEXING_CREDENTIALS_INCOMPLETE');
  }
  return credentials;
}

async function getAccessToken() {
  const credentials = getCredentials();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: SCOPE,
    aud: credentials.token_uri || TOKEN_URL,
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(credentials.private_key).toString('base64url');
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(credentials.token_uri || TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GOOGLE_TOKEN_${response.status}:${body.slice(0, 180)}`);
  }
  const data = await response.json();
  if (!data.access_token) throw new Error('GOOGLE_TOKEN_MISSING');
  return data.access_token;
}

export async function notifyGoogleUrl(url, type = 'URL_UPDATED', accessToken) {
  const token = accessToken || await getAccessToken();
  const response = await fetch(INDEXING_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url, type }),
    cache: 'no-store'
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GOOGLE_INDEXING_${response.status}:${text.slice(0, 220)}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function notifyGoogleUrls(urls, type = 'URL_UPDATED') {
  const token = await getAccessToken();
  const unique = [...new Set(urls.filter(Boolean))];
  const results = [];
  const batchSize = 8;

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(url => notifyGoogleUrl(url, type, token).then(() => ({ url, ok: true })))
    );
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') results.push(result.value);
      else results.push({ url: batch[index], ok: false, error: String(result.reason?.message || result.reason) });
    });
  }
  return results;
}
