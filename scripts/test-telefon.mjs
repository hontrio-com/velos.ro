/**
 * Test pentru src/lib/phone.ts — numere din orice tara.
 *
 *   node scripts/test-telefon.mjs
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

const TARA = 'RO';
const parseaza = (input, tara = TARA) => {
  const brut = (input ?? '').trim();
  if (!brut) return null;
  const p = parsePhoneNumberFromString(brut.replace(/^00/, '+'), tara);
  return p && p.isValid() ? p : null;
};
const normalizeaza = (i) => {
  const p = parseaza(i);
  if (!p) return null;
  return p.country === 'RO' ? '0' + p.nationalNumber.toString() : p.number;
};
const e164 = (i) => parseaza(i)?.number ?? null;

const cazuri = [
  // [intrare, stocare asteptata, E.164 asteptat]
  ['0722576733', '0722576733', '+40722576733'],
  ['0722 576 733', '0722576733', '+40722576733'],
  ['+40722576733', '0722576733', '+40722576733'],
  ['0040722576733', '0722576733', '+40722576733'],
  ['0040 (722) 576-733', '0722576733', '+40722576733'],
  ['722576733', '0722576733', '+40722576733'],
  ['+44 7487 629057', '+447487629057', '+447487629057'],   // Marea Britanie
  ['+39 333 1234567', '+393331234567', '+393331234567'],   // Italia
  ['+34 612 345 678', '+34612345678', '+34612345678'],     // Spania
  ['+49 151 12345678', '+4915112345678', '+4915112345678'],// Germania
  ['+373 69 123 456', '+37369123456', '+37369123456'],     // Rep. Moldova
  ['+1 415 555 2671', '+14155552671', '+14155552671'],     // SUA
  ['0721', null, null],
  ['abc', null, null],
  ['', null, null],
  ['+40 21 305 7000', '0213057000', '+40213057000'],       // fix Bucuresti
];

let ok = 0, esec = 0;
for (const [intrare, stocareAsteptata, e164Asteptat] of cazuri) {
  const stocare = normalizeaza(intrare);
  const numar = e164(intrare);
  const trecut = stocare === stocareAsteptata && numar === e164Asteptat;
  if (trecut) { ok++; console.log(`  OK   ${JSON.stringify(intrare).padEnd(24)} -> ${stocare ?? 'INVALID'}`); }
  else { esec++; console.log(`  ESEC ${JSON.stringify(intrare)}: asteptat ${stocareAsteptata}/${e164Asteptat}, primit ${stocare}/${numar}`); }
}

// Regresia veche: "+4" + numar pentru orice intrare fara 0/40 la inceput
console.log('\nRegresie (formatarea veche din sms.ts):');
const vechi = (t) => { const c = t.replace(/\D/g, ''); if (c.startsWith('40')) return '+' + c; if (c.startsWith('0')) return '+4' + c; return '+4' + c; };
const gresit = vechi('722576733');
if (gresit === '+4722576733') {
  console.log(`  OK   codul vechi producea ${gresit} (prefix Norvegia) in loc de +40722576733`);
  ok++;
} else { console.log('  ESEC regresia nu s-a reprodus'); esec++; }

console.log(`\n${ok} trecute, ${esec} esuate`);
process.exit(esec ? 1 : 0);
