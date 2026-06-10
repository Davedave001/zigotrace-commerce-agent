# EUDR Guardian — Hedera Food Traceability Commerce Agent

> **"An autonomous compliance agent that verifies food supply chains, detects counterfeit and compliance risks, coordinates specialist agents, and generates export-ready EUDR due diligence reports through HBAR-powered agent commerce."**

Built with Hedera Agent Kit + ACP + AP2 + MPP.

---

## 1. Executive Summary

**What we're building:** A multi-agent supply chain intelligence network that automates EU Deforestation Regulation (EUDR) compliance for coffee, cocoa, palm oil, rubber, timber, soy, and cattle exporters. A Master Guardian Agent orchestrates a network of specialist agents — each selling a distinct verification service for HBAR micropayments. The system produces export-ready EUDR Due Diligence Statements (DDS) and stores immutable compliance proofs on Hedera.

**Why it wins:**

| Judging Criterion | Weight | Our Approach |
|---|---|---|
| Technical Quality | 25% | TypeScript monorepo, 7 specialist agents, Hedera Agent Kit, typed AP2/ACP/MPP modules |
| Use of AI Studio | 25% | Claude claude-sonnet-4-6 orchestrator + Claude-powered specialist analysis engines |
| Feasibility | 20% | All verifications are AI reasoning over uploaded documents — no external satellite API dependency |
| Innovation | 15% | Counterfeit detection, volume anomaly analysis, agent-to-agent commerce, TracePass NFT |
| Demo Quality | 15% | Coffee cooperative demo: farmer uploads → 7 agents fire → EUDR report + HCS proof |

**Bonus Bounty ($250):** Full ACP + AP2 compliance earns "recognized industry best practices."

---

## 2. Problem Context

EUDR (EU Regulation 2023/1115) requires exporters of 7 commodity groups to prove their products are not linked to deforestation after December 31, 2020. A compliant Due Diligence Statement must include:

- GPS polygon data for every farm
- Evidence of no forest loss since Dec 2020
- Legality documentation (land ownership, permits)
- Traceability from farm to operator
- Input records (fertilizers, pesticides)

Non-compliance blocks market access. The verification process is expensive, slow, and currently manual. EUDR Guardian automates it through agent commerce.

---

## 3. Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER / CLIENT                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Next.js Dashboard  (shadcn/ui + Tailwind)                   │   │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐  │   │
│  │  │  Upload Panel  │  │  Agent Activity  │  │  Wallet     │  │   │
│  │  │  (farm docs,   │  │  Feed (live ACP  │  │  Widget     │  │   │
│  │  │   GPS, logs)   │  │   messages)      │  │ (HashConnect)│  │   │
│  │  └────────────────┘  └──────────────────┘  └─────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  EUDR Readiness Report Panel (final output)          │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ HTTPS / SSE
┌──────────────────────▼──────────────────────────────────────────────┐
│                       API SERVER  (Next.js App Router)               │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   EUDR GUARDIAN MASTER AGENT                   │  │
│  │  (Claude claude-sonnet-4-6 + Hedera Agent Kit + LangChain)    │  │
│  │                                                                 │  │
│  │  Input:  Farm ID, GPS polygons, farmer records,                │  │
│  │          fertilizer logs, pesticide logs, delivery records,    │  │
│  │          harvest records, land ownership docs                  │  │
│  │                                                                 │  │
│  │  Orchestrates via ACP:                                         │  │
│  │  ├─ Agent 1: Geolocation Verification     [0.05 HBAR / farm]  │  │
│  │  ├─ Agent 2: Deforestation Risk           [0.10 HBAR / farm]  │  │
│  │  ├─ Agent 3: Agronomy Verification        [0.03 HBAR / farm]  │  │
│  │  ├─ Agent 4: Farm Records Validation      [0.03 HBAR / farm]  │  │
│  │  ├─ Agent 5: Counterfeit Detection        [0.05 HBAR / batch] │  │
│  │  ├─ Agent 6: EUDR Compliance Scoring      [0.04 HBAR / batch] │  │
│  │  └─ Agent 7: DDS Report Generation        [0.15 HBAR / batch] │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                  PAYMENT COMMERCE LAYER                        │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐ │  │
│  │  │  AP2 Module  │  │  ACP Module   │  │  MPP Module         │ │  │
│  │  │  (payment    │  │  (agent       │  │  (split payment     │ │  │
│  │  │   messages)  │  │   checkout)   │  │   0.5 HBAR → 7 way) │ │  │
│  │  └──────────────┘  └───────────────┘  └─────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Hedera SDK / gRPC
┌──────────────────────────────▼──────────────────────────────────────┐
│                          HEDERA NETWORK                               │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │  HBAR Transfers  │  │  HCS Topics     │  │  HTS — TracePass  │  │
│  │  (per-agent MPP  │  │  (immutable     │  │  NFT (compliance  │  │
│  │   splits)        │  │   audit trail)  │  │   certificate)    │  │
│  └──────────────────┘  └─────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Agent framework | `@hashgraph/hedera-agent-kit` (JS) | Required by bounty |
| LLM | Claude claude-sonnet-4-6 via `@ai-sdk/anthropic` | Best tool-use + document reasoning |
| Agent orchestration | LangChain.js `AgentExecutor` | Native Hedera Agent Kit support |
| Frontend | Next.js 14 App Router + `ai` SDK `useChat` | SSE streaming, easy deploy |
| UI components | shadcn/ui + Tailwind CSS | Polished, accessible |
| Wallet | HashConnect v3 | Official Hedera wallet bridge |
| Backend hosting | Vercel (serverless) | Free tier, 90-day guarantee |
| Database | Upstash Redis | Session + verification-state cache |
| Protocol: AP2 | Custom TypeScript module (Pydantic → Zod) | Agent payment negotiation |
| Protocol: ACP | OpenAPI-compliant checkout endpoint | Agent service discovery |
| Protocol: MPP | `mppx` SDK + HTTP 402 + split routing | 7-way payment splits per DDS |

