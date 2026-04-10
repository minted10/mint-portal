import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "./db";
import { getFubDashboardData } from "./fub";

// ─── LISTING ROUTER ─────────────────────────────────────────────────────────

const listingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const isClient = ctx.user.portalRole === "client";
    if (isClient) {
      return db.getListingsByClient(ctx.user.id);
    }
    return db.getListingsByAgent(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      // Verify access
      const isAgent = listing.agentId === ctx.user.id;
      const isClient = listing.clientId === ctx.user.id;
      if (!isAgent && !isClient && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access to this listing" });
      }
      return listing;
    }),

  create: protectedProcedure
    .input(z.object({
      clientName: z.string().optional(),
      clientEmail: z.string().email().optional().or(z.literal("")),
      clientPhone: z.string().optional(),
      address: z.string().min(1),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      sqft: z.number().optional(),
      lotSizeSqft: z.number().optional(),
      yearBuilt: z.number().optional(),
      propertyType: z.string().optional(),
      listPrice: z.string().optional(),
      mlsNumber: z.string().optional(),
      description: z.string().optional(),
      photoUrl: z.string().optional(),
      status: z.enum(["pre-listing", "coming-soon", "active", "under-contract", "sold", "withdrawn", "expired"]).optional(),
      listDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Clients cannot create listings" });
      }
      const listingId = await db.createListing({
        agentId: ctx.user.id,
        clientName: input.clientName || null,
        clientEmail: input.clientEmail || null,
        clientPhone: input.clientPhone || null,
        address: input.address,
        city: input.city || null,
        state: input.state || null,
        zipCode: input.zipCode || null,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ? String(input.bathrooms) : null,
        sqft: input.sqft ?? null,
        lotSizeSqft: input.lotSizeSqft ?? null,
        yearBuilt: input.yearBuilt ?? null,
        propertyType: input.propertyType || null,
        listPrice: input.listPrice || null,
        mlsNumber: input.mlsNumber || null,
        description: input.description || null,
        photoUrl: input.photoUrl || null,
        status: (input.status as any) || "pre-listing",
        listDate: input.listDate ? new Date(input.listDate) : null,
      });

      // Initialize checklist, marketing links, and insights
      await db.initializeChecklistForListing(listingId);
      await db.initializeMarketingLinksForListing(listingId);
      await db.initializePropertyInsights(listingId);

      return { id: listingId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      clientName: z.string().optional(),
      clientEmail: z.string().optional(),
      clientPhone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      sqft: z.number().optional(),
      lotSizeSqft: z.number().optional(),
      yearBuilt: z.number().optional(),
      propertyType: z.string().optional(),
      listPrice: z.string().optional(),
      mlsNumber: z.string().optional(),
      description: z.string().optional(),
      photoUrl: z.string().optional(),
      status: z.enum(["pre-listing", "coming-soon", "active", "under-contract", "sold", "withdrawn", "expired"]).optional(),
      listDate: z.string().optional(),
      salePrice: z.string().optional(),
      closeDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.agentId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...updateData } = input;
      const cleanData: any = {};
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          if (key === "bathrooms") cleanData[key] = String(value);
          else if (key === "listDate" || key === "closeDate") cleanData[key] = value ? new Date(value) : null;
          else cleanData[key] = value;
        }
      }
      await db.updateListing(id, cleanData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.agentId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.deleteListing(input.id);
      return { success: true };
    }),

  dashboardStats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const isAgent = listing.agentId === ctx.user.id;
      const isClient = listing.clientId === ctx.user.id;
      if (!isAgent && !isClient && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getListingDashboardStats(input.id);
    }),
});

// ─── CHECKLIST ROUTER ───────────────────────────────────────────────────────

const checklistRouter = router({
  getByListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const isAgent = listing.agentId === ctx.user.id;
      const isClient = listing.clientId === ctx.user.id;
      if (!isAgent && !isClient && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getChecklistByListing(input.listingId);
    }),

  updateItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in-progress", "completed"]).optional(),
      dateCompleted: z.string().nullable().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Clients cannot modify checklists" });
      }
      const { id, ...data } = input;
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.dateCompleted !== undefined) updateData.dateCompleted = data.dateCompleted ? new Date(data.dateCompleted) : null;
      if (data.note !== undefined) updateData.note = data.note;
      await db.updateChecklistItem(id, updateData);
      return { success: true };
    }),

  progress: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      return db.getChecklistProgress(input.listingId);
    }),
});

