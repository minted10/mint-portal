import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EditListingDialogProps {
  listing: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditListingDialog({ listing, open, onOpenChange }: EditListingDialogProps) {
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    lotSizeSqft: "",
    yearBuilt: "",
    propertyType: "",
    listPrice: "",
    mlsNumber: "",
    description: "",
    status: "pre-listing" as string,
    listDate: "",
    salePrice: "",
    closeDate: "",
  });

  // Populate form when listing data changes
  useEffect(() => {
    if (listing && open) {
      setForm({
        clientName: listing.clientName || "",
        clientEmail: listing.clientEmail || "",
        clientPhone: listing.clientPhone || "",
        address: listing.address || "",
        city: listing.city || "",
        state: listing.state || "",
        zipCode: listing.zipCode || "",
        bedrooms: listing.bedrooms?.toString() || "",
        bathrooms: listing.bathrooms?.toString() || "",
        sqft: listing.sqft?.toString() || "",
        lotSizeSqft: listing.lotSizeSqft?.toString() || "",
        yearBuilt: listing.yearBuilt?.toString() || "",
        propertyType: listing.propertyType || "Single Family",
        listPrice: listing.listPrice || "",
        mlsNumber: listing.mlsNumber || "",
        description: listing.description || "",
        status: listing.status || "pre-listing",
        listDate: listing.listDate ? new Date(listing.listDate).toISOString().split("T")[0] : "",
        salePrice: listing.salePrice || "",
        closeDate: listing.closeDate ? new Date(listing.closeDate).toISOString().split("T")[0] : "",
      });
    }
  }, [listing, open]);

  const updateMutation = trpc.listing.update.useMutation({
    onSuccess: () => {
      utils.listing.getById.invalidate({ id: listing.id });
      utils.listing.list.invalidate();
      utils.listing.dashboardStats.invalidate({ id: listing.id });
      toast.success("Listing updated successfully");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update listing");
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim()) {
      toast.error("Address is required");
      return;
    }
    updateMutation.mutate({
      id: listing.id,
      clientName: form.clientName || undefined,
      clientEmail: form.clientEmail || undefined,
      clientPhone: form.clientPhone || undefined,
      address: form.address,
      city: form.city || undefined,
      state: form.state || undefined,
      zipCode: form.zipCode || undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      sqft: form.sqft ? Number(form.sqft) : undefined,
      lotSizeSqft: form.lotSizeSqft ? Number(form.lotSizeSqft) : undefined,
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      propertyType: form.propertyType || undefined,
      listPrice: form.listPrice || undefined,
      mlsNumber: form.mlsNumber || undefined,
      description: form.description || undefined,
      status: form.status as any,
      listDate: form.listDate || undefined,
      salePrice: form.salePrice || undefined,
      closeDate: form.closeDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Client Information */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Client Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Client Name</Label>
                <Input placeholder="John & Jane Doe" value={form.clientName} onChange={(e) => handleChange("clientName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Client Email</Label>
                <Input type="email" placeholder="client@email.com" value={form.clientEmail} onChange={(e) => handleChange("clientEmail", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <Label className="text-xs">Client Phone</Label>
              <Input placeholder="(949) 555-0100" value={form.clientPhone} onChange={(e) => handleChange("clientPhone", e.target.value)} />
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Property Details</h4>
            <div className="space-y-1.5 mb-3">
              <Label className="text-xs">Street Address <span className="text-destructive">*</span></Label>
              <Input placeholder="123 Main Street" value={form.address} onChange={(e) => handleChange("address", e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input placeholder="San Juan Capistrano" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input placeholder="CA" value={form.state} onChange={(e) => handleChange("state", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ZIP Code</Label>
                <Input placeholder="92675" value={form.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Bedrooms</Label>
                <Input type="number" placeholder="4" value={form.bedrooms} onChange={(e) => handleChange("bedrooms", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bathrooms</Label>
                <Input type="number" step="0.5" placeholder="3.5" value={form.bathrooms} onChange={(e) => handleChange("bathrooms", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Square Feet</Label>
                <Input type="number" placeholder="3200" value={form.sqft} onChange={(e) => handleChange("sqft", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lot Size (sqft)</Label>
                <Input type="number" placeholder="8712" value={form.lotSizeSqft} onChange={(e) => handleChange("lotSizeSqft", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Year Built</Label>
                <Input type="number" placeholder="2005" value={form.yearBuilt} onChange={(e) => handleChange("yearBuilt", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Property Type</Label>
                <Select value={form.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Family">Single Family</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">MLS Number</Label>
                <Input placeholder="OC26-12345" value={form.mlsNumber} onChange={(e) => handleChange("mlsNumber", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Listing Information */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Listing Information</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label className="text-xs">List Price ($)</Label>
                <Input placeholder="1,895,000" value={form.listPrice} onChange={(e) => handleChange("listPrice", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-listing">Pre-Listing</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under-contract">Under Contract</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">List Date</Label>
                <Input type="date" value={form.listDate} onChange={(e) => handleChange("listDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sale Price ($)</Label>
                <Input placeholder="1,950,000" value={form.salePrice} onChange={(e) => handleChange("salePrice", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Close Date</Label>
                <Input type="date" value={form.closeDate} onChange={(e) => handleChange("closeDate", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Property Description</Label>
              <Textarea placeholder="Describe the property features, upgrades, and highlights..." rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending} className="bg-primary hover:bg-[#5a9a75] text-white gap-2">
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
