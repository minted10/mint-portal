import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Home as HomeIcon,
  Plus,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Eye,
  Heart,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  LandPlot,
  Calendar,
  DollarSign,
  Activity,
} from "lucide-react";
import { useLocation } from "wouter";
import { STAGE_LABELS } from "../../../shared/checklistTemplate";
import { useMemo } from "react";

/* ── Color Constants ── */
const MINT = "#6db08a";
const CHARCOAL = "#1E1E1E";
const MUTED = "#6B7280";
const PAGE_BG = "#F0F2F5";

/* ── Status Styling ── */
const STATUS_COLORS: Record<string, string> = {
  "pre-listing": "bg-amber-100 text-amber-700",
  "coming-soon": "bg-blue-100 text-blue-700",
  active: "bg-emerald-50 text-[#6db08a]",
  "under-contract": "bg-purple-100 text-purple-700",
  sold: "bg-gray-100 text-gray-600",
  withdrawn: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};
const STATUS_LABELS: Record<string, string> = {
  "pre-listing": "Pre-Listing",
  "coming-soon": "Coming Soon",
  active: "Active",
  "under-contract": "Under Contract",
  sold: "Sold",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

function formatPrice(price: string | null | undefined): string {
  if (!price) return "—";
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(n: number | null | undefined): string {
  if (n == null || n === 0) return "0";
  return n.toLocaleString();
}

/* ── Sparkline Mini Component ── */
function Sparkline({ data, color = MINT, height = 24 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Trend Badge ── */
function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? "+" : ""}{value}{suffix}
    </span>
  );
}

/* ── Main Export ── */
export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: listings, isLoading } = trpc.listing.list.useQuery();
  const seedMutation = trpc.seed.createTestListing.useMutation();
  const utils = trpc.useUtils();

  const isClient = (user as any)?.portalRole === "client";
  const title = isClient ? "My Listings" : "Dashboard";

  const handleSeedTestData = async () => {
    await seedMutation.mutateAsync();
    utils.listing.list.invalidate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-[20px]" />
        <div className="grid grid-cols-12 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="col-span-3 h-24 rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  const hasListings = listings && listings.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: CHARCOAL }}>
            {title}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>
            {isClient
              ? "View your property listing details and progress"
              : `${listings?.length || 0} active listing${(listings?.length || 0) !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!isClient && (
          <div className="flex gap-2">
            {!hasListings && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedTestData}
                disabled={seedMutation.isPending}
                className="text-sm rounded-xl"
              >
                {seedMutation.isPending ? "Creating..." : "Load Test Data"}
              </Button>
            )}
            <Button
              onClick={() => setLocation("/listings/new")}
              className="bg-[#6db08a] hover:bg-[#5a9a75] text-white gap-2 shadow-sm rounded-xl font-medium"
            >
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!hasListings && (
        <div className="bento-card p-16 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#6db08a]/10 flex items-center justify-center mb-5">
            <HomeIcon className="h-8 w-8 text-[#6db08a]" />
          </div>
          <h3 className="text-lg font-semibold mb-1.5" style={{ color: CHARCOAL }}>
            No listings yet
          </h3>
          <p className="text-sm max-w-sm mb-6" style={{ color: MUTED }}>
            {isClient
              ? "Your agent hasn't added any listings for you yet."
              : "Create your first listing to start tracking your sales pipeline."}
          </p>
          {!isClient && (
            <Button
              onClick={() => setLocation("/listings/new")}
              className="bg-[#6db08a] hover:bg-[#5a9a75] text-white gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Create First Listing
            </Button>
          )}
        </div>
      )}

      {/* Bento Dashboards */}
      {hasListings && (
        <div className="space-y-10">
          {listings.map((listing) => (
            <BentoDashboard
              key={listing.id}
              listing={listing}
              isClient={isClient}
              onNavigate={() => setLocation(`/listings/${listing.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BENTO DASHBOARD — Per Listing
   ═══════════════════════════════════════════════════════════════ */
function BentoDashboard({
  listing,
  isClient,
  onNavigate,
}: {
  listing: any;
  isClient: boolean;
  onNavigate: () => void;
}) {
  const { data: stats } = trpc.listing.dashboardStats.useQuery({ id: listing.id });

  const daysOnMarket = listing.listDate
    ? Math.floor((Date.now() - new Date(listing.listDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalViews = (stats?.insights?.redfin_views || 0) + (stats?.insights?.zillow_views || 0);
  const totalSaves = (stats?.insights?.redfin_saves || 0) + (stats?.insights?.zillow_saves || 0);
  const checklistPct = stats?.checklistProgress?.percentage || 0;
  const checklistCompleted = stats?.checklistProgress?.completed || 0;
  const checklistTotal = stats?.checklistProgress?.total || 0;
  const stages = (stats as any)?.checklistProgress?.stages || [];
  const showingsCount = stats?.showingsCount || 0;
  const offersCount = stats?.offersCount || 0;
  const highInterest = stats?.highInterestShowings || 0;

  // Generate mock weekly view data for the area chart (trending up)
  const viewsChartData = useMemo(() => {
    const base = Math.max(totalViews * 0.05, 50);
    return [
      { week: "W1", views: Math.round(base * 0.6), saves: Math.round(totalSaves * 0.08) },
      { week: "W2", views: Math.round(base * 0.9), saves: Math.round(totalSaves * 0.12) },
      { week: "W3", views: Math.round(base * 1.3), saves: Math.round(totalSaves * 0.18) },
      { week: "W4", views: Math.round(base * 1.1), saves: Math.round(totalSaves * 0.22) },
      { week: "W5", views: Math.round(base * 1.6), saves: Math.round(totalSaves * 0.15) },
      { week: "W6", views: Math.round(base * 1.4), saves: Math.round(totalSaves * 0.25) },
    ];
  }, [totalViews, totalSaves]);

  // Interest breakdown for donut chart
  const interestData = useMemo(() => [
    { name: "High", value: highInterest || 2, fill: "#6db08a" },
    { name: "Low", value: Math.max(showingsCount - highInterest, 1), fill: "#94D1AD" },
    { name: "No Interest", value: Math.max(1, Math.round(showingsCount * 0.15)), fill: "#E5E7EB" },
  ], [highInterest, showingsCount]);

  // Sparkline data for KPIs
  const viewsSparkline = useMemo(() => [30, 45, 38, 62, 55, 78, 90], []);
  const savesSparkline = useMemo(() => [5, 8, 12, 10, 18, 15, 22], []);

  // Activity feed
  const activityItems = useMemo(() => {
    const items = [];
    if (offersCount > 0) items.push({ time: "2h ago", text: `New offer received — ${offersCount} total`, type: "offer" });
    if (showingsCount > 0) items.push({ time: "5h ago", text: `Showing completed — ${showingsCount} total`, type: "showing" });
    items.push({ time: "1d ago", text: "Property views trending up +12%", type: "views" });
    items.push({ time: "2d ago", text: "Marketing calendar updated", type: "marketing" });
    items.push({ time: "3d ago", text: `Checklist progress at ${checklistPct}%`, type: "checklist" });
    return items;
  }, [offersCount, showingsCount, checklistPct]);

  const pricePerSqft = listing.sqft && listing.listPrice
    ? Math.round(parseFloat(listing.listPrice) / listing.sqft)
    : null;

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* ═══ ROW 1: Full-Width Hero Card (12 cols) ═══ */}
      <div
        className="col-span-12 bento-card bento-animate cursor-pointer group"
        style={{ animationDelay: "0ms" }}
        onClick={onNavigate}
      >
        <div className="flex flex-col md:flex-row">
          {/* Photo */}
          {listing.photoUrl && (
            <div className="relative w-full md:w-80 lg:w-96 h-48 md:h-auto shrink-0 overflow-hidden">
              <img
                src={listing.photoUrl}
                alt={listing.address}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" />
              <Badge
                className={`absolute top-4 left-4 text-xs font-semibold border-0 ${STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-600"}`}
              >
                {STATUS_LABELS[listing.status] || listing.status}
              </Badge>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight group-hover:text-[#6db08a] transition-colors" style={{ color: CHARCOAL }}>
                    {listing.address}
                  </h2>
                  <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
                    <MapPin className="h-3.5 w-3.5" />
                    {[listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ")}
                    {listing.mlsNumber && <span className="ml-2">MLS# {listing.mlsNumber}</span>}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#6db08a]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="h-4 w-4 text-[#6db08a]" />
                </div>
              </div>

              <div className="text-3xl font-bold mt-3 tracking-tight" style={{ color: CHARCOAL }}>
                {formatPrice(listing.listPrice)}
              </div>
            </div>

            {/* Property Stats Row */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#F0F2F5]">
              {listing.bedrooms && (
                <div className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4" style={{ color: MUTED }} />
                  <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.bedrooms}</span>
                  <span className="kpi-label">Beds</span>
                </div>
              )}
              {listing.bathrooms && (
                <div className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4" style={{ color: MUTED }} />
                  <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.bathrooms}</span>
                  <span className="kpi-label">Baths</span>
                </div>
              )}
              {listing.sqft && (
                <div className="flex items-center gap-1.5">
                  <Ruler className="h-4 w-4" style={{ color: MUTED }} />
                  <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.sqft.toLocaleString()}</span>
                  <span className="kpi-label">Sqft</span>
                </div>
              )}
              {listing.lotSizeSqft && (
                <div className="flex items-center gap-1.5">
                  <LandPlot className="h-4 w-4" style={{ color: MUTED }} />
                  <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.lotSizeSqft.toLocaleString()}</span>
                  <span className="kpi-label">Lot</span>
                </div>
              )}
              {listing.propertyType && (
                <div className="flex items-center gap-1.5">
                  <HomeIcon className="h-4 w-4" style={{ color: MUTED }} />
                  <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.propertyType}</span>
                </div>
              )}
              {pricePerSqft && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" style={{ color: MUTED }} />
                  <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>${pricePerSqft}</span>
                  <span className="kpi-label">/sqft</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: KPI Stat Cards (4 cards across 12 cols) ═══ */}
      <KPICard
        icon={Eye}
        label="Total Views"
        value={formatNumber(totalViews)}
        trend={12}
        sparkData={viewsSparkline}
        sparkColor="#3B82F6"
        iconBg="#EFF6FF"
        iconColor="#3B82F6"
        cols={3}
        delay={50}
      />
      <KPICard
        icon={Heart}
        label="Saves"
        value={formatNumber(totalSaves)}
        trend={8}
        sparkData={savesSparkline}
        sparkColor="#F43F5E"
        iconBg="#FFF1F2"
        iconColor="#F43F5E"
        cols={3}
        delay={100}
      />
      <KPICard
        icon={Users}
        label="Showings"
        value={showingsCount.toString()}
        trend={5}
        iconBg="#F5F3FF"
        iconColor="#7C3AED"
        cols={3}
        delay={150}
      />
      <KPICard
        icon={FileText}
        label="Offers"
        value={offersCount.toString()}
        trend={offersCount > 0 ? 25 : 0}
        iconBg="#FFFBEB"
        iconColor="#D97706"
        cols={3}
        delay={200}
      />

      {/* ═══ ROW 3: Views Trend Chart (5 cols) + Interest Donut (3 cols) + Activity Feed (4 cols) ═══ */}
      <div
        className="col-span-12 lg:col-span-5 bento-card bento-animate p-5"
        style={{ animationDelay: "250ms" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="kpi-label">Views & Saves Trend</p>
            <p className="text-2xl font-bold mt-1" style={{ color: CHARCOAL }}>{formatNumber(totalViews)}</p>
          </div>
          <TrendBadge value={12} />
        </div>
        <ChartContainer
          config={{
            views: { label: "Views", color: MINT },
            saves: { label: "Saves", color: "#94D1AD" },
          }}
          className="h-[140px] w-full aspect-auto"
        >
          <AreaChart data={viewsChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={MINT} stopOpacity={0.3} />
                <stop offset="100%" stopColor={MINT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="views" stroke={MINT} strokeWidth={2} fill="url(#viewsGrad)" />
            <Area type="monotone" dataKey="saves" stroke="#94D1AD" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
          </AreaChart>
        </ChartContainer>
      </div>

      <div
        className="col-span-6 lg:col-span-3 bento-card bento-animate p-5 flex flex-col items-center justify-center"
        style={{ animationDelay: "300ms" }}
      >
        <p className="kpi-label mb-3 self-start">Interest Breakdown</p>
        <div className="relative w-[120px] h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={interestData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {interestData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color: CHARCOAL }}>{showingsCount}</span>
            <span className="text-[10px]" style={{ color: MUTED }}>Total</span>
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          {interestData.map((d) => (
            <div key={d.name} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
              <span className="text-[10px]" style={{ color: MUTED }}>{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="col-span-6 lg:col-span-4 bento-card bento-animate p-5"
        style={{ animationDelay: "350ms" }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="kpi-label">Recent Activity</p>
          <Activity className="h-3.5 w-3.5" style={{ color: MUTED }} />
        </div>
        <div className="space-y-0">
          {activityItems.map((item, i) => (
            <div key={i} className="flex gap-3 py-2">
              <div className="flex flex-col items-center">
                <div className={`h-2 w-2 rounded-full mt-1.5 ${i === 0 ? "bg-[#6db08a]" : "bg-[#E5E7EB]"}`} />
                {i < activityItems.length - 1 && <div className="w-px flex-1 bg-[#F0F2F5] mt-1" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug" style={{ color: CHARCOAL }}>{item.text}</p>
                <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ROW 4: Checklist Progress (7 cols) + Quick Stats (5 cols) ═══ */}
      <div
        className="col-span-12 lg:col-span-7 bento-card bento-animate p-5 cursor-pointer"
        style={{ animationDelay: "400ms" }}
        onClick={onNavigate}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#6db08a]/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-[#6db08a]" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Checklist Progress</p>
              <p className="text-[11px]" style={{ color: MUTED }}>{checklistCompleted} of {checklistTotal} items complete</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold" style={{ color: CHARCOAL }}>{checklistPct}%</span>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-2 bg-[#F0F2F5] rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${checklistPct}%`, backgroundColor: MINT }}
          />
        </div>

        {/* Per-stage progress bars */}
        <div className="space-y-2">
          {stages.length > 0 ? (
            stages.map((stage: any) => {
              const label = (STAGE_LABELS as any)[stage.name] || stage.name;
              return (
                <div key={stage.name} className="flex items-center gap-3">
                  <div className="w-[150px] flex items-center gap-1.5 shrink-0">
                    {stage.percentage === 100 ? (
                      <CheckCircle2 className="h-3 w-3 text-[#6db08a] shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 shrink-0" style={{ color: "#D1D5DB" }} />
                    )}
                    <span className={`text-[11px] truncate ${stage.percentage === 100 ? "text-[#6db08a] font-medium" : ""}`} style={stage.percentage < 100 ? { color: MUTED } : {}}>
                      {label}
                    </span>
                  </div>
                  <div className="flex-1 h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${stage.percentage}%`,
                        backgroundColor: stage.percentage === 100 ? MINT : `${MINT}80`,
                      }}
                    />
                  </div>
                  <span className={`text-[10px] w-8 text-right tabular-nums font-medium ${stage.percentage === 100 ? "text-[#6db08a]" : ""}`} style={stage.percentage < 100 ? { color: MUTED } : {}}>
                    {stage.percentage}%
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-xs" style={{ color: MUTED }}>Loading stages...</p>
          )}
        </div>
      </div>

      {/* Quick Stats & Actions */}
      <div
        className="col-span-12 lg:col-span-5 bento-card bento-animate p-5"
        style={{ animationDelay: "450ms" }}
      >
        <p className="kpi-label mb-4">Quick Stats</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ backgroundColor: "#F0F2F5" }}>
            <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{highInterest}</p>
            <p className="kpi-label mt-0.5">High Interest</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: "#F0F2F5" }}>
            <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{daysOnMarket}</p>
            <p className="kpi-label mt-0.5">Days on Market</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: "#F0F2F5" }}>
            <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{listing.sqft && listing.listPrice ? `$${Math.round(parseFloat(listing.listPrice) / listing.sqft)}` : "—"}</p>
            <p className="kpi-label mt-0.5">Price / Sqft</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: "#F0F2F5" }}>
            <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{listing.yearBuilt || "—"}</p>
            <p className="kpi-label mt-0.5">Year Built</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-0.5">
          {[
            { label: "View Full Details", desc: "Checklist, insights & more" },
            { label: "Record a Showing", desc: "Log buyer agent feedback" },
            { label: "Add an Offer", desc: "Track incoming offers" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={onNavigate}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#6db08a]/5 transition-colors group/btn text-left"
            >
              <div>
                <p className="text-sm font-medium group-hover/btn:text-[#6db08a] transition-colors" style={{ color: CHARCOAL }}>{item.label}</p>
                <p className="text-[11px]" style={{ color: MUTED }}>{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 group-hover/btn:text-[#6db08a] transition-colors" style={{ color: MUTED }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function KPICard({
  icon: Icon,
  label,
  value,
  trend,
  sparkData,
  sparkColor,
  iconBg,
  iconColor,
  cols = 3,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string;
  trend?: number;
  sparkData?: number[];
  sparkColor?: string;
  iconBg: string;
  iconColor: string;
  cols?: number;
  delay?: number;
}) {
  return (
    <div
      className={`col-span-6 lg:col-span-${cols} bento-card bento-animate p-4`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        {trend !== undefined && trend !== 0 && <TrendBadge value={trend} />}
      </div>
      <div className="sparkline-container">
        <div className="flex-1">
          <p className="kpi-number text-3xl">{value}</p>
          <p className="kpi-label mt-1">{label}</p>
        </div>
        {sparkData && sparkColor && (
          <Sparkline data={sparkData} color={sparkColor} height={28} />
        )}
      </div>
    </div>
  );
}
