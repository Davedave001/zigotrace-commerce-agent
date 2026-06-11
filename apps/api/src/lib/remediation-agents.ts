import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

export interface DimensionScore {
  pct: number;
  level: string;
  redFlags?: string[];
}

export interface ScanBreakdown {
  geo: DimensionScore;
  legality: DimensionScore;
  dueDiligence: DimensionScore;
  riskManagement: DimensionScore;
  profile: DimensionScore;
}

export interface CorrectiveAction {
  dimension: string;
  score: number;
  level: string;
  priorityActions: string[];
  zigotraceService: string;
  serviceLink: string;
  hbarCharged: number;
}

async function askClaude(prompt: string, fallback: string[]): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : fallback;
  } catch {
    return fallback;
  }
}

export async function remediateGeolocation(
  breakdown: ScanBreakdown,
  rawAnswers: Record<string, unknown>,
  userType: string
): Promise<CorrectiveAction> {
  const { geo } = breakdown;
  const relevantAnswers = Object.fromEntries(
    Object.entries(rawAnswers).filter(([k]) => k.includes("geo") || k.includes("q5") || k.includes("q6") || k.includes("q7") || k.includes("q8"))
  );

  const actions = await askClaude(
    `You are an EUDR Geolocation & Traceability specialist.
A ${userType} scored ${geo.pct}% on Geolocation & Traceability (${geo.level}).
Red flags: ${(geo.redFlags ?? []).join(", ") || "none"}.
Their answers: ${JSON.stringify(relevantAnswers)}.

Give exactly 3 specific, actionable corrective steps achievable in 60 days.
Step 1 must reference TerraTrace app (https://zigotrace.com/terratrace) for GPS farm mapping.
Steps must be direct instructions, not advice.
Return ONLY a JSON array of 3 strings.`,
    [
      "Download the TerraTrace app (zigotrace.com/terratrace) and walk your farm boundary to record a GPS polygon — this takes 1–2 hours.",
      "Start a farm diary: record every harvest with the date, plot name, and volume in kilograms. A simple notebook works.",
      "Contact your cooperative to register your farm and link your GPS records to their traceability system.",
    ]
  );

  return {
    dimension: "Geolocation & Traceability",
    score: geo.pct,
    level: geo.level,
    priorityActions: actions,
    zigotraceService: "TerraTrace GPS Farm Mapping",
    serviceLink: "https://zigotrace.com/terratrace",
    hbarCharged: 0.08,
  };
}

export async function remediateLegality(
  breakdown: ScanBreakdown,
  rawAnswers: Record<string, unknown>,
  userType: string
): Promise<CorrectiveAction> {
  const { legality } = breakdown;
  const relevantAnswers = Object.fromEntries(
    Object.entries(rawAnswers).filter(([k]) => k.includes("legal") || k.includes("q9") || k.includes("q10") || k.includes("q11"))
  );

  const actions = await askClaude(
    `You are an EUDR Legality compliance specialist.
A ${userType} scored ${legality.pct}% on Legality (${legality.level}).
Red flags: ${(legality.redFlags ?? []).join(", ") || "none"}.
Their answers: ${JSON.stringify(relevantAnswers)}.

Give exactly 3 specific corrective steps for land rights, labour law, and legal documentation.
Step 3 must mention contacting Akili Green (akili-green.com) for legal support.
Return ONLY a JSON array of 3 strings.`,
    [
      "Visit your local land registry or cooperative office to obtain a land title deed, lease agreement, or customary land rights certificate.",
      "Create a written record of all hired workers including their names, payment amounts, and working days — keep copies for 5 years.",
      "Contact Akili Green (akili-green.com) for guidance on legally documenting your land-use rights and labour compliance.",
    ]
  );

  return {
    dimension: "Legality",
    score: legality.pct,
    level: legality.level,
    priorityActions: actions,
    zigotraceService: "Akili Green Legal & Compliance Support",
    serviceLink: "https://akili-green.com/contact",
    hbarCharged: 0.07,
  };
}

