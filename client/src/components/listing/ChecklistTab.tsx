import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAGE_LABELS: Record<string, string> = {
  "pre-listing-appointment": "Pre-Listing Appointment",
  "post-listing-appointment": "Post-Listing Appointment",
  "signed-listing-agreement": "Signed Listing Agreement",
  "marketing-prep": "Marketing Prep",
  "active-on-market": "Active on Market",
  "review-and-responses": "Review and Responses",
  "in-escrow": "In Escrow",
  "post-close": "Post Close",
};

const STAGE_ORDER = [
  "pre-listing-appointment",
  "post-listing-appointment",
  "signed-listing-agreement",
  "marketing-prep",
  "active-on-market",
  "review-and-responses",
  "in-escrow",
  "post-close",
];

export default function ChecklistTab({ listingId, readOnly }: { listingId: number; readOnly: boolean }) {
  const { data: items, isLoading } = trpc.checklist.getByListing.useQuery({ listingId });
  const utils = trpc.useUtils();
  const updateMutation = trpc.checklist.updateItem.useMutation({
    onSuccess: () => {
      utils.checklist.getByListing.invalidate({ listingId });
      utils.checklist.progress.invalidate({ listingId });
      utils.listing.dashboardStats.invalidate({ id: listingId });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No checklist items found.
        </CardContent>
      </Card>
    );
  }

  // Group by stage
  const grouped = STAGE_ORDER.map((stage) => {
    const stageItems = items.filter((i) => i.stage === stage);
    const completed = stageItems.filter((i) => i.status === "completed").length;
    const total = stageItems.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { stage, label: STAGE_LABELS[stage] || stage, items: stageItems, completed, total, pct };
  }).filter((g) => g.items.length > 0);

  const handleToggle = (itemId: number, currentStatus: string) => {
    if (readOnly) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    updateMutation.mutate({
      id: itemId,
      status: newStatus as any,
      dateCompleted: newStatus === "completed" ? new Date().toISOString() : null,
    });
  };

  return (
    <Accordion type="multiple" defaultValue={grouped.filter(g => g.pct < 100).map(g => g.stage)} className="space-y-2">
      {grouped.map((group) => (
        <AccordionItem key={group.stage} value={group.stage} className="border rounded-lg bg-card px-0 overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4 flex-1 mr-4">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{group.label}</span>
                  <Badge variant="secondary" className={`text-xs ${group.pct === 100 ? "bg-emerald-100 text-emerald-700" : "bg-muted"}`}>
                    {group.completed}/{group.total}
                  </Badge>
                </div>
                <Progress value={group.pct} className="h-1 mt-2 max-w-xs" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{group.pct}%</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-4 pt-0">
            <div className="space-y-1">
              {group.items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  readOnly={readOnly}
                  onToggle={() => handleToggle(item.id, item.status)}
                  onNoteUpdate={(note: string) => {
                    updateMutation.mutate({ id: item.id, note });
                  }}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function ChecklistItem({
  item,
  readOnly,
  onToggle,
  onNoteUpdate,
}: {
  item: any;
  readOnly: boolean;
  onToggle: () => void;
  onNoteUpdate: (note: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(item.note || "");

  const isCompleted = item.status === "completed";
  const isInProgress = item.status === "in-progress";

  return (
    <div className={`flex items-center gap-3 py-2 px-2 rounded-md group hover:bg-muted/30 transition-colors ${isCompleted ? "opacity-70" : ""}`}>
      {!readOnly ? (
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          className="shrink-0"
        />
      ) : (
        <div className="shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : isInProgress ? (
            <Clock className="h-4 w-4 text-amber-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/40" />
          )}
        </div>
      )}
      <span className={`flex-1 text-sm ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {item.title}
      </span>
      {item.dateCompleted && (
        <span className="text-[11px] text-muted-foreground hidden sm:block">
          {new Date(item.dateCompleted).toLocaleDateString()}
        </span>
      )}
      {!readOnly && (
        <Popover open={noteOpen} onOpenChange={setNoteOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 shrink-0 ${item.note ? "text-primary" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"}`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Note</p>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="text-sm"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    onNoteUpdate(noteText);
                    setNoteOpen(false);
                    toast.success("Note saved");
                  }}
                  className="bg-primary hover:bg-[#5a9a75] text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
      {readOnly && item.note && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-primary">
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <p className="text-sm text-muted-foreground">{item.note}</p>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
