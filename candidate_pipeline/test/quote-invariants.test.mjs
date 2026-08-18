import assert from "node:assert/strict";
import test from "node:test";

import { inventorySkewQuote } from "./fixtures/inventory-skew-quote.mjs";

test("inventory-skew fixture keeps boundary quotes valid for the tuning grid", () => {
  for (const fairValue of [0, 1]) {
    for (const inventory of [-1, 0, 1]) {
      for (const skewCents of [0, 1, 2, 3, 4, 6]) {
        const quote = inventorySkewQuote(fairValue, inventory, skewCents);
        const context = `fair=${fairValue}, inventory=${inventory}, skew=${skewCents}`;
        assert.ok(0 <= quote.bidPrice && quote.bidPrice < quote.offerPrice, context);
        assert.ok(quote.offerPrice <= 1, context);
        assert.ok(Math.abs(Math.round(quote.bidPrice * 100) - quote.bidPrice * 100) < 1e-9, context);
        assert.ok(Math.abs(Math.round(quote.offerPrice * 100) - quote.offerPrice * 100) < 1e-9, context);
        assert.ok(quote.bidQuantity > 0 && quote.offerQuantity > 0, context);
      }
    }
  }
});
