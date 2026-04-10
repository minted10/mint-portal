import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** agent or client */
  portalRole: mysqlEnum("portalRole", ["agent", "client"]).default("agent").notNull(),
  /** If client, which agent invited them */
  invitedByAgentId: int("invitedByAgentId"),
  phone: varchar("phone", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Listings table - core property listing data
 */
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  /** Client (seller) user id */
  clientId: int("clientId"),
  
  // Client info
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 32 }),
  
  // Property details
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 10 }),
  
  bedrooms: int("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  sqft: int("sqft"),
  lotSizeSqft: int("lotSizeSqft"),
  yearBuilt: int("yearBuilt"),
  propertyType: varchar("propertyType", { length: 50 }),
  
  listPrice: decimal("listPrice", { precision: 12, scale: 2 }),
  mlsNumber: varchar("mlsNumber", { length: 50 }),
  
  // Status
  status: mysqlEnum("listingStatus", ["pre-listing", "coming-soon", "active", "under-contract", "sold", "withdrawn", "expired"]).default("pre-listing").notNull(),
  
  listDate: timestamp("listDate"),
  closeDate: timestamp("closeDate"),
  salePrice: decimal("salePrice", { precision: 12, scale: 2 }),
  
  description: text("description"),
  photoUrl: text("photoUrl"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

/**
 * Checklist items for each listing, organized by stage
 */
export const checklistItems = mysqlTable("checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  
  stage: mysqlEnum("stage", [
    "pre-listing-appointment",
    "post-listing-appointment",
    "signed-listing-agreement",
    "marketing-prep",
    "active-on-market",
    "review-and-responses",
    "in-escrow",
    "post-close"
  ]).notNull(),
  
  title: varchar("title", { length: 500 }).notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  
  status: mysqlEnum("itemStatus", ["pending", "in-progress", "completed"]).default("pending").notNull(),
  dateCompleted: timestamp("dateCompleted"),
  note: text("note"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

/**
 * Showings log
 */
export const showings = mysqlTable("showings", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  
  showingDate: timestamp("showingDate").notNull(),
  agentName: varchar("agentName", { length: 255 }),
  brokerage: varchar("brokerage", { length: 255 }),
  interestLevel: mysqlEnum("interestLevel", ["Not Responsive", "No Interest", "Low", "High"]),
  feedback: text("feedback"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Showing = typeof showings.$inferSelect;
export type InsertShowing = typeof showings.$inferInsert;

/**
 * Offers matching the Offer Sheet tab structure
 */
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  
  // Agent info
  agentName: varchar("agentName", { length: 255 }),
  company: varchar("company", { length: 255 }),
  buyerName: varchar("buyerName", { length: 255 }),
  
  // Offer details
  offerPrice: decimal("offerPrice", { precision: 12, scale: 2 }),
  escrowPeriod: varchar("escrowPeriod", { length: 100 }),
  emdAmount: decimal("emdAmount", { precision: 12, scale: 2 }),
  emdPercent: decimal("emdPercent", { precision: 5, scale: 2 }),
  
  // Loan info
  loanType: varchar("loanType", { length: 100 }),
  downPayment: decimal("downPayment", { precision: 12, scale: 2 }),
  loanPercent: decimal("loanPercent", { precision: 5, scale: 2 }),
  loanAmount: decimal("loanAmount", { precision: 12, scale: 2 }),
  preapprovalLetter: mysqlEnum("preapprovalLetter", ["Yes", "No", "Pending"]).default("No"),
  proofOfFunds: mysqlEnum("proofOfFunds", ["Yes", "No", "Pending"]).default("No"),
  
  // Contingencies
  inspectionContingency: varchar("inspectionContingency", { length: 100 }),
  appraisalContingency: varchar("appraisalContingency", { length: 100 }),
  loanContingency: varchar("loanContingency", { length: 100 }),
  
  // Companies
  escrowCompany: varchar("escrowCompany", { length: 255 }),
  titleCompany: varchar("titleCompany", { length: 255 }),
  homeWarrantyCompany: varchar("homeWarrantyCompany", { length: 255 }),
  homeWarrantyAmount: decimal("homeWarrantyAmount", { precision: 10, scale: 2 }),
  
  // Other
  homeToSell: mysqlEnum("homeToSell", ["Yes", "No"]).default("No"),
  notes: text("notes"),
  
  offerStatus: mysqlEnum("offerStatus", ["pending", "accepted", "countered", "rejected", "withdrawn"]).default("pending").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

/**
 * Marketing links for each listing
 */
export const marketingLinks = mysqlTable("marketing_links", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  
  category: mysqlEnum("category", [
    "Marketing Calendar",
    "Google Drive Folder",
    "Photos Folder",
    "Video",
    "Matterport",
    "Property Website"
  ]).notNull(),
  
  url: text("url"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketingLink = typeof marketingLinks.$inferSelect;
export type InsertMarketingLink = typeof marketingLinks.$inferInsert;

/**
 * Property insights - aggregated data for dashboard
 */
export const propertyInsights = mysqlTable("property_insights", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  
  redfin_views: int("redfin_views").default(0),
  zillow_views: int("zillow_views").default(0),
  redfin_saves: int("redfin_saves").default(0),
  zillow_saves: int("zillow_saves").default(0),
  
  totalShowings: int("totalShowings").default(0),
  totalOffers: int("totalOffers").default(0),
  
  openHouseDates: json("openHouseDates"),
  priceHistory: json("priceHistory"),
  
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyInsight = typeof propertyInsights.$inferSelect;
export type InsertPropertyInsight = typeof propertyInsights.$inferInsert;

/**
 * Client invitations - tracks agent inviting clients
 */
export const clientInvitations = mysqlTable("client_invitations", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  listingId: int("listingId"),
  
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 32 }),
  
  inviteToken: varchar("inviteToken", { length: 128 }).notNull().unique(),
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "expired"]).default("pending").notNull(),
  
  acceptedByUserId: int("acceptedByUserId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type ClientInvitation = typeof clientInvitations.$inferSelect;
export type InsertClientInvitation = typeof clientInvitations.$inferInsert;
