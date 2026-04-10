import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    const userId = await requireUserId();
    const settings = await prisma.dashboardSettings.findUnique({
      where: { userId },
      select: { calculatorDefaults: true },
    });
    return NextResponse.json(settings?.calculatorDefaults ?? {});
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
          update: { calculatorDefaults: body },
          create: { userId: u.id, calculatorDefaults: body },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
