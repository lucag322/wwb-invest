import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    await requireUserId();
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(deals);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();

    const annualRent = body.monthlyRent * 12;
    const grossYield =
      body.price > 0 ? (annualRent / body.price) * 100 : 0;

    const deal = await prisma.deal.create({
      data: {
        ...body,
        grossYield,
        userId,
      },
    });
    return NextResponse.json(deal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
