import type { CalculatorInputs, CalculatorResults } from "@/types";

export function calculateProjectCost(
  inputs: CalculatorInputs
): CalculatorResults {
  const {
    propertyPrice,
    deposit,
    interestRate,
    loanDuration,
    notaryFeesPercent,
    bankFeesPercent,
    brokerFeesPercent,
    sciFeesPercent,
    monthlyRentHC,
    annualPropertyTax,
    annualCharges,
    annualVacancy,
    renovationCost,
  } = inputs;

  const notaryFees = propertyPrice * (notaryFeesPercent / 100);
  const bankFees = propertyPrice * (bankFeesPercent / 100);
  const brokerFees = propertyPrice * (brokerFeesPercent / 100);
  const sciFees = propertyPrice * (sciFeesPercent / 100);

  const totalProjectCost =
    propertyPrice +
    notaryFees +
    bankFees +
    brokerFees +
    sciFees +
    renovationCost;

  const loanAmount = totalProjectCost - deposit;
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanDuration * 12;

  let monthlyPayment = 0;
  if (monthlyRate > 0 && numberOfPayments > 0 && loanAmount > 0) {
    monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  const totalCreditCost = monthlyPayment * numberOfPayments;
  const totalInterest = totalCreditCost - loanAmount;

  const annualRent = monthlyRentHC * 12;
  const grossYield =
    propertyPrice > 0 ? (annualRent / propertyPrice) * 100 : 0;

  const annualExpenses = annualPropertyTax + annualCharges + annualVacancy;
  const netAnnualIncome = annualRent - annualExpenses;
  const netYield =
    totalProjectCost > 0 ? (netAnnualIncome / totalProjectCost) * 100 : 0;

  const monthlyCashFlow = netAnnualIncome / 12 - monthlyPayment;

  const costBreakdown = [
    { label: "Prix du bien", value: propertyPrice, percent: 0 },
    { label: "Frais de notaire", value: notaryFees, percent: 0 },
    { label: "Frais bancaires", value: bankFees, percent: 0 },
    { label: "Frais de courtier", value: brokerFees, percent: 0 },
    { label: "Frais SCI/Divers", value: sciFees, percent: 0 },
    { label: "Travaux", value: renovationCost, percent: 0 },
  ];

  costBreakdown.forEach((item) => {
    item.percent =
      totalProjectCost > 0 ? (item.value / totalProjectCost) * 100 : 0;
  });

  return {
    notaryFees,
    bankFees,
    brokerFees,
    sciFees,
    totalProjectCost,
    loanAmount,
    monthlyPayment,
    totalCreditCost,
    totalInterest,
    annualRent,
    grossYield,
    netYield,
    monthlyCashFlow,
    costBreakdown,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
