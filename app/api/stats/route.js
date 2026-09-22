import { NextResponse } from 'next/server';

const TOKEN_URL='https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SEARCH_URL='https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

async function getToken(){
 const id=process.env.FT_CLIENT_ID, secret=process.env.FT_CLIENT_SECRET;
 if(!id||!secret) throw new Error('CONFIG_MISSING');
 const body=new URLSearchParams({grant_type:'client_credentials',client_id:id,client_secret:secret,scope:'api_offresdemploiv2 o2dsoffre'});
 const r=await fetch(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,cache:'no-store'});
 if(!r.ok) throw new Error('TOKEN_'+r.status);
 return (await r.json()).access_token;
}

export async function GET(){
 try{
  const token=await getToken();
  const r=await fetch(`${SEARCH_URL}?range=0-0`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'});
  if(!r.ok) throw new Error('FT_'+r.status);
  const cr=r.headers.get('content-range')||'';
  const m=cr.match(/\/(\d+)\s*$/);
  let total=m?Number(m[1]):0;
  if(!total){const data=await r.json(); total=Number(data?.resultats?.length||0)}
  return NextResponse.json({total,source:'France Travail'},{headers:{'Cache-Control':'s-maxage=900, stale-while-revalidate=3600'}});
 }catch(e){
  return NextResponse.json({total:0},{status:200});
 }
}
