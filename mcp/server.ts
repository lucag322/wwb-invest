import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = process.env.WWB_API_URL || "https://wwb-invest.vercel.app";
const API_KEY = process.env.WWB_API_KEY || "";

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...options.headers,
    },
  });
  return res.json();
}

const server = new McpServer({
  name: "wwb-invest",
  version: "1.0.0",
});

// ── Tasks ──

server.tool("list_tasks", "List all tasks", {}, async () => {
  const data = await api("/api/tasks");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "create_task",
  "Create a new task",
  {
    title: z.string().describe("Task title"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium").describe("Priority level"),
    status: z.enum(["todo", "in_progress", "done"]).default("todo").describe("Status"),
    category: z.enum(["general", "sci", "finance", "legal", "work"]).default("general").describe("Category"),
    dueDate: z.string().optional().describe("Due date (ISO format, e.g. 2025-12-31)"),
    description: z.string().optional().describe("Detailed description (supports HTML)"),
    notes: z.string().optional().describe("Additional notes (supports HTML)"),
    dealId: z.string().optional().describe("Associated deal ID"),
  },
  async (args) => {
    const data = await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "update_task",
  "Update an existing task",
  {
    id: z.string().describe("Task ID"),
    title: z.string().optional().describe("Task title"),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional().describe("Priority level"),
    status: z.enum(["todo", "in_progress", "done"]).optional().describe("Status"),
    category: z.enum(["general", "sci", "finance", "legal", "work"]).optional().describe("Category"),
    dueDate: z.string().optional().describe("Due date (ISO format)"),
    description: z.string().optional().describe("Detailed description"),
    notes: z.string().optional().describe("Additional notes"),
    dealId: z.string().optional().describe("Associated deal ID"),
  },
  async ({ id, ...body }) => {
    const data = await api(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "delete_task",
  "Delete a task",
  { id: z.string().describe("Task ID") },
  async ({ id }) => {
    const data = await api(`/api/tasks/${id}`, { method: "DELETE" });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Deals ──

server.tool("list_deals", "List all real estate deals", {}, async () => {
  const data = await api("/api/deals");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "create_deal",
  "Create a new real estate deal",
  {
    name: z.string().describe("Property name/label"),
    city: z.string().optional().describe("City"),
    address: z.string().optional().describe("Full address"),
    price: z.number().describe("Purchase price in euros"),
    monthlyRent: z.number().default(0).describe("Monthly rent in euros"),
    lots: z.number().optional().describe("Number of lots/units"),
    dpe: z.string().optional().describe("Energy rating (A-G)"),
    listingUrl: z.string().optional().describe("URL of the listing"),
    status: z.enum(["prospect", "visite", "offre_faite", "sous_compromis", "achete", "rejete"]).default("prospect").describe("Deal status"),
    profitable: z.boolean().optional().describe("Is it profitable?"),
    estimatedCashFlow: z.number().optional().describe("Estimated monthly cash flow"),
    notes: z.string().optional().describe("Notes about the deal"),
  },
  async (args) => {
    const data = await api("/api/deals", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "update_deal",
  "Update an existing deal",
  {
    id: z.string().describe("Deal ID"),
    name: z.string().optional().describe("Property name"),
    city: z.string().optional().describe("City"),
    address: z.string().optional().describe("Full address"),
    price: z.number().optional().describe("Purchase price"),
    monthlyRent: z.number().optional().describe("Monthly rent"),
    lots: z.number().optional().describe("Number of lots"),
    dpe: z.string().optional().describe("Energy rating"),
    listingUrl: z.string().optional().describe("Listing URL"),
    status: z.enum(["prospect", "visite", "offre_faite", "sous_compromis", "achete", "rejete"]).optional().describe("Deal status"),
    profitable: z.boolean().optional().describe("Profitable?"),
    estimatedCashFlow: z.number().optional().describe("Estimated cash flow"),
    notes: z.string().optional().describe("Notes"),
  },
  async ({ id, ...body }) => {
    const data = await api(`/api/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "delete_deal",
  "Delete a deal",
  { id: z.string().describe("Deal ID") },
  async ({ id }) => {
    const data = await api(`/api/deals/${id}`, { method: "DELETE" });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Contacts ──

server.tool("list_contacts", "List all contacts", {}, async () => {
  const data = await api("/api/contacts");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "create_contact",
  "Create a new contact",
  {
    name: z.string().describe("Contact name"),
    type: z.string().optional().describe("Type (agent, notaire, banquier, courtier, artisan, vendeur, other)"),
    city: z.string().optional().describe("City"),
    address: z.string().optional().describe("Address"),
    phone: z.string().optional().describe("Phone number"),
    email: z.string().optional().describe("Email address"),
    source: z.string().optional().describe("How you found this contact"),
    notes: z.string().optional().describe("Notes"),
    lastContactDate: z.string().optional().describe("Last contact date (ISO format)"),
  },
  async (args) => {
    const data = await api("/api/contacts", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "update_contact",
  "Update an existing contact",
  {
    id: z.string().describe("Contact ID"),
    name: z.string().optional().describe("Contact name"),
    type: z.string().optional().describe("Type"),
    city: z.string().optional().describe("City"),
    address: z.string().optional().describe("Address"),
    phone: z.string().optional().describe("Phone"),
    email: z.string().optional().describe("Email"),
    source: z.string().optional().describe("Source"),
    notes: z.string().optional().describe("Notes"),
    lastContactDate: z.string().optional().describe("Last contact date"),
  },
  async ({ id, ...body }) => {
    const data = await api(`/api/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "delete_contact",
  "Delete a contact",
  { id: z.string().describe("Contact ID") },
  async ({ id }) => {
    const data = await api(`/api/contacts/${id}`, { method: "DELETE" });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── SCI ──

server.tool("get_sci", "Get SCI information and checklist", {}, async () => {
  const data = await api("/api/sci");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "update_sci",
  "Update SCI information",
  {
    name: z.string().optional().describe("SCI name"),
    associates: z.string().optional().describe("Associates description"),
    distribution: z.string().optional().describe("Share distribution"),
    taxRegime: z.string().optional().describe("Tax regime"),
    legalNotes: z.string().optional().describe("Legal notes"),
    nextSteps: z.string().optional().describe("Next steps"),
  },
  async (args) => {
    const data = await api("/api/sci", {
      method: "PUT",
      body: JSON.stringify({ type: "info", ...args }),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Finance ──

server.tool("get_finance", "Get finance overview (deposit, borrowing capacity, monthly payment)", {}, async () => {
  const data = await api("/api/finance/overview");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "update_finance",
  "Update finance overview",
  {
    availableDeposit: z.number().optional().describe("Available deposit in euros"),
    borrowingCapacity: z.number().optional().describe("Borrowing capacity in euros"),
    maxMonthlyPayment: z.number().optional().describe("Maximum monthly payment in euros"),
  },
  async (args) => {
    const data = await api("/api/finance/overview", {
      method: "PUT",
      body: JSON.stringify(args),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Search ──

server.tool(
  "search",
  "Search across deals, tasks and contacts",
  { query: z.string().describe("Search query") },
  async ({ query }) => {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Start ──

const transport = new StdioServerTransport();
await server.connect(transport);
