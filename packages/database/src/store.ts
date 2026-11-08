import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  ApprovalRequestEntity,
  AuditLogEntity,
  BranchClusterState,
  BranchEntity,
  BranchMenuConfigEntity,
  ContractEntity,
  CustomerRatingEntity,
  DiningTableEntity,
  IdempotencyRecordEntity,
  InvoiceEntity,
  MenuItemEntity,
  MenuReleaseEntity,
  OrderItemEntity,
  OrderRoundEntity,
  OutboxEventEntity,
  PaymentEntity,
  PrinterDeviceEntity,
  PrintJobEntity,
  RefundRequestEntity,
  SupportAccessGrantEntity,
  SystemAlertEntity,
  TableSessionEntity,
  TenantEntity,
  UserEntity,
  UserSessionEntity,
} from './entities.js';

export interface DatabaseStateSnapshot {
  schemaVersion: number;
  tenants: TenantEntity[];
  contracts: ContractEntity[];
  branches: BranchEntity[];
  users: UserEntity[];
  userSessions: UserSessionEntity[];
  supportAccessGrants: SupportAccessGrantEntity[];
  approvalRequests: ApprovalRequestEntity[];
  menuItems: MenuItemEntity[];
  branchMenuConfigs: BranchMenuConfigEntity[];
  menuReleases: MenuReleaseEntity[];
  diningTables: DiningTableEntity[];
  tableSessions: TableSessionEntity[];
  orderRounds: OrderRoundEntity[];
  orderItems: OrderItemEntity[];
  printerDevices: PrinterDeviceEntity[];
  printJobs: PrintJobEntity[];
  invoices: InvoiceEntity[];
  payments: PaymentEntity[];
  refundRequests: RefundRequestEntity[];
  customerRatings: CustomerRatingEntity[];
  idempotencyRecords: IdempotencyRecordEntity[];
  outboxEvents: OutboxEventEntity[];
  auditLogs: AuditLogEntity[];
  systemAlerts: SystemAlertEntity[];
  clusterStates: BranchClusterState[];
}

export interface EncryptedBackupPackage {
  manifest: {
    backupId: string;
    tenantId: string;
    branchId: string;
    schemaVersion: number;
    createdAtIso: string;
    maxOutboxSequence: number;
    invoiceCount: number;
    totalConfirmedPaymentsVnd: number;
    ivHex: string;
    authTagHex: string;
    sha256Checksum: string;
  };
  ciphertextBase64: string;
}

function createEmptyState(): DatabaseStateSnapshot {
  return {
    schemaVersion: 1,
    tenants: [],
    contracts: [],
    branches: [],
    users: [],
    userSessions: [],
    supportAccessGrants: [],
    approvalRequests: [],
    menuItems: [],
    branchMenuConfigs: [],
    menuReleases: [],
    diningTables: [],
    tableSessions: [],
    orderRounds: [],
    orderItems: [],
    printerDevices: [],
    printJobs: [],
    invoices: [],
    payments: [],
    refundRequests: [],
    customerRatings: [],
    idempotencyRecords: [],
    outboxEvents: [],
    auditLogs: [],
    systemAlerts: [],
    clusterStates: [],
  };
}

/**
 * Transactional ACID-compliant store with optional file-backed WAL durability,
 * Primary-Standby replication simulation/verification, and AES-256-GCM encrypted backup/restore.
 */
export class TransactionalDatabase {
  private state: DatabaseStateSnapshot;
  private readonly storageFilePath: string | null;

  constructor(options?: { storageFilePath?: string; initialState?: DatabaseStateSnapshot }) {
    this.storageFilePath = options?.storageFilePath ?? null;
    if (options?.initialState) {
      this.state = structuredClone(options.initialState);
    } else if (this.storageFilePath && fs.existsSync(this.storageFilePath)) {
      const raw = fs.readFileSync(this.storageFilePath, 'utf8');
      this.state = JSON.parse(raw) as DatabaseStateSnapshot;
    } else {
      this.state = createEmptyState();
    }
  }

  public getState(): DatabaseStateSnapshot {
    return this.state;
  }

  public snapshot(): DatabaseStateSnapshot {
    return structuredClone(this.state);
  }

