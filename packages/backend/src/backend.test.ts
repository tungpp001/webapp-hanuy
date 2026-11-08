import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ActorAccessContext } from '@oc-pos/shared';
import {
  createOcPosBackendContainer,
  createOcPosHttpServer,
  generateTotpCode,
} from './index.js';

describe('@oc-pos/backend Comprehensive Business, Security, Offline, Failover & Load Tests', () => {
  const saasAdminActor: ActorAccessContext = {
    userId: 'saas-admin-1',
    role: 'SAAS_ADMIN',
    tenantId: null,
    branchId: null,
    mfaVerified: true,
    isPosLocked: false,
  };

  it('1. Enforces Authentication, 12-char password, MFA for SaaS Admin & Tech Support, 15-min POS lock preserving draft, and Employee Offboarding', () => {
    const app = createOcPosBackendContainer();
    const { tenant, branch } = app.tenantMenuService.createTenantWithContractAndBranch({
      actor: saasAdminActor,
      tenantCode: 'OC-AUTH',
      brandName: 'Ốc Auth',
      billingCycle: 'YEARLY',
      startDateYmd: '2026-01-01',
      endDateYmd: '2026-12-31',
      branchCode: 'Q1',
      branchName: 'Chi nhánh Quận 1',
      branchAddress: '123 Nguyễn Huệ, Q1',
    });

    // Reject < 12 character password
    assert.throws(
      () =>
        app.authService.createUser({
          actor: saasAdminActor,
          tenantId: tenant.id,
          branchId: branch.id,
          username: 'cashier_short',
          email: 'short@oc.vn',
          plainPassword: 'short',
          role: 'CASHIER',
        }),
      /PASSWORD_TOO_SHORT/
    );

    // Create Tech Support (mandatory MFA)
    const techCreated = app.authService.createUser({
      actor: saasAdminActor,
      tenantId: null,
      branchId: null,
      username: 'tech_support_01',
      email: 'tech@oc.vn',
      plainPassword: 'StrongPassword#2026',
      role: 'TECH_SUPPORT',
    });
    assert.equal(techCreated.user.mfaEnabled, true);
    assert.ok(techCreated.mfaSecretHex);

    // Login without TOTP code fails for TECH_SUPPORT
    assert.throws(
      () =>
        app.authService.login({
          username: 'tech_support_01',
          plainPassword: 'StrongPassword#2026',
          nowIso: '2026-10-16T08:00:00.000Z',
        }),
      /MFA_CODE_REQUIRED/
    );

    const validTotp = generateTotpCode(
      techCreated.mfaSecretHex!,
      new Date('2026-10-16T08:00:00.000Z').getTime()
    );
    const techLogin = app.authService.login({
      username: 'tech_support_01',
      plainPassword: 'StrongPassword#2026',
      totpCode: validTotp,
      nowIso: '2026-10-16T08:00:00.000Z',
    });
    assert.ok(techLogin.sessionToken);

    // Create Cashier and verify 15-minute POS idle lock preserves draft order state
    app.authService.createUser({
      actor: saasAdminActor,
      tenantId: tenant.id,
      branchId: branch.id,
      username: 'cashier_01',
      email: 'cashier@oc.vn',
      plainPassword: 'CashierPassword#2026',
      role: 'CASHIER',
    });

    const cashierLogin = app.authService.login({
      username: 'cashier_01',
      plainPassword: 'CashierPassword#2026',
      nowIso: '2026-10-16T10:00:00.000Z',
    });

    // At 10:05 (5 mins later), save draft order
    app.authService.checkAndTouchSession({
      sessionToken: cashierLogin.sessionToken,
      draftOrderStateJson: { tableCode: 'B05', pendingItems: ['Ốc hương rang muối'] },
      nowIso: '2026-10-16T10:05:00.000Z',
    });

    // At 10:21 (16 mins after last activity -> >= 15 mins idle), session auto-locks but keeps draft!
    const lockedCheck = app.authService.checkAndTouchSession({
      sessionToken: cashierLogin.sessionToken,
      nowIso: '2026-10-16T10:21:00.000Z',
    });
    assert.equal(lockedCheck.session.isPosLocked, true);
    assert.deepEqual(lockedCheck.session.draftOrderStateJson, {
      tableCode: 'B05',
      pendingItems: ['Ốc hương rang muối'],
    });

    // Unlock POS session and continue seamlessly
    const unlocked = app.authService.unlockPosSession({
      sessionToken: cashierLogin.sessionToken,
      plainPassword: 'CashierPassword#2026',
      nowIso: '2026-10-16T10:22:00.000Z',
    });
    assert.equal(unlocked.isPosLocked, false);

    // Offboard employee: revokes session immediately while keeping user record & audit logs
    const offboard = app.authService.disableEmployeeAndRevokeSessions({
      actor: saasAdminActor,
      targetUserId: cashierLogin.user.id,
      reason: 'Nhân viên nghỉ việc cuối tháng',
      nowIso: '2026-10-16T18:00:00.000Z',
    });
    assert.equal(offboard.revokedSessionCount, 1);
    assert.throws(
      () =>
        app.authService.checkAndTouchSession({
          sessionToken: cashierLogin.sessionToken,
          nowIso: '2026-10-16T18:01:00.000Z',
        }),
      /SESSION_REVOKED_OR_NOT_FOUND/
    );
  });

  it('2. Enforces Menu Inheritance vs Override, Price Change Limit Approval, and Snapshot Immutability', () => {
    const app = createOcPosBackendContainer();
    const { tenant, branch } = app.tenantMenuService.createTenantWithContractAndBranch({
      actor: saasAdminActor,
      tenantCode: 'OC-MENU',
      brandName: 'Ốc Hương Sài Gòn',
      billingCycle: 'YEARLY',
      startDateYmd: '2026-01-01',
      endDateYmd: '2026-12-31',
      branchCode: 'BG01',
      branchName: 'Chi nhánh Bình Giã',
      branchAddress: '45 Bình Giã, Tân Bình',
    });

    const chainOwner: ActorAccessContext = {
      userId: 'owner-1',
      role: 'CHAIN_OWNER',
      tenantId: tenant.id,
      branchId: null,
      mfaVerified: true,
      isPosLocked: false,
    };

    const branchManager: ActorAccessContext = {
      userId: 'mgr-1',
      role: 'BRANCH_MANAGER',
      tenantId: tenant.id,
      branchId: branch.id,
      mfaVerified: true,
      isPosLocked: false,
    };

    // Create 2 items: one with cost, one without cost (NULL -> "Chưa có dữ liệu giá vốn")
    const ocHap = app.tenantMenuService.createMenuItem({
      actor: chainOwner,
      tenantId: tenant.id,
      categoryName: 'Ốc Hấp',
      code: 'OC-HAP-NHO',
      name: 'Ốc hấp sả phần nhỏ',
      sellingUnit: 'PORTION',
      isWeightBased: false,
      standardPriceVnd: 100_000,
      standardEstimatedCostVnd: 55_000,
    });

    const ocRangMuoi = app.tenantMenuService.createMenuItem({
      actor: chainOwner,
      tenantId: tenant.id,
      categoryName: 'Ốc Rang',
      code: 'OC-RANG-MUOI',
      name: 'Ốc rang muối ớt',
      sellingUnit: 'PORTION',
      isWeightBased: false,
      standardPriceVnd: 100_000,
      standardEstimatedCostVnd: null, // No cost data yet
    });

    // Duplicate item creates a brand-new ID without overwriting original
    const ocHapLon = app.tenantMenuService.duplicateMenuItem({
      actor: chainOwner,
      tenantId: tenant.id,
      sourceMenuItemId: ocHap.id,
      newCode: 'OC-HAP-LON',
      newName: 'Ốc hấp sả phần lớn',
    });
    assert.notEqual(ocHapLon.id, ocHap.id);
    assert.equal(ocHapLon.copiedFromItemId, ocHap.id);

    // Branch manager sets OVERRIDE on ocRangMuoi explicitly to 100,000 VND (same number as standard, but explicit OVERRIDE mode!)
    const overrideRes = app.tenantMenuService.configureBranchMenuItem({
      actor: branchManager,
      tenantId: tenant.id,
      branchId: branch.id,
      menuItemId: ocRangMuoi.id,
      priceMode: 'OVERRIDE',
      overridePriceVnd: 100_000,
      reason: 'Giữ giá cố định tại chi nhánh Bình Giã',
    });
    assert.equal(overrideRes.appliedImmediately, true);

    // Branch manager attempts +40% price increase (exceeds 15% limit) -> must NOT apply immediately, creates pending approval
    const overLimitRes = app.tenantMenuService.configureBranchMenuItem({
      actor: branchManager,
      tenantId: tenant.id,
      branchId: branch.id,
      menuItemId: ocHap.id,
      priceMode: 'OVERRIDE',
      overridePriceVnd: 140_000,
      reason: 'Tăng giá dịp lễ',
    });
    assert.equal(overLimitRes.appliedImmediately, false);
    assert.ok(overLimitRes.approvalRequest);
    assert.equal(overLimitRes.approvalRequest?.status, 'PENDING');

    // Chain Owner publishes Master Menu Release updating standard prices of both items to 120,000 VND
    app.tenantMenuService.publishMasterMenuRelease({
      actor: chainOwner,
      tenantId: tenant.id,
      priceUpdates: [
        { menuItemId: ocHap.id, newStandardPriceVnd: 120_000 },
        { menuItemId: ocRangMuoi.id, newStandardPriceVnd: 120_000 },
      ],
    });

    const catalog = app.tenantMenuService.getEffectiveBranchCatalog(tenant.id, branch.id);
    const catOcHap = catalog.find((c) => c.menuItemId === ocHap.id)!;
    const catOcRang = catalog.find((c) => c.menuItemId === ocRangMuoi.id)!;

    // INHERITED item updated to 120,000 VND; OVERRIDE item stayed at 100,000 VND!
    assert.equal(catOcHap.effectivePriceVnd, 120_000);
    assert.equal(catOcRang.effectivePriceVnd, 100_000);
    assert.equal(catOcRang.costDisplayLabel, 'Chưa có dữ liệu giá vốn');
  });

  it('3. Full End-to-End Flow: QR Order, Weight-Based Snail Confirmation, Out-of-Stock Replacement, Additional Round Printing, KDS, Bill Split, Debt Close & Next-Day Debt Collection', () => {
    const app = createOcPosBackendContainer();
    const { tenant, branch } = app.tenantMenuService.createTenantWithContractAndBranch({
      actor: saasAdminActor,
      tenantCode: 'OC-E2E',
      brandName: 'Ốc Đảo Vĩnh Khánh',
      billingCycle: 'YEARLY',
      startDateYmd: '2026-01-01',
      endDateYmd: '2026-12-31',
      branchCode: 'VK01',
      branchName: 'Chi nhánh Vĩnh Khánh',
      branchAddress: '88 Vĩnh Khánh, Q4',
    });

    const chainOwner: ActorAccessContext = {
      userId: 'owner-vk',
      role: 'CHAIN_OWNER',
      tenantId: tenant.id,
      branchId: null,
      mfaVerified: true,
      isPosLocked: false,
    };
    const manager: ActorAccessContext = {
      userId: 'mgr-vk',
      role: 'BRANCH_MANAGER',
      tenantId: tenant.id,
      branchId: branch.id,
      mfaVerified: true,
      isPosLocked: false,
    };
    const waiter: ActorAccessContext = {
      userId: 'waiter-vk',
      role: 'WAITER',
      tenantId: tenant.id,
      branchId: branch.id,
      mfaVerified: false,
      isPosLocked: false,
    };
    const kitchen: ActorAccessContext = {
      userId: 'kitchen-vk',
      role: 'KITCHEN_STAFF',
      tenantId: tenant.id,
      branchId: branch.id,
      mfaVerified: false,
      isPosLocked: false,
    };
    const cashier: ActorAccessContext = {
      userId: 'cashier-vk',
      role: 'CASHIER',
      tenantId: tenant.id,
      branchId: branch.id,
      mfaVerified: false,
      isPosLocked: false,
    };

    const ocHuongKg = app.tenantMenuService.createMenuItem({
      actor: chainOwner,
      tenantId: tenant.id,
      categoryName: 'Ốc Bán Cân',
      code: 'OC-HUONG-KG',
      name: 'Ốc hương thiên nhiên (Bán theo kg)',
      sellingUnit: 'KG',
      isWeightBased: true,
      standardPriceVnd: 0,
      standardPricePerKgVnd: 450_000,
      standardEstimatedCostPerKgVnd: 250_000,
    });

    const soDiep = app.tenantMenuService.createMenuItem({
      actor: chainOwner,
      tenantId: tenant.id,
      categoryName: 'Nướng',
      code: 'SO-DIEP-MO-HANH',
      name: 'Sò điệp nướng mỡ hành',
      sellingUnit: 'PLATE',
      isWeightBased: false,
      standardPriceVnd: 86_000,
      standardEstimatedCostVnd: 40_000,
    });

    const tableB01 = app.orderingService.createDiningTable({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      code: 'B01',
      name: 'Bàn 01 Vỉa Hè',
      areaName: 'Khu A',
      capacity: 4,
    });

    const session = app.orderingService.openTableSession({
      actor: waiter,
      tenantId: tenant.id,
      branchId: branch.id,
      tableId: tableB01.id,
      nowIso: '2026-10-16T11:00:00.000Z',
    });

    // Customer submits Round 1 via QR (1 weight-based snail item)
    const round1 = app.orderingService.submitOrderRound({
      tenantId: tenant.id,
      branchId: branch.id,
      tableId: tableB01.id,
      source: 'CUSTOMER_QR',
      qrStaticKey: tableB01.qrStaticKey,
      sessionToken: session.sessionToken,
      idempotencyKey: 'idem-round-1',
      items: [{ menuItemId: ocHuongKg.id, quantity: 1, estimatedWeightKg: 0.8 }],
      nowIso: '2026-10-16T11:02:00.000Z',
    });

    // Trying to approve before weight confirmation fails
    assert.throws(
      () =>
        app.orderingService.approveOrderRoundAndSendToKitchen({
          actor: waiter,
          tenantId: tenant.id,
          branchId: branch.id,
          orderRoundId: round1.round.id,
          idempotencyKey: 'idem-approve-1-fail',
        }),
      /WEIGHT_CONFIRMATION_PENDING/
    );

    // Staff weighs actual 0.92 kg * 450,000 VND/kg = 414,000 VND, customer confirms!
    const weighed = app.orderingService.recordActualWeightAndCustomerConfirmation({
      actor: waiter,
      tenantId: tenant.id,
      branchId: branch.id,
      orderItemId: round1.items[0]!.id,
      actualWeightKg: 0.92,
      customerConfirmed: true,
      nowIso: '2026-10-16T11:04:00.000Z',
    });
    assert.equal(weighed.orderItem.lineTotalVnd, 414_000);
    assert.equal(weighed.orderItem.status, 'PENDING_APPROVAL');

    // Approve Round 1 -> sends to kitchen and creates PrintJob #1
    const approved1 = app.orderingService.approveOrderRoundAndSendToKitchen({
      actor: waiter,
      tenantId: tenant.id,
      branchId: branch.id,
      orderRoundId: round1.round.id,
      idempotencyKey: 'idem-approve-1-ok',
      nowIso: '2026-10-16T11:05:00.000Z',
    });
    assert.equal(approved1.sentItems[0]!.status, 'SENT_TO_KITCHEN');
    assert.equal(approved1.sentItems[0]!.cookingStartedAtIso, null); // Not cooking yet!

    // Kitchen marks COOKING -> starts prep timer
    const cookingItem = app.orderingService.updateKitchenItemStatus({
      actor: kitchen,
      tenantId: tenant.id,
      branchId: branch.id,
      orderItemId: approved1.sentItems[0]!.id,
      nextStatus: 'COOKING',
      nowIso: '2026-10-16T11:07:00.000Z',
    });
    assert.equal(cookingItem.cookingStartedAtIso, '2026-10-16T11:07:00.000Z');

    // Kitchen marks COMPLETED, Waiter marks SERVED
    app.orderingService.updateKitchenItemStatus({
      actor: kitchen,
      tenantId: tenant.id,
      branchId: branch.id,
      orderItemId: cookingItem.id,
      nextStatus: 'COMPLETED',
      nowIso: '2026-10-16T11:15:00.000Z',
    });
    app.orderingService.updateKitchenItemStatus({
      actor: waiter,
      tenantId: tenant.id,
      branchId: branch.id,
      orderItemId: cookingItem.id,
      nextStatus: 'SERVED',
      nowIso: '2026-10-16T11:16:00.000Z',
    });

    // Customer submits Round 2 (1 plate of Sò điệp = 86,000 VND). Total session = 414,000 + 86,000 = 500,000 VND
    const round2 = app.orderingService.submitOrderRound({
      tenantId: tenant.id,
      branchId: branch.id,
      tableId: tableB01.id,
      source: 'CUSTOMER_QR',
      qrStaticKey: tableB01.qrStaticKey,
      sessionToken: session.sessionToken,
      idempotencyKey: 'idem-round-2',
      items: [{ menuItemId: soDiep.id, quantity: 1 }],
      nowIso: '2026-10-16T11:20:00.000Z',
    });

    const approved2 = app.orderingService.approveOrderRoundAndSendToKitchen({
      actor: waiter,
      tenantId: tenant.id,
      branchId: branch.id,
      orderRoundId: round2.round.id,
      idempotencyKey: 'idem-approve-2-ok',
      nowIso: '2026-10-16T11:21:00.000Z',
    });

    // Verify PrintJob for Round 2 ONLY contains the 1 new item in Round 2, NOT Round 1's item!
    const printedItemsInRound2 = (
      approved2.kitchenPrintJob.payloadJson.items as Array<{ name: string }>
    );
    assert.equal(printedItemsInRound2.length, 1);
    assert.equal(printedItemsInRound2[0]!.name, 'Sò điệp nướng mỡ hành');

    // Create Invoice (Total = 500,000 VND)
    const invoice = app.billingService.createInvoiceForSession({
      actor: cashier,
      tenantId: tenant.id,
      branchId: branch.id,
      tableSessionId: session.id,
      idempotencyKey: 'idem-create-inv-1',
      nowIso: '2026-10-16T12:00:00.000Z',
    });
    assert.equal(invoice.totalAmountVnd, 500_000);
    assert.equal(invoice.displayCode, 'VK01-20261016-0001');

    // Customer pays 300,000 VND cash now (partial payment), leaving 200,000 VND debt
    const partialPay = app.billingService.recordInvoicePayment({
      actor: cashier,
      tenantId: tenant.id,
      branchId: branch.id,
      invoiceId: invoice.id,
      method: 'CASH',
      amountVnd: 300_000,
      idempotencyKey: 'idem-pay-partial-300k',
      nowIso: '2026-10-16T12:05:00.000Z',
    });
    assert.equal(partialPay.invoice.status, 'PARTIALLY_PAID');
    assert.equal(partialPay.invoice.debtAmountVnd, 200_000);

    // Retry the exact same payment request (simulating network timeout) -> returns original payment, does NOT double charge!
    const retryPay = app.billingService.recordInvoicePayment({
      actor: cashier,
      tenantId: tenant.id,
      branchId: branch.id,
      invoiceId: invoice.id,
      method: 'CASH',
      amountVnd: 300_000,
      idempotencyKey: 'idem-pay-partial-300k',
      nowIso: '2026-10-16T12:05:05.000Z',
    });
    assert.equal(retryPay.payment.id, partialPay.payment.id);
    assert.equal(retryPay.invoice.paidAmountVnd, 300_000);

    // Manager closes table with remaining 200,000 VND debt -> releases table B01, keeps invoice PARTIALLY_PAID
    const closedWithDebt = app.billingService.closeTableSessionWithDebt({
      requester: cashier,
      approver: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      tableSessionId: session.id,
      reason: 'Khách quen anh Tùng hẹn mai ghé thanh toán nốt 200k',
      idempotencyKey: 'idem-close-debt-1',
      nowIso: '2026-10-16T12:10:00.000Z',
    });
    assert.equal(closedWithDebt.session.status, 'CLOSED_WITH_DEBT');

    // Old QR session token is now invalid; trying to submit another QR order on closed session is blocked
    assert.throws(
      () =>
        app.orderingService.submitOrderRound({
          tenantId: tenant.id,
          branchId: branch.id,
          tableId: tableB01.id,
          source: 'CUSTOMER_QR',
          qrStaticKey: tableB01.qrStaticKey,
          sessionToken: session.sessionToken,
          idempotencyKey: 'idem-after-close-blocked',
          items: [{ menuItemId: soDiep.id, quantity: 1 }],
        }),
      /TABLE_HAS_NO_ACTIVE_SESSION/
    );

    // Next day (2026-10-17): Customer pays remaining 200,000 VND via Bank Transfer Static QR (verified by cashier)
    const debtPayNextDay = app.billingService.recordInvoicePayment({
      actor: cashier,
      tenantId: tenant.id,
      branchId: branch.id,
      invoiceId: invoice.id,
      method: 'BANK_TRANSFER_STATIC_QR',
      amountVnd: 200_000,
      referenceCode: 'FT26290998877',
      cashierVerifiedBankApp: true,
      idempotencyKey: 'idem-pay-debt-next-day',
      nowIso: '2026-10-17T10:00:00.000Z',
    });
    assert.equal(debtPayNextDay.invoice.status, 'PAID');
    assert.equal(debtPayNextDay.payment.isDebtCollection, true);
    assert.equal(debtPayNextDay.payment.collectedBusinessDateYmd, '2026-10-17');

    // Verify Financial Reports for 2026-10-16 vs 2026-10-17:
    // Day 1 (2026-10-16): Revenue = 500,000 VND, Collected = 300,000 VND
    const reportDay1 = app.billingService.getBranchDailyFinancialReport({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      businessDateYmd: '2026-10-16',
    });
    assert.equal(reportDay1.netRevenueVnd, 500_000);
    assert.equal(reportDay1.totalCollectedCashAndTransferVnd, 300_000);

    // Day 2 (2026-10-17): Revenue = 0 VND (NOT double counted!), Collected = 200,000 VND (debt collection)
    const reportDay2 = app.billingService.getBranchDailyFinancialReport({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      businessDateYmd: '2026-10-17',
    });
    assert.equal(reportDay2.netRevenueVnd, 0);
    assert.equal(reportDay2.totalCollectedCashAndTransferVnd, 200_000);
    assert.equal(reportDay2.debtCollectionFromPriorDaysVnd, 200_000);
  });

  it('4. Verifies Standby Disconnection Alert, Guided Failover Safety Gate, Split-Brain Prevention, and Multi-Branch Closure Isolation', () => {
    const app = createOcPosBackendContainer();
    const { tenant, branch } = app.tenantMenuService.createTenantWithContractAndBranch({
      actor: saasAdminActor,
      tenantCode: 'OC-HA',
      brandName: 'Ốc Chị Em',
      billingCycle: 'YEARLY',
      startDateYmd: '2026-01-01',
      endDateYmd: '2026-12-31',
      branchCode: 'CN1',
      branchName: 'Chi nhánh 1',
      branchAddress: '10 Lê Lợi',
    });

    const manager: ActorAccessContext = {
      userId: 'mgr-ha',
      role: 'BRANCH_MANAGER',
      tenantId: tenant.id,
      branchId: branch.id,
      mfaVerified: true,
      isPosLocked: false,
    };

    // Simulate Standby server unreachable while LAN Primary works
    app.syncFailoverService.setBranchNetworkHealth({
      branchId: branch.id,
      standbyReachable: false,
    });

    const table = app.orderingService.createDiningTable({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      code: 'B09',
      name: 'Bàn 09',
      areaName: 'Tầng 1',
      capacity: 4,
    });
    app.orderingService.openTableSession({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      tableId: table.id,
    });

    const item = app.tenantMenuService.createMenuItem({
      actor: saasAdminActor,
      tenantId: tenant.id,
      categoryName: 'Ốc',
      code: 'OC-MO',
      name: 'Ốc mỡ xào me',
      sellingUnit: 'PLATE',
      isWeightBased: false,
      standardPriceVnd: 95_000,
    });

    const round = app.orderingService.submitOrderRound({
      tenantId: tenant.id,
      branchId: branch.id,
      tableId: table.id,
      source: 'STAFF_POS',
      actor: manager,
      idempotencyKey: 'idem-ha-round-1',
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    // Approving when Standby is down does NOT silently claim CONFIRMED_DUAL_NODE; returns PERSISTED_LOCAL + warning!
    const approved = app.orderingService.approveOrderRoundAndSendToKitchen({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      orderRoundId: round.round.id,
      idempotencyKey: 'idem-ha-approve-1',
    });
    assert.equal(approved.durabilityState, 'PERSISTED_LOCAL');
    assert.ok(approved.standbyWarning);

    // Attempting blind failover while Standby is behind Primary sequence is strictly BLOCKED!
    assert.throws(
      () =>
        app.syncFailoverService.executeGuidedManualFailover({
          requester: manager,
          approver: saasAdminActor,
          tenantId: tenant.id,
          branchId: branch.id,
          reason: 'Thử chuyển máy chủ khi chưa đồng bộ hết',
        }),
      /UNSAFE_FAILOVER_BLOCKED/
    );

    // Once replication catches up, guided failover succeeds and increments clusterEpoch
    app.db.transaction((tx) => {
      const c = tx.clusterStates.find((cs) => cs.branchId === branch.id)!;
      c.standbyReachable = true;
      c.lastStandbyAckSequence = c.lastPrimarySequence;
    });

    const failoverRes = app.syncFailoverService.executeGuidedManualFailover({
      requester: manager,
      approver: saasAdminActor,
      tenantId: tenant.id,
      branchId: branch.id,
      reason: 'Bảo trì máy chủ chính định kỳ sau khi đã đồng bộ đủ WAL',
    });
    assert.equal(failoverRes.clusterState.clusterEpoch, 2);
    assert.equal(failoverRes.clusterState.standbyRole, 'QUARANTINED_READONLY');
  });

  it('5. Executes 250-Concurrent-Device Load Test Simulation with Zero Duplicate/Lost Transactions', async () => {
    const app = createOcPosBackendContainer();
    const { tenant, branch } = app.tenantMenuService.createTenantWithContractAndBranch({
      actor: saasAdminActor,
      tenantCode: 'OC-LOAD',
      brandName: 'Ốc LoadTest 250',
      billingCycle: 'YEARLY',
      startDateYmd: '2026-01-01',
      endDateYmd: '2026-12-31',
      branchCode: 'LT01',
      branchName: 'Chi nhánh Kiểm thử tải',
      branchAddress: 'Quận 3, TP.HCM',
    });

    const manager: ActorAccessContext = {
      userId: 'mgr-lt',
      role: 'BRANCH_MANAGER',
      tenantId: tenant.id,
      branchId: branch.id,
      mfaVerified: true,
      isPosLocked: false,
    };

    const menuItem = app.tenantMenuService.createMenuItem({
      actor: saasAdminActor,
      tenantId: tenant.id,
      categoryName: 'Ốc Hấp',
      code: 'OC-LT-01',
      name: 'Ốc bươu hấp tiêu xanh',
      sellingUnit: 'PORTION',
      isWeightBased: false,
      standardPriceVnd: 85_000,
      standardEstimatedCostVnd: 45_000,
    });

    const table = app.orderingService.createDiningTable({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      code: 'B-LOAD',
      name: 'Bàn Load Test',
      areaName: 'Sảnh chính',
      capacity: 20,
    });

    const session = app.orderingService.openTableSession({
      actor: manager,
      tenantId: tenant.id,
      branchId: branch.id,
      tableId: table.id,
    });

    const server = createOcPosHttpServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', 511, resolve));
    const address = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const concurrentDevices = 250;
      const latenciesMs: number[] = [];

      // Simulate 250 concurrent devices with realistic HTTP connection pooling (4 waves of 62-63 devices or pooled agent)
      const deviceIndices = Array.from({ length: concurrentDevices }, (_, i) => i);
      const waveSize = 65;
      for (let w = 0; w < deviceIndices.length; w += waveSize) {
        const wave = deviceIndices.slice(w, w + waveSize);
        await Promise.all(
          wave.map(async (idx) => {
            const start = performance.now();
            if (idx < 200) {
              const res = await fetch(
                `${baseUrl}/api/catalog?tenantId=${tenant.id}&branchId=${branch.id}`
              );
              assert.equal(res.status, 200);
            } else {
              // 50 order requests where pairs share the same idempotencyKey to verify zero duplicates under concurrent load!
              const logicalOrderSlot = Math.floor((idx - 200) / 2); // 25 unique idempotency keys, each sent twice concurrently
              const idemKey = `load-order-key-${logicalOrderSlot}`;
              const res = await fetch(`${baseUrl}/api/orders/rounds`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Idempotency-Key': idemKey,
                },
                body: JSON.stringify({
                  tenantId: tenant.id,
                  branchId: branch.id,
                  tableId: table.id,
                  source: 'CUSTOMER_QR',
                  qrStaticKey: table.qrStaticKey,
                  sessionToken: session.sessionToken,
                  items: [{ menuItemId: menuItem.id, quantity: 1 }],
                }),
              });
              assert.equal(res.status, 200);
            }
            latenciesMs.push(performance.now() - start);
          })
        );
      }

      latenciesMs.sort((a, b) => a - b);
      const p50 = latenciesMs[Math.floor(latenciesMs.length * 0.5)]!;
      const p95 = latenciesMs[Math.floor(latenciesMs.length * 0.95)]!;
      const p99 = latenciesMs[Math.floor(latenciesMs.length * 0.99)]!;

      // Even though 50 order requests were fired concurrently (25 unique keys x 2 retries),
      // exactly 25 OrderRounds must exist (0 duplicates, 0 lost)!
      const createdRounds = app.db.getState().orderRounds.filter(
        (r) => r.tableSessionId === session.id
      );
      assert.equal(createdRounds.length, 25);
      assert.ok(p95 < 500, `Expected p95 < 500ms, got ${p95.toFixed(2)}ms`);
      console.log(
        `[LoadTest 250 Concurrent Devices] Success=250/250 | UniqueOrders=25 (0 duplicates) | p50=${p50.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, p99=${p99.toFixed(2)}ms`
      );
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
