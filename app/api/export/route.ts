import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    const userId = await requireUserId();

    const [
      tasks,
      deals,
      financeContacts,
      financeDocuments,
      financeOverview,
      sciInfo,
      sciChecklist,
      contacts,
      dashboardSettings,
    ] = await Promise.all([
      prisma.task.findMany(),
      prisma.deal.findMany(),
      prisma.financeContact.findMany(),
      prisma.financeDocument.findMany(),
      prisma.financeOverview.findFirst(),
      prisma.sCIInfo.findFirst(),
      prisma.sCIChecklist.findMany(),
      prisma.contact.findMany(),
      prisma.dashboardSettings.findUnique({ where: { userId } }),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      tasks,
      deals,
      financeContacts,
      financeDocuments,
      financeOverview,
      sciInfo,
      sciChecklist,
      contacts,
      dashboardSettings,
    };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