// ─── SHOWING ROUTER ─────────────────────────────────────────────────────────

const showingRouter = router({
  list: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const isAgent = listing.agentId === ctx.user.id;
      const isClient = listing.clientId === ctx.user.id;
      if (!isAgent && !isClient && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getShowingsByListing(input.listingId);
    }),

  create: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      showingDate: z.string(),
      agentName: z.string().optional(),
      brokerage: z.string().optional(),
      interestLevel: z.enum(["Not Responsive", "No Interest", "Low", "High"]).optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const id = await db.createShowing({
        listingId: input.listingId,
        showingDate: new Date(input.showingDate),
        agentName: input.agentName || null,
        brokerage: input.brokerage || null,
        interestLevel: (input.interestLevel as any) || null,
        feedback: input.feedback || null,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      showingDate: z.string().optional(),
      agentName: z.string().optional(),
      brokerage: z.string().optional(),
      interestLevel: z.enum(["Not Responsive", "No Interest", "Low", "High"]).optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      const updateData: any = {};
      if (data.showingDate) updateData.showingDate = new Date(data.showingDate);
      if (data.agentName !== undefined) updateData.agentName = data.agentName;
      if (data.brokerage !== undefined) updateData.brokerage = data.brokerage;
      if (data.interestLevel !== undefined) updateData.interestLevel = data.interestLevel;
      if (data.feedback !== undefined) updateData.feedback = data.feedback;
      await db.updateShowing(id, updateData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.deleteShowing(input.id);
      return { success: true };
    }),
});

// ─── OFFER ROUTER ───────────────────────────────────────────────────────────

