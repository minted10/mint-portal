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
  Calendar,
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  "pre-listing": "bg-amber-100 text-amber-700",
  "coming-soon": "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

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
            {(!listings || listings.length === 0) && (
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
              className="bg-primary hover:bg-mint-dark text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {(!listings || listings.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <HomeIcon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
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
                className="bg-primary hover:bg-mint-dark text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Listing
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Listing Cards Grid */}
      {listings && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => setLocation(`/listings/${listing.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  onClick,
}: {
  listing: any;
  onClick: () => void;
}) {
  const { data: stats } = trpc.listing.dashboardStats.useQuery(
    { id: listing.id },
  );

  const daysOnMarket = listing.listDate
    ? Math.floor(
        (Date.now() - new Date(listing.listDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all duration-200 border-border/60 overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Top section with status and price */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between mb-3">
            <Badge
              variant="secondary"
              className={`text-xs font-medium ${STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-600"}`}
            >
              {STATUS_LABELS[listing.status] || listing.status}
            </Badge>
            {listing.listDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {daysOnMarket}d
              </span>
            )}
          </div>

          <h3 className="font-semibold text-foreground text-base leading-tight mb-1 group-hover:text-primary transition-colors">
            {listing.address}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[listing.city, listing.state, listing.zipCode]
              .filter(Boolean)
              .join(", ")}
          </p>

          <div className="text-xl font-semibold text-foreground mt-3">
            {formatPrice(listing.listPrice)}
          </div>

          {/* Property specs */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {listing.bedrooms && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {listing.bedrooms}
              </span>
            )}
            {listing.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {listing.bathrooms}
              </span>
            )}
            {listing.sqft && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" />
                {listing.sqft.toLocaleString()} sqft
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Stats row */}
        <div className="px-5 py-3 bg-muted/30">
          {stats ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Checklist Progress</span>
                <span className="font-medium text-foreground">
                  {stats.checklistProgress.percentage}%
                </span>
              </div>
              <Progress
                value={stats.checklistProgress.percentage}
                className="h-1.5"
              />
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {(stats.insights?.redfin_views || 0) +
                    (stats.insights?.zillow_views || 0)}{" "}
                  views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {(stats.insights?.redfin_saves || 0) +
                    (stats.insights?.zillow_saves || 0)}{" "}
                  saves
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {stats.showingsCount} showings
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {stats.offersCount} offers
                </span>
              </div>
            </div>
          ) : (
            <Skeleton className="h-10 w-full" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
