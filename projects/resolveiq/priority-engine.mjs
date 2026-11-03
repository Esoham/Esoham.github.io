/** ResolveIQ: deterministic, explainable ticket triage. No external AI service. */
export function prioritize(ticket) {
  if (!ticket || typeof ticket.id !== 'string') throw new TypeError('Ticket id required');
  const age = ticket.ageDays, impact = ticket.impactedCount;
  if (!Number.isInteger(age) || age < 0 || !Number.isInteger(impact) || impact < 0) throw new TypeError('Invalid age or impact');
  let score = 0;
  const reasons = [];
  const actions = [];
  if (ticket.blocked === true) { score += 45; reasons.push('Customer workflow blocked'); actions.push('Investigate blocker and establish workaround'); }
  if (impact >= 5) { score += 35; reasons.push(impact + ' users or orders potentially affected'); actions.push('Assess breadth and escalate impact'); }
  if (age >= 3) { score += age >= 5 ? 25 : 15; reasons.push('Waiting ' + age + ' days'); actions.push('Send status update and confirm next owner'); }
  if (ticket.category === 'Billing') actions.push('Validate invoice or refund against policy');
  if (ticket.category === 'Fulfillment') actions.push('Check carrier and fulfillment timeline');
  if (ticket.category === 'Technical') actions.push('Reproduce the reported issue');
  if (reasons.length === 0) reasons.push('Standard support request');
  return { ...ticket, score, priority: score >= 70 ? 'Urgent' : score >= 35 ? 'High' : 'Normal', reasons, actions: [...new Set(actions)] };
}
export function prioritizeQueue(tickets) {
  if (!Array.isArray(tickets)) throw new TypeError('Expected array');
  return tickets.map(prioritize).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id));
}