const offerRouter = router({
  list: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const isAgent = listing.agentId === ctx.user.id;
      const isClient = listing.clientId === ctx.user.id;
      if (!isAgent && !isClient && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getOffersByListing(input.listingId);
    }),

  create: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      agentName: z.string().optional(),
      company: z.string().optional(),
      buyerName: z.string().optional(),
      offerPrice: z.string().optional(),
      escrowPeriod: z.string().optional(),
      emdAmount: z.string().optional(),
      emdPercent: z.string().optional(),
      loanType: z.string().optional(),
      downPayment: z.string().optional(),
      loanPercent: z.string().optional(),
      loanAmount: z.string().optional(),
      preapprovalLetter: z.enum(["Yes", "No", "Pending"]).optional(),
      proofOfFunds: z.enum(["Yes", "No", "Pending"]).optional(),
      inspectionContingency: z.string().optional(),
      appraisalContingency: z.string().optional(),
      loanContingency: z.string().optional(),
      escrowCompany: z.string().optional(),
      titleCompany: z.string().optional(),
      homeWarrantyCompany: z.string().optional(),
      homeWarrantyAmount: z.string().optional(),
      homeToSell: z.enum(["Yes", "No"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const id = await db.createOffer({
        listingId: input.listingId,
        agentName: input.agentName || null,
        company: input.company || null,
        buyerName: input.buyerName || null,
        offerPrice: input.offerPrice || null,
        escrowPeriod: input.escrowPeriod || null,
        emdAmount: input.emdAmount || null,
        emdPercent: input.emdPercent || null,
        loanType: input.loanType || null,
        downPayment: input.downPayment || null,
        loanPercent: input.loanPercent || null,
        loanAmount: input.loanAmount || null,
        preapprovalLetter: (input.preapprovalLetter as any) || "No",
        proofOfFunds: (input.proofOfFunds as any) || "No",
        inspectionContingency: input.inspectionContingency || null,
        appraisalContingency: input.appraisalContingency || null,
        loanContingency: input.loanContingency || null,
        escrowCompany: input.escrowCompany || null,
        titleCompany: input.titleCompany || null,
        homeWarrantyCompany: input.homeWarrantyCompany || null,
        homeWarrantyAmount: input.homeWarrantyAmount || null,
        homeToSell: (input.homeToSell as any) || "No",
        notes: input.notes || null,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      offerStatus: z.enum(["pending", "accepted", "countered", "rejected", "withdrawn"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify the offer exists and agent owns the listing
      const offer = await db.getOfferById(input.id);
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      const listing = await db.getListingById(offer.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.agentId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the listing agent can update offers" });
      }

      const { id, ...data } = input;
      await db.updateOffer(id, data as any);

      // ─── ACCEPTANCE WORKFLOW ───
      if (input.offerStatus === "accepted") {
        // 1. Update listing status to "under-contract"
        await db.updateListing(offer.listingId, { status: "under-contract" as any });

        // 2. Reject all other pending offers
        await db.rejectOtherOffers(offer.listingId, input.id);
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.deleteOffer(input.id);
      return { success: true };
    }),
});

// ─── MARKETING LINKS ROUTER ────────────────────────────────────────────────

const marketingRouter = router({
  list: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const isAgent = listing.agentId === ctx.user.id;
      const isClient = listing.clientId === ctx.user.id;
      if (!isAgent && !isClient && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getMarketingLinksByListing(input.listingId);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      url: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.updateMarketingLink(input.id, input.url);
      return { success: true };
    }),
});

// ─── INSIGHTS ROUTER ────────────────────────────────────────────────────────

const insightsRouter = router({
  get: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const isAgent = listing.agentId === ctx.user.id;
      const isClient = listing.clientId === ctx.user.id;
      if (!isAgent && !isClient && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getPropertyInsights(input.listingId);
    }),

  update: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      redfin_views: z.number().optional(),
      zillow_views: z.number().optional(),
      redfin_saves: z.number().optional(),
      zillow_saves: z.number().optional(),
      totalShowings: z.number().optional(),
      totalOffers: z.number().optional(),
      openHouseDates: z.array(z.string()).optional(),
      priceHistory: z.array(z.object({ date: z.string(), price: z.number(), event: z.string() })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { listingId, openHouseDates, priceHistory, ...rest } = input;
      const data: any = { ...rest };
      if (openHouseDates) data.openHouseDates = JSON.stringify(openHouseDates);
      if (priceHistory) data.priceHistory = JSON.stringify(priceHistory);
      await db.updatePropertyInsights(listingId, data);
      return { success: true };
    }),
});

// ─── CLIENT INVITATION ROUTER ───────────────────────────────────────────────

const clientRouter = router({
  invite: protectedProcedure
    .input(z.object({
      listingId: z.number().optional(),
      clientName: z.string().min(1),
      clientEmail: z.string().email(),
      clientPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.portalRole === "client") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const token = nanoid(32);
      const id = await db.createClientInvitation({
        agentId: ctx.user.id,
        listingId: input.listingId ?? null,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone || null,
        inviteToken: token,
      });
      return { id, inviteToken: token };
    }),

  listInvitations: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.portalRole === "client") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getInvitationsByAgent(ctx.user.id);
  }),
});

// ─── SEED ROUTER (for test data) ───────────────────────────────────────────

