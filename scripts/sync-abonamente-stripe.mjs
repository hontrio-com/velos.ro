/**
 * Sincronizeaza abonamentele din Stripe in baza de date.
 *
 * De ce exista: webhook-ul a folosit campuri eliminate din API-ul Stripe
 * (Subscription.current_period_end, Invoice.subscription), deci a crapat inainte
 * sa activeze conturile. Acest script recupereaza starea reala din Stripe pentru
 * conturile ramase neactivate. Ruleaza-l o data dupa deploy-ul fix-ului.
 *
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/sync-abonamente-stripe.mjs
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/sync-abonamente-stripe.mjs --apply
 *
 * Fara --apply doar raporteaza. Cheia poate fi pusa si in .env.local.
 */
import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const envFile = path.join(process.cwd(), '.env.local');
const fileEnv = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
  : {};
const env = { ...fileEnv, ...process.env };

if (!env.STRIPE_SECRET_KEY) {
  console.error('Lipseste STRIPE_SECRET_KEY (in mediu sau in .env.local).');
  process.exit(1);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// price id -> { plan, cycle }
const PRICE_MAP = {};
for (const [plan, cycles] of Object.entries({
  basic: ['STRIPE_PRICE_BASIC_MONTHLY', 'STRIPE_PRICE_BASIC_YEARLY'],
  pro: ['STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_YEARLY'],
  enterprise: ['STRIPE_PRICE_ENTERPRISE_MONTHLY', 'STRIPE_PRICE_ENTERPRISE_YEARLY'],
})) {
  cycles.forEach((key, i) => {
    if (env[key]) PRICE_MAP[env[key]] = { plan, cycle: i === 0 ? 'monthly' : 'yearly' };
  });
}
if (!Object.keys(PRICE_MAP).length) {
  console.warn('ATENTIE: niciun STRIPE_PRICE_* configurat — planul nu poate fi dedus din pret.\n');
}

const toIso = (t) => (typeof t === 'number' && Number.isFinite(t) ? new Date(t * 1000).toISOString() : null);
const periodEnd = (sub) => toIso(sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end);
const periodStart = (sub) => toIso(sub?.items?.data?.[0]?.current_period_start ?? sub?.current_period_start);

const { data: profiles, error } = await sb
  .from('profiles')
  .select('id, email, plan, subscription_status, billing_cycle, stripe_customer_id, stripe_subscription_id')
  .not('stripe_customer_id', 'is', null);
if (error) throw error;

console.log(`Conturi cu client Stripe: ${profiles.length}\n`);

const deReparat = [];

for (const p of profiles) {
  let subs;
  try {
    subs = await stripe.subscriptions.list({ customer: p.stripe_customer_id, status: 'all', limit: 10 });
  } catch (e) {
    console.log(`  ${p.email}: EROARE Stripe — ${e.message}`);
    continue;
  }

  const activ = subs.data.find((s) => s.status === 'active' || s.status === 'trialing')
    ?? subs.data.find((s) => s.status === 'past_due');

  if (!activ) {
    console.log(`  ${p.email}: niciun abonament in Stripe (plan local: ${p.plan})`);
    continue;
  }

  // Planul se deduce, in ordine: price id configurat -> metadata abonamentului
  // (pusa la checkout) -> suma+intervalul pretului.
  const item = activ.items?.data?.[0];
  const priceId = item?.price?.id;
  const info = PRICE_MAP[priceId];

  const SUME = { 149: 'basic', 119: 'basic', 249: 'pro', 199: 'pro', 449: 'enterprise', 359: 'enterprise' };
  const dinSuma = SUME[(item?.price?.unit_amount ?? 0) / 100];

  const plan = info?.plan ?? activ.metadata?.plan ?? dinSuma ?? p.plan;
  const cycle = info?.cycle ?? activ.metadata?.cycle
    ?? (item?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly');
  const status = activ.status === 'past_due' ? 'past_due' : 'active';
  const ends = periodEnd(activ);

  const corect = p.stripe_subscription_id === activ.id && p.plan === plan && p.subscription_status === status;
  console.log(`  ${p.email}: Stripe=${activ.status} plan=${plan}/${cycle} sub=${activ.id} pana la ${ends ?? '?'}`);
  console.log(`      local: plan=${p.plan} status=${p.subscription_status} sub=${p.stripe_subscription_id ?? 'NULL'} ${corect ? '-> OK' : '-> NECESITA REPARARE'}`);

  if (!corect) deReparat.push({ p, activ, plan, cycle, status, ends, start: periodStart(activ) });
}

console.log(`\nConturi de reparat: ${deReparat.length}`);
if (!deReparat.length) process.exit(0);

if (!APPLY) {
  console.log('[DRY-RUN] Nu s-a modificat nimic. Ruleaza din nou cu --apply.');
  process.exit(0);
}

for (const r of deReparat) {
  const { error: e1 } = await sb.from('profiles').update({
    plan: r.plan,
    billing_cycle: r.cycle,
    subscription_status: r.status,
    stripe_subscription_id: r.activ.id,
    ...(r.ends ? { subscription_ends_at: r.ends } : {}),
  }).eq('id', r.p.id);
  if (e1) { console.log(`  ${r.p.email}: EROARE profil — ${e1.message}`); continue; }

  const { error: e2 } = await sb.from('subscriptions').upsert({
    profile_id: r.p.id,
    stripe_subscription_id: r.activ.id,
    stripe_customer_id: r.p.stripe_customer_id,
    plan: r.plan,
    billing_cycle: r.cycle,
    status: r.activ.status,
    current_period_start: r.start,
    current_period_end: r.ends,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });
  if (e2) console.log(`  ${r.p.email}: profil actualizat, dar istoric esuat — ${e2.message}`);
  else console.log(`  ${r.p.email}: reparat (plan ${r.plan}/${r.cycle}, ${r.status})`);
}
