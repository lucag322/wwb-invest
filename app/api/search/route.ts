import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/get-user";

export async function GET(req: NextRequest) {
  try {
    await requireUserId();

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ deals: [], tasks: [], contacts: [] });
    }

    const [deals, tasks, contacts] = await Promise.all([
      prisma.deal.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, city: true, price: true, status: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, status: true, category: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, type: true, city: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ deals, tasks, contacts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