const seedRouter = router({
  createTestListing: protectedProcedure.mutation(async ({ ctx }) => {
    // Delete existing test listings so we can re-seed with updated data
    const existing = await db.getListingsByAgent(ctx.user.id);
    for (const l of existing) {
      if (l.address === "26582 Paseo Callado" || l.address === "39851 Paseo Chaparro") {
        await db.deleteListing(l.id);
      }
    }

    // ─── LISTING 1: 26582 Paseo Callado (Real Redfin/Zillow data) ───
    const listingId = await db.createListing({
      agentId: ctx.user.id,
      clientName: "John & Sarah Mitchell",
      clientEmail: "mitchells@example.com",
      clientPhone: "(949) 555-0142",
      address: "26582 Paseo Callado",
      city: "San Juan Capistrano",
      state: "CA",
      zipCode: "92675",
      bedrooms: 5,
      bathrooms: "5.5",
      sqft: 3219,
      lotSizeSqft: 7575,
      yearBuilt: 2007,
      propertyType: "Single Family",
      listPrice: "2875000.00",
      mlsNumber: "OC26064932",
      status: "active" as any,
      listDate: new Date("2026-03-31"),
      description: "Coastal Nancy Meyers-inspired residence behind private gates in the coveted Paseo Collection of San Juan Capistrano. This stunning 5-bedroom, 5.5-bathroom home features a PebbleTec pool, detached casita, gourmet kitchen with Sub-Zero refrigerator and Taj Mahal quartzite countertops. Soaring ceilings, wide-plank hardwood floors, and designer finishes throughout. The private backyard is an entertainer's dream with built-in BBQ, fire pit, and lush landscaping.",
      photoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663506091484/YnEeEYz8JCEZbD4t8BzqPW/real-26582-paseo-callado_cd26028d.jpg",
    });

    await db.initializeChecklistForListing(listingId);
    await db.initializeMarketingLinksForListing(listingId);
    await db.initializePropertyInsights(listingId);

    // Mark some checklist items as completed
    const checklist = await db.getChecklistByListing(listingId);
    const preListingItems = checklist.filter(i => i.stage === "pre-listing-appointment");
    for (const item of preListingItems) {
      await db.updateChecklistItem(item.id, { status: "completed", dateCompleted: new Date("2026-03-01") });
    }
    const postListingItems = checklist.filter(i => i.stage === "post-listing-appointment");
    for (const item of postListingItems) {
      await db.updateChecklistItem(item.id, { status: "completed", dateCompleted: new Date("2026-03-05") });
    }
    const signedItems = checklist.filter(i => i.stage === "signed-listing-agreement");
    for (let i = 0; i < signedItems.length; i++) {
      if (i < 15) {
        await db.updateChecklistItem(signedItems[i].id, { status: "completed", dateCompleted: new Date("2026-03-10") });
      }
    }
    const marketingItems = checklist.filter(i => i.stage === "marketing-prep");
    for (let i = 0; i < marketingItems.length; i++) {
      if (i < 20) {
        await db.updateChecklistItem(marketingItems[i].id, { status: "completed", dateCompleted: new Date("2026-03-14") });
      } else if (i < 25) {
        await db.updateChecklistItem(marketingItems[i].id, { status: "in-progress" });
      }
    }
    const activeItems = checklist.filter(i => i.stage === "active-on-market");
    for (let i = 0; i < 4; i++) {
      if (activeItems[i]) {
        await db.updateChecklistItem(activeItems[i].id, { status: "completed", dateCompleted: new Date("2026-03-20") });
      }
    }

    // Add sample showings
    const sampleShowings = [
      { listingId, showingDate: new Date("2026-03-16T10:00:00"), agentName: "Lisa Chen", brokerage: "Compass", interestLevel: "High" as const, feedback: "Buyers loved the kitchen and backyard. Very interested, may submit offer this weekend." },
      { listingId, showingDate: new Date("2026-03-17T14:00:00"), agentName: "Mark Rodriguez", brokerage: "Keller Williams", interestLevel: "Low" as const, feedback: "Nice home but buyers prefer single story. Will keep looking." },
      { listingId, showingDate: new Date("2026-03-18T11:00:00"), agentName: "Jennifer Park", brokerage: "Coldwell Banker", interestLevel: "High" as const, feedback: "Second showing requested. Buyers are pre-approved and very motivated." },
      { listingId, showingDate: new Date("2026-03-20T15:30:00"), agentName: "David Thompson", brokerage: "RE/MAX", interestLevel: "Not Responsive" as const, feedback: null },
      { listingId, showingDate: new Date("2026-03-22T09:00:00"), agentName: "Sarah Williams", brokerage: "eXp Realty", interestLevel: "High" as const, feedback: "Buyers are relocating from NorCal. Love the neighborhood and schools. Preparing offer." },
      { listingId, showingDate: new Date("2026-03-23T13:00:00"), agentName: "Robert Kim", brokerage: "Berkshire Hathaway", interestLevel: "No Interest" as const, feedback: "Buyers decided the lot size is too small for their needs." },
      { listingId, showingDate: new Date("2026-03-25T10:30:00"), agentName: "Amanda Foster", brokerage: "Surterre Properties", interestLevel: "High" as const, feedback: "Cash buyer, very interested. Wants to move quickly." },
    ];
    for (const s of sampleShowings) {
      await db.createShowing(s as any);
    }

    // Add sample offers
    await db.createOffer({
      listingId,
      agentName: "Lisa Chen",
      company: "Compass",
      buyerName: "Michael & Emily Wang",
      offerPrice: "1875000.00",
      escrowPeriod: "30 days",
      emdAmount: "56250.00",
      emdPercent: "3.00",
      loanType: "Conventional",
      downPayment: "375000.00",
      loanPercent: "80.00",
      loanAmount: "1500000.00",
      preapprovalLetter: "Yes" as any,
      proofOfFunds: "Yes" as any,
      inspectionContingency: "17 days",
      appraisalContingency: "17 days",
      loanContingency: "21 days",
      escrowCompany: "Mariners Escrow",
      titleCompany: "First American Title",
      homeWarrantyCompany: "American Home Shield",
      homeWarrantyAmount: "625.00",
      homeToSell: "No" as any,
      notes: "Strong buyers, pre-approved with Chase. Flexible on close date.",
      offerStatus: "pending" as any,
    });

    await db.createOffer({
      listingId,
      agentName: "Amanda Foster",
      company: "Surterre Properties",
      buyerName: "Richard Blackwell",
      offerPrice: "1920000.00",
      escrowPeriod: "21 days",
      emdAmount: "192000.00",
      emdPercent: "10.00",
      loanType: "Cash",
      downPayment: "1920000.00",
      loanPercent: "0.00",
      loanAmount: "0.00",
      preapprovalLetter: "No" as any,
      proofOfFunds: "Yes" as any,
      inspectionContingency: "10 days",
      appraisalContingency: "Waived",
      loanContingency: "N/A",
      escrowCompany: "Surfline Escrow",
      titleCompany: "Chicago Title",
      homeWarrantyCompany: "None",
      homeWarrantyAmount: "0.00",
      homeToSell: "No" as any,
      notes: "All-cash offer. Buyer is an investor. Quick close preferred. No appraisal contingency.",
      offerStatus: "pending" as any,
    });

    // Add 2 more offers (total 4)
    await db.createOffer({
      listingId,
      agentName: "Sarah Williams",
      company: "eXp Realty",
      buyerName: "James & Priya Patel",
      offerPrice: "1850000.00",
      escrowPeriod: "45 days",
      emdAmount: "37000.00",
      emdPercent: "2.00",
      loanType: "FHA",
      downPayment: "185000.00",
      loanPercent: "90.00",
      loanAmount: "1665000.00",
      preapprovalLetter: "Yes" as any,
      proofOfFunds: "Pending" as any,
      inspectionContingency: "17 days",
      appraisalContingency: "21 days",
      loanContingency: "30 days",
      escrowCompany: "Pacific Premier Escrow",
      titleCompany: "Fidelity National Title",
      homeWarrantyCompany: "First American Home Warranty",
      homeWarrantyAmount: "550.00",
      homeToSell: "Yes" as any,
      notes: "Relocating from Bay Area. Contingent on selling their Sunnyvale home (currently in escrow, closing in 3 weeks). Strong income, pre-approved with Wells Fargo.",
      offerStatus: "pending" as any,
    });

    await db.createOffer({
      listingId,
      agentName: "Jennifer Park",
      company: "Coldwell Banker",
      buyerName: "David & Christine Nguyen",
      offerPrice: "1910000.00",
      escrowPeriod: "25 days",
      emdAmount: "95500.00",
      emdPercent: "5.00",
      loanType: "Conventional",
      downPayment: "573000.00",
      loanPercent: "70.00",
      loanAmount: "1337000.00",
      preapprovalLetter: "Yes" as any,
      proofOfFunds: "Yes" as any,
      inspectionContingency: "12 days",
      appraisalContingency: "Waived",
      loanContingency: "17 days",
      escrowCompany: "Mariners Escrow",
      titleCompany: "Old Republic Title",
      homeWarrantyCompany: "American Home Shield",
      homeWarrantyAmount: "625.00",
      homeToSell: "No" as any,
      notes: "Very motivated buyers. 30% down, waiving appraisal contingency. Currently renting nearby. Kids attend local schools. Flexible on close date but prefer quick.",
      offerStatus: "pending" as any,
    });

    // Update property insights with REAL scraped data from Redfin & Zillow
    await db.updatePropertyInsights(listingId, {
      redfin_views: 1047,
      zillow_views: 1047,
      redfin_saves: 46,
      zillow_saves: 46,
      totalShowings: 7,
      totalOffers: 4,
      openHouseDates: JSON.stringify(["2026-04-05", "2026-04-12"]),
      priceHistory: JSON.stringify([
        { date: "2026-03-31", price: 2875000, event: "Listed" },
        { date: "2026-04-05", price: 2875000, event: "Open House #1" },
        { date: "2026-04-12", price: 2875000, event: "Open House #2" },
      ]),
    });

    // ─── LISTING 2: 39851 Paseo Chaparro (Real Redfin/Zillow data) ───
    const listing2Id = await db.createListing({
      agentId: ctx.user.id,
      clientName: "Robert & Diana Flores",
      clientEmail: "flores.family@example.com",
      clientPhone: "(951) 555-0287",
      address: "39851 Paseo Chaparro",
      city: "Murrieta",
      state: "CA",
      zipCode: "92562",
      bedrooms: 4,
      bathrooms: "4",
      sqft: 2976,
      lotSizeSqft: 300564,
      yearBuilt: 2017,
      propertyType: "Single Family",
      listPrice: "1850000.00",
      mlsNumber: "SW26008864",
      status: "active" as any,
      listDate: new Date("2026-01-27"),
      description: "French Country estate in the prestigious La Cresta community on nearly 7 acres. This stunning property features two separate residences with stone accents, gray slate roof, and premium finishes throughout. The main home offers 4 bedrooms and 4 bathrooms with an open floor plan, gourmet kitchen, and expansive views. Enjoy the private hot tub, multiple outdoor entertaining areas, and proximity to the Santa Rosa Plateau Ecological Reserve. A rare opportunity for equestrian enthusiasts or those seeking ultimate privacy.",
      photoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663506091484/YnEeEYz8JCEZbD4t8BzqPW/real-39851-paseo-chaparro_3a8c8b96.jpg",
    });

    await db.initializeChecklistForListing(listing2Id);
    await db.initializeMarketingLinksForListing(listing2Id);
    await db.initializePropertyInsights(listing2Id);

    // Mark some checklist items for listing 2
    const checklist2 = await db.getChecklistByListing(listing2Id);
    const preList2 = checklist2.filter(i => i.stage === "pre-listing-appointment");
    for (const item of preList2) {
      await db.updateChecklistItem(item.id, { status: "completed", dateCompleted: new Date("2026-01-15") });
    }
    const postList2 = checklist2.filter(i => i.stage === "post-listing-appointment");
    for (const item of postList2) {
      await db.updateChecklistItem(item.id, { status: "completed", dateCompleted: new Date("2026-01-20") });
    }
    const signed2 = checklist2.filter(i => i.stage === "signed-listing-agreement");
    for (let i = 0; i < signed2.length; i++) {
      if (i < 15) await db.updateChecklistItem(signed2[i].id, { status: "completed", dateCompleted: new Date("2026-01-25") });
    }
    const marketing2 = checklist2.filter(i => i.stage === "marketing-prep");
    for (let i = 0; i < marketing2.length; i++) {
      if (i < 20) await db.updateChecklistItem(marketing2[i].id, { status: "completed", dateCompleted: new Date("2026-01-26") });
    }
    const active2 = checklist2.filter(i => i.stage === "active-on-market");
    for (let i = 0; i < active2.length; i++) {
      if (i < 8) await db.updateChecklistItem(active2[i].id, { status: "completed", dateCompleted: new Date("2026-02-05") });
    }
    const escrow2 = checklist2.filter(i => i.stage === "in-escrow");
    for (let i = 0; i < 3 && i < escrow2.length; i++) {
      await db.updateChecklistItem(escrow2[i].id, { status: "in-progress" });
    }

    // Add showings for listing 2
    const showings2 = [
      { listingId: listing2Id, showingDate: new Date("2026-02-01T10:00:00"), agentName: "Carlos Mendez", brokerage: "Redfin", interestLevel: "High" as const, feedback: "Buyers love the acreage and privacy. Very interested in the equestrian potential." },
      { listingId: listing2Id, showingDate: new Date("2026-02-05T14:00:00"), agentName: "Michelle Torres", brokerage: "Compass", interestLevel: "Low" as const, feedback: "Nice property but too remote for the buyers' commute." },
      { listingId: listing2Id, showingDate: new Date("2026-02-10T11:00:00"), agentName: "Brian Kessler", brokerage: "Coldwell Banker", interestLevel: "High" as const, feedback: "Second showing scheduled. Buyers are horse owners looking for the perfect property." },
      { listingId: listing2Id, showingDate: new Date("2026-02-15T09:00:00"), agentName: "Stephanie Lam", brokerage: "Keller Williams", interestLevel: "No Interest" as const, feedback: "Buyers decided they want a newer build with more modern finishes." },
      { listingId: listing2Id, showingDate: new Date("2026-03-01T13:00:00"), agentName: "Jason Rivera", brokerage: "RE/MAX", interestLevel: "High" as const, feedback: "Cash buyer from LA. Loves the guest house setup. Preparing offer." },
    ];
    for (const s of showings2) await db.createShowing(s as any);

    // Add offers for listing 2
    await db.createOffer({
      listingId: listing2Id,
      agentName: "Brian Kessler",
      company: "Coldwell Banker",
      buyerName: "Thomas & Rachel Whitfield",
      offerPrice: "1800000.00",
      escrowPeriod: "30 days",
      emdAmount: "54000.00",
      emdPercent: "3.00",
      loanType: "Conventional",
      downPayment: "540000.00",
      loanPercent: "70.00",
      loanAmount: "1260000.00",
      preapprovalLetter: "Yes" as any,
      proofOfFunds: "Yes" as any,
      inspectionContingency: "17 days",
      appraisalContingency: "17 days",
      loanContingency: "21 days",
      escrowCompany: "Inland Empire Escrow",
      titleCompany: "First American Title",
      homeWarrantyCompany: "American Home Shield",
      homeWarrantyAmount: "625.00",
      homeToSell: "No" as any,
      notes: "Equestrian buyers. Pre-approved with Bank of America. Flexible on close date.",
      offerStatus: "pending" as any,
    });

    await db.createOffer({
      listingId: listing2Id,
      agentName: "Jason Rivera",
      company: "RE/MAX",
      buyerName: "Marcus Chen",
      offerPrice: "1825000.00",
      escrowPeriod: "14 days",
      emdAmount: "182500.00",
      emdPercent: "10.00",
      loanType: "Cash",
      downPayment: "1825000.00",
      loanPercent: "0.00",
      loanAmount: "0.00",
      preapprovalLetter: "No" as any,
      proofOfFunds: "Yes" as any,
      inspectionContingency: "7 days",
      appraisalContingency: "Waived",
      loanContingency: "N/A",
      escrowCompany: "Pacific Escrow",
      titleCompany: "Chicago Title",
      homeWarrantyCompany: "None",
      homeWarrantyAmount: "0.00",
      homeToSell: "No" as any,
      notes: "All-cash offer from LA investor. Wants to use property as weekend retreat and potential Airbnb for guest house. Quick close.",
      offerStatus: "pending" as any,
    });

    // Update property insights for listing 2 with REAL scraped data
    await db.updatePropertyInsights(listing2Id, {
      redfin_views: 1673,
      zillow_views: 1385,
      redfin_saves: 78,
      zillow_saves: 52,
      totalShowings: 5,
      totalOffers: 2,
      openHouseDates: JSON.stringify(["2026-02-08", "2026-02-22", "2026-03-08"]),
      priceHistory: JSON.stringify([
        { date: "2024-09-15", price: 1380000, event: "Previous Sale" },
        { date: "2026-01-27", price: 1850000, event: "Listed" },
        { date: "2026-02-08", price: 1850000, event: "Open House #1" },
        { date: "2026-02-22", price: 1850000, event: "Open House #2" },
        { date: "2026-03-08", price: 1850000, event: "Open House #3" },
      ]),
    });

    return { id: listingId, message: "Test listings created with real scraped data (2 properties)" };
  }),
});

// ─── FUB ROUTER ──────────────────────────────────────────────────────────────

const fubRouter = router({
  dashboard: protectedProcedure.query(async () => {
    return getFubDashboardData();
  }),
});

// ─── ROOT ROUTER ────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  listing: listingRouter,
  checklist: checklistRouter,
  showing: showingRouter,
  offer: offerRouter,
  marketing: marketingRouter,
  insights: insightsRouter,
  clientInvite: clientRouter,
  seed: seedRouter,
  fub: fubRouter,
});

export type AppRouter = typeof appRouter;
