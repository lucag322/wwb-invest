import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    const userId = await requireUserId();
    const docs = await prisma.financeDocument.findMany({
      where: { userId },
    });
    return NextResponse.json(docs);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const { id, checked } = await req.json();
    const doc = await prisma.financeDocument.update({
      where: { id, userId },
      data: { checked },
    });
    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
