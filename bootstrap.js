const fs=require('fs'),path=require('path'),z=require('zlib');
const chunks=fs.readdirSync('.').filter(f=>/^chunk\d+\.txt$/.test(f)).sort();
const b64=chunks.map(f=>fs.readFileSync(f,'utf8')).join('');
const files=JSON.parse(z.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
for(const [p,d] of Object.entries(files)){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from(d,'base64'))}

fs.mkdirSync('public',{recursive:true});
fs.writeFileSync('public/70dffdac046cf2b9aca61c73215d16f9.html',`<!doctype html><html><head><meta charset="utf-8"></head><body>70dffdac046cf2b9aca61c73215d16f9</body></html>`,'utf8');
