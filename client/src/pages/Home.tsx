import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  Clock,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { STAGE_LABELS } from "../../../shared/checklistTemplate";

const MINT = "#6db08a";

const STATUS_COLORS: Record<string, string> = {
  "pre-listing": "bg-amber-100 text-amber-700 border-amber-200",
  "coming-soon": "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-emerald-50 text-[#6db08a] border-[#6db08a]/20",
  "under-contract": "bg-purple-100 text-purple-700 border-purple-200",
  sold: "bg-gray-100 text-gray-600 border-gray-200",
  withdrawn: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-500 border-gray-200",
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-4 grid-rows-3 gap-4 h-[600px]">
          <Skeleton className="col-span-2 row-span-2 rounded-2xl" />
          <Skeleton className="rounded-2xl" />
          <Skeleton className="rounded-2xl" />
          <Skeleton className="rounded-2xl" />
          <Skeleton className="rounded-2xl" />
          <Skeleton className="col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  // If there are listings, show bento dashboard for first listing (or selected)
  const hasListings = listings && listings.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
                className="text-sm"
              >
                {seedMutation.isPending ? "Creating..." : "Load Test Data"}
              </Button>
            )}
            <Button
              onClick={() => setLocation("/listings/new")}
              className="bg-[#6db08a] hover:bg-[#5a9a75] text-white gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!hasListings && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#6db08a]/10 flex items-center justify-center mb-5">
              <HomeIcon className="h-8 w-8 text-[#6db08a]" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1.5">
              No listings yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {isClient
                ? "Your agent hasn't added any listings for you yet."
                : "Create your first listing to start tracking your sales pipeline."}
            </p>
            {!isClient && (
              <Button
                onClick={() => setLocation("/listings/new")}
                className="bg-[#6db08a] hover:bg-[#5a9a75] text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Listing
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bento Grid for listings */}
      {hasListings && (
        <div className="space-y-8">
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
    ? Math.floor(
        (Date.now() - new Date(listing.listDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const totalViews = (stats?.insights?.redfin_views || 0) + (stats?.insights?.zillow_views || 0);
  const totalSaves = (stats?.insights?.redfin_saves || 0) + (stats?.insights?.zillow_saves || 0);
  const checklistPct = stats?.checklistProgress?.percentage || 0;
  const checklistCompleted = stats?.checklistProgress?.completed || 0;
  const checklistTotal = stats?.checklistProgress?.total || 0;

  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-[minmax(0,1fr)]">
      {/* ═══ ROW 1 ═══ */}

      {/* Listing Hero Card - spans 5 cols, 2 rows */}
      <div
        className="col-span-12 lg:col-span-5 row-span-2 rounded-2xl border border-border/60 bg-card p-6 flex flex-col cursor-pointer group hover:shadow-lg hover:border-[#6db08a]/30 transition-all duration-300"
        onClick={onNavigate}
      >
        <div>
          <div className="flex items-start justify-between mb-4">
            <Badge
              variant="secondary"
              className={`text-xs font-medium border ${STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-600"}`}
            >
              {STATUS_LABELS[listing.status] || listing.status}
            </Badge>
            <div className="h-8 w-8 rounded-full bg-[#6db08a]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-4 w-4 text-[#6db08a]" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-foreground leading-tight mb-1 group-hover:text-[#6db08a] transition-colors">
            {listing.address}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {[listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ")}
          </p>

          <div className="text-3xl font-bold text-foreground mt-5 tracking-tight">
            {formatPrice(listing.listPrice)}
          </div>

          {listing.mlsNumber && (
            <p className="text-xs text-muted-foreground mt-1.5">MLS# {listing.mlsNumber}</p>
          )}
        </div>

        {/* Client info */}
        {listing.clientName && (
          <div className="mt-5 pt-4 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Seller</p>
            <p className="text-sm font-medium text-foreground">{listing.clientName}</p>
            {listing.clientEmail && (
              <p className="text-xs text-muted-foreground mt-0.5">{listing.clientEmail}</p>
            )}
          </div>
        )}

        {/* Property type & year */}
        {(listing.propertyType || listing.yearBuilt) && (
          <div className="mt-4 flex items-center gap-4">
            {listing.propertyType && (
              <div className="px-2.5 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                {listing.propertyType}
              </div>
            )}
            {listing.yearBuilt && (
              <div className="px-2.5 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                Built {listing.yearBuilt}
              </div>
            )}
          </div>
        )}

        {/* Property specs */}
        <div className="flex items-center gap-5 mt-6 pt-5 border-t border-border/50">
          {listing.bedrooms && (
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">{listing.bedrooms}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Beds</p>
              </div>
            </div>
          )}
          {listing.bathrooms && (
            <div className="flex items-center gap-2">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">{listing.bathrooms}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Baths</p>
              </div>
            </div>
          )}
          {listing.sqft && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">{listing.sqft.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sqft</p>
              </div>
            </div>
          )}
          {listing.listDate && (
            <div className="flex items-center gap-2 ml-auto">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">{daysOnMarket}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Views KPI */}
      <BentoKPI
        icon={Eye}
        label="Total Views"
        value={formatNumber(totalViews)}
        sublabel="Redfin + Zillow"
        color="#3B82F6"
        bgColor="#EFF6FF"
        className="col-span-6 sm:col-span-4 lg:col-span-2"
      />

      {/* Saves KPI */}
      <BentoKPI
        icon={Heart}
        label="Saves"
        value={formatNumber(totalSaves)}
        sublabel="Favorites"
        color="#F43F5E"
        bgColor="#FFF1F2"
        className="col-span-6 sm:col-span-4 lg:col-span-2"
      />

      {/* Showings KPI */}
      <BentoKPI
        icon={Users}
        label="Showings"
        value={stats?.showingsCount?.toString() || "0"}
        sublabel="Total scheduled"
        color="#7C3AED"
        bgColor="#F5F3FF"
        className="col-span-6 sm:col-span-4 lg:col-span-3"
      />

      {/* Offers KPI */}
      <BentoKPI
        icon={FileText}
        label="Offers"
        value={stats?.offersCount?.toString() || "0"}
        sublabel="Received"
        color="#D97706"
        bgColor="#FFFBEB"
        className="col-span-6 sm:col-span-4 lg:col-span-2"
      />

      {/* High Interest */}
      <BentoKPI
        icon={TrendingUp}
        label="High Interest"
        value={stats?.highInterestShowings?.toString() || "0"}
        sublabel="Buyers"
        color="#6db08a"
        bgColor="#e8f5ee"
        className="col-span-6 sm:col-span-4 lg:col-span-2"
      />

      {/* Days on Market */}
      <BentoKPI
        icon={Clock}
        label="Days on Market"
        value={daysOnMarket.toString()}
        sublabel={listing.listDate ? `Since ${new Date(listing.listDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Not listed"}
        color="#64748B"
        bgColor="#F1F5F9"
        className="col-span-6 sm:col-span-4 lg:col-span-3"
      />

      {/* ═══ ROW 3 ═══ */}

      {/* Checklist Progress - wide card */}
      <div className="col-span-12 lg:col-span-7 rounded-2xl border border-border/60 bg-card p-5 cursor-pointer hover:shadow-lg hover:border-[#6db08a]/30 transition-all duration-300" onClick={onNavigate}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#6db08a]/10 flex items-center justify-center">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#6db08a]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Checklist Progress</h3>
              <p className="text-xs text-muted-foreground">{checklistCompleted} of {checklistTotal} items complete</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">{checklistPct}%</span>
          </div>
        </div>

        <Progress value={checklistPct} className="h-2 mb-4" />

        {/* Stage pills */}
        <div className="flex flex-wrap gap-2">
          {(stats as any)?.checklistProgress?.stages?.map((stage: any) => (
            <div
              key={stage.name}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
              style={{
                backgroundColor: stage.percentage === 100
                  ? "#e8f5ee"
                  : stage.percentage > 0
                    ? "rgba(109,176,138,0.08)"
                    : "#f1f5f9",
                color: stage.percentage > 0 ? "#6db08a" : "#94a3b8",
              }}
            >
              {stage.percentage === 100 ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {(STAGE_LABELS as any)[stage.name] || stage.name}
            </div>
          )) || (
            <p className="text-xs text-muted-foreground">Loading stages...</p>
          )}
        </div>
      </div>

      {/* Quick Actions / Activity Card */}
      <div className="col-span-12 lg:col-span-5 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-xl bg-[#6db08a]/10 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-[#6db08a]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Manage this listing</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: "View Full Details", desc: "Checklist, insights & more", action: onNavigate },
            { label: "Record a Showing", desc: "Log buyer agent feedback", action: onNavigate },
            { label: "Add an Offer", desc: "Track incoming offers", action: onNavigate },
            { label: "Update Marketing Links", desc: "Photos, video, Matterport", action: onNavigate },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#6db08a]/5 transition-colors group text-left"
            >
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-[#6db08a] transition-colors">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#6db08a] transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BentoKPI({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
  bgColor,
  className = "",
}: {
  icon: any;
  label: string;
  value: string;
  sublabel: string;
  color: string;
  bgColor: string;
  className?: string;
}) {
  return (
    <div className={`${className} rounded-2xl border border-border/60 bg-card p-4 flex flex-col justify-between hover:shadow-md hover:border-border transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
