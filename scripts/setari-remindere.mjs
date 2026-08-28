/**
 * Seteaza ce remindere ITP sunt active pentru o statie.
 *
 *   node scripts/setari-remindere.mjs --statie=<uuid>                 # arata setarile
 *   node scripts/setari-remindere.mjs --statie=<uuid> --doar=3_zile   # lasa activ doar acest tip
 *   node scripts/setari-remindere.mjs --statie=<uuid> --activ=3_zile,7_zile
 *
 * Necesita migratiile 006 + 007 aplicate (coloanele reminder_3_zile,
 * reminder_15_zile, reminder_expirat).
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const arg = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : null; };
const STATIE = arg('statie');
const DOAR = arg('doar');
const ACTIV = arg('activ');
if (!STATIE) { console.error('Lipseste --statie=<uuid>'); process.exit(1); }

const COLOANE = {
  '30_zile': 'reminder_30_zile',
  '15_zile': 'reminder_15_zile',
  '7_zile': 'reminder_7_zile',
  '3_zile': 'reminder_3_zile',
  '1_zi': 'reminder_1_zi',
  expirat: 'reminder_expirat',
};

const env = Object.fromEntries(fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
  .split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: statie } = await sb.from('statii').select('nume').eq('id', STATIE).single();
console.log(`Statie: ${statie?.nume ?? STATIE}\n`);

async function arata() {
  const { data, error } = await sb.from('setari_statie').select('*').eq('statie_id', STATIE).single();
  if (error) { console.error('Eroare:', error.message); process.exit(1); }
  console.log('Remindere ITP active:');
  for (const [tip, col] of Object.entries(COLOANE)) {
    if (!(col in data)) { console.log(`  ${tip.padEnd(8)} -> coloana ${col} lipseste (migratia 007 neaplicata)`); continue; }
    console.log(`  ${tip.padEnd(8)} -> ${data[col] ? 'ACTIV' : 'oprit'}`);
  }
  console.log(`\nsms_activ: ${data.sms_activ}`);
}

if (!DOAR && !ACTIV) { await arata(); process.exit(0); }

const dorite = new Set((DOAR ?? ACTIV).split(',').map((s) => s.trim()));
for (const t of dorite) {
  if (!COLOANE[t]) { console.error(`Tip necunoscut: ${t}. Valabile: ${Object.keys(COLOANE).join(', ')}`); process.exit(1); }
}

const update = {};
for (const [tip, col] of Object.entries(COLOANE)) update[col] = dorite.has(tip);

const { error } = await sb.from('setari_statie').update(update).eq('statie_id', STATIE);
if (error) { console.error('Eroare:', error.message); process.exit(1); }

console.log('Setari aplicate.\n');
await arata();
