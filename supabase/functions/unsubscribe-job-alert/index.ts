import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
const SUPABASE_SECRET_KEY = SECRET_KEYS.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } })
function page(title:string, message:string, ok=true){
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:60px auto;padding:28px;background:white;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.08);text-align:center"><h1 style="color:#0f9f6e;margin:0 0 18px">Jobelyo</h1><h2>${title}</h2><p style="line-height:1.5">${message}</p><a href="https://www.jobelyo.fr" style="display:inline-block;margin-top:14px;background:#0f9f6e;color:white;text-decoration:none;padding:11px 18px;border-radius:9px">Retour sur Jobelyo</a></div></body></html>`,{status:ok?200:400,headers:{'content-type':'text/html; charset=utf-8'}})
}
Deno.serve(async(req:Request)=>{
  if(!SUPABASE_URL || !SUPABASE_SECRET_KEY) return page('Erreur','Le service est temporairement indisponible.',false)
  const url = new URL(req.url); const token = url.searchParams.get('token') ?? ''
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) return page('Lien invalide','Ce lien de désabonnement est invalide.',false)
  const { data, error } = await supabase.from('job_alerts').update({active:false}).eq('unsubscribe_token',token).select('id').maybeSingle()
  if(error) return page('Erreur','Impossible de désactiver cette alerte pour le moment.',false)
  if(!data) return page('Alerte introuvable','Cette alerte a déjà été supprimée ou le lien n’est plus valide.',false)
  return page('Alerte désactivée','Vous ne recevrez plus d’e-mails pour cette alerte. Vous pourrez en créer une nouvelle à tout moment sur Jobelyo.')
})
