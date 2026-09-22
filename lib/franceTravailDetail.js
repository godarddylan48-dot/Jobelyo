const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const DETAIL_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres';
const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

async function getToken() {
  const id = process.env.FT_CLIENT_ID;
  const secret = process.env.FT_CLIENT_SECRET;
  if (!id || !secret) throw new Error('CONFIG_MISSING');
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret,
    scope: 'api_offresdemploiv2 o2dsoffre'
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`TOKEN_${response.status}`);
  return (await response.json()).access_token;
}

export async function getFranceTravailJob(id) {
  const cleanId = String(id || '').replace(/^ft-/, '').trim();
  if (!cleanId || !/^[A-Za-z0-9]+$/.test(cleanId)) return null;
  const token = await getToken();
  const response = await fetch(`${DETAIL_URL}/${encodeURIComponent(cleanId)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    next: { revalidate: 1800 }
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`FT_DETAIL_${response.status}`);
  const o = await response.json();
  return {
    id: cleanId,
    title: o.intitule || 'Offre d’emploi',
    company: o.entreprise?.nom || 'Entreprise',
    location: o.lieuTravail?.libelle || '',
    city: o.lieuTravail?.commune || o.lieuTravail?.libelle || '',
    postalCode: o.lieuTravail?.codePostal || '',
    contract: o.typeContratLibelle || o.typeContrat || '',
    contractNature: o.natureContrat || '',
    workTime: o.dureeTravailLibelle || '',
    salary: o.salaire?.libelle || '',
    description: o.description || '',
    experience: o.experienceLibelle || '',
    education: Array.isArray(o.formations) ? o.formations.map(f => f?.domaineLibelle || f?.niveauLibelle).filter(Boolean) : [],
    skills: Array.isArray(o.competences) ? o.competences.map(c => c?.libelle).filter(Boolean) : [],
    drivingLicenses: Array.isArray(o.permis) ? o.permis.map(p => p?.libelle).filter(Boolean) : [],
    datePosted: o.dateCreation || '',
    dateUpdated: o.dateActualisation || o.dateCreation || '',
    url: o.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(cleanId)}`
  };
}

export async function getLatestFranceTravailJobIds(limit = 100) {
  try {
    const wanted = Math.min(500, Math.max(1, Number(limit) || 100));
    const token = await getToken();
    const jobs = [];
    for (let start = 0; start < wanted; start += 150) {
      const end = Math.min(start + 149, wanted - 1);
      const params = new URLSearchParams({ range: `${start}-${end}`, sort: '1' });
      const response = await fetch(`${SEARCH_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        next: { revalidate: 3600 }
      });
      if (!response.ok) break;
      const data = await response.json();
      const batch = (data.resultats || []).map(o => ({
        id: o.id,
        title: o.intitule || 'Offre d’emploi',
        company: o.entreprise?.nom || 'Entreprise',
        location: o.lieuTravail?.libelle || '',
        contract: o.typeContratLibelle || o.typeContrat || '',
        updated: o.dateActualisation || o.dateCreation
      })).filter(o => o.id);
      jobs.push(...batch);
      if (batch.length < end - start + 1) break;
    }
    return jobs.slice(0, wanted);
  } catch {
    return [];
  }
}


export async function getSimilarFranceTravailJobs(job, limit = 6) {
  try {
    if (!job) return [];
    const token = await getToken();
    const params = new URLSearchParams({ range: `0-${Math.max(8, Number(limit) + 4)}`, sort: '1' });
    const words = String(job.title || '').replace(/[\/()\-]/g, ' ').split(/\s+/).filter(w => w.length >= 4).slice(0, 4).join(' ');
    if (words) params.set('motsCles', words);
    if (job.postalCode) params.set('departement', String(job.postalCode).slice(0, 2));
    const response = await fetch(`${SEARCH_URL}?${params}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, next: { revalidate: 1800 } });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.resultats || []).filter(o => o.id && String(o.id) !== String(job.id)).slice(0, limit).map(o => ({ id:o.id, title:o.intitule||'Offre d’emploi', company:o.entreprise?.nom||'Entreprise', location:o.lieuTravail?.libelle||'', contract:o.typeContratLibelle||o.typeContrat||'' }));
  } catch { return []; }
}
