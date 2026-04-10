import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home as HomeIcon,
  Plus,
  MapPin,
  Bed,
  Bath,
  Ruler,
  DollarSign,
  ArrowUpRight,
  Eye,
  Heart,
  Users,
  FileText,
  Clock,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Wind,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  TrendingUp,
  Quote,
  ChevronRight,
  Flame,
  UserCheck,
  Handshake,
  Target,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";

/* ── Color Constants ── */
const CHARCOAL = "#1E1E1E";
const MUTED = "#6B7280";
const MINT = "#6db08a";

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

/* ── Greeting based on time of day ── */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Weather icon helper ── */
function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("shower")) return <CloudRain className={className} />;
  if (c.includes("drizzle")) return <CloudDrizzle className={className} />;
  if (c.includes("snow")) return <CloudSnow className={className} />;
  if (c.includes("thunder") || c.includes("lightning")) return <CloudLightning className={className} />;
  if (c.includes("cloud") || c.includes("overcast")) return <Cloud className={className} />;
  if (c.includes("wind")) return <Wind className={className} />;
  return <Sun className={className} />;
}

/* ── Smart List icon mapping ── */
const SMART_LIST_ICONS: Record<number, { icon: any; color: string }> = {
  10: { icon: Target, color: "#3B82F6" },       // Leads
  11: { icon: Flame, color: "#EF4444" },         // Hot Prospects
  12: { icon: Heart, color: "#EC4899" },          // Nurture
  13: { icon: UserCheck, color: "#6db08a" },      // Buyers
  14: { icon: HomeIcon, color: "#8B5CF6" },       // Sellers
  15: { icon: Handshake, color: "#F59E0B" },      // Pending
};

