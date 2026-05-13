import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Zap } from "lucide-react";
import { BookingForm } from "./booking-form";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: statie } = await supabase
    .from("statii")
    .select("nume")
    .eq("slug", slug)
    .eq("activa", true)
    .single();
  return { title: statie ? `Programare ITP — ${statie.nume}` : "Programare ITP" };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: statie } = await supabase
    .from("statii")
    .select("id, nume, adresa, oras, judet, telefon, email, program_lucru")
    .eq("slug", slug)
    .eq("activa", true)
    .single();

  if (!statie) notFound();

  type ProgramLucru = Record<string, { start: string; end: string } | null>;

  const programLucru = statie.program_lucru as ProgramLucru | null;

  // Build open days label
  const ZILE_LABELS: Record<string, string> = {
    luni: "Lu", marti: "Ma", miercuri: "Mi", joi: "Jo",
    vineri: "Vi", sambata: "Sâ", duminica: "Du",
  };
  const openDays = programLucru
    ? Object.entries(programLucru)
        .filter(([, v]) => !!v)
        .map(([k]) => ZILE_LABELS[k] ?? k)
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#111318]">{statie.nume}</h1>
            <p className="text-xs text-[#9CA3AF]">Programare ITP online</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Station info */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-2">
          {(statie.adresa || statie.oras) && (
            <div className="flex items-center gap-2 text-sm text-[#374151]">
              <MapPin className="h-4 w-4 text-[#6B7280] shrink-0" />
              <span>
                {[statie.adresa, statie.oras, statie.judet].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {statie.telefon && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-[#6B7280] shrink-0" />
              <a href={`tel:${statie.telefon}`} className="text-[#1877F2] hover:underline">
                {statie.telefon}
              </a>
            </div>
          )}
          {statie.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-[#6B7280] shrink-0" />
              <a href={`mailto:${statie.email}`} className="text-[#1877F2] hover:underline">
                {statie.email}
              </a>
            </div>
          )}
          {openDays.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] text-[#9CA3AF]">Program:</span>
              {openDays.map((z) => (
                <span
                  key={z}
                  className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1877F2] text-[10px] font-semibold rounded"
                >
                  {z}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Booking form */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[#111318] mb-4">Fă o programare</h2>
          <BookingForm statieId={statie.id} programLucru={programLucru} />
        </div>

        <p className="text-center text-[11px] text-[#9CA3AF] pb-4">
          Powered by <span className="font-semibold">ITPBASE.RO</span>
        </p>
      </main>
    </div>
  );
}
