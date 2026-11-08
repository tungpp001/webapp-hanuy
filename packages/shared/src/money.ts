import { DiscountType, PriceInheritanceMode } from './enums.js';

/**
 * Ensures a monetary value is a valid non-negative safe integer in VND.
 * Floating-point numbers are strictly forbidden for currency storage.
 */
export function assertIntegerVnd(amountVnd: number, fieldName = 'amountVnd'): number {
  if (!Number.isSafeInteger(amountVnd)) {
    throw new Error(`${fieldName} must be an integer VND amount (got ${amountVnd})`);
  }
  if (amountVnd < 0) {
    throw new Error(`${fieldName} cannot be negative (got ${amountVnd})`);
  }
  return amountVnd;
}

/**
 * Calculates total VND for a weight-based snail/seafood item.
 * Weight is expressed in kg up to 3 decimal places (grams).
 * Example: 0.92 kg * 450,000 VND/kg = 414,000 VND.
 */
export function calculateWeightBasedAmountVnd(
  weightKg: number,
  pricePerKgVnd: number
): {
  normalizedWeightGrams: number;
  normalizedWeightKg: number;
  amountVnd: number;
} {
  assertIntegerVnd(pricePerKgVnd, 'pricePerKgVnd');
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error(`weightKg must be a positive number (got ${weightKg})`);
  }
  const normalizedWeightGrams = Math.round(weightKg * 1000);
  if (normalizedWeightGrams <= 0) {
    throw new Error(`weightKg is too small (got ${weightKg})`);
  }
  const normalizedWeightKg = normalizedWeightGrams / 1000;
  // Exact integer arithmetic via grams to avoid binary float drift:
  // (grams * pricePerKgVnd) / 1000 rounded to nearest 1 VND
  const amountVnd = Math.round((normalizedWeightGrams * pricePerKgVnd) / 1000);
  assertIntegerVnd(amountVnd, 'amountVnd');
  return {
    normalizedWeightGrams,
    normalizedWeightKg,
    amountVnd,
  };
}

/**
 * Evaluates whether an actual weighed item exceeds the configured threshold compared
 * to the initial estimated weight/price, requiring explicit customer re-confirmation.
 */
export function requiresCustomerWeightReconfirmation(params: {
  initialEstimatedAmountVnd: number;
  actualAmountVnd: number;
  varianceThresholdPercent: number;
}): {
  requiresReconfirmation: boolean;
  increaseAmountVnd: number;
  increasePercent: number;
} {
  const { initialEstimatedAmountVnd, actualAmountVnd, varianceThresholdPercent } = params;
  assertIntegerVnd(initialEstimatedAmountVnd, 'initialEstimatedAmountVnd');
  assertIntegerVnd(actualAmountVnd, 'actualAmountVnd');

  if (actualAmountVnd <= initialEstimatedAmountVnd || initialEstimatedAmountVnd === 0) {
    return {
      requiresReconfirmation: true, // First-time weight entry always needs customer confirmation before kitchen
      increaseAmountVnd: Math.max(0, actualAmountVnd - initialEstimatedAmountVnd),
      increasePercent: 0,
    };
  }

  const increaseAmountVnd = actualAmountVnd - initialEstimatedAmountVnd;
  const increasePercent = (increaseAmountVnd / initialEstimatedAmountVnd) * 100;
  return {
    requiresReconfirmation: increasePercent > varianceThresholdPercent,
    increaseAmountVnd,
    increasePercent: Math.round(increasePercent * 100) / 100,
  };
}

/**
 * Calculates single invoice-level discount in integer VND.
 * Never allows discount to make invoice total negative.
 */
export function calculateInvoiceDiscountVnd(params: {
  subtotalVnd: number;
  discountType: DiscountType;
  discountValue: number;
}): {
  discountAmountVnd: number;
  finalTotalVnd: number;
} {
  const { subtotalVnd, discountType, discountValue } = params;
  assertIntegerVnd(subtotalVnd, 'subtotalVnd');

  if (discountType === 'NONE' || discountValue === 0) {
    return { discountAmountVnd: 0, finalTotalVnd: subtotalVnd };
  }

  if (!Number.isSafeInteger(discountValue) || discountValue < 0) {
    throw new Error(`discountValue must be a non-negative integer (got ${discountValue})`);
  }

  let discountAmountVnd = 0;
  if (discountType === 'AMOUNT') {
    if (discountValue > subtotalVnd) {
      throw new Error(
        `Discount amount (${discountValue} VND) cannot exceed subtotal (${subtotalVnd} VND)`
      );
    }
    discountAmountVnd = discountValue;
  } else if (discountType === 'PERCENT') {
    if (discountValue > 100) {
      throw new Error(`Discount percent cannot exceed 100% (got ${discountValue}%)`);
    }
    discountAmountVnd = Math.round((subtotalVnd * discountValue) / 100);
  }

  const finalTotalVnd = subtotalVnd - discountAmountVnd;
  assertIntegerVnd(finalTotalVnd, 'finalTotalVnd');
  return { discountAmountVnd, finalTotalVnd };
}

