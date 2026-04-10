import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NewListing() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const createMutation = trpc.listing.create.useMutation({
    onSuccess: (data) => {
      utils.listing.list.invalidate();
      toast.success("Listing created successfully");
      setLocation(`/listings/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create listing");
    },
  });

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    address: "",
    city: "",
    state: "CA",
    zipCode: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    lotSizeSqft: "",
    yearBuilt: "",
    propertyType: "Single Family",
    listPrice: "",
    mlsNumber: "",
    description: "",
    status: "pre-listing" as "pre-listing" | "coming-soon" | "active" | "under-contract" | "sold" | "withdrawn" | "expired",
    listDate: "",
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
    createMutation.mutate({
      ...form,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      sqft: form.sqft ? Number(form.sqft) : undefined,
      lotSizeSqft: form.lotSizeSqft ? Number(form.lotSizeSqft) : undefined,
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      listPrice: form.listPrice || undefined,
      clientEmail: form.clientEmail || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New Listing
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a new property to your portfolio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="John & Jane Doe"
                  value={form.clientName}
                  onChange={(e) => handleChange("clientName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="client@email.com"
                  value={form.clientEmail}
                  onChange={(e) => handleChange("clientEmail", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                placeholder="(949) 555-0100"
                value={form.clientPhone}
                onChange={(e) => handleChange("clientPhone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">
                Street Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="San Juan Capistrano"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="92675"
                  value={form.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="4"
                  value={form.bedrooms}
                  onChange={(e) => handleChange("bedrooms", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  placeholder="3.5"
                  value={form.bathrooms}
                  onChange={(e) => handleChange("bathrooms", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqft">Square Feet</Label>
                <Input
                  id="sqft"
                  type="number"
                  placeholder="3200"
                  value={form.sqft}
                  onChange={(e) => handleChange("sqft", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lotSizeSqft">Lot Size (sqft)</Label>
                <Input
                  id="lotSizeSqft"
                  type="number"
                  placeholder="8712"
                  value={form.lotSizeSqft}
                  onChange={(e) => handleChange("lotSizeSqft", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="2005"
                  value={form.yearBuilt}
                  onChange={(e) => handleChange("yearBuilt", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={form.propertyType}
                  onValueChange={(v) => handleChange("propertyType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="mlsNumber">MLS Number</Label>
                <Input
                  id="mlsNumber"
                  placeholder="OC26-12345"
                  value={form.mlsNumber}
                  onChange={(e) => handleChange("mlsNumber", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listing Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">
              Listing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listPrice">List Price ($)</Label>
                <Input
                  id="listPrice"
                  placeholder="1,895,000"
                  value={form.listPrice}
                  onChange={(e) => handleChange("listPrice", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-listing">Pre-Listing</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under-contract">
                      Under Contract
                    </SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="listDate">List Date</Label>
                <Input
                  id="listDate"
                  type="date"
                  value={form.listDate}
                  onChange={(e) => handleChange("listDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Property Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the property features, upgrades, and highlights..."
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary hover:bg-[#5a9a75] text-white gap-2"
          >
            <Save className="h-4 w-4" />
            {createMutation.isPending ? "Creating..." : "Create Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
