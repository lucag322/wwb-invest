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
      prisma.task.findMany({ where: { userId } }),
      prisma.deal.findMany({ where: { userId } }),
      prisma.financeContact.findMany({ where: { userId } }),
      prisma.financeDocument.findMany({ where: { userId } }),
      prisma.financeOverview.findUnique({ where: { userId } }),
      prisma.sCIInfo.findUnique({ where: { userId } }),
      prisma.sCIChecklist.findMany({ where: { userId } }),
      prisma.contact.findMany({ where: { userId } }),
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
