import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { TransactionalDatabase } from './index.js';

describe('@oc-pos/database Transactional Integrity, Hard-Delete Protection & Encrypted Backup/Restore', () => {
  it('rolls back entire transaction when an error occurs mid-flight', () => {
    const db = new TransactionalDatabase();
    assert.throws(() => {
      db.transaction((tx) => {
        tx.tenants.push({
          id: 't-1',
          code: 'OC01',
          brandName: 'Ốc Ngon Sài Gòn',
          status: 'ACTIVE',
          logoUrl: null,
          primaryColor: '#D9381E',
          coverImageUrl: null,
          bannerUrl: null,
          customDomain: null,
          configVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        throw new Error('SIMULATED_CRASH');
      });
    }, /SIMULATED_CRASH/);

    assert.equal(db.getState().tenants.length, 0);
  });

  it('prevents hard deletion of MenuItems that have transaction history', () => {
    const db = new TransactionalDatabase();
    db.transaction((tx) => {
      tx.menuItems.push({
        id: 'item-1',
        tenantId: 't-1',
        categoryName: 'Ốc Hấp',
        code: 'OC-HAP-SA',
        name: 'Ốc hương hấp sả',
        description: 'Ốc hương tươi hấp sả ớt',
        imageUrl: null,
        sellingUnit: 'KG',
        isWeightBased: true,
        standardPriceVnd: 0,
        standardPricePerKgVnd: 450_000,
        standardEstimatedCostVnd: null,
        standardEstimatedCostPerKgVnd: 280_000,
        standardPrepMinutes: 12,
        allowedPrepNotes: ['Ít cay', 'Không hành'],
        defaultStatus: 'AVAILABLE',
        version: 1,
        copiedFromItemId: null,
        hasTransactions: true,
        createdAtIso: new Date().toISOString(),
      });
    });

    assert.throws(
      () => db.deleteMenuItemSafe('t-1', 'item-1'),
      /HARD_DELETE_FORBIDDEN/
    );
    assert.equal(db.getState().menuItems.length, 1);
  });

  it('creates AES-256-GCM encrypted backup, verifies checksum, restores in isolation, and does not reprint completed jobs', () => {
    const db = new TransactionalDatabase();
    const keyHex = crypto.randomBytes(32).toString('hex');

    db.transaction((tx) => {
      tx.tenants.push({
        id: 't-1',
        code: 'OC01',
        brandName: 'Ốc Đảo',
        status: 'ACTIVE',
        logoUrl: null,
        primaryColor: '#D9381E',
        coverImageUrl: null,
        bannerUrl: null,
        customDomain: null,
        configVersion: 1,
        createdAt: '2026-10-16T08:00:00.000Z',
        updatedAt: '2026-10-16T08:00:00.000Z',
      });
      tx.invoices.push({
        id: 'inv-1',
        tenantId: 't-1',
        branchId: 'b-1',
        tableSessionId: 'sess-1',
        parentInvoiceId: null,
        splitIndex: null,
        splitTotalParts: null,
        displayCode: 'BG01-20261016-0001',
        businessDateYmd: '2026-10-16',
        subtotalVnd: 414_000,
        discountType: 'NONE',
        discountValue: 0,
        discountAmountVnd: 0,
        discountReason: null,
        discountByUserId: null,
        discountApprovalId: null,
        adjustmentAmountVnd: 0,
        adjustmentReason: null,
        adjustmentApprovalId: null,
        totalAmountVnd: 414_000,
        paidAmountVnd: 414_000,
        refundedAmountVnd: 0,
        debtAmountVnd: 0,
        status: 'PAID',
        voidReason: null,
        voidApprovalId: null,
        createdAtIso: '2026-10-16T12:00:00.000Z',
      });
      tx.payments.push({
        id: 'pay-1',
        tenantId: 't-1',
        branchId: 'b-1',
        invoiceId: 'inv-1',
        method: 'CASH',
        amountVnd: 414_000,
        referenceCode: null,
        recordedByUserId: 'u-cashier',
        paidAtIso: '2026-10-16T12:05:00.000Z',
        collectedBusinessDateYmd: '2026-10-16',
        isDebtCollection: false,
        durabilityState: 'CONFIRMED_DUAL_NODE',
      });
      tx.printJobs.push(
        {
          id: 'pj-done',
          tenantId: 't-1',
          branchId: 'b-1',
          printerRole: 'KITCHEN',
          jobType: 'KITCHEN_ROUND_TICKET',
          referenceId: 'round-1',
          isReprint: false,
          reprintBannerText: null,
          payloadJson: {},
          status: 'CONFIRMED_BY_STAFF',
          retryCount: 0,
          lastError: null,
          createdAtIso: '2026-10-16T11:30:00.000Z',
          updatedAtIso: '2026-10-16T11:31:00.000Z',
        },
        {
          id: 'pj-inflight',
          tenantId: 't-1',
          branchId: 'b-1',
          printerRole: 'CASHIER',
          jobType: 'INVOICE_RECEIPT',
          referenceId: 'inv-1',
          isReprint: false,
          reprintBannerText: null,
          payloadJson: {},
          status: 'SENDING',
          retryCount: 0,
          lastError: null,
          createdAtIso: '2026-10-16T12:05:00.000Z',
          updatedAtIso: '2026-10-16T12:05:00.000Z',
        }
      );
    });

    const backupPkg = db.createEncryptedBranchBackup({
      tenantId: 't-1',
      branchId: 'b-1',
      encryptionKeyHex: keyHex,
    });

    const verification = TransactionalDatabase.verifyAndRestoreIsolated({
      backupPackage: backupPkg,
      encryptionKeyHex: keyHex,
    });

    assert.equal(verification.verifiedInvoiceCount, 1);
    assert.equal(verification.verifiedTotalPaymentsVnd, 414_000);
    assert.equal(verification.nonCompletedPrintJobsRequeued, 1);

    const restoredJobs = verification.restoredDb.getState().printJobs;
    assert.equal(restoredJobs.find((j) => j.id === 'pj-done')?.status, 'CONFIRMED_BY_STAFF');
    assert.equal(restoredJobs.find((j) => j.id === 'pj-inflight')?.status, 'QUEUED');
  });
});
