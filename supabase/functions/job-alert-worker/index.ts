import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
const SUPABASE_SECRET_KEY = SECRET_KEYS.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const EXPECTED_TOKEN_SHA256 = '93def4c86f5f0435905a64f299c6a3ec95c25964c1859b80fb96dc98263c40fd'
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })

function esc(v: unknown) { return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c] ?? c)) }
async function sha256(input: string) { const data = new TextEncoder().encode(input); const digest = await crypto.subtle.digest('SHA-256', data); return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('') }
function normalizeJob(j: any) { const id = String(j?.id ?? j?.jobId ?? j?.offerId ?? j?.url ?? j?.link ?? ''); return { id, title: j?.title ?? j?.intitule ?? j?.name ?? 'Offre d’emploi', company: j?.company ?? j?.entreprise ?? j?.companyName ?? j?.employer ?? '', location: j?.location ?? j?.lieu ?? j?.city ?? j?.ville ?? '', url: j?.url ?? j?.link ?? j?.applyUrl ?? j?.redirect_url ?? 'https://www.jobelyo.fr', source: j?.source ?? j?.provider ?? '' } }
async function sendMail(to: string, query: string, city: string, jobs: any[], unsubscribeToken:string) {
  const cards = jobs.slice(0, 12).map((j) => `<div style="padding:16px 0;border-bottom:1px solid #e5e7eb"><div style="font-size:17px;font-weight:700">${esc(j.title)}</div>${j.company ? `<div>${esc(j.company)}</div>` : ''}${j.location ? `<div style="color:#64748b">${esc(j.location)}</div>` : ''}${j.source ? `<div style="color:#94a3b8;font-size:12px;margin-top:3px">${esc(j.source)}</div>` : ''}<div style="margin-top:10px"><a href="${esc(j.url)}" style="background:#0f9f6e;color:#fff;text-decoration:none;padding:9px 14px;border-radius:8px;display:inline-block">Voir l’offre</a></div></div>`).join('')
  const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/unsubscribe-job-alert?token=${encodeURIComponent(unsubscribeToken)}`
  const subject = `${jobs.length} nouvelle${jobs.length > 1 ? 's' : ''} offre${jobs.length > 1 ? 's' : ''} pour ${query} à ${city} – Jobelyo`
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0f172a"><h1 style="color:#0f9f6e">Jobelyo</h1><p>De nouvelles offres correspondent à votre alerte <strong>${esc(query)}</strong> près de <strong>${esc(city)}</strong>.</p>${cards}<p style="margin-top:24px;color:#64748b;font-size:13px">Vous recevez cet e-mail car vous avez créé une alerte sur Jobelyo.</p><p style="color:#64748b;font-size:12px"><a href="${esc(unsubscribeUrl)}" style="color:#64748b">Se désabonner de cette alerte</a></p></div>`
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Jobelyo <alertes@jobelyo.fr>', to: [to], subject, html, headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` } }) })
  const body = await r.text(); if (!r.ok) throw new Error(`Resend ${r.status}: ${body.slice(0, 300)}`)
}
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || await sha256(token) !== EXPECTED_TOKEN_SHA256) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SECRET_KEY) return Response.json({ error: 'Missing server configuration' }, { status: 500 })
  const { data: alerts, error } = await supabase.from('job_alerts').select('*').eq('active', true)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  let checked = 0, sent = 0, errors = 0
  for (const alert of alerts ?? []) {
    try {
      const url = new URL('https://www.jobelyo.fr/api/jobs')
      url.searchParams.set('q', alert.query); url.searchParams.set('city', alert.city); url.searchParams.set('radius', String(alert.radius ?? 30))
      const r = await fetch(url.toString(), { headers: { 'User-Agent': 'JobelyoAlertWorker/1.0' } })
      if (!r.ok) throw new Error(`Jobs API ${r.status}`)
      const payload = await r.json()
      const rawJobs = Array.isArray(payload) ? payload : (Array.isArray(payload?.jobs) ? payload.jobs : (Array.isArray(payload?.data) ? payload.data : []))
      const jobs = rawJobs.map(normalizeJob).filter((j: any) => j.id)
      const currentIds = jobs.map((j: any) => j.id).slice(0, 200)
      const previousIds = Array.isArray(alert.last_seen_job_ids) ? alert.last_seen_job_ids.map(String) : []
      const previousSet = new Set(previousIds)
      const newJobs = previousIds.length === 0 ? [] : jobs.filter((j: any) => !previousSet.has(j.id))
      const now = new Date().toISOString()
      const update: any = { last_seen_job_ids: currentIds, last_checked_at: now }
      if (newJobs.length > 0) {
        await sendMail(alert.email, alert.query, alert.city, newJobs, alert.unsubscribe_token)
        update.last_sent_at = now; update.send_count = (alert.send_count ?? 0) + 1; sent += 1
      }
      const { error: updateError } = await supabase.from('job_alerts').update(update).eq('id', alert.id)
      if (updateError) throw updateError
      checked += 1
    } catch (e) { console.error('alert processing failed', alert?.id, e instanceof Error ? e.message : String(e)); errors += 1 }
  }
  return Response.json({ ok: true, checked, sent, errors })
})