---

## 5. Repository Structure

```
eudr-guardian/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── page.tsx                    # Dashboard entry (upload + agent feed)
│       │   ├── api/
│       │   │   ├── guardian/route.ts       # Master agent SSE stream
│       │   │   ├── checkout/route.ts       # ACP checkout endpoint
│       │   │   ├── services/route.ts       # ACP agent catalog
│       │   │   └── payment/
│       │   │       ├── request/route.ts    # AP2 PaymentRequest
│       │   │       └── verify/route.ts     # Mirror node verification
│       │   ├── components/
│       │   │   ├── UploadPanel.tsx
│       │   │   ├── AgentActivityFeed.tsx
│       │   │   ├── WalletWidget.tsx
│       │   │   ├── PaymentModal.tsx
│       │   │   └── EUDRReportPanel.tsx
│       │   └── lib/
│       │       ├── guardian-agent.ts       # Master agent setup
│       │       ├── specialist-agents/
│       │       │   ├── geolocation.ts      # Agent 1
│       │       │   ├── deforestation.ts    # Agent 2
│       │       │   ├── agronomy.ts         # Agent 3
│       │       │   ├── farm-records.ts     # Agent 4
│       │       │   ├── counterfeit.ts      # Agent 5
│       │       │   ├── compliance.ts       # Agent 6
│       │       │   └── report.ts           # Agent 7
│       │       ├── scoring.ts              # EUDR readiness scoring model
│       │       └── hedera.ts               # SDK client singleton
│       └── package.json
├── packages/
│   ├── ap2/                                # AP2 protocol module
│   ├── acp/                                # ACP protocol module
│   └── mpp/                               # MPP HTTP-402 + split routing
├── IMPLEMENTATION_PLAN.md
├── README.md
├── turbo.json
└── package.json
```

---

## 6. Agent Specifications

### Master Agent — EUDR Guardian

```typescript
// apps/web/app/lib/guardian-agent.ts
import { HederaAgentKit, createHederaTools } from "@hashgraph/hedera-agent-kit";
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

const kit = new HederaAgentKit(
  process.env.HEDERA_OPERATOR_ID!,
  process.env.HEDERA_OPERATOR_KEY!,
  { network: process.env.HEDERA_NETWORK as "testnet" | "mainnet" }
);

const GUARDIAN_SYSTEM_PROMPT = `
You are EUDR Guardian, a compliance intelligence agent for EU Deforestation Regulation.

