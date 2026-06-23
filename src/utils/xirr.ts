function xnpv(rate: number, flows: Array<{ date: Date; amount: number }>): number {
  const t0 = flows[0].date.getTime();
  return flows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0) / (365.25 * 24 * 3600 * 1000);
    return sum + cf.amount / Math.pow(1 + rate, years);
  }, 0);
}

function xnpvDeriv(rate: number, flows: Array<{ date: Date; amount: number }>): number {
  const t0 = flows[0].date.getTime();
  return flows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0) / (365.25 * 24 * 3600 * 1000);
    return sum - (years * cf.amount) / Math.pow(1 + rate, years + 1);
  }, 0);
}

/**
 * Calculate XIRR (Extended Internal Rate of Return) for a series of cash flows.
 * cashFlows: deposits (positive amounts, will be negated as outflows)
 * currentValue: final portfolio value (inflow)
 */
export function calcXIRR(
  cashFlows: ReadonlyArray<{ date: string; amount: number }>,
  currentValue: number
): number | null {
  if (cashFlows.length === 0 || currentValue <= 0) return null;

  const today = new Date();
  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));

  const flows: Array<{ date: Date; amount: number }> = [
    ...sorted.map((cf) => ({ date: new Date(cf.date + 'T12:00:00'), amount: -cf.amount })),
    { date: today, amount: currentValue },
  ];

  // Newton-Raphson iteration starting at 10% guess
  let rate = 0.1;
  for (let i = 0; i < 300; i++) {
    const npv = xnpv(rate, flows);
    const deriv = xnpvDeriv(rate, flows);
    if (Math.abs(deriv) < 1e-14) break;
    const next = rate - npv / deriv;
    if (Math.abs(next - rate) < 1e-8) {
      return Math.abs(xnpv(next, flows)) < 0.01 ? next : null;
    }
    if (next < -0.99 || next > 100) break;
    rate = next;
  }
  return null;
}
