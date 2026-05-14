import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import {
  Users, Building2, MessageSquare, CreditCard, TrendingUp, Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import Link from "next/link";
import { OverviewCharts } from "@/components/admin/overview-charts";

export const metadata: Metadata = { title: "Admin - Overview" };

const PLAN_COLORS: Record<string, string> = {
  trial: "#6B7280",
  basic: "#059669",
  pro: "#1877F2",
  enterprise: "#7C3AED",
};

function StatCard({
  title, value, subtitle, icon: Icon, color, href,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div className="bg-white border border-[#F3F4F6] rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#6B7280]">{title}</span>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[#111318]">{value}</p>
      {subtitle && <p className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminOverviewPage() {
  const supabase = createServiceClient();
  const thisMonth = new Date().toISOString().substring(0, 7) + "-01";
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    { data: allProfiles },
    { data: allStatii },
    { data: smsQuota },
    { data: purchases },
    { data: recentUsers },
    { data: recentPayments },
    { data: usersForChart },
    { data: paymentsForChart },
  ] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, plan, created_at, is_admin"),
    supabase.from("statii").select("id, activa"),
    (supabase as any).from("sms_quota").select("sms_trimise").eq("luna", thisMonth),
    (supabase as any).from("sms_purchases").select("pret_total, created_at").eq("status", "completed"),
    supabase
      .from("profiles")
      .select("id, email, full_name, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    (supabase as any)
      .from("sms_purchases")
      .select("id, profile_id, cantitate, pret_total, created_at, profiles!profile_id(email, full_name)")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo),
    (supabase as any).from("sms_purchases").select("pret_total, created_at")
      .eq("status", "completed").gte("created_at", sixMonthsAgo.toISOString()),
  ]);

  // Build chart data
  const usersByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split("T")[0];
    const count = (usersForChart as any[])?.filter((u: any) => u.created_at.startsWith(dateStr)).length ?? 0;
    return { date: dateStr, utilizatori: count };
  });

  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthStr = d.toISOString().substring(0, 7);
    const total = (paymentsForChart as any[])
      ?.filter((p: any) => p.created_at.startsWith(monthStr))
      .reduce((sum: number, p: any) => sum + Number(p.pret_total ?? 0), 0) ?? 0;
    return { luna: format(d, "MMM", { locale: ro }), venituri: Math.round(total * 100) / 100 };
  });

  // Compute stats
  const totalUsers = allProfiles?.length ?? 0;
  const newUsers30d = allProfiles?.filter((p: any) => p.created_at >= thirtyDaysAgo).length ?? 0;
  const totalStatii = allStatii?.length ?? 0;
  const activeStatii = allStatii?.filter((s: any) => s.activa).length ?? 0;
  const smsSentMonth = (smsQuota as any[])?.reduce((sum: number, q: any) => sum + (q.sms_trimise ?? 0), 0) ?? 0;
  const revenueTotal = (purchases as any[])?.reduce((sum: number, p: any) => sum + (p.pret_total ?? 0), 0) ?? 0;
  const revenueMonth = (purchases as any[])?.filter((p: any) => p.created_at >= thisMonth)
    .reduce((sum: number, p: any) => sum + (p.pret_total ?? 0), 0) ?? 0;

  const planCounts = allProfiles?.reduce((acc: Record<string, number>, p: any) => {
    acc[p.plan] = (acc[p.plan] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  const PLAN_LABELS: Record<string, string> = { trial: "Trial", basic: "Basic", pro: "Pro", enterprise: "Enterprise" };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#111318]">Admin Overview</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total utilizatori"
          value={totalUsers}
          subtitle={`+${newUsers30d} în ultimele 30 zile`}
          icon={Users}
          color="#1877F2"
          href="/admin/utilizatori"
        />
        <StatCard
          title="Total stații"
          value={totalStatii}
          subtitle={`${activeStatii} active`}
          icon={Building2}
          color="#059669"
          href="/admin/statii"
        />
        <StatCard
          title="SMS trimise (luna aceasta)"
          value={smsSentMonth.toLocaleString("ro-RO")}
          subtitle="toate conturile"
          icon={MessageSquare}
          color="#EA580C"
          href="/admin/sms"
        />
        <StatCard
          title="Venituri SMS"
          value={`€${revenueTotal.toFixed(2)}`}
          subtitle={`€${revenueMonth.toFixed(2)} luna aceasta`}
          icon={CreditCard}
          color="#7C3AED"
          href="/admin/plati"
        />
      </div>

      {/* Charts */}
      <OverviewCharts usersByDay={usersByDay} revenueByMonth={revenueByMonth} />

      {/* Plan distribution */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#111318] mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#6B7280]" />
          Distribuție planuri
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["trial", "basic", "pro", "enterprise"].map((plan) => {
            const count = planCounts[plan] ?? 0;
            const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
            return (
              <div key={plan} className="rounded-lg p-3" style={{ background: `${PLAN_COLORS[plan]}10` }}>
                <p className="text-xs font-medium" style={{ color: PLAN_COLORS[plan] }}>
                  {PLAN_LABELS[plan]}
                </p>
                <p className="text-2xl font-bold text-[#111318] mt-1">{count}</p>
                <p className="text-xs text-[#9CA3AF]">{pct}% din total</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#111318] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#6B7280]" />
              Utilizatori recenți
            </h2>
            <Link href="/admin/utilizatori" className="text-xs text-[#1877F2] hover:underline">
              Vezi toți
            </Link>
          </div>
          <div className="space-y-2">
            {recentUsers?.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111318] truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: PLAN_COLORS[u.plan] }}
                  >
                    {PLAN_LABELS[u.plan]}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {format(new Date(u.created_at), "d MMM", { locale: ro })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#111318] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#6B7280]" />
              Plăți recente
            </h2>
            <Link href="/admin/plati" className="text-xs text-[#1877F2] hover:underline">
              Vezi toate
            </Link>
          </div>
          <div className="space-y-2">
            {(recentPayments as any[])?.length === 0 && (
              <p className="text-sm text-[#9CA3AF] text-center py-4">Nicio plată încă</p>
            )}
            {(recentPayments as any[])?.map((p: any) => {
              const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              return (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111318] truncate">
                      {profile?.full_name || profile?.email || "—"}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">{p.cantitate} SMS-uri</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-[#059669]">€{Number(p.pret_total).toFixed(2)}</span>
                    <span className="text-[10px] text-[#9CA3AF]">
                      {format(new Date(p.created_at), "d MMM", { locale: ro })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
