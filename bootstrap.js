const fs=require('fs'),path=require('path'),z=require('zlib');
// The project bundle is intentionally stored in chunk00.txt.
// Ignore any older chunk*.txt files that may remain in the GitHub repo after uploads.
const b64=fs.readFileSync('chunk00.txt','utf8').trim();
const files=JSON.parse(z.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
for(const [p,d] of Object.entries(files)){
  fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,Buffer.from(d,'base64'));
}
