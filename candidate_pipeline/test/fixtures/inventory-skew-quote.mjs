export function inventorySkewQuote(fairValue, inventory, skewCents) {
  let centerCents = Math.round(fairValue * 100);
  if (inventory > 0) centerCents -= skewCents;
  else if (inventory < 0) centerCents += skewCents;
  centerCents = Math.max(0, Math.min(centerCents, 100));
  return {
    bidPrice: Math.max(centerCents - 3, 0) / 100,
    bidQuantity: 2,
    offerPrice: Math.min(centerCents + 3, 100) / 100,
    offerQuantity: 2,
  };
}
