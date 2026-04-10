import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Calendar, Building2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const INTEREST_COLORS: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-700",
  Low: "bg-amber-100 text-amber-700",
  "No Interest": "bg-gray-100 text-gray-500",
  "Not Responsive": "bg-red-100 text-red-600",
};

export default function ShowingsTab({ listingId, readOnly }: { listingId: number; readOnly: boolean }) {
  const { data: showings, isLoading } = trpc.showing.list.useQuery({ listingId });
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    showingDate: "",
    agentName: "",
    brokerage: "",
    interestLevel: "" as string,
    feedback: "",
  });

  const createMutation = trpc.showing.create.useMutation({
    onSuccess: () => {
      utils.showing.list.invalidate({ listingId });
      utils.listing.dashboardStats.invalidate({ id: listingId });
      setOpen(false);
      setForm({ showingDate: "", agentName: "", brokerage: "", interestLevel: "", feedback: "" });
      toast.success("Showing added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.showing.delete.useMutation({
    onSuccess: () => {
      utils.showing.list.invalidate({ listingId });
      utils.listing.dashboardStats.invalidate({ id: listingId });
      toast.success("Showing removed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.showingDate) { toast.error("Date is required"); return; }
    createMutation.mutate({
      listingId,
      showingDate: new Date(form.showingDate).toISOString(),
      agentName: form.agentName || undefined,
      brokerage: form.brokerage || undefined,
      interestLevel: (form.interestLevel || undefined) as any,
      feedback: form.feedback || undefined,
    });
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-mint-dark text-white gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Log Showing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log a Showing</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Date & Time <span className="text-destructive">*</span></Label>
                  <Input type="datetime-local" value={form.showingDate} onChange={(e) => setForm(p => ({ ...p, showingDate: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Buyer Agent</Label>
                    <Input placeholder="Agent name" value={form.agentName} onChange={(e) => setForm(p => ({ ...p, agentName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Brokerage</Label>
                    <Input placeholder="Company" value={form.brokerage} onChange={(e) => setForm(p => ({ ...p, brokerage: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Interest Level</Label>
                  <Select value={form.interestLevel} onValueChange={(v) => setForm(p => ({ ...p, interestLevel: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="No Interest">No Interest</SelectItem>
                      <SelectItem value="Not Responsive">Not Responsive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Feedback</Label>
                  <Textarea placeholder="Buyer feedback or notes..." value={form.feedback} onChange={(e) => setForm(p => ({ ...p, feedback: e.target.value }))} rows={3} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-mint-dark text-white">
                    {createMutation.isPending ? "Saving..." : "Save Showing"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {!showings || showings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p>No showings logged yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Brokerage</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Feedback</TableHead>
                  {!readOnly && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {showings.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(s.showingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.showingDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{s.agentName || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.brokerage || "—"}</TableCell>
                    <TableCell>
                      {s.interestLevel ? (
                        <Badge variant="secondary" className={`text-xs ${INTEREST_COLORS[s.interestLevel] || ""}`}>
                          {s.interestLevel}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {s.feedback || "—"}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ id: s.id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Users(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
