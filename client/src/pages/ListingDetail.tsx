import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Ruler,
  LandPlot,
  Home,
  DollarSign,
  Eye,
  Heart,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Activity,
  CheckSquare,
  BarChart3,
  Link2,
  Megaphone,
  Calendar,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";
import { STAGE_LABELS } from "../../../shared/checklistTemplate";
import ChecklistTab from "@/components/listing/ChecklistTab";
import ShowingsTab from "@/components/listing/ShowingsTab";
import OffersTab from "@/components/listing/OffersTab";
import MarketingTab from "@/components/listing/MarketingTab";
import InsightsTab from "@/components/listing/InsightsTab";

/* ── Color Constants ── */
const MINT = "#6db08a";
const CHARCOAL = "#1E1E1E";
const MUTED = "#6B7280";

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
export default function ListingDetail({ id }: { id: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isClient = (user as any)?.portalRole === "client";

  const { data: listing, isLoading: listingLoading } = trpc.listing.getById.useQuery({ id });
  const { data: stats } = trpc.listing.dashboardStats.useQuery({ id });

  if (listingLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56 w-full rounded-[20px]" />
        <div className="grid grid-cols-12 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="col-span-3 h-24 rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-medium" style={{ color: CHARCOAL }}>Listing not found</h2>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setLocation("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

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

  const pricePerSqft = listing.sqft && listing.listPrice
    ? Math.round(parseFloat(listing.listPrice) / listing.sqft)
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="gap-1.5 text-sm rounded-xl"
          style={{ color: MUTED }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-12 gap-3">

        {/* ═══ ROW 1: Full-Width Hero Card (12 cols) ═══ */}
        <div className="col-span-12 bento-card bento-animate overflow-hidden" style={{ animationDelay: "0ms" }}>
          <div className="flex flex-col md:flex-row">
            {listing.photoUrl && (
              <div className="relative w-full md:w-96 lg:w-[440px] h-56 md:h-auto shrink-0 overflow-hidden">
                <img
                  src={listing.photoUrl}
                  alt={listing.address}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" />
                <Badge
                  className={`absolute top-4 left-4 text-xs font-semibold border-0 ${STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {STATUS_LABELS[listing.status] || listing.status}
                </Badge>
              </div>
            )}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>
                  {listing.address}
                </h1>
                <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
                  <MapPin className="h-3.5 w-3.5" />
                  {[listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ")}
                  {listing.mlsNumber && <span className="ml-2">MLS# {listing.mlsNumber}</span>}
                </p>
                <div className="text-3xl font-bold mt-3 tracking-tight" style={{ color: CHARCOAL }}>
                  {formatPrice(listing.listPrice)}
                </div>
              </div>
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
                    <span className="kpi-label">Lot Sqft</span>
                  </div>
                )}
                {listing.propertyType && (
                  <div className="flex items-center gap-1.5">
                    <Home className="h-4 w-4" style={{ color: MUTED }} />
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

        {/* ═══ ROW 2: KPI Stat Cards (4 x 3 cols) ═══ */}
        <KPICard icon={Eye} label="Total Views" value={formatNumber(totalViews)} trend={12} sparkData={[30, 45, 38, 62, 55, 78, 90]} sparkColor="#3B82F6" iconBg="#EFF6FF" iconColor="#3B82F6" cols={3} delay={50} />
        <KPICard icon={Heart} label="Saves" value={formatNumber(totalSaves)} trend={8} sparkData={[5, 8, 12, 10, 18, 15, 22]} sparkColor="#F43F5E" iconBg="#FFF1F2" iconColor="#F43F5E" cols={3} delay={100} />
        <KPICard icon={Users} label="Showings" value={showingsCount.toString()} trend={5} iconBg="#F5F3FF" iconColor="#7C3AED" cols={3} delay={150} />
        <KPICard icon={FileText} label="Offers" value={offersCount.toString()} trend={offersCount > 0 ? 25 : 0} iconBg="#FFFBEB" iconColor="#D97706" cols={3} delay={200} />

        {/* ═══ ROW 3: Views Chart (5 cols) + Interest Donut (3 cols) + Activity (4 cols) ═══ */}
        <ViewsChart totalViews={totalViews} totalSaves={totalSaves} delay={250} />
        <InterestDonut showingsCount={showingsCount} highInterest={highInterest} delay={300} />
        <ActivityFeed offersCount={offersCount} showingsCount={showingsCount} checklistPct={checklistPct} delay={350} />

        {/* ═══ ROW 4: Checklist Progress (7 cols) + Quick Stats (5 cols) ═══ */}
        <ChecklistCard stages={stages} checklistPct={checklistPct} checklistCompleted={checklistCompleted} checklistTotal={checklistTotal} delay={400} />
        <QuickStatsCard
          highInterest={highInterest}
          daysOnMarket={daysOnMarket}
          pricePerSqft={pricePerSqft}
          yearBuilt={listing.yearBuilt}
          clientName={listing.clientName}
          clientEmail={listing.clientEmail}
          clientPhone={listing.clientPhone}
          isClient={isClient}
          delay={450}
        />
      </div>

      {/* ═══ TABS SECTION ═══ */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm p-1 h-auto flex-wrap rounded-xl border border-[#E5E7EB]">
          <TabsTrigger value="checklist" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-[#6db08a] data-[state=active]:text-white">
            <CheckSquare className="h-3.5 w-3.5" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-[#6db08a] data-[state=active]:text-white">
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="showings" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-[#6db08a] data-[state=active]:text-white">
            <Users className="h-3.5 w-3.5" />
            Showings
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-[#6db08a] data-[state=active]:text-white">
            <FileText className="h-3.5 w-3.5" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-1.5 text-sm rounded-lg data-[state=active]:bg-[#6db08a] data-[state=active]:text-white">
            <Link2 className="h-3.5 w-3.5" />
            Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <ChecklistTab listingId={id} readOnly={isClient} />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab listingId={id} readOnly={isClient} />
        </TabsContent>
        <TabsContent value="showings">
          <ShowingsTab listingId={id} readOnly={isClient} />
        </TabsContent>
        <TabsContent value="offers">
          <OffersTab listingId={id} readOnly={isClient} listPrice={listing?.listPrice} />
        </TabsContent>
        <TabsContent value="marketing">
          <MarketingTab listingId={id} readOnly={isClient} />
        </TabsContent>
      </Tabs>

      {/* Property Description */}
      {listing.description && (
        <div className="bento-card p-5">
          <p className="kpi-label mb-2">Property Description</p>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{listing.description}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function KPICard({
  icon: Icon, label, value, trend, sparkData, sparkColor, iconBg, iconColor, cols = 3, delay = 0,
}: {
  icon: any; label: string; value: string; trend?: number; sparkData?: number[]; sparkColor?: string;
  iconBg: string; iconColor: string; cols?: number; delay?: number;
}) {
  return (
    <div
      className={`col-span-6 lg:col-span-${cols} bento-card bento-animate p-4`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        {trend !== undefined && trend !== 0 && <TrendBadge value={trend} />}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{value}</p>
          <p className="kpi-label mt-1">{label}</p>
        </div>
        {sparkData && sparkColor && <Sparkline data={sparkData} color={sparkColor} height={28} />}
      </div>
    </div>
  );
}

function ViewsChart({ totalViews, totalSaves, delay }: { totalViews: number; totalSaves: number; delay: number }) {
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

  return (
    <div className="col-span-12 lg:col-span-5 bento-card bento-animate p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="kpi-label">Views & Saves Trend</p>
          <p className="text-2xl font-bold mt-1" style={{ color: CHARCOAL }}>{formatNumber(totalViews)}</p>
        </div>
        <TrendBadge value={12} />
      </div>
      <ChartContainer
        config={{ views: { label: "Views", color: MINT }, saves: { label: "Saves", color: "#94D1AD" } }}
        className="h-[140px] w-full aspect-auto"
      >
        <AreaChart data={viewsChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="viewsGradDetail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MINT} stopOpacity={0.3} />
              <stop offset="100%" stopColor={MINT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" dataKey="views" stroke={MINT} strokeWidth={2} fill="url(#viewsGradDetail)" />
          <Area type="monotone" dataKey="saves" stroke="#94D1AD" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function InterestDonut({ showingsCount, highInterest, delay }: { showingsCount: number; highInterest: number; delay: number }) {
  const interestData = useMemo(() => [
    { name: "High", value: highInterest || 2, fill: "#6db08a" },
    { name: "Low", value: Math.max(showingsCount - highInterest, 1), fill: "#94D1AD" },
    { name: "No Interest", value: Math.max(1, Math.round(showingsCount * 0.15)), fill: "#E5E7EB" },
  ], [highInterest, showingsCount]);

  return (
    <div className="col-span-6 lg:col-span-3 bento-card bento-animate p-5 flex flex-col items-center justify-center" style={{ animationDelay: `${delay}ms` }}>
      <p className="kpi-label mb-3 self-start">Interest Breakdown</p>
      <div className="relative w-[120px] h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={interestData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value" strokeWidth={0}>
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
  );
}

function ActivityFeed({ offersCount, showingsCount, checklistPct, delay }: { offersCount: number; showingsCount: number; checklistPct: number; delay: number }) {
  const activityItems = useMemo(() => {
    const items = [];
    if (offersCount > 0) items.push({ time: "2h ago", text: `New offer received — ${offersCount} total`, type: "offer" });
    if (showingsCount > 0) items.push({ time: "5h ago", text: `Showing completed — ${showingsCount} total`, type: "showing" });
    items.push({ time: "1d ago", text: "Property views trending up +12%", type: "views" });
    items.push({ time: "3d ago", text: `Checklist progress at ${checklistPct}%`, type: "checklist" });
    return items;
  }, [offersCount, showingsCount, checklistPct]);

  return (
    <div className="col-span-6 lg:col-span-4 bento-card bento-animate p-5" style={{ animationDelay: `${delay}ms` }}>
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
  );
}

function ChecklistCard({ stages, checklistPct, checklistCompleted, checklistTotal, delay }: { stages: any[]; checklistPct: number; checklistCompleted: number; checklistTotal: number; delay: number }) {
  return (
    <div className="col-span-12 lg:col-span-7 bento-card bento-animate p-5" style={{ animationDelay: `${delay}ms` }}>
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
        <span className="text-3xl font-bold" style={{ color: CHARCOAL }}>{checklistPct}%</span>
      </div>
      <div className="h-2 bg-[#F0F2F5] rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${checklistPct}%`, backgroundColor: MINT }} />
      </div>
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
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stage.percentage}%`, backgroundColor: stage.percentage === 100 ? MINT : `${MINT}80` }} />
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
  );
}

function QuickStatsCard({
  highInterest, daysOnMarket, pricePerSqft, yearBuilt, clientName, clientEmail, clientPhone, isClient, delay,
}: {
  highInterest: number; daysOnMarket: number; pricePerSqft: number | null; yearBuilt: number | null;
  clientName: string | null; clientEmail: string | null; clientPhone: string | null; isClient: boolean; delay: number;
}) {
  return (
    <div className="col-span-12 lg:col-span-5 bento-card bento-animate p-5" style={{ animationDelay: `${delay}ms` }}>
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
          <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{pricePerSqft ? `$${pricePerSqft}` : "—"}</p>
          <p className="kpi-label mt-0.5">Price / Sqft</p>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: "#F0F2F5" }}>
          <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{yearBuilt || "—"}</p>
          <p className="kpi-label mt-0.5">Year Built</p>
        </div>
      </div>

      {/* Client Info (agent only) */}
      {!isClient && clientName && (
        <div className="border-t border-[#F0F2F5] pt-3">
          <p className="kpi-label mb-2">Seller Information</p>
          <p className="text-sm font-medium" style={{ color: CHARCOAL }}>{clientName}</p>
          {clientEmail && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{clientEmail}</p>}
          {clientPhone && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{clientPhone}</p>}
        </div>
      )}
    </div>
  );
}