export interface SplitInvoicePart {
  partIndex: number; // 1-based index: 1..partsCount
  totalParts: number;
  subtotalVnd: number;
  discountAmountVnd: number;
  totalAmountVnd: number;
}

/**
 * Splits an integer VND amount into N parts deterministically:
 * First (total % N) parts receive floor(total / N) + 1 VND,
 * remaining parts receive floor(total / N) VND.
 * Guarantees sum(parts) === total exactly.
 */
export function splitIntegerAmountDeterministic(totalVnd: number, partsCount: number): number[] {
  assertIntegerVnd(totalVnd, 'totalVnd');
  if (!Number.isSafeInteger(partsCount) || partsCount < 2) {
    throw new Error(`partsCount must be an integer >= 2 (got ${partsCount})`);
  }

  const baseShare = Math.floor(totalVnd / partsCount);
  const remainder = totalVnd % partsCount;

  const result: number[] = [];
  for (let i = 0; i < partsCount; i++) {
    result.push(i < remainder ? baseShare + 1 : baseShare);
  }
  return result;
}

/**
 * Splits an invoice equally across N people/sub-invoices while allocating both
 * subtotal and invoice-level discount so that every child invoice is consistent
 * and the sum of child totals equals the parent total to the exact 1 VND.
 */
export function splitInvoiceEquallyVnd(params: {
  subtotalVnd: number;
  discountAmountVnd: number;
  partsCount: number;
}): SplitInvoicePart[] {
  const { subtotalVnd, discountAmountVnd, partsCount } = params;
  assertIntegerVnd(subtotalVnd, 'subtotalVnd');
  assertIntegerVnd(discountAmountVnd, 'discountAmountVnd');
  if (discountAmountVnd > subtotalVnd) {
    throw new Error('discountAmountVnd cannot exceed subtotalVnd');
  }

  const subtotals = splitIntegerAmountDeterministic(subtotalVnd, partsCount);
  const discounts = splitIntegerAmountDeterministic(discountAmountVnd, partsCount);

  return subtotals.map((partSubtotal, idx) => {
    const partDiscount = discounts[idx]!;
    return {
      partIndex: idx + 1,
      totalParts: partsCount,
      subtotalVnd: partSubtotal,
      discountAmountVnd: partDiscount,
      totalAmountVnd: partSubtotal - partDiscount,
    };
  });
}

/**
 * Resolves effective branch price and whether a master menu price update changes it.
 * Never infers inheritance from equality of numbers; strictly uses explicit PriceInheritanceMode.
 */
export function resolveEffectiveBranchPriceVnd(params: {
  standardPriceVnd: number;
  priceMode: PriceInheritanceMode;
  overridePriceVnd: number | null;
}): number {
  const { standardPriceVnd, priceMode, overridePriceVnd } = params;
  assertIntegerVnd(standardPriceVnd, 'standardPriceVnd');

  if (priceMode === 'INHERITED') {
    return standardPriceVnd;
  }

  if (overridePriceVnd === null || overridePriceVnd === undefined) {
    throw new Error('overridePriceVnd is required when priceMode is OVERRIDE');
  }
  assertIntegerVnd(overridePriceVnd, 'overridePriceVnd');
  return overridePriceVnd;
}

/**
 * Formats an invoice display code per branch and business date, e.g., BG01-20261016-0001
 */
export function formatInvoiceDisplayCode(
  branchCode: string,
  businessDateYmd: string,
  sequenceNumber: number
): string {
  const cleanBranch = branchCode.trim().toUpperCase();
  const compactDate = businessDateYmd.replace(/-/g, '');
  if (!/^\d{8}$/.test(compactDate)) {
    throw new Error(`Invalid businessDateYmd format: ${businessDateYmd} (expected YYYY-MM-DD)`);
  }
  if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error(`sequenceNumber must be positive integer (got ${sequenceNumber})`);
  }
  return `${cleanBranch}-${compactDate}-${String(sequenceNumber).padStart(4, '0')}`;
}
