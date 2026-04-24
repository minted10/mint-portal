import { getDb } from "./server/_core/db.mjs";

const db = await getDb();

// Get listing 1
const [listing] = await db.select().from(listings).where(eq(listings.address, "26582 Paseo Callado")).limit(1);
console.log("Listing ID:", listing?.id);

if (listing) {
  // Get current insights
  const [insights] = await db.select().from(propertyInsights).where(eq(propertyInsights.listingId, listing.id)).limit(1);
  console.log("Current insights:", insights);
  
  // Try updating
  await db.update(propertyInsights).set({
    redfin_views: 1047,
    zillow_views: 2094,
    redfin_saves: 46,
    zillow_saves: 92,
  }).where(eq(propertyInsights.listingId, listing.id));
  
  // Get updated insights
  const [updated] = await db.select().from(propertyInsights).where(eq(propertyInsights.listingId, listing.id)).limit(1);
  console.log("Updated insights:", updated);
}

process.exit(0);
