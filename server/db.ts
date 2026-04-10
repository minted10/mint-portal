import { and, eq, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  listings, InsertListing, Listing,
  checklistItems, InsertChecklistItem,
  showings, InsertShowing,
  offers, InsertOffer,
  marketingLinks, InsertMarketingLink,
  propertyInsights, InsertPropertyInsight,
  clientInvitations, InsertClientInvitation,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { CHECKLIST_TEMPLATE, STAGE_ORDER, MARKETING_LINK_CATEGORIES } from "../shared/checklistTemplate";
import type { ChecklistStage } from "../shared/checklistTemplate";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USER HELPERS ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }

    if (!values.lastSignedIn) { values.lastSignedIn = new Date(); }
    if (Object.keys(updateSet).length === 0) { updateSet.lastSignedIn = new Date(); }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── LISTING HELPERS ────────────────────────────────────────────────────────

export async function createListing(data: InsertListing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(listings).values(data);
  const id = result[0].insertId;
  return id;
}

export async function initializeChecklistForListing(listingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const items: InsertChecklistItem[] = [];
  for (const stage of STAGE_ORDER) {
    const tasks = CHECKLIST_TEMPLATE[stage];
    tasks.forEach((title, idx) => {
      items.push({
        listingId,
        stage: stage as any,
        title,
        sortOrder: idx,
        status: "pending" as any,
      });
    });
  }

  if (items.length > 0) {
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < items.length; i += batchSize) {
      await db.insert(checklistItems).values(items.slice(i, i + batchSize));
    }
  }
}

export async function initializeMarketingLinksForListing(listingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const links: InsertMarketingLink[] = MARKETING_LINK_CATEGORIES.map(cat => ({
    listingId,
    category: cat as any,
    url: null,
  }));

  await db.insert(marketingLinks).values(links);
}

export async function initializePropertyInsights(listingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(propertyInsights).values({
    listingId,
    redfin_views: 0,
    zillow_views: 0,
    redfin_saves: 0,
    zillow_saves: 0,
    totalShowings: 0,
    totalOffers: 0,
    openHouseDates: JSON.stringify([]),
    priceHistory: JSON.stringify([]),
  });
}

export async function getListingsByAgent(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(listings).where(eq(listings.agentId, agentId)).orderBy(desc(listings.createdAt));
}

export async function getListingsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(listings).where(eq(listings.clientId, clientId)).orderBy(desc(listings.createdAt));
}

export async function getListingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateListing(id: number, data: Partial<InsertListing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(listings).set(data).where(eq(listings.id, id));
}

export async function deleteListing(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data first
  await db.delete(checklistItems).where(eq(checklistItems.listingId, id));
  await db.delete(showings).where(eq(showings.listingId, id));
  await db.delete(offers).where(eq(offers.listingId, id));
  await db.delete(marketingLinks).where(eq(marketingLinks.listingId, id));
  await db.delete(propertyInsights).where(eq(propertyInsights.listingId, id));
  await db.delete(listings).where(eq(listings.id, id));
}

// ─── CHECKLIST HELPERS ──────────────────────────────────────────────────────

export async function getChecklistByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistItems)
    .where(eq(checklistItems.listingId, listingId))
    .orderBy(asc(checklistItems.sortOrder));
}

export async function updateChecklistItem(id: number, data: { status?: string; dateCompleted?: Date | null; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(checklistItems).set(data as any).where(eq(checklistItems.id, id));
}

export async function getChecklistProgress(listingId: number) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, percentage: 0 };
  
  const all = await db.select({ id: checklistItems.id, status: checklistItems.status })
    .from(checklistItems).where(eq(checklistItems.listingId, listingId));
  
  const total = all.length;
  const completed = all.filter(i => i.status === "completed").length;
  return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

// ─── SHOWING HELPERS ────────────────────────────────────────────────────────

export async function getShowingsByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(showings)
    .where(eq(showings.listingId, listingId))
    .orderBy(desc(showings.showingDate));
}

export async function createShowing(data: InsertShowing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(showings).values(data);
  return result[0].insertId;
}

export async function updateShowing(id: number, data: Partial<InsertShowing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(showings).set(data).where(eq(showings.id, id));
}

export async function deleteShowing(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(showings).where(eq(showings.id, id));
}

// ─── OFFER HELPERS ──────────────────────────────────────────────────────────

export async function getOffersByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offers)
    .where(eq(offers.listingId, listingId))
    .orderBy(desc(offers.createdAt));
}

export async function createOffer(data: InsertOffer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(offers).values(data);
  return result[0].insertId;
}

export async function updateOffer(id: number, data: Partial<InsertOffer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(offers).set(data).where(eq(offers.id, id));
}

export async function deleteOffer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(offers).where(eq(offers.id, id));
}

// ─── MARKETING LINKS HELPERS ────────────────────────────────────────────────

export async function getMarketingLinksByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketingLinks).where(eq(marketingLinks.listingId, listingId));
}

export async function updateMarketingLink(id: number, url: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(marketingLinks).set({ url }).where(eq(marketingLinks.id, id));
}

// ─── PROPERTY INSIGHTS HELPERS ──────────────────────────────────────────────

export async function getPropertyInsights(listingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(propertyInsights).where(eq(propertyInsights.listingId, listingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePropertyInsights(listingId: number, data: Partial<InsertPropertyInsight>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(propertyInsights).set(data).where(eq(propertyInsights.listingId, listingId));
}

// ─── CLIENT INVITATION HELPERS ──────────────────────────────────────────────

export async function createClientInvitation(data: InsertClientInvitation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientInvitations).values(data);
  return result[0].insertId;
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientInvitations).where(eq(clientInvitations.inviteToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvitationsByAgent(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientInvitations).where(eq(clientInvitations.agentId, agentId)).orderBy(desc(clientInvitations.createdAt));
}

export async function acceptInvitation(token: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientInvitations).set({ status: "accepted" as any, acceptedByUserId: userId }).where(eq(clientInvitations.inviteToken, token));
}

// ─── DASHBOARD STATS ────────────────────────────────────────────────────────

export async function getListingDashboardStats(listingId: number) {
  const db = await getDb();
  if (!db) return null;

  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) return null;

  const progress = await getChecklistProgress(listingId);
  const showingsList = await getShowingsByListing(listingId);
  const offersList = await getOffersByListing(listingId);
  const insights = await getPropertyInsights(listingId);

  const daysOnMarket = listing.listDate
    ? Math.floor((Date.now() - new Date(listing.listDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    listing,
    checklistProgress: progress,
    showingsCount: showingsList.length,
    offersCount: offersList.length,
    daysOnMarket,
    insights,
    recentShowings: showingsList.slice(0, 5),
    highInterestShowings: showingsList.filter(s => s.interestLevel === "High").length,
  };
}
