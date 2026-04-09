import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@wwb.fr" },
    update: {},
    create: {
      name: "Admin WWB",
      email: "admin@wwb.fr",
      password: hashedPassword,
    },
  });

  console.log("User created:", user.email);

  await prisma.dashboardSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { cashFlowTarget: 500, userId: user.id },
  });

  await prisma.financeOverview.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      availableDeposit: 80000,
      borrowingCapacity: 550000,
      maxMonthlyPayment: 2500,
      userId: user.id,
    },
  });

  const existingDeals = await prisma.deal.count({ where: { userId: user.id } });
  if (existingDeals === 0) {
    await prisma.deal.create({
      data: {
        name: "Immeuble Mantes",
        city: "Mantes-la-Jolie",
        address: "15 rue de la République",
        price: 449000,
        monthlyRent: 3140,
        lots: 6,
        dpe: "D",
        status: "a_analyser",
        profitable: "oui",
        grossYield: parseFloat(((3140 * 12 / 449000) * 100).toFixed(2)),
        estimatedCashFlow: 450,
        notes:
          "Immeuble de rapport 6 lots. Bon emplacement centre-ville. Toiture refaite en 2020. Quelques travaux de rafraîchissement à prévoir.",
        userId: user.id,
      },
    });

    await prisma.deal.create({
      data: {
        name: "Appartement T3 Poissy",
        city: "Poissy",
        price: 195000,
        monthlyRent: 950,
        lots: 1,
        dpe: "C",
        status: "interessant",
        profitable: "moyen",
        grossYield: parseFloat(((950 * 12 / 195000) * 100).toFixed(2)),
        notes: "Proche gare RER. À visiter.",
        userId: user.id,
      },
    });
  }

  const existingTasks = await prisma.task.count({ where: { userId: user.id } });
  if (existingTasks === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    await prisma.task.createMany({
      data: [
        {
          title: "Appeler le courtier pour simulation",
          priority: "high",
          status: "todo",
          category: "banque",
          dueDate: tomorrow,
          notes: "Demander simulation sur 20 ans et 25 ans",
          userId: user.id,
        },
        {
          title: "Analyser le DPE de l'immeuble Mantes",
          priority: "medium",
          status: "in_progress",
          category: "deals",
          dueDate: nextWeek,
          userId: user.id,
        },
        {
          title: "Rassembler les documents pour le dossier bancaire",
          priority: "high",
          status: "todo",
          category: "banque",
          dueDate: nextWeek,
          notes:
            "3 dernières fiches de paie, 2 derniers avis d'imposition, relevés bancaires",
          userId: user.id,
        },
        {
          title: "Prendre RDV chez le notaire pour création SCI",
          priority: "medium",
          status: "todo",
          category: "juridique",
          dueDate: nextMonth,
          userId: user.id,
        },
        {
          title: "Comparer les offres d'assurance emprunteur",
          priority: "low",
          status: "todo",
          category: "admin",
          userId: user.id,
        },
      ],
    });
  }

  const existingContacts = await prisma.contact.count({
    where: { userId: user.id },
  });
  if (existingContacts === 0) {
    await prisma.contact.createMany({
      data: [
        {
          name: "Pierre Martin",
          type: "courtier",
          city: "Paris",
          phone: "06 12 34 56 78",
          email: "p.martin@courtage.fr",
          source: "Recommandation",
          notes: "Très réactif, spécialisé investissement locatif",
          userId: user.id,
        },
        {
          name: "Marie Dubois",
          type: "notaire",
          city: "Mantes-la-Jolie",
          phone: "01 23 45 67 89",
          email: "m.dubois@notaires.fr",
          notes: "Cabinet réputé, connaît bien le marché local",
          userId: user.id,
        },
        {
          name: "Jean-Luc Moreau",
          type: "agent",
          city: "Mantes-la-Jolie",
          phone: "06 98 76 54 32",
          source: "LeBonCoin",
          userId: user.id,
        },
      ],
    });
  }

  const existingFinanceContacts = await prisma.financeContact.count({
    where: { userId: user.id },
  });
  if (existingFinanceContacts === 0) {
    await prisma.financeContact.createMany({
      data: [
        {
          name: "Crédit Agricole",
          type: "banque",
          status: "a_contacter",
          notes: "Agence centre-ville",
          userId: user.id,
        },
        {
          name: "BoursoBank",
          type: "banque",
          status: "contacte",
          email: "credit@bourso.fr",
          userId: user.id,
        },
      ],
    });
  }

  const existingDocs = await prisma.financeDocument.count({
    where: { userId: user.id },
  });
  if (existingDocs === 0) {
    const documents = [
      "Fiches de paie (3 derniers mois)",
      "Avis d'imposition (2 dernières années)",
      "Relevés bancaires (3 derniers mois)",
      "Justificatifs d'épargne",
      "Pièce d'identité",
      "Justificatif de domicile",
      "Contrat de travail",
      "Tableau d'amortissement (crédits en cours)",
    ];
    await prisma.financeDocument.createMany({
      data: documents.map((name) => ({ name, userId: user.id })),
    });
  }

  await prisma.sCIInfo.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      name: "WWB Investissement",
      associates: "Associé 1, Associé 2",
      distribution: "50% / 50%",
      taxRegime: "IS",
      legalNotes: "SCI familiale à l'IS pour optimisation fiscale",
      nextSteps: "Finaliser les statuts et ouvrir le compte bancaire",
      userId: user.id,
    },
  });

  const existingChecklist = await prisma.sCIChecklist.count({
    where: { userId: user.id },
  });
  if (existingChecklist === 0) {
    const checklistItems = [
      "Choix du nom de la SCI",
      "Choix du régime fiscal (IS/IR)",
      "Rédaction des statuts",
      "Ouverture du compte bancaire",
      "Dépôt du capital social",
      "Publication annonce légale",
      "Immatriculation au greffe",
      "Désignation du notaire",
      "Désignation du comptable",
    ];
    await prisma.sCIChecklist.createMany({
      data: checklistItems.map((item, i) => ({
        item,
        checked: i < 2,
        userId: user.id,
      })),
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
