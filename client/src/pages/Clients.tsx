import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Mail, Phone, Clock, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Clients() {
  const { data: invitations, isLoading } = trpc.clientInvite.listInvitations.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
  });

  const inviteMutation = trpc.clientInvite.invite.useMutation({
    onSuccess: (data) => {
      utils.clientInvite.listInvitations.invalidate();
      setOpen(false);
      setForm({ clientName: "", clientEmail: "", clientPhone: "" });
      const inviteUrl = `${window.location.origin}?invite=${data.inviteToken}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Client invitation created! Link copied to clipboard.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create invitation");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.clientEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    inviteMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client access to the portal
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-mint-dark text-white gap-2">
              <UserPlus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="invClientName">
                  Client Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invClientName"
                  placeholder="John & Jane Doe"
                  value={form.clientName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, clientName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invClientEmail">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invClientEmail"
                  type="email"
                  placeholder="client@email.com"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, clientEmail: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invClientPhone">Phone</Label>
                <Input
                  id="invClientPhone"
                  placeholder="(949) 555-0100"
                  value={form.clientPhone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, clientPhone: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="bg-primary hover:bg-mint-dark text-white"
                >
                  {inviteMutation.isPending
                    ? "Sending..."
                    : "Send Invitation"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invitations list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-20" />
            </Card>
          ))}
        </div>
      ) : !invitations || invitations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No clients yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Invite your first client to give them access to view their listing
              progress and insights.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {inv.clientName}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          inv.status === "accepted"
                            ? "bg-emerald-100 text-emerald-700"
                            : inv.status === "expired"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-amber-100 text-amber-700"
                        }
                      >
                        {inv.status === "accepted" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {inv.clientEmail}
                      </span>
                      {inv.clientPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {inv.clientPhone}
                        </span>
                      )}
                    </div>
                  </div>
                  {inv.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}?invite=${inv.inviteToken}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Invite link copied!");
                      }}
                      className="gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
