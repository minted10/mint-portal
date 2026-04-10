import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Ruler,
  LandPlot,
  CalendarDays,
  Eye,
  Heart,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Home,
  DollarSign,
  BarChart3,
  CheckSquare,
  Megaphone,
  Link2,
} from "lucide-react";
import { useLocation } from "wouter";
import ChecklistTab from "@/components/listing/ChecklistTab";
import ShowingsTab from "@/components/listing/ShowingsTab";
import OffersTab from "@/components/listing/OffersTab";
import MarketingTab from "@/components/listing/MarketingTab";
import InsightsTab from "@/components/listing/InsightsTab";

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

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

export default function ListingDetail({ id }: { id: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isClient = (user as any)?.portalRole === "client";

  const { data: listing, isLoading: listingLoading } = trpc.listing.getById.useQuery({ id });
  const { data: stats, isLoading: statsLoading } = trpc.listing.dashboardStats.useQuery({ id });

  if (listingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-medium">Listing not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="h-9 w-9 mt-0.5 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {listing.address}
            </h1>
            <Badge
              variant="secondary"
              className={STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-600"}
            >
              {STATUS_LABELS[listing.status] || listing.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {[listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ")}
            {listing.mlsNumber && (
              <span className="ml-3 text-xs">MLS# {listing.mlsNumber}</span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-semibold">{formatPrice(listing.listPrice)}</div>
          {listing.listDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {daysOnMarket} days on market
            </p>
          )}
        </div>
      </div>

      {/* Property Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <QuickStat icon={Bed} label="Beds" value={listing.bedrooms?.toString() || "—"} />
        <QuickStat icon={Bath} label="Baths" value={listing.bathrooms?.toString() || "—"} />
        <QuickStat icon={Ruler} label="Sqft" value={formatNumber(listing.sqft)} />
        <QuickStat icon={LandPlot} label="Lot" value={listing.lotSizeSqft ? `${formatNumber(listing.lotSizeSqft)} sqft` : "—"} />
        <QuickStat icon={Home} label="Type" value={listing.propertyType || "—"} />
        <QuickStat icon={CalendarDays} label="Year" value={listing.yearBuilt?.toString() || "—"} />
        <QuickStat icon={DollarSign} label="$/sqft" value={listing.sqft && listing.listPrice ? `$${Math.round(parseFloat(listing.listPrice) / listing.sqft)}` : "—"} />
      </div>

      {/* Dashboard KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={Eye} label="Total Views" value={formatNumber(totalViews)} color="text-blue-600" bg="bg-blue-50" />
        <KPICard icon={Heart} label="Saves" value={formatNumber(totalSaves)} color="text-rose-500" bg="bg-rose-50" />
        <KPICard icon={Users} label="Showings" value={stats?.showingsCount?.toString() || "0"} color="text-purple-600" bg="bg-purple-50" />
        <KPICard icon={FileText} label="Offers" value={stats?.offersCount?.toString() || "0"} color="text-amber-600" bg="bg-amber-50" />
        <KPICard icon={TrendingUp} label="High Interest" value={stats?.highInterestShowings?.toString() || "0"} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={Clock} label="Days on Market" value={daysOnMarket.toString()} color="text-gray-600" bg="bg-gray-50" />
      </div>

      {/* Checklist Progress */}
      {stats?.checklistProgress && (
        <Card>
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Checklist Progress</span>
              <span className="text-sm font-semibold text-primary">
                {stats.checklistProgress.completed}/{stats.checklistProgress.total} ({stats.checklistProgress.percentage}%)
              </span>
            </div>
            <Progress value={stats.checklistProgress.percentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="checklist" className="gap-1.5 text-sm">
            <CheckSquare className="h-3.5 w-3.5" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 text-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="showings" className="gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5" />
            Showings
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-1.5 text-sm">
            <FileText className="h-3.5 w-3.5" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-1.5 text-sm">
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
          <OffersTab listingId={id} readOnly={isClient} />
        </TabsContent>
        <TabsContent value="marketing">
          <MarketingTab listingId={id} readOnly={isClient} />
        </TabsContent>
      </Tabs>

      {/* Property Description */}
      {listing.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Property Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Client Info (agent only) */}
      {!isClient && listing.clientName && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name</span>
                <p className="font-medium">{listing.clientName}</p>
              </div>
              {listing.clientEmail && (
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{listing.clientEmail}</p>
                </div>
              )}
              {listing.clientPhone && (
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{listing.clientPhone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2.5">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
