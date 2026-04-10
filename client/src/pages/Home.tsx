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
  LandPlot,
  DollarSign,
  ArrowUpRight,
  Eye,
  Heart,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";

/* ── Color Constants ── */
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-[20px]" />
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

      {/* Listing Cards Grid */}
      {hasListings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {listings.map((listing, index) => (
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

/* ═══════════════════════════════════════════════════════════════
   LISTING CARD — Simplified hero card per listing
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

  const pricePerSqft = listing.sqft && listing.listPrice
    ? Math.round(parseFloat(listing.listPrice) / listing.sqft)
    : null;

  return (
    <div
      className="bento-card bento-animate cursor-pointer group overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
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
        <h3 className="text-lg font-bold tracking-tight group-hover:text-[#6db08a] transition-colors" style={{ color: CHARCOAL }}>
          {listing.address}
        </h3>
        <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
          <MapPin className="h-3.5 w-3.5" />
          {[listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ")}
          {listing.mlsNumber && <span className="ml-2 text-xs opacity-70">MLS# {listing.mlsNumber}</span>}
        </p>

        {/* Property Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F0F2F5]">
          {listing.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.bedrooms}</span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>bd</span>
            </div>
          )}
          {listing.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.bathrooms}</span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>ba</span>
            </div>
          )}
          {listing.sqft && (
            <div className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{listing.sqft.toLocaleString()}</span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>sqft</span>
            </div>
          )}
          {pricePerSqft && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" style={{ color: MUTED }} />
              <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>${pricePerSqft}</span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>/sqft</span>
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
            <span className="text-xs" style={{ color: MUTED }}>{daysOnMarket} days on market</span>
          </div>
          <span className="text-xs font-medium text-[#6db08a] group-hover:underline">View Details →</span>
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
      <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
    </div>
  );
}
