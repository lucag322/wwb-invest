import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const data = await req.json();

    if (data.dashboardSettings) {
      await prisma.dashboardSettings.upsert({
        where: { userId },
        update: { cashFlowTarget: data.dashboardSettings.cashFlowTarget },
        create: {
          cashFlowTarget: data.dashboardSettings.cashFlowTarget,
          userId,
        },
      });
    }

    if (data.financeOverview) {
      const { id: _, userId: __, ...overviewData } = data.financeOverview;
      await prisma.financeOverview.upsert({
        where: { userId },
        update: overviewData,
        create: { ...overviewData, userId },
      });
    }

    if (data.sciInfo) {
      const { id: _, userId: __, ...sciData } = data.sciInfo;
      await prisma.sCIInfo.upsert({
        where: { userId },
        update: sciData,
        create: { ...sciData, userId },
      });
    }

    if (data.deals?.length) {
      for (const deal of data.deals) {
        const { id: _, userId: __, tasks: _t, ...dealData } = deal;
        await prisma.deal.create({
          data: { ...dealData, userId },
        });
      }
    }

    if (data.tasks?.length) {
      for (const task of data.tasks) {
        const { id: _, userId: __, deal: _d, ...taskData } = task;
        await prisma.task.create({
          data: {
            ...taskData,
            dealId: null,
            userId,
          },
        });
      }
    }

    if (data.contacts?.length) {
      for (const contact of data.contacts) {
        const { id: _, userId: __, ...contactData } = contact;
        await prisma.contact.create({
          data: { ...contactData, userId },
        });
      }
    }

    if (data.financeContacts?.length) {
      for (const fc of data.financeContacts) {
        const { id: _, userId: __, ...fcData } = fc;
        await prisma.financeContact.create({
          data: { ...fcData, userId },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
