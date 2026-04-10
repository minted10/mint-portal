export type ChecklistStage =
  | "pre-listing-appointment"
  | "post-listing-appointment"
  | "signed-listing-agreement"
  | "marketing-prep"
  | "active-on-market"
  | "review-and-responses"
  | "in-escrow"
  | "post-close";

export const STAGE_LABELS: Record<ChecklistStage, string> = {
  "pre-listing-appointment": "Pre-Listing Appointment",
  "post-listing-appointment": "Post-Listing Appointment",
  "signed-listing-agreement": "Signed Listing Agreement",
  "marketing-prep": "Marketing Prep",
  "active-on-market": "Active on Market",
  "review-and-responses": "Review and Responses",
  "in-escrow": "In Escrow",
  "post-close": "Post Close",
};

export const STAGE_ORDER: ChecklistStage[] = [
  "pre-listing-appointment",
  "post-listing-appointment",
  "signed-listing-agreement",
  "marketing-prep",
  "active-on-market",
  "review-and-responses",
  "in-escrow",
  "post-close",
];

export const CHECKLIST_TEMPLATE: Record<ChecklistStage, string[]> = {
  "pre-listing-appointment": [
    "Set Listing Appointment and send Calendar Invite",
    "Confirm Bed/Bath/SqFt from Title Report",
    "Confirm Seller Names via Tax Records",
    "Print Property Profile with USA Title",
    "Print Listing Agreement",
    "Build and Print CMA",
    "Print Seller's Net Proceeds Sheet (Mariners Escrow)",
    "Print Buyer Demand Report in Real Scout",
    "Create Mint Sellers Handbook",
    "Add brochures to folder",
    "Create & Print Listing Timeline Calendar",
  ],
  "post-listing-appointment": [
    "Call/Email Sellers Thanking Them",
    "Confirm names for everyone on Title & or Trust name",
    "Send Listing Agreement for Signatures",
    "Put together list of recommended upgrades",
    "Summarize marketing strategy/approach",
    "Confirm listing specs",
  ],
  "signed-listing-agreement": [
    "Buy custom domain on GoDaddy and build QR Code",
    "Notify Transaction Coordinator once listing is signed",
    "Create A Google Drive Folder for Property & Share with Client",
    "Create Photo sub-folder",
    "Create Google Drive marketing sub-folder",
    "Schedule Approved Vendor Work",
    "TC Intro Email",
    "TC Create Disclosure Packet (Disclosures.Io or other)",
    "TC to Order NHD from myNHD",
    "TC to Receive Preliminary Title Report",
    "Ask Escrow Officer if any red flags (liens, etc.)",
    "Add Seller to Updater",
    "Draft AVID",
    "Provide rehab quotes if any",
    "Retrieve Keys From Seller(s) / Make Copies",
    "Add Combo & Lock Box to Property",
    "Schedule Pre-Listing Inspections",
    "Stager Quote Received, send it to clients if they are paying",
    "Get Vendor Budget Approved By Seller(s)",
  ],
  "marketing-prep": [
    "Photos",
    "Video",
    "Matterport and Floor Plan",
    "Zillow 3D Tour",
    "Promotional Event",
    "Write Property Description",
    "Create single property website",
    "Design Brochure",
    "Use snippet for social post",
    "Upload Photos to Canva",
    "Confirm QR Code works",
    "Confirm MLS Number",
    "Confirm Property Description",
    "Schedule Staging",
    "Schedule Vendors",
    "Schedule Cleaners",
    "Schedule Complete Staging Preview w/Listing Agent before Media",
    "Order Sign + Post",
    "Install sign rider(s)",
    "Trigger Coming Soon marketing",
    "Post Card",
    "Social media W/ custom audience",
    "Add selected photos to Google Drive and organize",
    "Send Single Property Site to Sellers",
    "Add photos to Online Profiles",
    "Yelp",
    "Google Business",
    "Instagram",
    "Facebook",
    "LinkedIn",
    "Facebook Marketplace",
    "Coming Soon E-Blast to MLS",
    "Create 'In Escrow Marketing Collateral'",
    "Call all Neighbors and let them know home is coming to market",
    "Print Flyers",
  ],
  "active-on-market": [
    "Active on the MLS",
    "Feedback to Sellers",
    "Introduce Yourself To Neighbors",
    "24 Hours Before Offer Deadline follow up with all showings",
    "Send out email to those with Disclosures",
    "Update Description in MLS",
    "Follow up with all Leads and Showings after week 1",
    "Side Listing \"Stats\" Reports",
    "Generate Report Weekly & Send to Sellers",
  ],
  "review-and-responses": [
    "Fill out offers tab",
    "Review offers tab with sellers",
    "Send Counter Offers",
    "Fully execute offer and open escrow with Surfline",
    "Start Cross Qualification with Loan Brothers",
  ],
  "in-escrow": [
    "Send all docs to Rachel",
    "Escrow Timeline Calendar Invites Sent",
    "Follow up with Buyers Agent about Deposit",
    "Change MLS to Active Under Contract Once Deposit is Confirmed W/ Escrow",
    "Confirm CDA with all agents involved",
    "Check in with TC (Make sure file looks good/complete) 1 Week Prior",
    "Schedule Signing Appointment with Sellers (5 days before COE)",
    "Send Calendar Invite for Signing Date (2-3 Days before COE)",
    "Remove all marketing material from property",
    "Schedule De-Staging with Staging Company",
    "Schedule Sign Removal",
    "Send Updater link to clients for utilities change",
    "Check in with Lender and Escrow (1 Week Prior)",
    "Coordinate Key Exchange",
  ],
  "post-close": [
    "Remove Lockbox & Sign Rider",
    "Claim Sale on Zillow",
    "Create what I learned from this transaction video",
    "Send just sold postcard to Neighborhood and Mailing List",
    "Follow up for Review",
    "Fully completed and ready to archive",
  ],
};

export const MARKETING_LINK_CATEGORIES = [
  "Marketing Calendar",
  "Google Drive Folder",
  "Photos Folder",
  "Video",
  "Matterport",
  "Property Website",
] as const;

export type MarketingLinkCategory = typeof MARKETING_LINK_CATEGORIES[number];

export const INTEREST_LEVELS = ["Not Responsive", "No Interest", "Low", "High"] as const;
export type InterestLevel = typeof INTEREST_LEVELS[number];

export const LISTING_STATUSES = ["pre-listing", "coming-soon", "active", "under-contract", "sold", "withdrawn", "expired"] as const;
export type ListingStatus = typeof LISTING_STATUSES[number];

export const OFFER_STATUSES = ["pending", "accepted", "countered", "rejected", "withdrawn"] as const;
export type OfferStatus = typeof OFFER_STATUSES[number];
