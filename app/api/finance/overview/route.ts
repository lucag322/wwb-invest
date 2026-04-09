import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    const userId = await requireUserId();
    const overview = await prisma.financeOverview.findUnique({
      where: { userId },
    });
    return NextResponse.json(overview);
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
        prisma.financeOverview.upsert({
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
