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
    const userId = await requireUserId();
    const body = await req.json();
    await prisma.dashboardSettings.upsert({
      where: { userId },
      update: { calculatorDefaults: body },
      create: { userId, calculatorDefaults: body },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
