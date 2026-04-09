export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskCategory =
  | "banque"
  | "deals"
  | "sci"
  | "juridique"
  | "admin"
  | "visite";

export type DealStatus =
  | "a_analyser"
  | "interessant"
  | "visite_prevue"
  | "visite"
  | "offre_faite"
  | "refuse"
  | "achete";

export type DealProfitable = "oui" | "moyen" | "non";

export type FinanceContactType = "banque" | "courtier";
export type FinanceContactStatus =
  | "a_contacter"
  | "contacte"
  | "relance"
  | "reponse_recue"
  | "refus"
  | "accord_principe";

export type ContactType =
  | "agent"
  | "notaire"
  | "courtier"
  | "comptable"
  | "artisan";

export type SCITaxRegime = "IS" | "IR";

export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate?: string;
  notes?: string;
  dealId?: string;
}

export interface DealFormData {
  name: string;
  city: string;
  address?: string;
  price: number;
  monthlyRent: number;
  lots: number;
  dpe?: string;
  listingUrl?: string;
  status: DealStatus;
  profitable: DealProfitable;
  estimatedCashFlow?: number;
  grossYield?: number;
  notes?: string;
}

export interface FinanceContactFormData {
  name: string;
  type: FinanceContactType;
  email?: string;
  phone?: string;
  status: FinanceContactStatus;
  notes?: string;
}

export interface ContactFormData {
  name: string;
  type: ContactType;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  lastContactDate?: string;
}

export interface CalculatorInputs {
  propertyPrice: number;
  deposit: number;
  interestRate: number;
  loanDuration: number;
  notaryFeesPercent: number;
  bankFeesPercent: number;
  brokerFeesPercent: number;
  sciFeesPercent: number;
  monthlyRentHC: number;
  annualPropertyTax: number;
  annualCharges: number;
  annualVacancy: number;
  renovationCost: number;
}

export interface CalculatorResults {
  notaryFees: number;
  bankFees: number;
  brokerFees: number;
  sciFees: number;
  totalProjectCost: number;
  loanAmount: number;
  monthlyPayment: number;
  totalCreditCost: number;
  totalInterest: number;
  annualRent: number;
  grossYield: number;
  netYield: number;
  monthlyCashFlow: number;
  costBreakdown: { label: string; value: number; percent: number }[];
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}
