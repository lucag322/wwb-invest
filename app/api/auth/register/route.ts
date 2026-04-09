import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FINANCE_DOCUMENTS,
  DEFAULT_SCI_CHECKLIST,
} from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        dashboardSettings: { create: { cashFlowTarget: 500 } },
        financeOverview: {
          create: {
            availableDeposit: 0,
            borrowingCapacity: 0,
            maxMonthlyPayment: 0,
          },
        },
        sciInfo: { create: {} },
        financeDocuments: {
          create: DEFAULT_FINANCE_DOCUMENTS.map((doc) => ({ name: doc })),
        },
        sciChecklist: {
          create: DEFAULT_SCI_CHECKLIST.map((item) => ({ item })),
        },
      },
    });

    return NextResponse.json({ id: user.id, name: user.name }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