When a user submits farm data, you must:
1. Assess completeness of submitted records
2. Delegate each verification to the appropriate specialist agent via ACP
3. Request HBAR payment before each specialist agent runs
4. Aggregate findings into a EUDR readiness score
5. Flag any red flags (deforestation, banned inputs, volume anomalies)
6. Commission a Due Diligence Statement report
7. Issue a TracePass NFT on successful compliance

You coordinate an agent economy. Each specialist agent charges for its service.
All payments are logged immutably on HCS.
`;

export const guardianAgent = AgentExecutor.fromAgentAndTools({
  agent: createToolCallingAgent({
    llm: new ChatAnthropic({ model: "claude-sonnet-4-6", temperature: 0 }),
    tools: [...createHederaTools(kit), ...createSpecialistAgentTools(kit)],
    prompt: GUARDIAN_SYSTEM_PROMPT,
  }),
  tools: [...createHederaTools(kit), ...createSpecialistAgentTools(kit)],
  maxIterations: 20,
  verbose: true,
});
```

---

### Agent 1 — Geolocation Verification Agent

**Responsibilities:**
- Validate GPS coordinates format and completeness
- Check polygon closure and integrity
- Detect polygon overlaps between farms
- Validate polygon area meets >4 hectare minimum
- Flag polygons intersecting protected area boundaries

**Price:** `0.05 HBAR` per farm, paid via AP2

```typescript
// apps/web/app/lib/specialist-agents/geolocation.ts
export const geolocationAgent = tool({
  name: "verify_geolocation",
  description: "Verify GPS polygon integrity, check protected area boundaries, validate farm size requirements",
  parameters: z.object({
    farmId: z.string(),
    gpsPolygon: z.array(z.object({ lat: z.number(), lng: z.number() })),
    claimedAreaHectares: z.number(),
  }),
  execute: async (input, { accountId }) => {
    await requirePayment({ serviceId: "geolocation", amountHbar: 0.05, accountId });

    const result = await runGeolocationAnalysis(input);
    await logToHCS("GEOLOCATION_VERIFIED", { farmId: input.farmId, result });
    return result;
  },
});

// Output shape:
// { status: "PASS" | "FAIL" | "WARNING", issues: string[], polygonAreaHa: number }
```

---

### Agent 2 — Deforestation Risk Agent

**Consumes:** Farm polygon + satellite imagery metadata + forest layer reference data

**Checks:**
- Forest cover loss after December 31, 2020 within polygon
- Buffer zone encroachment on protected forests
- Farm boundary expansion risk

**Price:** `0.10 HBAR` per farm — highest price reflects the most critical EUDR check

```typescript
export const deforestationAgent = tool({
  name: "assess_deforestation_risk",
  description: "Assess deforestation risk within farm polygon boundaries since Dec 31 2020",
  parameters: z.object({
    farmId: z.string(),
    gpsPolygon: z.array(z.object({ lat: z.number(), lng: z.number() })),
    countryCode: z.string(),
    commodity: z.enum(["coffee", "cocoa", "palm_oil", "soy", "rubber", "cattle", "timber"]),
  }),
  execute: async (input, { accountId }) => {
    await requirePayment({ serviceId: "deforestation", amountHbar: 0.10, accountId });

    const result = await runDeforestationAnalysis(input);
    await logToHCS("DEFORESTATION_ASSESSED", { farmId: input.farmId, result });
    return result;
  },
});

// Output shape:
// { riskLevel: "LOW" | "MEDIUM" | "HIGH", forestLossHa: number, encroachmentDetected: boolean }
```

---

### Agent 3 — Agronomy Verification Agent

**Validates:**
- Fertilizer application rates against crop-specific agronomic norms
- Pesticide records for EU-banned substances
- Input procurement consistency
- Harvest yield plausibility vs. farm area

**Price:** `0.03 HBAR` per farm

