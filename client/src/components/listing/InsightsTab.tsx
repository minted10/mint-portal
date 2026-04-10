import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Heart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  ExternalLink,
  Calendar,
  DollarSign,
  Home,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function InsightsTab({ listingId, readOnly }: { listingId: number; readOnly: boolean }) {
  const { data: insights, isLoading } = trpc.insights.get.useQuery({ listingId });
  const utils = trpc.useUtils();

  const updateMutation = trpc.insights.update.useMutation({
    onSuccess: () => {
      utils.insights.get.invalidate({ listingId });
      utils.listing.dashboardStats.invalidate({ id: listingId });
      toast.success("Insights updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    redfin_views: 0,
    redfin_saves: 0,
    zillow_views: 0,
    zillow_saves: 0,
    open_house_dates: "",
    price_history: "",
  });

  useEffect(() => {
    if (insights) {
      setForm({
        redfin_views: insights.redfin_views || 0,
        redfin_saves: insights.redfin_saves || 0,
        zillow_views: insights.zillow_views || 0,
        zillow_saves: insights.zillow_saves || 0,
        open_house_dates: typeof insights.openHouseDates === 'string' ? insights.openHouseDates : (insights.openHouseDates ? JSON.stringify(insights.openHouseDates) : ""),
        price_history: typeof insights.priceHistory === 'string' ? insights.priceHistory : (insights.priceHistory ? JSON.stringify(insights.priceHistory) : ""),
      });
    }
  }, [insights]);

  const handleSave = () => {
    // Parse open house dates from comma-separated string to array
    const parsedOpenHouseDates = form.open_house_dates
      ? form.open_house_dates.split(",").map(d => d.trim()).filter(Boolean)
      : undefined;

    // Parse price history from JSON string to array
    let parsedPriceHistory: Array<{ date: string; price: number; event: string }> | undefined;
    if (form.price_history) {
      try {
        const raw = JSON.parse(form.price_history);
        parsedPriceHistory = raw.map((e: any) => ({
          date: String(e.date || ""),
          price: typeof e.price === 'number' ? e.price : parseFloat(String(e.price).replace(/[^0-9.]/g, '')) || 0,
          event: String(e.event || ""),
        }));
      } catch {
        // skip invalid JSON
      }
    }

    updateMutation.mutate({
      listingId,
      redfin_views: form.redfin_views,
      redfin_saves: form.redfin_saves,
      zillow_views: form.zillow_views,
      zillow_saves: form.zillow_saves,
      ...(parsedOpenHouseDates ? { openHouseDates: parsedOpenHouseDates } : {}),
      ...(parsedPriceHistory ? { priceHistory: parsedPriceHistory } : {}),
    });
    setEditing(false);
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const totalViews = (form.redfin_views || 0) + (form.zillow_views || 0);
  const totalSaves = (form.redfin_saves || 0) + (form.zillow_saves || 0);

  // Parse open house dates - handle JSON arrays from DB
  let openHouseDates: string[] = [];
  if (form.open_house_dates) {
    try {
      const parsed = JSON.parse(form.open_house_dates);
      if (Array.isArray(parsed)) {
        openHouseDates = parsed.map((d: string) => {
          // Format ISO dates nicely
          try {
            const date = new Date(d + 'T00:00:00');
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          } catch { return d; }
        });
      }
    } catch {
      // Fallback: comma-separated string
      openHouseDates = form.open_house_dates.split(",").map(d => d.trim()).filter(Boolean);
    }
  }

  // Parse price history - handle JSON arrays from DB
  let priceHistory: Array<{ date: string; price: string | number; event: string }> = [];
  if (form.price_history) {
    try {
      const parsed = JSON.parse(form.price_history);
      if (Array.isArray(parsed)) {
        priceHistory = parsed.map((e: any) => ({
          date: e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          price: typeof e.price === 'number' ? `$${e.price.toLocaleString()}` : String(e.price || ''),
          event: String(e.event || 'Price Change'),
        }));
      }
    } catch {
      // skip invalid JSON
    }
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-[#5a9a75] text-white gap-1">
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Update Insights
            </Button>
          )}
        </div>
      )}

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Redfin */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xs font-bold">R</span>
              </div>
              Redfin

            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Views</Label>
                  <Input type="number" value={form.redfin_views} onChange={e => setForm(p => ({ ...p, redfin_views: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Saves / Favorites</Label>
                  <Input type="number" value={form.redfin_saves} onChange={e => setForm(p => ({ ...p, redfin_saves: Number(e.target.value) }))} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <StatDisplay icon={Eye} label="Views" value={form.redfin_views} color="text-blue-600" />
                <StatDisplay icon={Heart} label="Saves" value={form.redfin_saves} color="text-rose-500" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zillow */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">Z</span>
              </div>
              Zillow

            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Views</Label>
                  <Input type="number" value={form.zillow_views} onChange={e => setForm(p => ({ ...p, zillow_views: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Saves / Favorites</Label>
                  <Input type="number" value={form.zillow_saves} onChange={e => setForm(p => ({ ...p, zillow_saves: Number(e.target.value) }))} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <StatDisplay icon={Eye} label="Views" value={form.zillow_views} color="text-blue-600" />
                <StatDisplay icon={Heart} label="Saves" value={form.zillow_saves} color="text-rose-500" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Combined Totals */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-foreground">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-foreground">{totalSaves.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Saves</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-foreground">
                {totalViews > 0 ? `${((totalSaves / totalViews) * 100).toFixed(1)}%` : "0%"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Save Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-foreground">{openHouseDates.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Open Houses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open House Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Open House Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Enter dates separated by commas</Label>
              <Input
                placeholder="Apr 12, 2026, Apr 19, 2026"
                value={form.open_house_dates}
                onChange={e => setForm(p => ({ ...p, open_house_dates: e.target.value }))}
              />
            </div>
          ) : openHouseDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {openHouseDates.map((date, i) => (
                <div key={i} className="px-3 py-1.5 bg-primary/10 rounded-md text-sm font-medium text-primary">
                  {date}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No open houses scheduled.</p>
          )}
        </CardContent>
      </Card>

      {/* Price History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                JSON format: [{"{"}"date":"Apr 1","price":"$1,895,000","event":"Listed"{"}"}]
              </Label>
              <Input
                placeholder='[{"date":"Apr 1, 2026","price":"$1,895,000","event":"Listed"}]'
                value={form.price_history}
                onChange={e => setForm(p => ({ ...p, price_history: e.target.value }))}
              />
            </div>
          ) : priceHistory.length > 0 ? (
            <div className="space-y-2">
              {priceHistory.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {entry.event?.toLowerCase().includes("reduce") ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.event || "Price Change"}</p>
                    <p className="text-xs text-muted-foreground">{entry.date}</p>
                  </div>
                  <span className="font-semibold text-sm">{entry.price}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No price history recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatDisplay({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-semibold">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
