import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MCP_USER_ID = "cmnrh69vk0000jr0aw449ywjm";

const TOOLS = [
  {
    name: "list_tasks",
    description: "List all tasks",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_task",
    description: "Create a new task",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Priority" },
        status: { type: "string", enum: ["todo", "in_progress", "done"], description: "Status" },
        category: { type: "string", enum: ["general", "sci", "finance", "legal", "work"], description: "Category" },
        dueDate: { type: "string", description: "Due date (ISO)" },
        description: { type: "string", description: "Description (HTML)" },
        notes: { type: "string", description: "Notes (HTML)" },
        dealId: { type: "string", description: "Associated deal ID" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update an existing task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID" },
        title: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        status: { type: "string", enum: ["todo", "in_progress", "done"] },
        category: { type: "string", enum: ["general", "sci", "finance", "legal", "work"] },
        dueDate: { type: "string" },
        description: { type: "string" },
        notes: { type: "string" },
        dealId: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "list_deals",
    description: "List all real estate deals",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_deal",
    description: "Create a new real estate deal",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Property name" },
        city: { type: "string" },
        address: { type: "string" },
        price: { type: "number", description: "Purchase price (EUR)" },
        monthlyRent: { type: "number", description: "Monthly rent (EUR)" },
        lots: { type: "number", description: "Number of lots" },
        dpe: { type: "string", description: "Energy rating (A-G)" },
        listingUrl: { type: "string", description: "Listing URL" },
        status: { type: "string", enum: ["prospect", "visite", "offre_faite", "sous_compromis", "achete", "rejete"] },
        profitable: { type: "boolean" },
        estimatedCashFlow: { type: "number" },
        notes: { type: "string" },
      },
      required: ["name", "price"],
    },
  },
  {
    name: "update_deal",
    description: "Update an existing deal",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        city: { type: "string" },
        address: { type: "string" },
        price: { type: "number" },
        monthlyRent: { type: "number" },
        lots: { type: "number" },
        dpe: { type: "string" },
        listingUrl: { type: "string" },
        status: { type: "string", enum: ["prospect", "visite", "offre_faite", "sous_compromis", "achete", "rejete"] },
        profitable: { type: "boolean" },
        estimatedCashFlow: { type: "number" },
        notes: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_deal",
    description: "Delete a deal",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "list_contacts",
    description: "List all contacts",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_contact",
    description: "Create a new contact",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        type: { type: "string", description: "agent, notaire, banquier, courtier, artisan, vendeur, other" },
        city: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        source: { type: "string" },
        notes: { type: "string" },
        lastContactDate: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_contact",
    description: "Update an existing contact",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        type: { type: "string" },
        city: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        source: { type: "string" },
        notes: { type: "string" },
        lastContactDate: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_contact",
    description: "Delete a contact",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "get_sci",
    description: "Get SCI information and checklist",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_sci",
    description: "Update SCI information",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        associates: { type: "string" },
        distribution: { type: "string" },
        taxRegime: { type: "string" },
        legalNotes: { type: "string" },
        nextSteps: { type: "string" },
      },
    },
  },
  {
    name: "get_finance",
    description: "Get finance overview",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_finance",
    description: "Update finance overview",
    inputSchema: {
      type: "object",
      properties: {
        availableDeposit: { type: "number" },
        borrowingCapacity: { type: "number" },
        maxMonthlyPayment: { type: "number" },
      },
    },
  },
  {
    name: "search",
    description: "Search across deals, tasks and contacts",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(name: string, args: any) {
  switch (name) {
    case "list_tasks":
      return prisma.task.findMany({
        orderBy: { createdAt: "desc" },
        include: { deal: { select: { id: true, name: true } } },
      });

    case "create_task":
      return prisma.task.create({
        data: {
          ...args,
          dueDate: args.dueDate ? new Date(args.dueDate) : null,
          userId: MCP_USER_ID,
        },
      });

    case "update_task": {
      const { id, ...data } = args;
      return prisma.task.update({
        where: { id },
        data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
      });
    }

    case "delete_task":
      return prisma.task.delete({ where: { id: args.id } });

    case "list_deals":
      return prisma.deal.findMany({ orderBy: { createdAt: "desc" } });

    case "create_deal": {
      const annualRent = (args.monthlyRent ?? 0) * 12;
      const grossYield = args.price > 0 ? (annualRent / args.price) * 100 : 0;
      return prisma.deal.create({
        data: { ...args, grossYield, userId: MCP_USER_ID },
      });
    }

    case "update_deal": {
      const { id: dealId, ...dealData } = args;
      const annualRent2 = (dealData.monthlyRent ?? 0) * 12;
      const grossYield2 = dealData.price > 0 ? (annualRent2 / dealData.price) * 100 : 0;
      return prisma.deal.update({
        where: { id: dealId },
        data: { ...dealData, grossYield: grossYield2 },
      });
    }

    case "delete_deal":
      return prisma.deal.delete({ where: { id: args.id } });

    case "list_contacts":
      return prisma.contact.findMany({ orderBy: { createdAt: "desc" } });

    case "create_contact":
      return prisma.contact.create({
        data: {
          ...args,
          lastContactDate: args.lastContactDate ? new Date(args.lastContactDate) : null,
          userId: MCP_USER_ID,
        },
      });

    case "update_contact": {
      const { id: cId, ...cData } = args;
      return prisma.contact.update({
        where: { id: cId },
        data: { ...cData, lastContactDate: cData.lastContactDate ? new Date(cData.lastContactDate) : undefined },
      });
    }

    case "delete_contact":
      return prisma.contact.delete({ where: { id: args.id } });

    case "get_sci": {
      const [info, checklist] = await Promise.all([
        prisma.sCIInfo.findFirst(),
        prisma.sCIChecklist.findMany(),
      ]);
      return { info, checklist };
    }

    case "update_sci":
      return prisma.sCIInfo.upsert({
        where: { userId: MCP_USER_ID },
        update: args,
        create: { ...args, userId: MCP_USER_ID },
      });

    case "get_finance":
      return prisma.financeOverview.findFirst();

    case "update_finance": {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      await Promise.all(
        allUsers.map((u) =>
          prisma.financeOverview.upsert({
            where: { userId: u.id },
            update: args,
            create: { ...args, userId: u.id },
          })
        )
      );
      return { ok: true };
    }

    case "search": {
      const q = args.query;
      const [deals, tasks, contacts] = await Promise.all([
        prisma.deal.findMany({
          where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] },
          take: 10,
        }),
        prisma.task.findMany({
          where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
          take: 10,
        }),
        prisma.contact.findMany({
          where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
          take: 10,
        }),
      ]);
      return { deals, tasks, contacts };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function jsonrpc(id: string | number, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function jsonrpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function sseResponse(data: unknown) {
  const body = `event: message\ndata: ${JSON.stringify(data)}\n\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: endpoint\ndata: /api/mcp\n\n`));
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const results = await Promise.all(body.map((msg) => handleMessage(msg)));
      const responses = results.filter(Boolean);
      if (responses.length === 0) return new Response(null, { status: 202 });
      const sseBody = responses.map((r) => `event: message\ndata: ${JSON.stringify(r)}\n\n`).join("");
      return new Response(sseBody, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const result = await handleMessage(body);
    if (!result) return new Response(null, { status: 202 });
    return sseResponse(result);
  } catch {
    return NextResponse.json(jsonrpcError(null, -32700, "Parse error"), { status: 400 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMessage(msg: any) {
  if (!msg.method) return null;

  if (msg.method.startsWith("notifications/")) return null;

  switch (msg.method) {
    case "initialize":
      return jsonrpc(msg.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "wwb-invest", version: "1.0.0" },
      });

    case "tools/list":
      return jsonrpc(msg.id, { tools: TOOLS });

    case "tools/call": {
      try {
        const result = await executeTool(msg.params.name, msg.params.arguments ?? {});
        return jsonrpc(msg.id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (e) {
        return jsonrpcError(msg.id, -32603, e instanceof Error ? e.message : "Tool execution failed");
      }
    }

    default:
      return jsonrpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}
