export interface AcpService {
  id: string;
  name: string;
  description: string;
  price: { amount: string; currency: "HBAR" };
  checkoutUrl: string;
  category: string;
}

export interface AcpCatalog {
  version: string;
  merchant: { id: string; name: string; url: string };
  services: AcpService[];
}

export const EUDR_SERVICES: AcpService[] = [
  {
    id: "geolocation",
    name: "GPS Polygon Verification",
    description:
      "Verify GPS coordinates, polygon integrity, protected area boundaries, and minimum area requirements",
    price: { amount: "0.05", currency: "HBAR" },
    checkoutUrl: "/api/checkout",
    category: "geospatial",
  },
  {
    id: "deforestation",
    name: "Deforestation Risk Scan",
    description: "Forest loss assessment within farm polygon since Dec 31 2020",
    price: { amount: "0.10", currency: "HBAR" },
    checkoutUrl: "/api/checkout",
    category: "environmental",
  },
  {
    id: "agronomy",
    name: "Agronomy & Input Compliance",
    description:
      "Fertilizer records, pesticide compliance against EU banned substances list, yield plausibility",
    price: { amount: "0.03", currency: "HBAR" },
    checkoutUrl: "/api/checkout",
    category: "agronomy",
  },
  {
    id: "farm-records",
    name: "Farm Records Validation",
    description: "Harvest, sales, labor, and land ownership document verification",
    price: { amount: "0.03", currency: "HBAR" },
    checkoutUrl: "/api/checkout",
    category: "records",
  },
  {
    id: "counterfeit",
    name: "Counterfeit & Fraud Detection",
    description:
      "Input fraud detection and volume anomaly analysis for mixed-origin or counterfeit sourcing",
    price: { amount: "0.05", currency: "HBAR" },
    checkoutUrl: "/api/checkout",
    category: "fraud",
  },
  {
    id: "compliance",
    name: "EUDR Compliance Scoring",
    description: "Readiness score across all six EUDR dimensions based on verification outputs",
    price: { amount: "0.04", currency: "HBAR" },
    checkoutUrl: "/api/checkout",
    category: "compliance",
  },
  {
    id: "report",
    name: "DDS Report Generation",
    description:
      "Export-ready EUDR Due Diligence Statement with remediation recommendations",
    price: { amount: "0.15", currency: "HBAR" },
    checkoutUrl: "/api/checkout",
    category: "reporting",
  },
];

export function buildCatalog(merchantUrl: string): AcpCatalog {
  return {
    version: "2026-04-17",
    merchant: {
      id: "eudr-guardian",
      name: "EUDR Guardian Verification Network",
      url: merchantUrl,
    },
    services: EUDR_SERVICES,
  };
}
