export type UserRole =
  | 'SAAS_ADMIN'
  | 'TECH_SUPPORT'
  | 'CHAIN_OWNER'
  | 'BRANCH_MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'KITCHEN_STAFF';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export type ContractStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'GRACE_PERIOD'
  | 'EXPIRED_RESTRICTED'
  | 'SUSPENDED'
  | 'TERMINATED';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export type PriceInheritanceMode = 'INHERITED' | 'OVERRIDE';

export type MenuItemAvailability = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

export type SellingUnit = 'PORTION' | 'KG' | 'PLATE' | 'COMBO';

export type DiningTableStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'PENDING_PAYMENT'
  | 'CLEANING';

export type TableSessionStatus =
  | 'OPEN'
  | 'LOCKED_FOR_PAYMENT'
  | 'CLOSED'
  | 'CLOSED_WITH_DEBT';

export type OrderRoundSource = 'CUSTOMER_QR' | 'STAFF_POS';

export type OrderItemStatus =
  | 'PENDING_WEIGHT_CONFIRM'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT_TO_KITCHEN'
  | 'COOKING'
  | 'COMPLETED'
  | 'SERVED'
  | 'PENDING_CANCELLATION'
  | 'CANCELLED';

export type PrinterRole = 'KITCHEN' | 'CASHIER';

export type PrintJobType = 'KITCHEN_ROUND_TICKET' | 'INVOICE_RECEIPT';

export type PrintJobStatus =
  | 'QUEUED'
  | 'SENDING'
  | 'DISPATCHED_UNVERIFIED'
  | 'CONFIRMED_BY_STAFF'
  | 'FAILED'
  | 'CANCELLED_BEFORE_SEND';

export type DiscountType = 'NONE' | 'AMOUNT' | 'PERCENT';

export type InvoiceStatus =
  | 'DRAFT'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'VOIDED'
  | 'REFUNDED_PARTIAL'
  | 'REFUNDED_FULL';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER_STATIC_QR';

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED';

export type SensitiveActionType =
  | 'DISCOUNT_OVER_LIMIT'
  | 'CANCEL_ITEM_AFTER_KITCHEN'
  | 'VOID_INVOICE'
  | 'REFUND_PAYMENT'
  | 'ADJUST_RECEIVABLE'
  | 'CLOSE_TABLE_WITH_DEBT'
  | 'REOPEN_CLOSED_SESSION_OR_INVOICE'
  | 'PRICE_CHANGE_OVER_LIMIT'
  | 'DATA_RESTORE_OR_FAILOVER';

export type TransactionDurabilityState =
  | 'PROCESSING'
  | 'PERSISTED_LOCAL'
  | 'CONFIRMED_DUAL_NODE'
  | 'SYNCED_TO_CLOUD'
  | 'UNCERTAIN_NEEDS_RECONCILIATION'
  | 'FAILED';

export type SupportScope =
  | 'DIAGNOSTICS_READ'
  | 'PRINTER_CONFIG'
  | 'SYNC_RECOVERY'
  | 'FAILOVER_ASSIST';

export type ServerNodeRole = 'PRIMARY' | 'STANDBY' | 'QUARANTINED_READONLY';