export async function remediateDueDiligence(
  breakdown: ScanBreakdown,
  rawAnswers: Record<string, unknown>,
  userType: string
): Promise<CorrectiveAction> {
  const { dueDiligence } = breakdown;
  const relevantAnswers = Object.fromEntries(
    Object.entries(rawAnswers).filter(([k]) => k.includes("due") || k.includes("q12") || k.includes("q13") || k.includes("q14") || k.includes("q15") || k.includes("q16") || k.includes("q17") || k.includes("q18") || k.includes("q19") || k.includes("q20"))
  );

  const actions = await askClaude(
    `You are an EUDR Due Diligence specialist focused on deforestation risk and supply chain traceability.
A ${userType} scored ${dueDiligence.pct}% on Due Diligence (${dueDiligence.level}).
Red flags: ${(dueDiligence.redFlags ?? []).join(", ") || "none"}.
Their answers: ${JSON.stringify(relevantAnswers)}.

Give exactly 3 corrective steps for deforestation risk, buyer traceability, and DDS preparation.
Step 2 must mention that production linked to post-December 2020 deforestation cannot enter the EU market.
Return ONLY a JSON array of 3 strings.`,
    [
      "Contact your main buyer and ask them to share the specific data requirements they need from you — start collecting this information immediately.",
      "If any part of your farm was cleared from forest after December 31, 2020, that land cannot supply EU-bound produce — segregate produce from those plots now.",
      "Work with your cooperative to document the full chain: your farm → collection point → processor → exporter. This chain must be traceable for every delivery.",
    ]
  );

  return {
    dimension: "Due Diligence",
    score: dueDiligence.pct,
    level: dueDiligence.level,
    priorityActions: actions,
    zigotraceService: "ZigoTrace Supply Chain Verification",
    serviceLink: "https://zigotrace.com/eudr-scan",
    hbarCharged: 0.19,
  };
}

export async function remediateRiskManagement(
  breakdown: ScanBreakdown,
  rawAnswers: Record<string, unknown>,
  userType: string
): Promise<CorrectiveAction> {
  const { riskManagement } = breakdown;
  const relevantAnswers = Object.fromEntries(
    Object.entries(rawAnswers).filter(([k]) => k.includes("risk") || k.includes("q14") || k.includes("q15") || k.includes("q16") || k.includes("q17") || k.includes("q21") || k.includes("q22") || k.includes("q23") || k.includes("q24") || k.includes("q25") || k.includes("q26"))
  );

  const actions = await askClaude(
    `You are an EUDR Risk Management specialist.
A ${userType} scored ${riskManagement.pct}% on Risk Management (${riskManagement.level}).
Red flags: ${(riskManagement.redFlags ?? []).join(", ") || "none"}.
Their answers: ${JSON.stringify(relevantAnswers)}.

Give exactly 3 corrective steps for EUDR awareness, sustainability certification, and compliance support.
Mention the December 2026 deadline specifically.
Step 3 must mention contacting Akili Green for training.
Return ONLY a JSON array of 3 strings.`,
    [
      "Read the EUDR requirements for your commodity at the EU Commission website — the December 2026 enforcement deadline is approaching fast.",
      "Ask your cooperative or buyer about joining a sustainability certification group such as Rainforest Alliance or Fairtrade — certified farms have most EUDR data already.",
      "Contact Akili Green (akili-green.com) to join a farmer training session on EUDR data requirements and compliance preparation.",
    ]
  );

  return {
    dimension: "Risk Management",
    score: riskManagement.pct,
    level: riskManagement.level,
    priorityActions: actions,
    zigotraceService: "Akili Green Farmer Training",
    serviceLink: "https://akili-green.com/training",
    hbarCharged: 0.07,
  };
}

export async function buildRemediationReport(
  submissionId: string,
  userType: string,
  overallScore: number,
  overallLevel: string,
  actions: CorrectiveAction[],
  hcsTxId: string | undefined,
  tracePassTokenId: string | null,
  submittedName?: string,
): Promise<RemediationReport> {
  const totalHbar = actions.reduce((sum, a) => sum + a.hbarCharged, 0) + 0.15;
  const topGap = [...actions].sort((a, b) => a.score - b.score)[0];

  const summary = await askClaude(
    `You are an EUDR compliance advisor. Write a 2-sentence executive summary for a ${userType} with overall EUDR readiness of ${overallScore}% (${overallLevel}).
Their biggest gap is ${topGap?.dimension} at ${topGap?.score}%.
Keep it direct and action-oriented. Return ONLY a JSON array with 1 string.`,
    [`Your EUDR readiness stands at ${overallScore}% — ${overallLevel}. Prioritise improving ${topGap?.dimension} immediately to protect your EU market access before the December 2026 deadline.`]
  );

  return {
    submissionId,
    overallScore,
    overallLevel,
    totalHbarCharged: Math.round(totalHbar * 100) / 100,
    hcsTxId,
    tracePassTokenId,
    correctiveActions: actions,
    summaryStatement: summary[0] ?? "",
    generatedAt: new Date().toISOString(),
    ddsReference: `ZT-REM-${submissionId.slice(0, 8).toUpperCase()}`,
    submittedName,
  };
}

export interface RemediationReport {
  submissionId: string;
  overallScore: number;
  overallLevel: string;
  totalHbarCharged: number;
  hcsTxId: string | undefined;
  tracePassTokenId: string | null;
  correctiveActions: CorrectiveAction[];
  summaryStatement: string;
  generatedAt: string;
  ddsReference: string;
  submittedName?: string;
}
