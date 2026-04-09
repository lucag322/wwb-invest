import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    const userId = await requireUserId();

    const [settings, dealStats, taskStats, finance, deals, tasks] =
      await Promise.all([
        prisma.dashboardSettings.findUnique({ where: { userId } }),
        prisma.deal.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.task.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.financeOverview.findUnique({ where: { userId } }),
        prisma.deal.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.task.findMany({
          where: { status: { not: "done" } },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          take: 5,
        }),
      ]);

    const totalDeals = dealStats.reduce((s, d) => s + d._count, 0);
    const offersCount =
      dealStats.find((d) => d.status === "offre_faite")?._count ?? 0;
    const boughtCount =
      dealStats.find((d) => d.status === "achete")?._count ?? 0;
    const inProgressTasks =
      taskStats.find((t) => t.status === "in_progress")?._count ?? 0;
    const todoTasks =
      taskStats.find((t) => t.status === "todo")?._count ?? 0;

    const allDeals = await prisma.deal.findMany({
      select: { estimatedCashFlow: true },
    });
    const totalCashFlow = allDeals.reduce(
      (sum, d) => sum + (d.estimatedCashFlow ?? 0),
      0
    );

    return NextResponse.json({
      cashFlowTarget: settings?.cashFlowTarget ?? 500,
      widgetConfig: (settings?.widgetConfig as Record<string, boolean>) ?? {},
      totalDeals,
      offersCount,
      boughtCount,
      inProgressTasks,
      todoTasks,
      totalCashFlow,
      availableDeposit: finance?.availableDeposit ?? 0,
      borrowingCapacity: finance?.borrowingCapacity ?? 0,
      maxMonthlyPayment: finance?.maxMonthlyPayment ?? 0,
      recentDeals: deals,
      recentTasks: tasks,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireUserId();
    const body = await req.json();

    const allUsers = await prisma.user.findMany({ select: { id: true } });

    await Promise.all(
      allUsers.map((u) =>
        prisma.dashboardSettings.upsert({
          where: { userId: u.id },
          update: body,
          create: { ...body, userId: u.id },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
