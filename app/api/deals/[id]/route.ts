import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserId();
    const { id } = await params;
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: "desc" } } },
    });
    if (!deal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(deal);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserId();
    const { id } = await params;
    const body = await req.json();

    const annualRent = (body.monthlyRent ?? 0) * 12;
    const grossYield =
      body.price > 0 ? (annualRent / body.price) * 100 : 0;

    const deal = await prisma.deal.update({
      where: { id },
      data: { ...body, grossYield },
    });
    return NextResponse.json(deal);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserId();
    const { id } = await params;
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