/* ═══════════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: listings, isLoading: listingsLoading } = trpc.listing.list.useQuery();
  const { data: fubData, isLoading: fubLoading } = trpc.fub.dashboard.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache for 5 min
    retry: 1,
  });
  const seedMutation = trpc.seed.createTestListing.useMutation();
  const utils = trpc.useUtils();

  const isClient = (user as any)?.portalRole === "client";

  // Weather state (fetched client-side from free API)
  const [weather, setWeather] = useState<any>(null);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<any[]>([]);

  useEffect(() => {
    // Fetch weather
    fetch("https://wttr.in/Costa+Mesa,CA?format=j1")
      .then((r) => r.json())
      .then((d) => {
        const current = d.current_condition?.[0];
        const today = d.weather?.[0];
        if (current) {
          setWeather({
            temp: current.temp_F,
            condition: current.weatherDesc?.[0]?.value || "Clear",
            high: today?.maxtempF,
            low: today?.mintempF,
            humidity: current.humidity,
            wind: current.windspeedMiles,
          });
        }
      })
      .catch(() => {});

    // Fetch quote
    fetch("https://zenquotes.io/api/today")
      .then((r) => r.json())
      .then((d) => {
        if (d?.[0]) {
          setQuote({ text: d[0].q, author: d[0].a });
        }
      })
      .catch(() => {
        setQuote({
          text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          author: "Winston Churchill",
        });
      });
  }, []);

  const handleSeedTestData = async () => {
    await seedMutation.mutateAsync();
    utils.listing.list.invalidate();
  };

  const firstName = user?.name?.split(" ")[0] || "there";
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // If client, show simplified view
  if (isClient) {
    return <ClientHome listings={listings} isLoading={listingsLoading} />;
  }

  return (
    <div className="space-y-6">
      {/* ── Greeting Header ── */}
      <div className="bento-card bento-animate p-6" style={{ animationDelay: "0ms" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: CHARCOAL }}>
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {dateStr}
              {weather && (
                <span className="ml-3 inline-flex items-center gap-1.5">
                  <WeatherIcon condition={weather.condition} className="h-3.5 w-3.5" />
                  {weather.temp}°F, {weather.condition}
                  {weather.high && (
                    <span className="text-xs opacity-70">
                      · H:{weather.high}° L:{weather.low}°
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {(!listings || listings.length === 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedTestData}
                disabled={seedMutation.isPending}
                className="text-sm rounded-xl"
              >
                {seedMutation.isPending ? "Loading..." : "Load Test Data"}
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
        </div>

        {/* Quote */}
        {quote && (
          <div className="mt-4 pt-4 border-t border-[#F0F2F5]">
            <div className="flex items-start gap-3">
              <Quote className="h-4 w-4 mt-0.5 shrink-0" style={{ color: MINT }} />
              <div>
                <p className="text-sm italic leading-relaxed" style={{ color: CHARCOAL }}>
                  "{quote.text}"
                </p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  — {quote.author}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid: CRM Pulse + Smart Lists + Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CRM Pulse */}
        <CRMPulseCard fubData={fubData} isLoading={fubLoading} />

        {/* Smart Lists */}
        <SmartListsCard fubData={fubData} isLoading={fubLoading} />

        {/* Today's Schedule */}
        <ScheduleCard />
      </div>

      {/* ── Deal Pipeline ── */}
      {fubData?.deals && (
        <DealPipelineCard deals={fubData.deals} />
      )}

      {/* ── Your Listings ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold tracking-tight" style={{ color: CHARCOAL }}>
            Your Listings
          </h2>
          <button
            onClick={() => setLocation("/listings")}
            className="text-sm font-medium flex items-center gap-1 hover:underline"
            style={{ color: MINT }}
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {listingsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64 rounded-[20px]" />
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#6db08a]/10 flex items-center justify-center mb-4">
              <HomeIcon className="h-7 w-7 text-[#6db08a]" />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: CHARCOAL }}>
              No listings yet
            </h3>
            <p className="text-sm max-w-sm mb-5" style={{ color: MUTED }}>
              Create your first listing or load test data to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listings.slice(0, 4).map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                delay={index * 80}
                onClick={() => setLocation(`/listings/${listing.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CRM PULSE CARD
   ═══════════════════════════════════════════════════════════════ */
function CRMPulseCard({ fubData, isLoading }: { fubData: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bento-card bento-animate p-5" style={{ animationDelay: "100ms" }}>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const tasks = fubData?.tasks || { totalOpen: 0, overdue: 0, dueToday: 0 };
  const leads = fubData?.leads || { newLeadsToday: 0, totalContacts: 0 };

  const stats = [
    {
      icon: AlertCircle,
      label: "Overdue Tasks",
      value: tasks.overdue,
      color: tasks.overdue > 0 ? "#EF4444" : MUTED,
      bgColor: tasks.overdue > 0 ? "#FEF2F2" : "#F7F8FA",
    },
    {
      icon: CheckCircle2,
      label: "Due Today",
      value: tasks.dueToday,
      color: tasks.dueToday > 0 ? "#F59E0B" : MUTED,
      bgColor: tasks.dueToday > 0 ? "#FFFBEB" : "#F7F8FA",
    },
    {
      icon: TrendingUp,
      label: "New Leads Today",
      value: leads.newLeadsToday,
      color: leads.newLeadsToday > 0 ? MINT : MUTED,
      bgColor: leads.newLeadsToday > 0 ? "#F0FDF4" : "#F7F8FA",
    },
    {
      icon: Users,
      label: "Total Contacts",
      value: leads.totalContacts,
      color: "#3B82F6",
      bgColor: "#EFF6FF",
    },
  ];

  return (
    <div className="bento-card bento-animate p-5" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
          <Flame className="h-4 w-4 text-red-500" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: CHARCOAL }}>
          CRM Pulse
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F2F5] font-medium" style={{ color: MUTED }}>
          FUB
        </span>
      </div>

      <div className="space-y-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-xl px-3.5 py-3"
            style={{ backgroundColor: stat.bgColor }}
          >
            <div className="flex items-center gap-2.5">
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              <span className="text-sm font-medium" style={{ color: CHARCOAL }}>
                {stat.label}
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[#F0F2F5] text-center">
        <span className="text-xs" style={{ color: MUTED }}>
          {tasks.totalOpen.toLocaleString()} total open tasks
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SMART LISTS CARD
   ═══════════════════════════════════════════════════════════════ */
function SmartListsCard({ fubData, isLoading }: { fubData: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bento-card bento-animate p-5" style={{ animationDelay: "200ms" }}>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const smartLists = fubData?.smartLists || [];

  return (
    <div className="bento-card bento-animate p-5" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
          <ListTodo className="h-4 w-4 text-blue-500" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: CHARCOAL }}>
          Smart Lists
        </h3>
      </div>

      {smartLists.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: MUTED }}>
          No smart lists found
        </p>
      ) : (
        <div className="space-y-2">
          {smartLists.map((sl: any) => {
            const config = SMART_LIST_ICONS[sl.id] || { icon: Users, color: MUTED };
            const IconComp = config.icon;
            return (
              <div
                key={sl.id}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 hover:bg-[#F7F8FA] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <IconComp className="h-3.5 w-3.5" style={{ color: config.color }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: CHARCOAL }}>
                    {sl.name}
                  </span>
                </div>
                <Badge
                  className="text-xs font-bold border-0 tabular-nums"
                  style={{
                    backgroundColor: sl.count > 0 ? `${config.color}15` : "#F0F2F5",
                    color: sl.count > 0 ? config.color : MUTED,
                  }}
                >
                  {sl.count.toLocaleString()}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCHEDULE CARD (Google Calendar via server proxy)
   ═══════════════════════════════════════════════════════════════ */
function ScheduleCard() {
  // For now, show a placeholder that can be wired to Google Calendar API later
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toLocaleDateString("en-US", { weekday: "long" });
  const tomorrowStr = tomorrow.toLocaleDateString("en-US", { weekday: "long" });

  // Static placeholder events - will be replaced with live Google Calendar data
  const [events] = useState([
    { time: "9:00 AM", title: "Roleplay & Accountability Call", type: "meeting" },
    { time: "9:30 AM", title: "Weekly Accounting", type: "task" },
    { time: "11:00 AM", title: "Friday Coaching Call", type: "meeting" },
    { time: "1:00 PM", title: "SISU Goal Planning - Client Meeting", type: "client" },
    { time: "2:00 PM", title: "Mint Opportunity Alignment", type: "client" },
    { time: "3:45 PM", title: "Next Week Agenda Plan", type: "task" },
  ]);

  const typeColors: Record<string, string> = {
    meeting: "#3B82F6",
    task: "#F59E0B",
    client: MINT,
  };

  return (
    <div className="bento-card bento-animate p-5" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F0FDF4" }}>
          <CalendarDays className="h-4 w-4" style={{ color: MINT }} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: CHARCOAL }}>
          Today's Schedule
        </h3>
      </div>

      <div className="space-y-1.5">
        {events.map((event, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-[#F7F8FA] transition-colors"
          >
            <div
              className="w-1 h-8 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: typeColors[event.type] || MUTED }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>
                {event.title}
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                {event.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F0F2F5]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: MUTED }}>
            Tomorrow ({tomorrowStr})
          </span>
          <span className="text-xs" style={{ color: MUTED }}>
            No events
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DEAL PIPELINE CARD
   ═══════════════════════════════════════════════════════════════ */
function DealPipelineCard({ deals }: { deals: any }) {
  const stageOrder = [
    "Appointment Set",
    "Appointment Met",
    "Signed",
    "MLS Live",
    "Pending",
    "Pipeline",
    "Closed",
  ];

  const stageColors: Record<string, string> = {
    "Appointment Set": "#3B82F6",
    "Appointment Met": "#6366F1",
    Signed: "#8B5CF6",
    "MLS Live": "#EC4899",
    Pending: "#F59E0B",
    Pipeline: "#6db08a",
    Closed: "#10B981",
  };

  const stages = stageOrder
    .filter((s) => deals.stages[s])
    .map((name) => ({
      name,
      count: deals.stages[name] || 0,
      color: stageColors[name] || MUTED,
    }));

  const totalInPipeline = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="bento-card bento-animate p-5" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F5F3FF" }}>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: CHARCOAL }}>
            Deal Pipeline
          </h3>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: CHARCOAL }}>
            {deals.totalDeals}
          </span>
          <span className="text-xs ml-1.5" style={{ color: MUTED }}>
            deals · ${(deals.totalValue / 1_000_000).toFixed(1)}M
          </span>
        </div>
      </div>

      {/* Pipeline Bar */}
      <div className="flex rounded-xl overflow-hidden h-8 mb-3">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="flex items-center justify-center text-white text-[10px] font-bold transition-all"
            style={{
              backgroundColor: stage.color,
              width: `${(stage.count / totalInPipeline) * 100}%`,
              minWidth: stage.count > 0 ? "32px" : "0",
            }}
            title={`${stage.name}: ${stage.count}`}
          >
            {stage.count}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="text-xs" style={{ color: MUTED }}>
              {stage.name}
            </span>
            <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>
              {stage.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LISTING CARD (reused from previous version)
   ═══════════════════════════════════════════════════════════════ */
function ListingCard({
  listing,
  delay,
  onClick,
}: {
  listing: any;
  delay: number;
  onClick: () => void;
}) {
  const { data: stats } = trpc.listing.dashboardStats.useQuery({ id: listing.id });

  const daysOnMarket = listing.listDate
    ? Math.floor((Date.now() - new Date(listing.listDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalViews = (stats?.insights?.redfin_views || 0) + (stats?.insights?.zillow_views || 0);
  const totalSaves = (stats?.insights?.redfin_saves || 0) + (stats?.insights?.zillow_saves || 0);
  const showingsCount = stats?.showingsCount || 0;
  const offersCount = stats?.offersCount || 0;

  const pricePerSqft =
    listing.sqft && listing.listPrice
      ? Math.round(parseFloat(listing.listPrice) / listing.sqft)
      : null;

  return (
    <div
      className="bento-card bento-animate cursor-pointer group overflow-hidden"
      style={{ animationDelay: `${500 + delay}ms` }}
      onClick={onClick}
    >
      {/* Photo Section */}
      <div className="relative h-48 overflow-hidden">
        {listing.photoUrl ? (
          <img
            src={listing.photoUrl}
            alt={listing.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#6db08a]/20 to-[#6db08a]/5 flex items-center justify-center">
            <HomeIcon className="h-12 w-12 text-[#6db08a]/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <Badge
          className={`absolute top-3 left-3 text-xs font-semibold border-0 ${STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-600"}`}
        >
          {STATUS_LABELS[listing.status] || listing.status}
        </Badge>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white text-2xl font-bold tracking-tight drop-shadow-md">
            {formatPrice(listing.listPrice)}
          </div>
        </div>
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5">
        <h3
          className="text-lg font-bold tracking-tight group-hover:text-[#6db08a] transition-colors"
          style={{ color: CHARCOAL }}
        >
          {listing.address}
        </h3>
        <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
          <MapPin className="h-3.5 w-3.5" />
          {[listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ")}
          {listing.mlsNumber && (
            <span className="ml-2 text-xs opacity-70">MLS# {listing.mlsNumber}</span>
          )}
        </p>

        {/* Property Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F0F2F5]">
          {listing.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {listing.bedrooms}
              </span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>
                bd
              </span>
            </div>
          )}
          {listing.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {listing.bathrooms}
              </span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>
                ba
              </span>
            </div>
          )}
          {listing.sqft && (
            <div className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {listing.sqft.toLocaleString()}
              </span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>
                sqft
              </span>
            </div>
          )}
          {pricePerSqft && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                ${pricePerSqft}
              </span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>
                /sqft
              </span>
            </div>
          )}
        </div>

        {/* Quick KPI Row */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <MiniStat icon={Eye} value={formatNumber(totalViews)} label="Views" />
          <MiniStat icon={Heart} value={formatNumber(totalSaves)} label="Saves" />
          <MiniStat icon={Users} value={showingsCount.toString()} label="Showings" />
          <MiniStat icon={FileText} value={offersCount.toString()} label="Offers" />
        </div>

        {/* Days on Market */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0F2F5]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" style={{ color: MUTED }} />
            <span className="text-xs" style={{ color: MUTED }}>
              {daysOnMarket} days on market
            </span>
          </div>
          <span className="text-xs font-medium text-[#6db08a] group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Mini Stat for KPI row ── */
function MiniStat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="text-center rounded-lg py-2 px-1" style={{ backgroundColor: "#F7F8FA" }}>
      <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: MUTED }} />
      <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLIENT HOME (simplified for client users)
   ═══════════════════════════════════════════════════════════════ */
function ClientHome({ listings, isLoading }: { listings: any; isLoading: boolean }) {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-[20px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-bold tracking-tight" style={{ color: CHARCOAL }}>
        My Listings
      </h1>
      {!listings || listings.length === 0 ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
          <HomeIcon className="h-10 w-10 text-[#6db08a]/40 mb-3" />
          <p className="text-sm" style={{ color: MUTED }}>
            Your agent hasn't added any listings for you yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {listings.map((listing: any, index: number) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              delay={index * 80}
              onClick={() => setLocation(`/listings/${listing.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
