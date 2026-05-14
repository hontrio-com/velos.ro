"use client";

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DayData { date: string; utilizatori: number }
interface MonthData { luna: string; venituri: number }

interface OverviewChartsProps {
  usersByDay: DayData[];
  revenueByMonth: MonthData[];
}

function CustomTooltipUsers({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="text-[#9CA3AF] mb-0.5">{label}</p>
      <p className="font-semibold text-[#1877F2]">{payload[0].value} utilizatori noi</p>
    </div>
  );
}

function CustomTooltipRevenue({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="text-[#9CA3AF] mb-0.5">{label}</p>
      <p className="font-semibold text-[#059669]">€{Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
}

export function OverviewCharts({ usersByDay, revenueByMonth }: OverviewChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Utilizatori noi — ultimele 30 zile */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#111318]">Utilizatori noi</h3>
          <p className="text-xs text-[#9CA3AF]">ultimele 30 de zile</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={usersByDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1877F2" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              interval={6}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltipUsers />} />
            <Area
              type="monotone"
              dataKey="utilizatori"
              stroke="#1877F2"
              strokeWidth={2}
              fill="url(#colorUsers)"
              dot={false}
              activeDot={{ r: 4, fill: "#1877F2" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Venituri SMS — ultimele 6 luni */}
      <div className="bg-white border border-[#F3F4F6] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#111318]">Venituri SMS</h3>
          <p className="text-xs text-[#9CA3AF]">ultimele 6 luni</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="luna"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip content={<CustomTooltipRevenue />} />
            <Bar
              dataKey="venituri"
              fill="#059669"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
