import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  FolderOpen,
  Image,
  Video,
  Box,
  Globe,
  ExternalLink,
  Save,
  Link2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, any> = {
  "Marketing Calendar": Calendar,
  "Google Drive Folder": FolderOpen,
  "Photos Folder": Image,
  "Video": Video,
  "Matterport": Box,
  "Property Website": Globe,
};

export default function MarketingTab({ listingId, readOnly }: { listingId: number; readOnly: boolean }) {
  const { data: links, isLoading } = trpc.marketing.list.useQuery({ listingId });
  const utils = trpc.useUtils();
  const updateMutation = trpc.marketing.update.useMutation({
    onSuccess: () => {
      utils.marketing.list.invalidate({ listingId });
      toast.success("Link saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const [editValues, setEditValues] = useState<Record<number, string>>({});

  useEffect(() => {
    if (links) {
      const vals: Record<number, string> = {};
      links.forEach((l) => { vals[l.id] = l.url || ""; });
      setEditValues(vals);
    }
  }, [links]);

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  if (!links || links.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Link2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p>No marketing links configured.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {links.map((link) => {
        const Icon = CATEGORY_ICONS[link.category] || Link2;
        const currentValue = editValues[link.id] ?? (link.url || "");
        const hasChanged = currentValue !== (link.url || "");

        return (
          <Card key={link.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-foreground">{link.category}</span>
              </div>
              {readOnly ? (
                link.url ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {link.url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not added yet</p>
                )
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={currentValue}
                    onChange={(e) => setEditValues(p => ({ ...p, [link.id]: e.target.value }))}
                    className="text-sm"
                  />
                  {hasChanged && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="shrink-0 h-9 w-9"
                      onClick={() => updateMutation.mutate({ id: link.id, url: currentValue || null })}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
