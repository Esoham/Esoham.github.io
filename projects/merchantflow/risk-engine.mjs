/**
 * MerchantFlow deterministic exception scoring.
 * Input data must follow the normalized contract to the explicit contract below.
 * All dates are absolute; elapsed calendar days are computed in UTC.
 * No personally identifiable customer data is accepted.
 *
 * @typedef {{ id:string, createdAt:string, fulfillmentStatus:'fulfilled'|'unfulfilled'|'partial',
 * requiredQuantity:number, availableQuantity:number|null,
 * manualAttention?:boolean, inventoryTracked?:boolean }} MerchantOrder
 */
export function evaluateOrder(order, now = new Date()) {
  if (!order || !order.id || !order.createdAt) throw new TypeError('Valid order with id and createdAt required');
  if (order.fulfillmentStatus === 'fulfilled') return null;
  const created = new Date(order.createdAt);
  const reference = new Date(now);
  if (Number.isNaN(created.valueOf()) || Number.isNaN(reference.valueOf())) throw new TypeError('Invalid date');
  const daysOpen = Math.max(0, Math.floor((reference.valueOf() - created.valueOf()) / 86400000));
  const reasons = [];
  const actions = [];
  let score = 0;
  const inventoryKnown = order.inventoryTracked !== false &&
    Number.isFinite(order.availableQuantity) &&
    Number.isFinite(order.requiredQuantity) &&
    order.requiredQuantity > 0;
  if (inventoryKnown && order.availableQuantity < order.requiredQuantity) {
    score += 60;
    reasons.push('Inventory shortage: ' + order.availableQuantity + ' available for ' + order.requiredQuantity + ' required');
    actions.push('Confirm stock by fulfillment location and check replenishment');
  }
  if (daysOpen >= 3) {
    score += daysOpen >= 5 ? 45 : 25;
    reasons.push('Unfulfilled for ' + daysOpen + ' days');
    actions.push('Verify picking and shipping timeline');
  }
  if (order.manualAttention === true) {
    score += 20;
    reasons.push('Order marked for manual attention');
    actions.push('Review merchant notes');
  }
  if (score === 0) return null;
  return {
    orderId: String(order.id),
    score,
    priority: score >= 60 ? 'high' : score >= 25 ? 'medium' : 'low',
    reasons,
    recommendedActions: actions,
    daysOpen
  };
}

export function buildExceptionQueue(orders, now = new Date()) {
  if (!Array.isArray(orders)) throw new TypeError('orders must be an array');
  return orders.map(order => evaluateOrder(order, now))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.orderId.localeCompare(b.orderId));
}