```typescript
export const agronomyAgent = tool({
  name: "verify_agronomy",
  description: "Validate fertilizer records, pesticide compliance (EU banned substances), and yield plausibility",
  parameters: z.object({
    farmId: z.string(),
    farmAreaHectares: z.number(),
    commodity: z.string(),
    fertilizerRecords: z.array(z.object({ product: z.string(), quantityKg: z.number(), date: z.string() })),
    pesticideRecords: z.array(z.object({ product: z.string(), activeIngredient: z.string(), quantityL: z.number() })),
    harvestRecords: z.array(z.object({ quantityKg: z.number(), season: z.string() })),
  }),
  execute: async (input, { accountId }) => {
    await requirePayment({ serviceId: "agronomy", amountHbar: 0.03, accountId });

    const result = await runAgronomyAnalysis(input);
    await logToHCS("AGRONOMY_VERIFIED", { farmId: input.farmId, result });
    return result;
  },
});

// Output shape:
// { euBannedPesticidesDetected: string[], yieldAnomalyFactor: number, flags: string[] }
```

---

### Agent 4 — Farm Records Validation Agent

**Validates:**
- Harvest records completeness and continuity
- Sales records against delivery records (no volume gaps)
- Labor records for legality indicators
- Land ownership document consistency

**Price:** `0.03 HBAR` per farm

---

### Agent 5 — Counterfeit Detection Agent

The highest-value analytical agent. Detects two fraud patterns:

#### Input Fraud Detection

Cross-references claimed fertilizer/pesticide brands against:
- Application rates (dose per hectare vs. manufacturer specs)
- Procurement source plausibility
- Lot number format verification

```typescript
// Example flag:
// Farmer claims: "Yara YaraMila ACTYVA 50kg bags"
// Detected: application rate = 3x manufacturer maximum
// Flag: "Counterfeit or mislabeled fertilizer suspected"
```

#### Volume / Origin Fraud Detection

Compares cooperative aggregate volumes against the sum of mapped farm capacities:

```typescript
// Example flag:
// Cooperative total: 100 tonnes coffee
// Sum of mapped farm maximum yields: 38 tonnes
// Flag: "Volume anomaly 2.6x — potential mixed-origin produce or laundering"
```

**Price:** `0.05 HBAR` per cooperative batch

```typescript
export const counterfeitAgent = tool({
  name: "detect_counterfeits",
  description: "Detect input fraud and volume anomalies indicating mixed-origin or counterfeit sourcing",
  parameters: z.object({
    cooperativeId: z.string(),
    totalVolumeKg: z.number(),
    farms: z.array(z.object({
      farmId: z.string(),
      areaHectares: z.number(),
      harvestKg: z.number(),
      inputRecords: z.array(z.any()),
    })),
    commodity: z.string(),
  }),
  execute: async (input, { accountId }) => {
    await requirePayment({ serviceId: "counterfeit", amountHbar: 0.05, accountId });

    const result = await runCounterfeitAnalysis(input);
    await logToHCS("COUNTERFEIT_SCAN", { cooperativeId: input.cooperativeId, result });
    return result;
  },
});

// Output shape:
// { volumeAnomalyDetected: boolean, anomalyFactor: number, inputFraudFlags: string[], overallRisk: "LOW" | "MEDIUM" | "HIGH" }
```

---

### Agent 6 — EUDR Compliance Scoring Agent

Maps all verification outputs onto the EUDR readiness scoring model:

```typescript
// Scoring dimensions (each 0–100):
const SCORING_DIMENSIONS = {
  geolocationCompleteness: 0.20,   // GPS coverage of all farms
  deforestationClearance: 0.30,    // Most weighted — EUDR core requirement
  inputCompliance: 0.15,           // No banned pesticides
  recordsLegality: 0.15,           // Ownership + labor compliance
  traceabilityScore: 0.10,         // Farm-to-operator chain completeness
  antifraudScore: 0.10,            // No volume/input anomalies
};

// Score bands:
// 85–100: Advanced Readiness — ready to export
// 65–84:  Intermediate Readiness — gaps exist, addressable
// 40–64:  Basic Readiness — significant remediation needed
// 0–39:   Critical Gaps — not eligible for EU export
```

**Price:** `0.04 HBAR` per batch

---

### Agent 7 — DDS Report Generation Agent

Produces a structured EUDR Due Diligence Statement:

