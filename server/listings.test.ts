import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createAgentContext(userId = 1): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: userId,
    openId: "agent-user-" + userId,
    email: "agent@mintrealestate.com",
    name: "Test Agent",
    loginMethod: "manus",
    role: "admin",
    portalRole: "agent",
    invitedByAgentId: null,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createClientContext(userId = 2, agentId = 1): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: userId,
    openId: "client-user-" + userId,
    email: "client@example.com",
    name: "Test Client",
    loginMethod: "manus",
    role: "user",
    portalRole: "client",
    invitedByAgentId: agentId,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Auth", () => {
  it("returns null for unauthenticated user", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated agent", async () => {
    const { ctx } = createAgentContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test Agent");
    expect(result?.portalRole).toBe("agent");
  });
});

describe("Listing Router - Authorization", () => {
  it("prevents clients from creating listings", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.listing.create({
        address: "123 Test St",
      })
    ).rejects.toThrow("Clients cannot create listings");
  });
});

describe("Checklist Router - Authorization", () => {
  it("prevents clients from updating checklist items", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checklist.updateItem({
        id: 1,
        status: "completed",
      })
    ).rejects.toThrow("Clients cannot modify checklists");
  });
});

describe("Showing Router - Authorization", () => {
  it("prevents clients from creating showings", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.showing.create({
        listingId: 1,
        showingDate: "2026-04-01T10:00:00",
      })
    ).rejects.toThrow();
  });

  it("prevents clients from deleting showings", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.showing.delete({ id: 1 })
    ).rejects.toThrow();
  });
});

describe("Offer Router - Authorization", () => {
  it("prevents clients from creating offers", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.offer.create({
        listingId: 1,
      })
    ).rejects.toThrow();
  });

  it("prevents clients from updating offer status", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.offer.update({
        id: 1,
        offerStatus: "accepted",
      })
    ).rejects.toThrow();
  });

  it("prevents clients from deleting offers", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.offer.delete({ id: 1 })
    ).rejects.toThrow();
  });
});

describe("Marketing Router - Authorization", () => {
  it("prevents clients from updating marketing links", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.marketing.update({
        id: 1,
        url: "https://example.com",
      })
    ).rejects.toThrow();
  });
});

describe("Insights Router - Authorization", () => {
  it("prevents clients from updating insights", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.insights.update({
        listingId: 1,
        redfin_views: 100,
      })
    ).rejects.toThrow();
  });
});

describe("Client Invitation Router - Authorization", () => {
  it("prevents clients from sending invitations", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientInvite.invite({
        clientName: "New Client",
        clientEmail: "new@example.com",
      })
    ).rejects.toThrow();
  });

  it("prevents clients from listing invitations", async () => {
    const { ctx } = createClientContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientInvite.listInvitations()
    ).rejects.toThrow();
  });
});

describe("Input Validation", () => {
  it("rejects listing creation with empty address", async () => {
    const { ctx } = createAgentContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.listing.create({
        address: "",
      })
    ).rejects.toThrow();
  });

  it("rejects client invitation with invalid email", async () => {
    const { ctx } = createAgentContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientInvite.invite({
        clientName: "Test",
        clientEmail: "not-an-email",
      })
    ).rejects.toThrow();
  });

  it("rejects client invitation with empty name", async () => {
    const { ctx } = createAgentContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientInvite.invite({
        clientName: "",
        clientEmail: "test@example.com",
      })
    ).rejects.toThrow();
  });
});
