# EUDR Guardian — Hedera Food Traceability Commerce Agent

> An autonomous compliance agent that verifies food supply chains, detects counterfeit and compliance risks, coordinates specialist agents, and generates export-ready EUDR due diligence reports through HBAR-powered agent commerce.

Built for **Hedera AI Bounty Week 4 — Commerce Agent**.

**Live demo:** [eudr-guardian.vercel.app](https://eudr-guardian.vercel.app) *(coming soon)*

---

## What it does

The EU Deforestation Regulation (EUDR) requires coffee, cocoa, palm oil, soy, rubber, cattle, and timber exporters to prove their supply chains are not linked to deforestation after December 31, 2020. Compliance requires geospatial verification, agronomy audits, and a formal Due Diligence Statement — currently a slow, manual process.

EUDR Guardian automates the entire compliance workflow through a network of 7 specialist agents that each sell a distinct verification service for HBAR micropayments.

---

## Architecture

```
Cooperative uploads farm data
         ↓
  EUDR Guardian (Master Agent — Claude claude-sonnet-4-6)
         ↓
  ┌──────────────────────────────────────────────────┐
  │  ACP agent commerce — each agent charges HBAR    │
  │                                                  │
  │  Agent 1: Geolocation Verification  0.05 HBAR   │
  │  Agent 2: Deforestation Risk        0.10 HBAR   │
  │  Agent 3: Agronomy Compliance       0.03 HBAR   │
  │  Agent 4: Farm Records Validation   0.03 HBAR   │
  │  Agent 5: Counterfeit Detection     0.05 HBAR   │
  │  Agent 6: EUDR Compliance Scoring   0.04 HBAR   │
  │  Agent 7: DDS Report Generation     0.15 HBAR   │
  └──────────────────────────────────────────────────┘
         ↓
  MPP split: 0.45 HBAR → 7 accounts (1 CryptoTransfer)
         ↓
  HCS immutable audit trail
         ↓
  TracePass NFT minted (if score ≥ 65%)
         ↓
  EUDR Due Diligence Statement
```

---

## Hedera Features

| Feature | Usage |
|---|---|
| **HBAR** | Per-service micropayments + MPP 7-way split |
| **HCS** | Immutable compliance audit trail for every verification event |
| **HTS** | TracePass NFT — on-chain proof of EUDR compliance |
| **Hedera Agent Kit** | Native SDK integration throughout |

---

## Protocol Integration

| Protocol | Implementation |
|---|---|
| **AP2** | `PaymentRequest`/`PaymentResponse` Zod-typed schemas. Every specialist agent issues an AP2 message before executing. |
| **ACP** | OpenAPI-compliant service catalog at `GET /api/services`. Any ACP-compatible agent can discover and purchase these verification services. |
| **MPP** | HTTP 402 gate on `/api/report`. Full verification triggers a single 7-way `CryptoTransfer` splitting 0.45 HBAR across all agent accounts. |

---

## Agent Commerce Flow

```
1. Cooperative uploads GPS polygons, scouting reports, input logs
2. Guardian detects farms and commodities
3. For each specialist agent:
   a. Guardian requests quote (AP2 PaymentRequest)
   b. User approves HBAR transfer in HashConnect
   c. Agent executes verification
   d. Result streamed to UI via SSE
4. All 7 agents complete → MPP split fires
5. Compliance score calculated across 6 EUDR dimensions
6. DDS report generated
7. TracePass NFT minted on Hedera
8. HCS topic contains full immutable audit history
```

---

## Counterfeit Detection (Novel Feature)

Agent 5 detects two classes of supply chain fraud:

**Input fraud** — cross-references pesticide/fertilizer claims against application rates and procurement plausibility:
```
Farmer claims: Yara YaraMila ACTYVA
Detected: application rate 3x manufacturer maximum
Flag: Counterfeit or mislabeled fertilizer
```

**Volume fraud** — compares cooperative aggregate volume against sum of mapped farm capacities:
```
Cooperative reports: 100 tonnes
Sum of farm max yields: 38 tonnes
Flag: Volume anomaly 2.6x — potential mixed-origin produce
```

---

## Demo Scenario — Zigotrace Coffee Cooperative

Built-in demo dataset (`demo` toggle in UI):

- 6 farms, Kenya, 2025 harvest season
- Farm F005 has EU-banned pesticide (Chlorpyrifos) — detected by Agent 3
- All farms deforestation-clear (Kenya Highland coffee zone)
- Volume within expected range — no fraud flag
- Expected output: **~82% readiness**, 1 red flag, 5 export-eligible farms

---

## Setup

### Prerequisites
- Node.js 20+
- Hedera testnet account (free at [portal.hedera.com](https://portal.hedera.com))
- Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/Davedave001/zigotrace-commerce-agent
cd zigotrace-commerce-agent
npm install
```

### 2. Configure environment

```bash
cp .env.example apps/web/.env.local
# Fill in HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, ANTHROPIC_API_KEY
```

### 3. Create Hedera resources (one-time)

```bash
# Create HCS topic for audit trail
npx ts-node scripts/setup-hedera.ts
# Saves HCS_EUDR_TOPIC_ID to output
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 5. Run demo

1. Open [localhost:3000](http://localhost:3000)
2. Check "Use Zigotrace Coffee Cooperative demo dataset"
3. Click "Start EUDR Verification"
4. Watch 7 agents fire in the activity feed
5. EUDR Report appears on the right with TracePass NFT ID

---

## Repository Structure

```
eudr-guardian/
├── apps/web/                        # Next.js 15 frontend + API
│   └── app/
│       ├── api/
│       │   ├── guardian/            # SSE Master Agent orchestrator
│       │   ├── services/            # ACP catalog endpoint
│       │   ├── checkout/            # ACP checkout endpoint
│       │   └── payment/             # AP2 request + Mirror Node verify
│       ├── components/              # UI: Upload, Feed, Report, Wallet
│       └── lib/
│           ├── specialist-agents/   # 7 Claude-powered agents
│           ├── hedera.ts            # HCS, HTS, CryptoTransfer
│           ├── hcs-logger.ts        # Non-blocking audit events
│           ├── scoring.ts           # EUDR readiness scoring model
│           └── demo-data.ts         # Zigotrace Coffee Cooperative dataset
├── packages/
│   ├── ap2/                         # AP2 PaymentRequest/Response schemas
│   ├── acp/                         # Service catalog + checkout types
│   └── mpp/                         # HTTP 402 gate + 7-way split routing
└── IMPLEMENTATION_PLAN.md
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

Key ones:
```env
HEDERA_OPERATOR_ID=        # Master agent Hedera account
HEDERA_OPERATOR_KEY=       # Ed25519 private key (DER encoded)
HEDERA_NETWORK=testnet
HCS_EUDR_TOPIC_ID=         # Created via Hedera Portal or SDK
ANTHROPIC_API_KEY=         # Powers all 7 specialist agents
# ... 7 specialist agent account IDs for MPP splits
```

---

## Hedera Agent Kit Feedback

Filed at [`hedera-dev/hedera-agent-kit`](https://github.com/hedera-dev/hedera-agent-kit/issues):

**Title:** `[Feedback] Week 4 Bounty — Multi-Agent Commerce: missing batch CryptoTransfer + payment verification helper`

Gaps discovered while building:
1. No batch `CryptoTransfer` helper — MPP 7-way splits require individual `addHbarTransfer` calls; a batch API would simplify multi-agent payment settlement
2. No `verifyTransfer(txId, expectedAmount, receiver)` — Mirror Node HTTP calls required manually
3. `getTopicMessages()` lacks pagination — full audit log reconstruction is fragile

---

## License

MIT
