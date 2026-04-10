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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, FileText, Columns3, List } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  countered: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-600",
  withdrawn: "bg-gray-100 text-gray-500",
};

function formatPrice(price: string | null | undefined): string {
  if (!price) return "—";
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

export default function OffersTab({ listingId, readOnly }: { listingId: number; readOnly: boolean }) {
  const { data: offers, isLoading } = trpc.offer.list.useQuery({ listingId });
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "compare">("list");

  const emptyForm = {
    agentName: "", company: "", buyerName: "", offerPrice: "", escrowPeriod: "",
    emdAmount: "", emdPercent: "", loanType: "", downPayment: "", loanPercent: "",
    loanAmount: "", preapprovalLetter: "No" as "Yes" | "No" | "Pending",
    proofOfFunds: "No" as "Yes" | "No" | "Pending",
    inspectionContingency: "", appraisalContingency: "", loanContingency: "",
    escrowCompany: "", titleCompany: "", homeWarrantyCompany: "", homeWarrantyAmount: "",
    homeToSell: "No" as "Yes" | "No", notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const createMutation = trpc.offer.create.useMutation({
    onSuccess: () => {
      utils.offer.list.invalidate({ listingId });
      utils.listing.dashboardStats.invalidate({ id: listingId });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Offer added");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.offer.update.useMutation({
    onSuccess: () => {
      utils.offer.list.invalidate({ listingId });
      toast.success("Offer updated");
    },
  });

  const deleteMutation = trpc.offer.delete.useMutation({
    onSuccess: () => {
      utils.offer.list.invalidate({ listingId });
      utils.listing.dashboardStats.invalidate({ id: listingId });
      toast.success("Offer removed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ listingId, ...form });
  };

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const hasMultipleOffers = offers && offers.length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* View mode toggle */}
        {hasMultipleOffers && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-3 text-xs gap-1.5 ${viewMode === "list" ? "bg-primary text-white hover:bg-mint-dark" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === "compare" ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-3 text-xs gap-1.5 ${viewMode === "compare" ? "bg-primary text-white hover:bg-mint-dark" : ""}`}
              onClick={() => setViewMode("compare")}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Compare
            </Button>
          </div>
        )}
        {!hasMultipleOffers && <div />}

        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-mint-dark text-white gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Offer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                {/* Buyer Info */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Buyer Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Buyer Agent</Label><Input placeholder="Agent name" value={form.agentName} onChange={e => set("agentName", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Company</Label><Input placeholder="Brokerage" value={form.company} onChange={e => set("company", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Buyer Name</Label><Input placeholder="Buyer name" value={form.buyerName} onChange={e => set("buyerName", e.target.value)} /></div>
                  </div>
                </div>
                {/* Financial */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Financial Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Offer Price ($)</Label><Input placeholder="1,900,000" value={form.offerPrice} onChange={e => set("offerPrice", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Escrow Period</Label><Input placeholder="30 days" value={form.escrowPeriod} onChange={e => set("escrowPeriod", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">EMD Amount ($)</Label><Input placeholder="57,000" value={form.emdAmount} onChange={e => set("emdAmount", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">EMD %</Label><Input placeholder="3" value={form.emdPercent} onChange={e => set("emdPercent", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Loan Type</Label><Input placeholder="Conventional" value={form.loanType} onChange={e => set("loanType", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Down Payment ($)</Label><Input placeholder="380,000" value={form.downPayment} onChange={e => set("downPayment", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Loan %</Label><Input placeholder="80" value={form.loanPercent} onChange={e => set("loanPercent", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Loan Amount ($)</Label><Input placeholder="1,520,000" value={form.loanAmount} onChange={e => set("loanAmount", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Pre-Approval Letter</Label>
                      <Select value={form.preapprovalLetter} onValueChange={v => set("preapprovalLetter", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Proof of Funds</Label>
                      <Select value={form.proofOfFunds} onValueChange={v => set("proofOfFunds", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Home to Sell</Label>
                      <Select value={form.homeToSell} onValueChange={v => set("homeToSell", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {/* Contingencies */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Contingencies</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Inspection</Label><Input placeholder="17 days" value={form.inspectionContingency} onChange={e => set("inspectionContingency", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Appraisal</Label><Input placeholder="17 days" value={form.appraisalContingency} onChange={e => set("appraisalContingency", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Loan</Label><Input placeholder="21 days" value={form.loanContingency} onChange={e => set("loanContingency", e.target.value)} /></div>
                  </div>
                </div>
                {/* Service Providers */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Service Providers</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Escrow Company</Label><Input placeholder="Mariners Escrow" value={form.escrowCompany} onChange={e => set("escrowCompany", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Title Company</Label><Input placeholder="First American Title" value={form.titleCompany} onChange={e => set("titleCompany", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Home Warranty Company</Label><Input placeholder="American Home Shield" value={form.homeWarrantyCompany} onChange={e => set("homeWarrantyCompany", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Warranty Amount ($)</Label><Input placeholder="625" value={form.homeWarrantyAmount} onChange={e => set("homeWarrantyAmount", e.target.value)} /></div>
                  </div>
                </div>
                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea placeholder="Additional notes about this offer..." value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-mint-dark text-white">
                    {createMutation.isPending ? "Saving..." : "Submit Offer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!offers || offers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p>No offers received yet.</p>
          </CardContent>
        </Card>
      ) : viewMode === "compare" && hasMultipleOffers ? (
        <OfferComparisonView offers={offers} readOnly={readOnly} updateMutation={updateMutation} deleteMutation={deleteMutation} />
      ) : (
        <Accordion type="multiple" defaultValue={offers.map(o => String(o.id))} className="space-y-2">
          {offers.map((offer) => (
            <AccordionItem key={offer.id} value={String(offer.id)} className="border rounded-lg bg-card overflow-hidden">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
                <div className="flex items-center gap-4 flex-1 mr-4">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{offer.buyerName || "Unknown Buyer"}</span>
                      <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[offer.offerStatus] || ""}`}>
                        {offer.offerStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {offer.agentName && `${offer.agentName} · `}{offer.company || ""}
                    </p>
                  </div>
                  <span className="text-lg font-semibold">{formatPrice(offer.offerPrice)}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  <InfoField label="Escrow Period" value={offer.escrowPeriod} />
                  <InfoField label="EMD" value={offer.emdAmount ? `${formatPrice(offer.emdAmount)} (${offer.emdPercent}%)` : "—"} />
                  <InfoField label="Loan Type" value={offer.loanType} />
                  <InfoField label="Down Payment" value={offer.downPayment ? `${formatPrice(offer.downPayment)} (${offer.loanPercent}%)` : "—"} />
                  <InfoField label="Loan Amount" value={formatPrice(offer.loanAmount)} />
                  <InfoField label="Pre-Approval" value={offer.preapprovalLetter} />
                  <InfoField label="Proof of Funds" value={offer.proofOfFunds} />
                  <InfoField label="Home to Sell" value={offer.homeToSell} />
                  <InfoField label="Inspection" value={offer.inspectionContingency} />
                  <InfoField label="Appraisal" value={offer.appraisalContingency} />
                  <InfoField label="Loan Contingency" value={offer.loanContingency} />
                  <InfoField label="Escrow Co." value={offer.escrowCompany} />
                  <InfoField label="Title Co." value={offer.titleCompany} />
                  <InfoField label="Home Warranty" value={offer.homeWarrantyCompany} />
                  <InfoField label="Warranty Amt" value={formatPrice(offer.homeWarrantyAmount)} />
                </div>
                {offer.notes && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{offer.notes}</p>
                  </div>
                )}
                {!readOnly && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Select
                      value={offer.offerStatus}
                      onValueChange={(v) => updateMutation.mutate({ id: offer.id, offerStatus: v as any })}
                    >
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="countered">Countered</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: offer.id })}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

/* ─── Offer Comparison View ─── */
function OfferComparisonView({ offers, readOnly, updateMutation, deleteMutation }: {
  offers: any[];
  readOnly: boolean;
  updateMutation: any;
  deleteMutation: any;
}) {
  // Find highest offer price for highlighting
  const prices = offers.map(o => parseFloat(o.offerPrice || "0")).filter(n => !isNaN(n));
  const highestPrice = Math.max(...prices);

  // Comparison rows definition
  const rows: { label: string; section: string; getValue: (o: any) => string; highlight?: "highest-price" | "yes-is-good" | "no-is-good" | "lowest-is-good" }[] = [
    { label: "Buyer", section: "Buyer Info", getValue: o => o.buyerName || "—" },
    { label: "Agent", section: "Buyer Info", getValue: o => o.agentName || "—" },
    { label: "Brokerage", section: "Buyer Info", getValue: o => o.company || "—" },
    { label: "Status", section: "Buyer Info", getValue: o => o.offerStatus || "—" },
    { label: "Offer Price", section: "Financial", getValue: o => formatPrice(o.offerPrice), highlight: "highest-price" },
    { label: "Escrow Period", section: "Financial", getValue: o => o.escrowPeriod || "—", highlight: "lowest-is-good" },
    { label: "EMD Amount", section: "Financial", getValue: o => o.emdAmount ? `${formatPrice(o.emdAmount)} (${o.emdPercent || "—"}%)` : "—" },
    { label: "Loan Type", section: "Financial", getValue: o => o.loanType || "—" },
    { label: "Down Payment", section: "Financial", getValue: o => o.downPayment ? `${formatPrice(o.downPayment)} (${o.loanPercent || "—"}%)` : "—" },
    { label: "Loan Amount", section: "Financial", getValue: o => formatPrice(o.loanAmount) },
    { label: "Pre-Approval", section: "Verification", getValue: o => o.preapprovalLetter || "—", highlight: "yes-is-good" },
    { label: "Proof of Funds", section: "Verification", getValue: o => o.proofOfFunds || "—", highlight: "yes-is-good" },
    { label: "Home to Sell", section: "Verification", getValue: o => o.homeToSell || "—", highlight: "no-is-good" },
    { label: "Inspection", section: "Contingencies", getValue: o => o.inspectionContingency || "—", highlight: "lowest-is-good" },
    { label: "Appraisal", section: "Contingencies", getValue: o => o.appraisalContingency || "—", highlight: "lowest-is-good" },
    { label: "Loan Contingency", section: "Contingencies", getValue: o => o.loanContingency || "—", highlight: "lowest-is-good" },
    { label: "Escrow Co.", section: "Service Providers", getValue: o => o.escrowCompany || "—" },
    { label: "Title Co.", section: "Service Providers", getValue: o => o.titleCompany || "—" },
    { label: "Home Warranty", section: "Service Providers", getValue: o => o.homeWarrantyCompany || "—" },
    { label: "Warranty Amt", section: "Service Providers", getValue: o => formatPrice(o.homeWarrantyAmount) },
    { label: "Notes", section: "Other", getValue: o => o.notes || "—" },
  ];

  // Group rows by section
  const sections = Array.from(new Set(rows.map(r => r.section)));

  function getCellHighlight(row: typeof rows[0], offer: any): string {
    if (!row.highlight) return "";
    const val = row.getValue(offer);
    if (val === "—") return "";

    switch (row.highlight) {
      case "highest-price": {
        const num = parseFloat(offer.offerPrice || "0");
        return num === highestPrice && highestPrice > 0 ? "bg-emerald-50 text-emerald-700 font-semibold" : "";
      }
      case "yes-is-good":
        return val === "Yes" ? "bg-emerald-50 text-emerald-700" : val === "No" ? "bg-red-50 text-red-600" : "";
      case "no-is-good":
        return val === "No" ? "bg-emerald-50 text-emerald-700" : val === "Yes" ? "bg-amber-50 text-amber-700" : "";
      case "lowest-is-good": {
        // Extract number from strings like "17 days" or "Waived"
        if (val.toLowerCase().includes("waiv") || val.toLowerCase() === "n/a") return "bg-emerald-50 text-emerald-700";
        const nums = offers.map(o => {
          const v = row.getValue(o);
          const n = parseInt(v);
          return isNaN(n) ? Infinity : n;
        });
        const myNum = parseInt(val);
        if (isNaN(myNum)) return "";
        const minNum = Math.min(...nums);
        return myNum === minNum ? "bg-emerald-50 text-emerald-700" : "";
      }
      default:
        return "";
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/30 min-w-[140px] z-10">
                Field
              </th>
              {offers.map((offer) => (
                <th key={offer.id} className="text-left p-3 min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{offer.buyerName || "Unknown"}</span>
                    <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[offer.offerStatus] || ""}`}>
                      {offer.offerStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">
                    {formatPrice(offer.offerPrice)}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const sectionRows = rows.filter(r => r.section === section);
              return (
                <React.Fragment key={section}>
                  <tr>
                    <td
                      colSpan={offers.length + 1}
                      className="px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {section}
                    </td>
                  </tr>
                  {sectionRows.map((row) => (
                    <tr key={row.label} className="border-b border-border/40 hover:bg-muted/10">
                      <td className="p-3 text-muted-foreground font-medium sticky left-0 bg-background z-10">
                        {row.label}
                      </td>
                      {offers.map((offer) => (
                        <td key={offer.id} className={`p-3 ${getCellHighlight(row, offer)}`}>
                          {row.label === "Status" ? (
                            !readOnly ? (
                              <Select
                                value={offer.offerStatus}
                                onValueChange={(v) => updateMutation.mutate({ id: offer.id, offerStatus: v as any })}
                              >
                                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="accepted">Accepted</SelectItem>
                                  <SelectItem value="countered">Countered</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[offer.offerStatus] || ""}`}>
                                {offer.offerStatus}
                              </Badge>
                            )
                          ) : row.label === "Notes" ? (
                            <p className="text-xs max-w-[200px] line-clamp-3">{row.getValue(offer)}</p>
                          ) : (
                            row.getValue(offer)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}