```markdown
# EUDR Due Diligence Statement
**Operator:** Zigotrace Coffee Cooperative
**Reference Number:** DDS-2026-KE-001
**Commodity:** Green Coffee (HS 0901.11)

## Readiness Score: 82% — Intermediate Readiness

## Farm Verification Summary
| Farm ID | GPS | Deforestation | Agronomy | Records |
|---------|-----|---------------|----------|---------|
| F001    | ✅  | ✅            | ⚠️       | ✅      |
| F002    | ✅  | ✅            | ✅       | ✅      |

## Red Flags
- F001: Pesticide "Chlorpyrifos" detected — banned in EU since 2020

## Recommendations
1. Replace Chlorpyrifos with approved IPM alternatives before next season
2. Obtain updated land titles for farms F003, F004

## HCS Audit Trail
Topic: 0.0.XXXXXX | All verification steps immutably recorded
TracePass NFT: 0.0.XXXXXX (issued on compliance)
```

**Price:** `0.15 HBAR`

---

## 7. ACP + AP2 + MPP Integration

### 7.1 AP2 — Agentic Payments Protocol

Each specialist agent negotiates payment through AP2 before execution.

```typescript
// packages/ap2/src/models.ts
export const PaymentRequestSchema = z.object({
  version: z.literal("1.0"),
  requestId: z.string().uuid(),
  type: z.literal("payment_request"),
  amount: z.object({ value: z.number(), currency: z.literal("HBAR") }),
  merchant: z.object({ id: z.string(), name: z.string() }),
  description: z.string(),
  expiresAt: z.string().datetime(),
  metadata: z.object({
    serviceId: z.string(),
    farmId: z.string().optional(),
    cooperativeId: z.string().optional(),
  }),
});
```

**Flow:**
1. Guardian Agent requests quote from specialist agent
2. Specialist agent returns AP2 `PaymentRequest` with price
3. Frontend shows `PaymentModal` — user approves in HashConnect
4. Hedera HBAR transfer executes
5. AP2 `PaymentResponse` carries transaction ID
6. Specialist agent verifies via Mirror Node → proceeds

---

### 7.2 ACP — Agentic Commerce Protocol

Service catalog published at `GET /api/services` — any ACP-compatible agent can discover and purchase these verification services:

```json
{
  "version": "2026-04-17",
  "merchant": {
    "id": "eudr-guardian",
    "name": "EUDR Guardian Verification Network",
    "url": "https://eudr-guardian.vercel.app"
  },
  "services": [
    {
      "id": "geolocation",
      "name": "GPS Polygon Verification",
      "price": { "amount": "0.05", "currency": "HBAR" },
      "description": "Verify GPS coordinates, polygon integrity, protected area boundaries"
    },
    {
      "id": "deforestation",
      "name": "Deforestation Risk Scan",
      "price": { "amount": "0.10", "currency": "HBAR" },
      "description": "Forest loss assessment since Dec 31 2020"
    },
    {
      "id": "agronomy",
      "name": "Agronomy & Input Compliance",
      "price": { "amount": "0.03", "currency": "HBAR" },
      "description": "Fertilizer, pesticide records, EU banned substances check"
    },
    {
      "id": "farm-records",
      "name": "Farm Records Validation",
      "price": { "amount": "0.03", "currency": "HBAR" },
      "description": "Harvest, sales, labor, land ownership document verification"
    },
    {
      "id": "counterfeit",
      "name": "Counterfeit & Fraud Detection",
      "price": { "amount": "0.05", "currency": "HBAR" },
      "description": "Input fraud and volume anomaly detection"
    },
    {
      "id": "compliance",
      "name": "EUDR Compliance Scoring",
      "price": { "amount": "0.04", "currency": "HBAR" },
      "description": "Readiness score across all EUDR dimensions"
    },
    {
      "id": "report",
      "name": "DDS Report Generation",
      "price": { "amount": "0.15", "currency": "HBAR" },
      "description": "Export-ready EUDR Due Diligence Statement"
    }
  ]
}
```

---

### 7.3 MPP — Multi-Party Payments (Showcase Feature)

The full cooperative verification costs `0.45 HBAR`. MPP settles automatically, splitting across all 7 agents in a single transaction:

