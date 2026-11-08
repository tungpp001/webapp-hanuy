import {
  BillingCycle,
  ContractStatus,
  DiningTableStatus,
  DiscountType,
  InvoiceStatus,
  MenuItemAvailability,
  OrderItemStatus,
  OrderRoundSource,
  PaymentMethod,
  PriceInheritanceMode,
  PrinterRole,
  PrintJobStatus,
  PrintJobType,
  RefundStatus,
  SellingUnit,
  SensitiveActionType,
  ServerNodeRole,
  SupportScope,
  TableSessionStatus,
  TenantStatus,
  TransactionDurabilityState,
  UserRole,
} from '@oc-pos/shared';

export interface TenantEntity {
  id: string;
  code: string;
  brandName: string;
  status: TenantStatus;
  logoUrl: string | null;
  primaryColor: string;
  coverImageUrl: string | null;
  bannerUrl: string | null;
  customDomain: string | null;
  configVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractEntity {
  id: string;
  tenantId: string;
  billingCycle: BillingCycle;
  startDateYmd: string;
  endDateYmd: string;
  gracePeriodDays: number;
  warningDaysBefore: number[];
  termsJson: Record<string, unknown>;
  status: ContractStatus;
  signedLicenseToken: string;
  createdAt: string;
}

export interface BranchEntity {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  timezone: string; // 'Asia/Ho_Chi_Minh'
  businessDayStartHour: number; // 0..23
  status: 'ACTIVE' | 'CLOSING' | 'CLOSED';
  activeMenuVersion: number;
  primaryServerId: string;
  standbyServerId: string;
  clusterEpoch: number;
  cashierMaxDiscountPercent: number;
  cashierMaxDiscountAmountVnd: number;
  managerMaxPriceDeltaPercent: number;
  weightVarianceThresholdPercent: number;
  lastCloudSyncAt: string | null;
  lastBackupAt: string | null;
  createdAt: string;
}

export interface UserEntity {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  failedLoginAttempts: number;
  lockedUntilIso: string | null;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface UserSessionEntity {
  id: string;
  userId: string;
  tokenHash: string;
  isPosLocked: boolean;
  draftOrderStateJson: Record<string, unknown> | null;
  lastActivityAtIso: string;
  expiresAtIso: string;
  revokedAtIso: string | null;
}

export interface SupportAccessGrantEntity {
  id: string;
  tenantId: string;
  branchId: string;
  technicianUserId: string;
  requestedByUserId: string;
  approvedByUserId: string;
  scope: SupportScope;
  reason: string;
  startsAtIso: string;
  expiresAtIso: string;
  revokedAtIso: string | null;
}

export interface ApprovalRequestEntity {
  id: string;
  tenantId: string;
  branchId: string;
  actionType: SensitiveActionType;
  resourceType: string;
  resourceId: string;
  requestedByUserId: string;
  requestedByRole: UserRole;
  approvedByUserId: string | null;
  approvedByRole: UserRole | null;
  reason: string;
  payloadJson: Record<string, unknown>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAtIso: string;
  decidedAtIso: string | null;
}

export interface MenuItemEntity {
  id: string;
  tenantId: string;
  categoryName: string;
  code: string;
  name: string;
  description: string;
  imageUrl: string | null;
  sellingUnit: SellingUnit;
  isWeightBased: boolean;
  standardPriceVnd: number;
  standardPricePerKgVnd: number | null;
  /** NULL means "Chưa có dữ liệu giá vốn" — never coerced to 0 */
  standardEstimatedCostVnd: number | null;
  standardEstimatedCostPerKgVnd: number | null;
  standardPrepMinutes: number;
  allowedPrepNotes: string[];
  defaultStatus: MenuItemAvailability;
  version: number;
  copiedFromItemId: string | null;
  hasTransactions: boolean;
  createdAtIso: string;
}

export interface BranchMenuConfigEntity {
  id: string;
  tenantId: string;
  branchId: string;
  menuItemId: string;
  priceMode: PriceInheritanceMode;
  overridePriceVnd: number | null;
  overridePricePerKgVnd: number | null;
  costMode: PriceInheritanceMode;
  overrideEstimatedCostVnd: number | null;
  overrideEstimatedCostPerKgVnd: number | null;
  availabilityStatus: MenuItemAvailability;
  prepMinutesOverride: number | null;
  syncedMenuVersion: number;
  pendingPriceApprovalId: string | null;
}

export interface MenuReleaseEntity {
  id: string;
  tenantId: string;
  versionNumber: number;
  scheduledForIso: string;
  publishedAtIso: string | null;
  snapshotJson: {
    items: MenuItemEntity[];
  };
  createdByUserId: string;
  restoredFromVersion: number | null;
  createdAtIso: string;
}

export interface DiningTableEntity {
  id: string;
  tenantId: string;
  branchId: string;
  code: string;
  name: string;
  areaName: string;
  capacity: number;
  status: DiningTableStatus;
  qrStaticKey: string;
  qrVersion: number;
  activeSessionId: string | null;
  mergedIntoSessionId: string | null;
}

export interface TableSessionEntity {
  id: string;
  tenantId: string;
  branchId: string;
  primaryTableId: string;
  mergedTableIds: string[];
  sessionToken: string;
  businessDateYmd: string;
  status: TableSessionStatus;
  openedByUserId: string;
  closedByUserId: string | null;
  openedAtIso: string;
  closedAtIso: string | null;
  closeDebtApprovalId: string | null;
  closeDebtReason: string | null;
}

export interface OrderRoundEntity {
  id: string;
  tenantId: string;
  branchId: string;
  tableSessionId: string;
  roundNumber: number;
  source: OrderRoundSource;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedByUserId: string | null;
  createdAtIso: string;
  approvedAtIso: string | null;
}

export interface OrderItemEntity {
  id: string;
  tenantId: string;
  branchId: string;
  tableSessionId: string;
  orderRoundId: string;
  menuItemId: string;
  itemNameSnapshot: string;
  sellingUnitSnapshot: SellingUnit;
  isWeightBasedSnapshot: boolean;
  unitPriceVndSnapshot: number;
  pricePerKgVndSnapshot: number | null;
  /** NULL means "Chưa có dữ liệu giá vốn" */
  estimatedUnitCostVndSnapshot: number | null;
  estimatedCostPerKgVndSnapshot: number | null;
  standardPrepMinutesSnapshot: number;
  quantity: number;
  weightKg: number | null;
  weighedByUserId: string | null;
  weighedAtIso: string | null;
  customerConfirmedWeightAtIso: string | null;
  lineTotalVnd: number;
  estimatedLineCostVnd: number | null;
  prepNotes: string;
  status: OrderItemStatus;
  replacedFromOrderItemId: string | null;
  replacementReason: string | null;
  customerAgreedReplacementAtIso: string | null;
  kitchenSentAtIso: string | null;
  cookingStartedAtIso: string | null;
  completedAtIso: string | null;
  servedAtIso: string | null;
  cancelledAtIso: string | null;
  cancellationReason: string | null;
  cancellationApprovalId: string | null;
  incurredKitchenWaste: boolean;
}

export interface PrinterDeviceEntity {
  id: string;
  tenantId: string;
  branchId: string;
  role: PrinterRole;
  name: string;
  ipAddress: string;
  port: number;
  isOnline: boolean;
}

export interface PrintJobEntity {
  id: string;
  tenantId: string;
  branchId: string;
  printerRole: PrinterRole;
  jobType: PrintJobType;
  referenceId: string; // orderRoundId or invoiceId
  isReprint: boolean;
  reprintBannerText: string | null; // "IN LẠI" when isReprint === true
  payloadJson: Record<string, unknown>;
  status: PrintJobStatus;
  retryCount: number;
  lastError: string | null;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface InvoiceEntity {
  id: string;
  tenantId: string;
  branchId: string;
  tableSessionId: string;
  parentInvoiceId: string | null;
  splitIndex: number | null;
  splitTotalParts: number | null;
  displayCode: string; // e.g., BG01-20261016-0001
  businessDateYmd: string;
  subtotalVnd: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmountVnd: number;
  discountReason: string | null;
  discountByUserId: string | null;
  discountApprovalId: string | null;
  adjustmentAmountVnd: number;
  adjustmentReason: string | null;
  adjustmentApprovalId: string | null;
  totalAmountVnd: number;
  paidAmountVnd: number;
  refundedAmountVnd: number;
  debtAmountVnd: number;
  status: InvoiceStatus;
  voidReason: string | null;
  voidApprovalId: string | null;
  createdAtIso: string;
}

export interface PaymentEntity {
  id: string;
  tenantId: string;
  branchId: string;
  invoiceId: string;
  method: PaymentMethod;
  amountVnd: number;
  referenceCode: string | null;
  recordedByUserId: string;
  paidAtIso: string;
  /** The actual business date when cash/transfer was collected (crucial for debt collection on later days) */
  collectedBusinessDateYmd: string;
  isDebtCollection: boolean;
  durabilityState: TransactionDurabilityState;
}

export interface RefundRequestEntity {
  id: string;
  tenantId: string;
  branchId: string;
  invoiceId: string;
  amountVnd: number;
  method: PaymentMethod;
  reason: string;
  externalReference: string | null;
  requestedByUserId: string;
  approvedByUserId: string | null;
  status: RefundStatus;
  createdAtIso: string;
  executedAtIso: string | null;
  refundBusinessDateYmd: string | null;
}

export interface CustomerRatingEntity {
  id: string;
  tenantId: string;
  branchId: string;
  tableSessionId: string;
  stars: number; // 1..5
  comment: string | null;
  createdAtIso: string;
}

export interface IdempotencyRecordEntity {
  tenantId: string;
  branchId: string;
  idempotencyKey: string;
  endpoint: string;
  payloadHash: string;
  durabilityState: TransactionDurabilityState;
  responseStatusCode: number;
  responseBodyJson: unknown;
  createdAtIso: string;
}

export interface OutboxEventEntity {
  id: string;
  tenantId: string;
  branchId: string;
  sequenceNumber: number;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payloadJson: Record<string, unknown>;
  standbyAckedAtIso: string | null;
  cloudSyncedAtIso: string | null;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED_RETRYING' | 'CONFLICT_DETECTED';
  retryCount: number;
  lastError: string | null;
  createdAtIso: string;
}

export interface AuditLogEntity {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  actorUserId: string;
  actorRole: UserRole;
  supportGrantId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  reason: string | null;
  beforeJson: unknown;
  afterJson: unknown;
  occurredAtIso: string;
}

export interface SystemAlertEntity {
  id: string;
  tenantId: string;
  branchId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category:
    | 'PRIMARY_SERVER'
    | 'STANDBY_SERVER'
    | 'DISK_SPACE'
    | 'BACKUP'
    | 'CLOUD_SYNC'
    | 'REPLICATION'
    | 'APP_VERSION'
    | 'PRINT_QUEUE'
    | 'AUTH_SECURITY'
    | 'SENSITIVE_ACTION'
    | 'UNCERTAIN_TRANSACTION';
  title: string;
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAtIso: string;
  resolvedAtIso: string | null;
}

export interface BranchClusterState {
  branchId: string;
  clusterEpoch: number;
  primaryServerId: string;
  standbyServerId: string;
  primaryRole: ServerNodeRole;
  standbyRole: ServerNodeRole;
  standbyReachable: boolean;
  cloudReachable: boolean;
  lastStandbyAckSequence: number;
  lastPrimarySequence: number;
  requireDualNodeAckForFinancialTx: boolean;
}
