const fs=require('fs'),path=require('path'),z=require('zlib');
const chunks=fs.readdirSync('.').filter(f=>/^chunk\d+\.txt$/.test(f)).sort();
const b64=chunks.map(f=>fs.readFileSync(f,'utf8')).join('');
const files=JSON.parse(z.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
for(const [p,d] of Object.entries(files)){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.from(d,'base64'))}