```typescript
// packages/mpp/src/split.ts
export const FULL_VERIFICATION_SPLIT: MppSplit = {
  totalHbar: 0.45,
  recipients: [
    { agentId: "geolocation", accountId: process.env.GEOLOCATION_ACCOUNT!, shareHbar: 0.05 },
    { agentId: "deforestation", accountId: process.env.DEFORESTATION_ACCOUNT!, shareHbar: 0.10 },
    { agentId: "agronomy", accountId: process.env.AGRONOMY_ACCOUNT!, shareHbar: 0.03 },
    { agentId: "farm-records", accountId: process.env.FARM_RECORDS_ACCOUNT!, shareHbar: 0.03 },
    { agentId: "counterfeit", accountId: process.env.COUNTERFEIT_ACCOUNT!, shareHbar: 0.05 },
    { agentId: "compliance", accountId: process.env.COMPLIANCE_ACCOUNT!, shareHbar: 0.04 },
    { agentId: "report", accountId: process.env.REPORT_ACCOUNT!, shareHbar: 0.15 },
  ],
};

// Executes as a single Hedera CryptoTransfer with 7 debit+credit pairs
async function executeMppSplit(split: MppSplit, payerAccountId: string) {
  await kit.transferHbar(
    split.recipients.map(r => ({
      from: payerAccountId,
      to: r.accountId,
      amount: r.shareHbar,
    }))
  );
}
```

**HTTP 402 gate** on the report endpoint triggers MPP:

```typescript
// apps/web/app/api/report/route.ts
export async function POST(req: NextRequest) {
  const paymentToken = req.headers.get("X-Payment-Token");

  if (!paymentToken) {
    return new Response(JSON.stringify({
      error: "Payment required",
      payment_details: {
        amount: 0.45,
        currency: "HBAR",
        split: FULL_VERIFICATION_SPLIT.recipients,
        payment_url: "/api/payment/request",
      },
    }), { status: 402 });
  }

  const valid = await verifyPaymentToken(paymentToken);
  if (!valid) return new Response("Invalid payment token", { status: 402 });

  return runFullVerification(req);
}
```

---

## 8. Hedera-Native Features

### HCS — Immutable Compliance Audit Trail

Every agent action writes to a dedicated HCS topic. The audit trail is exportable as EUDR evidence:

```typescript
async function logToHCS(eventType: EudrEvent, data: Record<string, unknown>) {
  await kit.submitMessageToTopic(
    process.env.HCS_EUDR_TOPIC_ID!,
    JSON.stringify({
      eventType,           // "FARM_VERIFIED" | "DEFORESTATION_CLEARED" | "COMPLIANCE_SCORED" | "DDS_GENERATED"
      timestamp: Date.now(),
      cooperativeId: data.cooperativeId,
      farmId: data.farmId,
      agentId: data.agentId,
      result: data.result,
      txId: data.txId,
    })
  );
}
```

### HTS — TracePass NFT

On successful compliance (score ≥ 65%), Guardian issues a soulbound TracePass NFT:

```typescript
async function issueTracePassNFT(cooperativeId: string, score: number) {
  const tokenId = await kit.createToken({
    name: `TracePass — ${cooperativeId}`,
    symbol: "TPASS",
    tokenType: "NON_FUNGIBLE_UNIQUE",
    supplyKey: kit.operatorKey,
    metadata: JSON.stringify({
      cooperativeId,
      eudrScore: score,
      verifiedDate: new Date().toISOString(),
      hcsTopicId: process.env.HCS_EUDR_TOPIC_ID,
      commodity: "coffee",
    }),
  });

  await kit.mintToken(tokenId, [Buffer.from(`DDS-${cooperativeId}-${Date.now()}`)]);
  return tokenId;
}
```

---

## 9. Killer Demo Scenario — Coffee Cooperative

**Setup:** Zigotrace Coffee Cooperative (Kenya) — 12 farms, 2026 harvest season, preparing for EU market entry

**Demo script (5 minutes):**

