import { ENV } from "./_core/env";

const FUB_BASE = "https://api.followupboss.com/v1";

async function fubFetch(path: string, params?: Record<string, string>) {
  const url = new URL(`${FUB_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${Buffer.from(ENV.fubApiKey + ":").toString("base64")}`,
      "X-System": "MintOS",
      "X-System-Key": "mintos-dashboard",
    },
  });
  if (!res.ok) throw new Error(`FUB API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Smart lists IDs 10-15 only
const SMART_LIST_IDS = [10, 11, 12, 13, 14, 15];

export async function getSmartListsWithCounts() {
  // Get all smart lists
  const listsRes = await fubFetch("/smartLists");
  const allLists = listsRes.smartlists || [];

  // Filter to IDs 10-15
  const filtered = allLists.filter((sl: any) => SMART_LIST_IDS.includes(sl.id));

  // Also check page 2
  if (listsRes._metadata?.nextLink) {
    const page2 = await fubFetch(`/smartLists?next=${listsRes._metadata.next}`);
    const page2Lists = (page2.smartlists || []).filter((sl: any) =>
      SMART_LIST_IDS.includes(sl.id)
    );
    filtered.push(...page2Lists);
  }

  // Get counts for each
  const results = await Promise.all(
    filtered.map(async (sl: any) => {
      try {
        const peopleRes = await fubFetch("/people", {
          smartListId: String(sl.id),
          limit: "1",
        });
        return {
          id: sl.id,
          name: sl.name,
          count: peopleRes._metadata?.total ?? 0,
        };
      } catch {
        return { id: sl.id, name: sl.name, count: 0 };
      }
    })
  );

  // Sort by ID ascending
  return results.sort((a, b) => a.id - b.id);
}

export async function getTasksSummary() {
  // Get total open tasks
  const openRes = await fubFetch("/tasks", { status: "open", limit: "1" });
  const totalOpen = openRes._metadata?.total ?? 0;

  // Get tasks due today (sample to count overdue vs today)
  const tasks = await fubFetch("/tasks", { status: "open", limit: "50" });
  const today = new Date().toISOString().split("T")[0];
  let overdue = 0;
  let dueToday = 0;
  for (const t of tasks.tasks || []) {
    const due = t.dueDate || "";
    if (due && due < today) overdue++;
    else if (due === today) dueToday++;
  }

  return { totalOpen, overdue, dueToday };
}

export async function getDealsPipeline() {
  const res = await fubFetch("/deals", { limit: "100" });
  const deals = res.deals || [];
  const totalDeals = res._metadata?.total ?? deals.length;
  const totalValue = deals.reduce((sum: number, d: any) => sum + (d.price || 0), 0);

  // Group by stage
  const stages: Record<string, number> = {};
  for (const deal of deals) {
    const stage = deal.stageName || "Unknown";
    stages[stage] = (stages[stage] || 0) + 1;
  }

  return { totalDeals, totalValue, stages };
}

export async function getNewLeadsToday() {
  // Get recent events to count registrations today
  const res = await fubFetch("/events", { limit: "50" });
  const today = new Date().toISOString().split("T")[0];
  const events = res.events || [];
  const regsToday = events.filter(
    (e: any) => e.type === "Registration" && (e.created || "").startsWith(today)
  ).length;

  // Also get total people count
  const peopleRes = await fubFetch("/people", { limit: "1" });
  const totalPeople = peopleRes._metadata?.total ?? 0;

  return { newLeadsToday: regsToday, totalContacts: totalPeople };
}

export async function getFubDashboardData() {
  const [smartLists, tasks, deals, leads] = await Promise.all([
    getSmartListsWithCounts(),
    getTasksSummary(),
    getDealsPipeline(),
    getNewLeadsToday(),
  ]);

  return { smartLists, tasks, deals, leads };
}
