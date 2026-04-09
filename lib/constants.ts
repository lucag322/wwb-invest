import type {
  TaskPriority,
  TaskStatus,
  TaskCategory,
  DealStatus,
  DealProfitable,
  FinanceContactStatus,
  FinanceContactType,
  ContactType,
} from "@/types";

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "banque", label: "Banque" },
  { value: "deals", label: "Deals" },
  { value: "sci", label: "SCI" },
  { value: "juridique", label: "Juridique" },
  { value: "admin", label: "Admin" },
  { value: "visite", label: "Visite" },
];

export const DEAL_STATUSES: { value: DealStatus; label: string }[] = [
  { value: "a_analyser", label: "À analyser" },
  { value: "interessant", label: "Intéressant" },
  { value: "visite_prevue", label: "Visite prévue" },
  { value: "visite", label: "Visité" },
  { value: "offre_faite", label: "Offre faite" },
  { value: "refuse", label: "Refusé" },
  { value: "achete", label: "Acheté" },
];

export const DEAL_PROFITABLE: { value: DealProfitable; label: string }[] = [
  { value: "oui", label: "Oui" },
  { value: "moyen", label: "Moyen" },
  { value: "non", label: "Non" },
];

export const FINANCE_CONTACT_TYPES: {
  value: FinanceContactType;
  label: string;
}[] = [
  { value: "banque", label: "Banque" },
  { value: "courtier", label: "Courtier" },
];

export const FINANCE_CONTACT_STATUSES: {
  value: FinanceContactStatus;
  label: string;
}[] = [
  { value: "a_contacter", label: "À contacter" },
  { value: "contacte", label: "Contacté" },
  { value: "relance", label: "Relancé" },
  { value: "reponse_recue", label: "Réponse reçue" },
  { value: "refus", label: "Refus" },
  { value: "accord_principe", label: "Accord de principe" },
];

export const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: "agent", label: "Agent immobilier" },
  { value: "notaire", label: "Notaire" },
  { value: "courtier", label: "Courtier" },
  { value: "comptable", label: "Comptable" },
  { value: "artisan", label: "Artisan" },
];

export const DPE_VALUES = ["A", "B", "C", "D", "E", "F", "G"];

export const DEFAULT_CALCULATOR_INPUTS = {
  propertyPrice: 200000,
  deposit: 20000,
  interestRate: 3.5,
  loanDuration: 20,
  notaryFeesPercent: 8,
  bankFeesPercent: 1.5,
  brokerFeesPercent: 0.5,
  sciFeesPercent: 0.2,
  monthlyRentHC: 1200,
  annualPropertyTax: 1500,
  annualCharges: 1200,
  annualVacancy: 600,
  renovationCost: 0,
};

export const DEFAULT_FINANCE_DOCUMENTS = [
  "Fiches de paie (3 derniers mois)",
  "Avis d'imposition (2 dernières années)",
  "Relevés bancaires (3 derniers mois)",
  "Justificatifs d'épargne",
  "Pièce d'identité",
  "Justificatif de domicile",
  "Contrat de travail",
  "Tableau d'amortissement (crédits en cours)",
];

export const DEFAULT_SCI_CHECKLIST = [
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

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/tasks", label: "Tâches", icon: "CheckSquare" },
  { href: "/calculator", label: "Calculateur", icon: "Calculator" },
  { href: "/deals", label: "Deals", icon: "Building2" },
  { href: "/documents", label: "Documents", icon: "FolderOpen" },
  { href: "/sci", label: "SCI", icon: "Scale" },
  { href: "/contacts", label: "Contacts", icon: "Users" },
  { href: "/settings", label: "Paramètres", icon: "Settings" },
];