```
Step 1:  User uploads cooperative data package
         (GPS polygons × 12, scouting reports, fertilizer logs, pesticide records)

Step 2:  EUDR Guardian detects: 2 farms missing polygon data
         → Requests Geolocation Agent service: 0.05 HBAR × 12 = 0.60 HBAR
         → User approves in HashConnect wallet

Step 3:  Geolocation Agent runs
         → 10 farms: PASS
         → Farm F007: polygon area < 4 ha (minimum required)
         → Farm F011: polygon incomplete — only 3 vertices

Step 4:  Deforestation Agent runs on all 12 farms
         → 11 farms: PASS (no forest loss since Dec 2020)
         → Farm F003: 0.8 ha forest loss detected in 2022 — RED FLAG

Step 5:  Agronomy Agent runs
         → Farm F005: Chlorpyrifos detected in pesticide records
           → EU banned substance since 2020 — RED FLAG
         → All other farms: PASS

Step 6:  Counterfeit Agent runs on cooperative batch
         → Total reported: 84 tonnes
         → Sum of farm maximum yields: 81 tonnes
         → Anomaly factor: 1.04 — within acceptable range: PASS

Step 7:  Compliance Agent scores cooperative:
         → Readiness Score: 78% (Intermediate Readiness)
         → Red Flags: 2 (deforestation on F003, banned pesticide on F005)

Step 8:  User triggers "Generate EUDR Report" — 0.45 HBAR
         → MPP splits to all 7 agents automatically
         → One transaction, 7 recipients

Step 9:  DDS Report renders in browser
         → Readiness: 78%
         → F003: excluded from batch pending remediation
         → F005: remediation plan (pesticide substitution)
         → 10 remaining farms: export-eligible

Step 10: HCS audit trail displayed with topic explorer link
         TracePass NFT issued: 0.0.XXXXXX
         → Proof of compliance minted on Hedera
```

---

## 10. Frontend Implementation

### Upload Panel

Farm data intake — supports JSON upload or manual entry:

```tsx
// apps/web/app/components/UploadPanel.tsx
type FarmPackage = {
  cooperativeId: string;
  commodity: string;
  farms: Farm[];
  fertilizerLogs: InputRecord[];
  pesticideLogs: InputRecord[];
  harvestRecords: HarvestRecord[];
};
```

### Agent Activity Feed

Real-time stream of ACP messages as agents fire:

```
[10:42:01] Guardian Agent: Analyzing 12 farms...
[10:42:03] → Geolocation Agent: Verifying GPS polygons (0.05 HBAR)
[10:42:03]   Payment requested — awaiting wallet approval
[10:42:07]   ✅ Payment confirmed: 0.0.12345@1234567890.123456789
[10:42:09]   Farm F001: PASS | Farm F007: FAIL (area < 4ha)
[10:42:11] → Deforestation Agent: Scanning forest layers (0.10 HBAR × 12)
...
```

### EUDR Report Panel

Full rendered DDS report with:
- Readiness score gauge (0–100%)
- Farm-by-farm verification table
- Red flag cards with remediation recommendations
- HCS topic link + TracePass NFT token ID
- Export to PDF button

---

## 11. Development Phases

### Phase 1 — Foundation (Day 1–2)
- [ ] Init Turborepo monorepo, configure TypeScript
- [ ] Hedera testnet accounts: 1 master + 7 specialist agent accounts
- [ ] Fund all accounts with testnet HBAR
- [ ] Basic Hedera Agent Kit setup: HBAR transfer + HCS topic + HTS token
- [ ] Next.js scaffold with shadcn/ui

### Phase 2 — Agent Core (Day 2–3)
- [ ] Guardian Master Agent (LangChain + Claude claude-sonnet-4-6)
- [ ] All 7 specialist agent tools (analysis logic + payment gate)
- [ ] AP2 module: PaymentRequest / PaymentResponse schemas
- [ ] HCS audit logger for all events

### Phase 3 — Commerce Layer (Day 3–4)
- [ ] MPP split payment: 7-way CryptoTransfer
- [ ] HTTP 402 middleware for report endpoint
- [ ] ACP service catalog + checkout endpoint
- [ ] HashConnect wallet integration

### Phase 4 — Frontend (Day 4–5)
- [ ] Upload Panel with farm data parsing
- [ ] Agent Activity Feed (SSE streaming)
- [ ] PaymentModal with split breakdown display
- [ ] EUDR Report Panel with PDF export
- [ ] TracePass NFT display + HCS explorer link

### Phase 5 — Polish + Deploy (Day 5–6)
- [ ] Full end-to-end demo with coffee cooperative dataset
- [ ] README with architecture diagram + demo video
- [ ] Deploy to Vercel, smoke test live URL
- [ ] File GitHub feedback issue on Hedera Agent Kit
- [ ] Submit to ai-bounties.hedera.com

---

## 12. Differentiators vs. Typical Entries

