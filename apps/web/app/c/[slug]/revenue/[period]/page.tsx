import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck, Key, ExternalLink, Lock } from "lucide-react";
import Link from "next/link";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";
import { APP_URL } from "@/lib/constants";

interface PageProps {
  params: Promise<{ slug: string; period: string }>;
  searchParams: Promise<{ key?: string }>;
}

/**
 * Parses a period string like "2025-05" → { year: 2025, month: 5 }
 * or "2025" → { year: 2025, month: null }
 */
function parsePeriod(period: string): { year: number; month: number | null } | null {
  const monthly = /^(\d{4})-(\d{2})$/.exec(period);
  if (monthly) {
    const year = Number(monthly[1]);
    const month = Number(monthly[2]);
    if (month < 1 || month > 12) return null;
    return { year, month };
  }
  const yearly = /^(\d{4})$/.exec(period);
  if (yearly) {
    return { year: Number(yearly[1]), month: null };
  }
  return null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatPeriodLabel(year: number, month: number | null): string {
  if (month !== null) return `${MONTH_NAMES[month - 1]} ${year}`;
  return `Full Year ${year}`;
}

async function fetchCreator(slug: string) {
  try {
    const res = await fetch(`${APP_URL}/api/creators/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, period } = await params;
  const parsed = parsePeriod(period);
  if (!parsed) return { title: "Revenue Proof | Veil" };
  const label = formatPeriodLabel(parsed.year, parsed.month);
  return {
    title: `Revenue Proof — ${label} | Veil`,
    description: `Cryptographically verified revenue for ${slug} on Veil — powered by Umbra privacy protocol.`,
  };
}

export default async function RevenueProofPage({ params, searchParams }: PageProps) {
  const { slug, period } = await params;
  const { key } = await searchParams;

  const parsed = parsePeriod(period);
  if (!parsed) notFound();

  const creator = await fetchCreator(slug);
  if (!creator) notFound();

  const { year, month } = parsed;
  const periodLabel = formatPeriodLabel(year, month);
  const scope = month !== null ? "monthly" : "yearly";

  const verifyUrl = key
    ? `${APP_URL}/verify?key=${encodeURIComponent(key)}&scope=${scope}&year=${year}${month ? `&month=${month}` : ""}`
    : null;

  return (
    <div className="min-h-screen relative flex flex-col bg-veil-bg text-veil-text font-body">
      <VeilHeader />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-veil-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-32 pb-24">

        {/* Creator attribution */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-veil-secondary border-2 border-white shadow-sm shrink-0">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-heading font-black text-2xl text-veil-text">
                {creator.displayName[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-veil-muted uppercase tracking-wider">Revenue Proof</p>
            <h1 className="font-heading text-2xl font-black text-veil-text tracking-tight">
              {creator.displayName}
            </h1>
          </div>
        </div>

        {/* Main proof card */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] border border-black/5 mb-6">
          {/* Green accent top bar */}
          <div className="h-1.5 bg-green-500 w-full" />

          <div className="p-10">
            {/* Period */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-veil-muted uppercase tracking-wider mb-1">Period</p>
                <p className="font-heading text-3xl font-black text-veil-text tracking-tight">{periodLabel}</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-full">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span className="text-xs font-black text-green-700 uppercase tracking-wider">Verified</span>
              </div>
            </div>

            {/* What is proven */}
            <div className="space-y-3 mb-10">
              <p className="text-xs font-bold text-veil-muted uppercase tracking-wider">This badge certifies</p>
              {[
                `${creator.displayName} received USDC support during ${periodLabel}`,
                "All payments routed through Umbra privacy protocol on Solana",
                "Individual patron wallet addresses are cryptographically hidden",
                "Revenue total is verifiable without exposing any patron identity",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-veil-text leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            {/* Key section */}
            {key ? (
              <div className="bg-veil-bg rounded-2xl p-5 border border-black/5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-veil-primary" />
                  <p className="text-xs font-bold text-veil-muted uppercase tracking-wider">
                    Viewing Key Attached
                  </p>
                </div>
                <p className="font-mono text-xs break-all text-veil-text leading-relaxed mb-4">
                  {key}
                </p>
                {verifyUrl && (
                  <Link
                    href={verifyUrl}
                    className="inline-flex items-center gap-2 text-xs font-bold text-veil-primary hover:text-veil-text transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open full verification page
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-veil-bg rounded-2xl p-5 border border-black/5 mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-veil-muted" />
                  <p className="text-sm font-medium text-veil-muted">
                    No viewing key attached to this link. The creator can share a key-enabled link from their compliance dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <p className="text-xs text-veil-muted font-medium text-center leading-relaxed">
              Powered by{" "}
              <span className="font-bold text-veil-text">Umbra Privacy Protocol</span> on Solana.
              Revenue figures are self-certified by cryptographic keys — no third party required.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/c/${slug}`}
            className="flex-1 text-center py-4 rounded-2xl border border-black/10 bg-white font-bold text-veil-text hover:border-black/20 hover:bg-veil-bg transition-all text-sm"
          >
            View {creator.displayName}&apos;s profile
          </Link>
          <Link
            href="/explore"
            className="flex-1 text-center py-4 rounded-2xl bg-veil-text text-white font-bold hover:bg-black transition-all text-sm"
          >
            Explore creators
          </Link>
        </div>
      </main>

      <VeilFooter />
    </div>
  );
}
