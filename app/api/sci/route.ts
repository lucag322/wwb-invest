import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    await requireUserId();
    const info = await prisma.sCIInfo.findFirst();
    const checklist = await prisma.sCIChecklist.findMany();
    return NextResponse.json({ info, checklist });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();

    if (body.type === "info") {
      const { type: _, ...data } = body;
      const info = await prisma.sCIInfo.upsert({
        where: { userId },
        update: data,
        create: { ...data, userId },
      });
      return NextResponse.json(info);
    }

    if (body.type === "checklist") {
      const item = await prisma.sCIChecklist.update({
        where: { id: body.id },
        data: { checked: body.checked },
      });
      return NextResponse.json(item);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