| Most submissions | **EUDR Guardian** |
|---|---|
| Single payment flow | MPP 7-way split in one Hedera CryptoTransfer |
| Generic AI chatbot | Domain-specific compliance engine solving a $100B export problem |
| One agent, one service | 7 specialist agents, each selling a distinct real-world verification |
| HCS as afterthought | HCS as the legal evidence backbone for EU customs |
| Demo shows a chatbot | Demo shows a cooperative becoming export-eligible in 5 minutes |
| Charges for AI outputs | Charges for economic services: geolocation, deforestation, fraud detection |
| No novel detection | Counterfeit input detection + volume fraud anomalies = genuinely new |

---

## 13. Judging Alignment

**Technical Quality (25%):** TypeScript monorepo, 7 fully-typed specialist agents, clean AP2/ACP/MPP modules, Hedera Agent Kit throughout, HCS + HTS integration.

**Use of AI Studio (25%):** Claude claude-sonnet-4-6 runs every agent — Master Guardian orchestration, geolocation reasoning, deforestation analysis, agronomy document parsing, counterfeit pattern detection, compliance scoring, natural language DDS generation. All via structured tool calling with Vercel AI SDK streaming.

**Feasibility (20%):** No satellite API dependency — all verification is AI reasoning over farmer-submitted documents. Testnet demo with real HBAR transfers. Vercel + Upstash = zero-cost hosting.

**Innovation (15%):** First agent system to apply AP2 + ACP + MPP to agricultural compliance. Counterfeit detection and volume fraud analysis are novel and directly relevant to EUDR enforcement.

**Demo Quality (15%):** Coffee cooperative golden path — farmer uploads data, 7 agents fire, 2 red flags caught, MPP split payment, TracePass NFT minted, HCS audit trail shown.

---

## 14. GitHub Feedback Issue

File on [`hedera-dev/hedera-agent-kit`](https://github.com/hedera-dev/hedera-agent-kit/issues):

**Title:** `[Feedback] Week 4 Bounty — Multi-Agent Commerce: missing batch CryptoTransfer + payment verification helper`

**Body:**
> While building EUDR Guardian, a 7-agent supply chain compliance network, I found three gaps in the kit:
> 1. **Batch CryptoTransfer** — MPP splits require transferring HBAR to 7 recipients simultaneously. The current API requires individual transfers; a batch API matching the Hedera SDK's `TransferTransaction` multi-debit/credit would be ideal.
> 2. **`verifyTransfer(txId, expectedAmount, expectedReceiver)` helper** — currently requires manual Mirror Node HTTP calls to confirm payment before executing a gated service.
> 3. **HCS message pagination** — `getTopicMessages()` returns only the latest batch; audit log reconstruction for EUDR evidence requires full history.
>
> All three would significantly improve multi-agent payment use cases. Happy to contribute PRs.

---

## 15. Environment Variables Checklist

```env
# Hedera — Master Agent
HEDERA_OPERATOR_ID=
HEDERA_OPERATOR_KEY=
HEDERA_NETWORK=testnet
HCS_EUDR_TOPIC_ID=
HTS_TRACEPASS_TOKEN_ID=

# Hedera — Specialist Agent Accounts (each holds their earned HBAR)
GEOLOCATION_ACCOUNT=
DEFORESTATION_ACCOUNT=
AGRONOMY_ACCOUNT=
FARM_RECORDS_ACCOUNT=
COUNTERFEIT_ACCOUNT=
COMPLIANCE_ACCOUNT=
REPORT_ACCOUNT=

# AI
ANTHROPIC_API_KEY=

# Session
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Frontend
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_GUARDIAN_ACCOUNT=
```

---

## 16. Submission Checklist

- [ ] Public GitHub repo with commits dated June 8–14, 2026
- [ ] `README.md`: architecture diagram, live demo URL, setup instructions, protocol integration docs
- [ ] Live demo URL on Vercel (90+ days uptime)
- [ ] GitHub feedback issue filed on `hedera-dev/hedera-agent-kit`
- [ ] Submission form completed on ai-bounties.hedera.com
- [ ] Demo video (screen recording, 3–4 min): coffee cooperative golden path
- [ ] Coffee cooperative sample dataset included in `/demo-data/`
