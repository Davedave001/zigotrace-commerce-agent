export interface SplitRecipient {
  agentId: string;
  accountId: string;
  shareHbar: number;
}

export interface MppSplit {
  totalHbar: number;
  recipients: SplitRecipient[];
}

/** Full cooperative verification split — 0.45 HBAR across all 7 agents */
export function buildFullVerificationSplit(accounts: Record<string, string>): MppSplit {
  const recipients: SplitRecipient[] = [
    { agentId: "geolocation", accountId: accounts.geolocation, shareHbar: 0.05 },
    { agentId: "deforestation", accountId: accounts.deforestation, shareHbar: 0.10 },
    { agentId: "agronomy", accountId: accounts.agronomy, shareHbar: 0.03 },
    { agentId: "farm-records", accountId: accounts.farmRecords, shareHbar: 0.03 },
    { agentId: "counterfeit", accountId: accounts.counterfeit, shareHbar: 0.05 },
    { agentId: "compliance", accountId: accounts.compliance, shareHbar: 0.04 },
    { agentId: "report", accountId: accounts.report, shareHbar: 0.15 },
  ];

  const total = recipients.reduce((sum, r) => sum + r.shareHbar, 0);
  return { totalHbar: Math.round(total * 100) / 100, recipients };
}
