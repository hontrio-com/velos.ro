/**
 * Verifica o singura data configurarea Cloudflare R2 pentru pozele ITP,
 * inainte de a anunta functia utilizatorilor. Face cereri REALE catre R2
 * (un obiect de test sub itp/00000000-.../, sters la final).
 *
 * Ce verifica:
 *  1. URL presemnat PUT cu Content-Type + Content-Length semnate: urcare OK;
 *  2. acelasi URL cu alta marime / alt Content-Type: R2 trebuie sa REFUZE (403);
 *  3. GET partial (Range) prin aws4fetch: 206 + Content-Range + Content-Type
 *     (se afiseaza si Last-Modified - confirmarea refuza pozele urcate de > 12 h);
 *  4. GET presemnat cu X-Amz-Date in trecut (fereastra de 5 minute din src/lib/r2.ts);
 *  5. CORS: preflight PUT si GET cu Origin pentru fiecare domeniu al aplicatiei;
 *  6. DELETE (si DELETE repetat: 204 sau 404 NoSuchKey - aplicatia trateaza
 *     doar acestea ca succes), apoi GET -> 404 NoSuchKey. Se afiseaza si codul
 *     de eroare R2 (<Code>), ca sa se vada ce raspunde R2 pentru o cheie lipsa.
 * Regula de lifecycle (itp/ la 15 zile) NU se poate citi cu tokenul de obiecte -
 * verific-o in dashboard.
 *
 *   node scripts/verifica-r2.mjs https://velos.ro https://www.velos.ro http://localhost:3004
 *
 * Variabilele R2_* se citesc din mediu sau din .env.local (rulat din radacina proiectului).
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { AwsClient, AwsV4Signer } from 'aws4fetch';

const envFile = path.join(process.cwd(), '.env.local');
const fileEnv = fs.existsSync(envFile)
  ? Object.fromEntries(
      fs
        .readFileSync(envFile, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => [
          l.slice(0, l.indexOf('=')).trim(),
          l.slice(l.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2'),
        ])
    )
  : {};
const env = { ...fileEnv, ...process.env };

for (const k of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']) {
  if (!env[k]) {
    console.error(`Lipseste ${k} (in mediu sau in .env.local).`);
    process.exit(1);
  }
}

const cont = env.R2_ACCOUNT_ID.trim().toLowerCase();
const jurisdictie = (env.R2_JURISDICTION || 'eu').trim().toLowerCase();
const endpoint =
  jurisdictie === 'eu' ? `https://${cont}.eu.r2.cloudflarestorage.com` : `https://${cont}.r2.cloudflarestorage.com`;
const origini = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['https://velos.ro', 'https://www.velos.ro', 'http://localhost:3004'];

const creds = { accessKeyId: env.R2_ACCESS_KEY_ID.trim(), secretAccessKey: env.R2_SECRET_ACCESS_KEY.trim() };
const client = new AwsClient({ ...creds, service: 's3', region: 'auto', retries: 1 });
const zero = '00000000-0000-4000-8000-000000000000';
const cheie = `itp/${zero}/${zero}/${randomUUID()}.jpg`;
const url = `${endpoint}/${env.R2_BUCKET.trim()}/${cheie}`;
const corp = new Uint8Array(100);
corp.set([0xff, 0xd8, 0xff, 0xe0]);

let esecuri = 0;
const rezultat = (ok, text) => {
  if (!ok) esecuri++;
  console.log(`${ok ? '  OK  ' : '  ESEC'} ${text}`);
};
// Codul de eroare S3 din corpul XML al raspunsului (<Code>NoSuchKey</Code>), ca in src/lib/r2.ts.
const codEroare = (xml) => /<Code>([^<]{1,100})<\/Code>/.exec(xml)?.[1].trim() || null;

async function presignPut(marime, tip) {
  const u = new URL(url);
  u.searchParams.set('X-Amz-Expires', '600');
  const s = await new AwsV4Signer({
    method: 'PUT',
    url: u.toString(),
    headers: { 'content-type': tip, 'content-length': String(marime) },
    ...creds,
    service: 's3',
    region: 'auto',
    signQuery: true,
    allHeaders: true,
  }).sign();
  return s.url.toString();
}

console.log(`Endpoint: ${endpoint} | bucket: ${env.R2_BUCKET} | cheie test: ${cheie}\n`);

// 1-2. PUT presemnat
const putOk = await presignPut(corp.length, 'image/jpeg');
let r = await fetch(putOk, { method: 'PUT', body: corp, headers: { 'Content-Type': 'image/jpeg' } });
rezultat(r.ok, `PUT presemnat (100 B, image/jpeg) -> ${r.status}`);

const putMic = await presignPut(50, 'image/jpeg');
r = await fetch(putMic, { method: 'PUT', body: corp, headers: { 'Content-Type': 'image/jpeg' } });
rezultat(r.status === 403, `PUT cu alta marime decat cea semnata -> ${r.status} (asteptat 403)`);

r = await fetch(putOk, { method: 'PUT', body: corp, headers: { 'Content-Type': 'image/png' } });
rezultat(r.status === 403, `PUT cu alt Content-Type decat cel semnat -> ${r.status} (asteptat 403)`);

// 3. GET partial
r = await client.fetch(url, { method: 'GET', headers: { Range: 'bytes=0-15' } });
const octeti = new Uint8Array(await r.arrayBuffer());
rezultat(
  r.status === 206 &&
    /\/100$/.test(r.headers.get('content-range') ?? '') &&
    (r.headers.get('content-type') ?? '').startsWith('image/jpeg') &&
    octeti[0] === 0xff &&
    octeti[1] === 0xd8,
  `GET Range -> ${r.status}, Content-Range: ${r.headers.get('content-range')}, Content-Type: ${r.headers.get('content-type')}, Last-Modified: ${r.headers.get('last-modified')}`
);

// 4. GET presemnat cu data rotunjita in trecut (ca in src/lib/r2.ts)
const pas = 300_000;
const inceput = Math.floor(Date.now() / pas) * pas;
const ug = new URL(url);
ug.searchParams.set('X-Amz-Expires', '1200');
const getUrl = (
  await new AwsV4Signer({
    method: 'GET',
    url: ug.toString(),
    ...creds,
    service: 's3',
    region: 'auto',
    signQuery: true,
    datetime: new Date(inceput).toISOString().replace(/[:-]|\.\d{3}/g, ''),
  }).sign()
).url.toString();
r = await fetch(getUrl);
rezultat(r.ok && (await r.arrayBuffer()).byteLength === 100, `GET presemnat (X-Amz-Date in fereastra de 5 min) -> ${r.status}`);

// 5. CORS
for (const origine of origini) {
  r = await fetch(url, {
    method: 'OPTIONS',
    headers: { Origin: origine, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' },
  });
  const allow = r.headers.get('access-control-allow-origin');
  rezultat(r.ok && (allow === origine || allow === '*'), `CORS preflight PUT din ${origine} -> ${r.status}, allow-origin: ${allow}`);
  r = await fetch(getUrl, { headers: { Origin: origine } });
  const allowGet = r.headers.get('access-control-allow-origin');
  await r.arrayBuffer();
  rezultat(r.ok && (allowGet === origine || allowGet === '*'), `CORS GET din ${origine} -> ${r.status}, allow-origin: ${allowGet}`);
}

// 6. DELETE idempotent
r = await client.fetch(url, { method: 'DELETE' });
rezultat(r.status === 204 || r.status === 200, `DELETE -> ${r.status}`);
r = await client.fetch(url, { method: 'DELETE' });
const codDelete = codEroare(await r.text());
rezultat(
  r.status === 204 || r.status === 200 || (r.status === 404 && codDelete === 'NoSuchKey'),
  `DELETE repetat -> ${r.status}, Code: ${codDelete ?? '-'} (asteptat 204 sau 404 NoSuchKey - tratat ca succes)`
);
r = await client.fetch(url, { method: 'GET', headers: { Range: 'bytes=0-15' } });
const codGet = codEroare(await r.text());
rezultat(
  r.status === 404 && (codGet === null || codGet === 'NoSuchKey'),
  `GET dupa stergere -> ${r.status}, Code: ${codGet ?? '-'} (asteptat 404 NoSuchKey)`
);

console.log(`\n${esecuri ? `${esecuri} verificari ESUATE - vezi mai sus.` : 'Totul este configurat corect.'}`);
console.log('Nu uita: regula de lifecycle "itp/" la 15 zile (R2 -> bucket -> Settings -> Object lifecycle rules).');
process.exit(esecuri ? 1 : 0);
