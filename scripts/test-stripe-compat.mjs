/**
 * Test pentru src/lib/stripe-compat.ts — verifica citirea campurilor Stripe
 * atat in forma veche (pre-2025-03-31.basil) cat si in cea noua.
 *
 *   node scripts/test-stripe-compat.mjs
 */
import fs from 'fs';

// Incarcam modulul TS transformand importurile/exporturile (fara dependinte externe).
const src = fs.readFileSync('src/lib/stripe-compat.ts', 'utf8')
  .replace(/export function/g, 'function')
  .replace(/: any/g, '').replace(/: unknown/g, '').replace(/: string \| null/g, '')
  .replace(/: string \| undefined/g, '');
const mod = new Function(`${src}; return { toIso, getPeriodStart, getPeriodEnd, getInvoiceSubscriptionId, getInvoicePriceId };`)();

const T = 1788000000; // 2026-08-25T...Z
const ISO = new Date(T * 1000).toISOString();

const cazuri = [
  // ── forma NOUA (2026-04-22.dahlia) ──
  ['perioada, API nou', () => mod.getPeriodEnd({ items: { data: [{ current_period_end: T }] } }), ISO],
  ['start, API nou', () => mod.getPeriodStart({ items: { data: [{ current_period_start: T }] } }), ISO],
  ['abonament factura, API nou', () => mod.getInvoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_new' } } }), 'sub_new'],
  ['price factura, API nou', () => mod.getInvoicePriceId({ lines: { data: [{ pricing: { price_details: { price: 'price_new' } } }] } }), 'price_new'],

  // ── forma VECHE (evenimente trimise pe versiuni mai vechi) ──
  ['perioada, API vechi', () => mod.getPeriodEnd({ current_period_end: T }), ISO],
  ['start, API vechi', () => mod.getPeriodStart({ current_period_start: T }), ISO],
  ['abonament factura, API vechi', () => mod.getInvoiceSubscriptionId({ subscription: 'sub_old' }), 'sub_old'],
  ['abonament factura, obiect extins', () => mod.getInvoiceSubscriptionId({ subscription: { id: 'sub_exp' } }), 'sub_exp'],
  ['price factura, API vechi', () => mod.getInvoicePriceId({ lines: { data: [{ price: { id: 'price_old' } }] } }), 'price_old'],

  // ── cazuri degenerate: nu trebuie sa arunce niciodata ──
  ['abonament fara perioada', () => mod.getPeriodEnd({ id: 'sub_x', items: { data: [{}] } }), null],
  ['abonament null', () => mod.getPeriodEnd(null), null],
  ['factura fara abonament', () => mod.getInvoiceSubscriptionId({ id: 'in_x' }), null],
  ['timestamp invalid', () => mod.toIso('nu-i numar'), null],
  ['timestamp NaN', () => mod.toIso(NaN), null],
  ['timestamp undefined', () => mod.toIso(undefined), null],
];

let ok = 0, fail = 0;
for (const [nume, fn, asteptat] of cazuri) {
  let rezultat, eroare = null;
  try { rezultat = fn(); } catch (e) { eroare = e; }
  const trecut = !eroare && rezultat === asteptat;
  if (trecut) { ok++; console.log(`  OK   ${nume}`); }
  else { fail++; console.log(`  ESEC ${nume}: asteptat ${JSON.stringify(asteptat)}, primit ${eroare ? 'EXCEPTIE ' + eroare.message : JSON.stringify(rezultat)}`); }
}

// Regresia care a spart platforma: codul vechi arunca pe forma noua de payload.
console.log('\nRegresie (cod vechi pe payload nou):');
try {
  const subNou = { items: { data: [{ current_period_end: T }] } };
  new Date(subNou.current_period_end * 1000).toISOString();
  console.log('  ESEC codul vechi ar fi trebuit sa arunce');
  fail++;
} catch (e) {
  console.log(`  OK   codul vechi arunca "${e.constructor.name}: ${e.message}" — exact cauza abonamentelor neactivate`);
  ok++;
}

console.log(`\n${ok} trecute, ${fail} esuate`);
process.exit(fail ? 1 : 0);