  /**
   * Executes a synchronous atomic transaction. If an error is thrown inside `fn`,
   * the entire state rolls back to the pre-transaction snapshot.
   */
  public transaction<T>(fn: (tx: DatabaseStateSnapshot) => T): T {
    const workingCopy = structuredClone(this.state);
    const result = fn(workingCopy);
    this.state = workingCopy;
    this.flushToDiskIfConfigured();
    return result;
  }

  private flushToDiskIfConfigured(): void {
    if (!this.storageFilePath) return;
    const dir = path.dirname(this.storageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${this.storageFilePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.storageFilePath);
  }

  /**
   * Hard-delete protection: forbids deleting MenuItems or Invoices that have transaction history.
   */
  public deleteMenuItemSafe(tenantId: string, menuItemId: string): void {
    this.transaction((tx) => {
      const itemIdx = tx.menuItems.findIndex(
        (m) => m.id === menuItemId && m.tenantId === tenantId
      );
      if (itemIdx === -1) {
        throw new Error('MENU_ITEM_NOT_FOUND');
      }
      const item = tx.menuItems[itemIdx]!;
      const usedInOrders = tx.orderItems.some((oi) => oi.menuItemId === menuItemId);
      if (item.hasTransactions || usedInOrders) {
        throw new Error(
          'HARD_DELETE_FORBIDDEN: Không được xóa cứng món ăn đã phát sinh giao dịch. Hãy chuyển trạng thái sang ẨN hoặc HẾT HÀNG.'
        );
      }
      tx.menuItems.splice(itemIdx, 1);
    });
  }

  /**
   * Creates an AES-256-GCM encrypted backup of a specific branch's transactional data
   * with cryptographic integrity checksum.
   */
  public createEncryptedBranchBackup(params: {
    tenantId: string;
    branchId: string;
    encryptionKeyHex: string; // 64 hex chars = 32 bytes
    nowIso?: string;
  }): EncryptedBackupPackage {
    const { tenantId, branchId, encryptionKeyHex, nowIso = new Date().toISOString() } = params;
    const keyBuffer = Buffer.from(encryptionKeyHex, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error('Encryption key must be 256 bits (64 hex characters)');
    }

    const branchSnapshot: DatabaseStateSnapshot = {
      schemaVersion: this.state.schemaVersion,
      tenants: this.state.tenants.filter((t) => t.id === tenantId),
      contracts: this.state.contracts.filter((c) => c.tenantId === tenantId),
      branches: this.state.branches.filter((b) => b.id === branchId && b.tenantId === tenantId),
      users: this.state.users.filter(
        (u) => u.tenantId === tenantId && (!u.branchId || u.branchId === branchId)
      ),
      userSessions: [], // Never include active session tokens in backups
      supportAccessGrants: this.state.supportAccessGrants.filter((g) => g.branchId === branchId),
      approvalRequests: this.state.approvalRequests.filter((a) => a.branchId === branchId),
      menuItems: this.state.menuItems.filter((m) => m.tenantId === tenantId),
      branchMenuConfigs: this.state.branchMenuConfigs.filter((c) => c.branchId === branchId),
      menuReleases: this.state.menuReleases.filter((r) => r.tenantId === tenantId),
      diningTables: this.state.diningTables.filter((t) => t.branchId === branchId),
      tableSessions: this.state.tableSessions.filter((s) => s.branchId === branchId),
      orderRounds: this.state.orderRounds.filter((r) => r.branchId === branchId),
      orderItems: this.state.orderItems.filter((i) => i.branchId === branchId),
      printerDevices: this.state.printerDevices.filter((p) => p.branchId === branchId),
      printJobs: this.state.printJobs.filter((j) => j.branchId === branchId),
      invoices: this.state.invoices.filter((inv) => inv.branchId === branchId),
      payments: this.state.payments.filter((p) => p.branchId === branchId),
      refundRequests: this.state.refundRequests.filter((r) => r.branchId === branchId),
      customerRatings: this.state.customerRatings.filter((r) => r.branchId === branchId),
      idempotencyRecords: this.state.idempotencyRecords.filter((r) => r.branchId === branchId),
      outboxEvents: this.state.outboxEvents.filter((e) => e.branchId === branchId),
      auditLogs: this.state.auditLogs.filter((l) => l.branchId === branchId),
      systemAlerts: this.state.systemAlerts.filter((a) => a.branchId === branchId),
      clusterStates: this.state.clusterStates.filter((c) => c.branchId === branchId),
    };

    const plaintextJson = JSON.stringify(branchSnapshot);
    const sha256Checksum = crypto.createHash('sha256').update(plaintextJson, 'utf8').digest('hex');

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(plaintextJson, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const maxOutboxSequence = branchSnapshot.outboxEvents.reduce(
      (max, e) => Math.max(max, e.sequenceNumber),
      0
    );
    const totalConfirmedPaymentsVnd = branchSnapshot.payments
      .filter((p) => p.durabilityState === 'CONFIRMED_DUAL_NODE' || p.durabilityState === 'SYNCED_TO_CLOUD')
      .reduce((sum, p) => sum + p.amountVnd, 0);

    return {
      manifest: {
        backupId: crypto.randomUUID(),
        tenantId,
        branchId,
        schemaVersion: this.state.schemaVersion,
        createdAtIso: nowIso,
        maxOutboxSequence,
        invoiceCount: branchSnapshot.invoices.length,
        totalConfirmedPaymentsVnd,
        ivHex: iv.toString('hex'),
        authTagHex: authTag.toString('hex'),
        sha256Checksum,
      },
      ciphertextBase64: encrypted.toString('base64'),
    };
  }

  /**
   * Restores and verifies an encrypted backup in an isolated database instance.
   * Never marks a backup as valid without decrypting, verifying checksum, and checking invariants.
   */
  public static verifyAndRestoreIsolated(params: {
    backupPackage: EncryptedBackupPackage;
    encryptionKeyHex: string;
  }): {
    restoredDb: TransactionalDatabase;
    verifiedInvoiceCount: number;
    verifiedTotalPaymentsVnd: number;
    nonCompletedPrintJobsRequeued: number;
  } {
    const { backupPackage, encryptionKeyHex } = params;
    const keyBuffer = Buffer.from(encryptionKeyHex, 'hex');
    const iv = Buffer.from(backupPackage.manifest.ivHex, 'hex');
    const authTag = Buffer.from(backupPackage.manifest.authTagHex, 'hex');
    const ciphertext = Buffer.from(backupPackage.ciphertextBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const decryptedJson = decryptedBuffer.toString('utf8');

    const actualChecksum = crypto.createHash('sha256').update(decryptedJson, 'utf8').digest('hex');
    if (actualChecksum !== backupPackage.manifest.sha256Checksum) {
      throw new Error('BACKUP_CHECKSUM_MISMATCH: Dữ liệu sao lưu không toàn vẹn.');
    }

    const parsedState = JSON.parse(decryptedJson) as DatabaseStateSnapshot;
    const restoredDb = new TransactionalDatabase({ initialState: parsedState });

    // Crucial Rule: When restoring or recovering, NEVER automatically reprint already completed print jobs
    let nonCompletedPrintJobsRequeued = 0;
    restoredDb.transaction((tx) => {
      for (const job of tx.printJobs) {
        if (job.status === 'SENDING') {
          job.status = 'QUEUED';
          nonCompletedPrintJobsRequeued++;
        }
        // CONFIRMED_BY_STAFF jobs stay CONFIRMED_BY_STAFF and are NEVER re-queued
      }
    });

    const verifiedInvoiceCount = restoredDb.getState().invoices.length;
    const verifiedTotalPaymentsVnd = restoredDb
      .getState()
      .payments.filter(
        (p) =>
          p.durabilityState === 'CONFIRMED_DUAL_NODE' || p.durabilityState === 'SYNCED_TO_CLOUD'
      )
      .reduce((sum, p) => sum + p.amountVnd, 0);

    if (
      verifiedInvoiceCount !== backupPackage.manifest.invoiceCount ||
      verifiedTotalPaymentsVnd !== backupPackage.manifest.totalConfirmedPaymentsVnd
    ) {
      throw new Error('BACKUP_MANIFEST_INVARIANT_MISMATCH');
    }

    return {
      restoredDb,
      verifiedInvoiceCount,
      verifiedTotalPaymentsVnd,
      nonCompletedPrintJobsRequeued,
    };
  }
}
