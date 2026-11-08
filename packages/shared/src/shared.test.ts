import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeightBasedAmountVnd,
  splitInvoiceEquallyVnd,
  resolveEffectiveBranchPriceVnd,
  formatInvoiceDisplayCode,
  evaluateContractPolicy,
  resolveVietnamBusinessDateYmd,
  assertOrderItemTransition,
  assertTenantAndBranchScope,
  validateSensitiveActionApproval,
} from './index.js';

describe('@oc-pos/shared Domain Invariants & Financial Rules', () => {
  it('calculates weight-based snail pricing accurately (0.92 kg * 450,000 VND/kg = 414,000 VND)', () => {
    const res = calculateWeightBasedAmountVnd(0.92, 450_000);
    assert.equal(res.normalizedWeightGrams, 920);
    assert.equal(res.normalizedWeightKg, 0.92);
    assert.equal(res.amountVnd, 414_000);
  });

  it('splits invoices equally and allocates remainder so sum of parts equals parent total to the exact 1 VND', () => {
    const parts = splitInvoiceEquallyVnd({
      subtotalVnd: 1_000_000,
      discountAmountVnd: 100_000,
      partsCount: 3,
    });
    assert.equal(parts.length, 3);
    const sumSubtotal = parts.reduce((acc, p) => acc + p.subtotalVnd, 0);
    const sumDiscount = parts.reduce((acc, p) => acc + p.discountAmountVnd, 0);
    const sumTotal = parts.reduce((acc, p) => acc + p.totalAmountVnd, 0);

    assert.equal(sumSubtotal, 1_000_000);
    assert.equal(sumDiscount, 100_000);
    assert.equal(sumTotal, 900_000);
    assert.deepEqual(
      parts.map((p) => p.totalAmountVnd),
      [300_000, 300_000, 300_000]
    );

    // Non-divisible total: 500,000 VND split into 3 parts -> 166,667 + 166,667 + 166,666 = 500,000
    const unevenParts = splitInvoiceEquallyVnd({
      subtotalVnd: 500_000,
      discountAmountVnd: 0,
      partsCount: 3,
    });
    assert.deepEqual(
      unevenParts.map((p) => p.totalAmountVnd),
      [166_667, 166_667, 166_666]
    );
    assert.equal(
      unevenParts.reduce((acc, p) => acc + p.totalAmountVnd, 0),
      500_000
    );
  });

  it('distinguishes INHERITED vs OVERRIDE branch prices even if numbers are identical', () => {
    const inheritedAfterMasterUpdate = resolveEffectiveBranchPriceVnd({
      standardPriceVnd: 120_000,
      priceMode: 'INHERITED',
      overridePriceVnd: 100_000,
    });
    assert.equal(inheritedAfterMasterUpdate, 120_000);

    const overrideAfterMasterUpdate = resolveEffectiveBranchPriceVnd({
      standardPriceVnd: 120_000,
      priceMode: 'OVERRIDE',
      overridePriceVnd: 100_000,
    });
    assert.equal(overrideAfterMasterUpdate, 100_000);
  });

  it('formats invoice display code correctly', () => {
    assert.equal(formatInvoiceDisplayCode('bg01', '2026-10-16', 1), 'BG01-20261016-0001');
  });

  it('enforces 7-day contract grace period and post-expiration restrictions', () => {
    const duringGrace = evaluateContractPolicy({
      endDateYmd: '2026-11-01',
      gracePeriodDays: 7,
      warningDaysBefore: [30, 14, 7, 3, 1],
      administrativeStatus: 'ACTIVE',
      currentLocalDateYmd: '2026-11-05',
    });
    assert.equal(duringGrace.effectiveStatus, 'GRACE_PERIOD');
    assert.equal(duringGrace.canOpenNewTableSession, true);

    const afterGrace = evaluateContractPolicy({
      endDateYmd: '2026-11-01',
      gracePeriodDays: 7,
      warningDaysBefore: [30, 14, 7, 3, 1],
      administrativeStatus: 'ACTIVE',
      currentLocalDateYmd: '2026-11-09',
    });
    assert.equal(afterGrace.effectiveStatus, 'EXPIRED_RESTRICTED');
    assert.equal(afterGrace.canOpenNewTableSession, false);
    assert.equal(afterGrace.canAddOrderRoundToExistingSession, false);
    assert.equal(afterGrace.canCompleteExistingSessionPaymentAndPrint, true);
  });

  it('resolves Vietnam business date using branch start hour', () => {
    // 2026-10-16T18:30:00Z is 2026-10-17 01:30:00+07:00 (Asia/Ho_Chi_Minh).
    // With businessDayStartHour = 4 (04:00 AM), it still belongs to 2026-10-16 business day!
    const bDate = resolveVietnamBusinessDateYmd('2026-10-16T18:30:00.000Z', 4);
    assert.equal(bDate, '2026-10-16');
  });

  it('enforces OrderItem state machine (SENT_TO_KITCHEN != COOKING, and COMPLETED cannot be CANCELLED)', () => {
    assertOrderItemTransition('APPROVED', 'SENT_TO_KITCHEN');
    assertOrderItemTransition('SENT_TO_KITCHEN', 'COOKING');
    assertOrderItemTransition('COOKING', 'COMPLETED');
    assert.throws(
      () => assertOrderItemTransition('COMPLETED', 'CANCELLED'),
      /Invalid OrderItemStatus transition/
    );
  });

  it('enforces strict tenant isolation, MFA for TECH_SUPPORT, and blocks remote support from mutating financial records', () => {
    assert.throws(
      () =>
        assertTenantAndBranchScope({
          actor: {
            userId: 'u-1',
            role: 'BRANCH_MANAGER',
            tenantId: 'tenant-A',
            branchId: 'branch-A1',
            mfaVerified: true,
            isPosLocked: false,
          },
          targetTenantId: 'tenant-B',
          targetBranchId: 'branch-B1',
        }),
      /TENANT_ISOLATION_VIOLATION/
    );

    assert.throws(
      () =>
        assertTenantAndBranchScope({
          actor: {
            userId: 'tech-1',
            role: 'TECH_SUPPORT',
            tenantId: null,
            branchId: null,
            mfaVerified: true,
            isPosLocked: false,
            activeSupportGrant: {
              grantId: 'g-1',
              tenantId: 'tenant-A',
              branchId: 'branch-A1',
              scope: 'DIAGNOSTICS_READ',
              expiresAtIso: '2099-01-01T00:00:00.000Z',
              revokedAtIso: null,
            },
          },
          targetTenantId: 'tenant-A',
          targetBranchId: 'branch-A1',
          isFinancialTransactionMutation: true,
        }),
      /FORBIDDEN_FINANCIAL_MUTATION/
    );
  });

  it('prevents self-approval on sensitive operations', () => {
    assert.throws(
      () =>
        validateSensitiveActionApproval({
          actionType: 'VOID_INVOICE',
          requestedByUserId: 'mgr-1',
          requestedByRole: 'BRANCH_MANAGER',
          approvedByUserId: 'mgr-1',
          approvedByRole: 'BRANCH_MANAGER',
          reason: 'Khách đổi ý không dùng bữa nữa',
          requireIndependentApprover: true,
        }),
      /SELF_APPROVAL_FORBIDDEN/
    );
  });
});
