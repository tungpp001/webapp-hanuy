import crypto from 'node:crypto';
import {
  ActorAccessContext,
  assertIntegerVnd,
  assertTenantAndBranchScope,
  calculateInvoiceDiscountVnd,
  DiscountType,
  formatInvoiceDisplayCode,
  PaymentMethod,
  resolveVietnamBusinessDateYmd,
  splitInvoiceEquallyVnd,
  TransactionDurabilityState,
  validateSensitiveActionApproval,
} from '@oc-pos/shared';
import {
  InvoiceEntity,
  PaymentEntity,
  PrintJobEntity,
  RefundRequestEntity,
  TableSessionEntity,
  TransactionalDatabase,
} from '@oc-pos/database';
import { OrderingAndKitchenService } from './ordering-kitchen.service.js';

export interface FinancialReportSummary {
  tenantId: string;
  branchId: string;
  businessDateYmd: string;
  generatedAtIso: string;
  lastCloudSyncAtIso: string | null;
  invoiceCount: number;
  /** Doanh thu phát sinh từ các hóa đơn mở trong ngày kinh doanh này */
  grossRevenueVnd: number;
  /** Tổng giảm giá cấp hóa đơn */
  discountTotalVnd: number;
  /** Khoản điều chỉnh/miễn giảm khiếu nại */
  adjustmentTotalVnd: number;
  /** Doanh thu thuần sau giảm giá và điều chỉnh */
  netRevenueVnd: number;
  /** Tiền thực thu trong ngày kinh doanh này (gồm cả thu nợ của hóa đơn ngày trước, KHÔNG cộng lặp vào doanh thu) */
  totalCollectedCashAndTransferVnd: number;
  cashCollectedVnd: number;
  bankTransferCollectedVnd: number;
  debtCollectionFromPriorDaysVnd: number;
  /** Hoàn tiền thực hiện trong ngày */
  refundedTotalVnd: number;
  /** Tổng khoản phải thu (công nợ còn chưa thu) */
  outstandingReceivablesDebtVnd: number;
  /** Giá vốn ước tính & Lợi nhuận gộp ước tính (Chỉ ghi lợi nhuận gộp ước tính, không gọi là lợi nhuận ròng) */
  estimatedCostOfGoodsVnd: number | null;
  estimatedGrossProfitVnd: number | null;
  hasItemsWithMissingCostData: boolean;
}

export class BillingAndPaymentService {
  constructor(
    private readonly db: TransactionalDatabase,
    private readonly orderingService: OrderingAndKitchenService
  ) {}

  /**
   * Generates a primary Invoice for an open TableSession based on all non-cancelled OrderItems.
   */
  public createInvoiceForSession(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    tableSessionId: string;
    idempotencyKey: string;
    nowIso?: string;
  }): InvoiceEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      isFinancialTransactionMutation: true,
      nowIso,
    });

    const res = this.orderingService.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'CREATE_INVOICE_FOR_SESSION',
      payload: { tableSessionId: params.tableSessionId },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx) => {
        const branch = tx.branches.find((b) => b.id === params.branchId)!;
        const session = tx.tableSessions.find(
          (s) => s.id === params.tableSessionId && s.branchId === params.branchId
        );
        if (!session) {
          throw new Error('TABLE_SESSION_NOT_FOUND');
        }

        const activeItems = tx.orderItems.filter(
          (i) => i.tableSessionId === session.id && i.status !== 'CANCELLED'
        );
        if (activeItems.length === 0) {
          throw new Error('NO_BILLABLE_ITEMS_IN_SESSION');
        }
        if (
          activeItems.some(
            (i) =>
              i.status === 'PENDING_WEIGHT_CONFIRM' || i.status === 'PENDING_APPROVAL'
          )
        ) {
          throw new Error(
            'UNAPPROVED_ITEMS_REMAINING: Còn món chờ xác nhận cân hoặc chờ nhân viên duyệt.'
          );
        }

        const subtotalVnd = activeItems.reduce((sum, i) => sum + i.lineTotalVnd, 0);
        const sameDayInvoices = tx.invoices.filter(
          (inv) =>
            inv.branchId === params.branchId &&
            inv.businessDateYmd === session.businessDateYmd
        );
        const nextSeq = sameDayInvoices.length + 1;
        const displayCode = formatInvoiceDisplayCode(
          branch.code,
          session.businessDateYmd,
          nextSeq
        );

        const invoice: InvoiceEntity = {
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          tableSessionId: session.id,
          parentInvoiceId: null,
          splitIndex: null,
          splitTotalParts: null,
          displayCode,
          businessDateYmd: session.businessDateYmd,
          subtotalVnd,
          discountType: 'NONE',
          discountValue: 0,
          discountAmountVnd: 0,
          discountReason: null,
          discountByUserId: null,
          discountApprovalId: null,
          adjustmentAmountVnd: 0,
          adjustmentReason: null,
          adjustmentApprovalId: null,
          totalAmountVnd: subtotalVnd,
          paidAmountVnd: 0,
          refundedAmountVnd: 0,
          debtAmountVnd: subtotalVnd,
          status: 'UNPAID',
          voidReason: null,
          voidApprovalId: null,
          createdAtIso: nowIso,
        };
        tx.invoices.push(invoice);

        const primaryTable = tx.diningTables.find(
          (t) => t.id === session.primaryTableId
        );
        if (primaryTable) {
          primaryTable.status = 'PENDING_PAYMENT';
        }

        return invoice;
      },
    });

    return res.data;
  }

  /**
   * Applies a single invoice-level discount (AMOUNT or PERCENT).
   * - Enforces MVP rule: only 1 invoice-level discount (replaces or sets once, never stacks multiple).
   * - Never allows total to become negative.
   * - If discount exceeds Cashier's configured limit (% or VND), requires independent Manager/Chain Owner approval.
   */
  public applyInvoiceDiscount(params: {
    requester: ActorAccessContext;
    approver?: ActorAccessContext;
    tenantId: string;
    branchId: string;
    invoiceId: string;
    discountType: DiscountType;
    discountValue: number;
    reason: string;
    idempotencyKey: string;
    nowIso?: string;
  }): InvoiceEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.requester,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      isFinancialTransactionMutation: true,
      nowIso,
    });

    if (!params.reason || params.reason.trim().length < 3) {
      throw new Error('DISCOUNT_REASON_REQUIRED');
    }

    const res = this.orderingService.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'APPLY_INVOICE_DISCOUNT',
      payload: {
        invoiceId: params.invoiceId,
        discountType: params.discountType,
        discountValue: params.discountValue,
      },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx) => {
        const branch = tx.branches.find((b) => b.id === params.branchId)!;
        const invoice = tx.invoices.find(
          (inv) => inv.id === params.invoiceId && inv.branchId === params.branchId
        );
        if (!invoice) {
          throw new Error('INVOICE_NOT_FOUND');
        }
        if (invoice.status !== 'UNPAID' && invoice.status !== 'DRAFT') {
          throw new Error('CANNOT_DISCOUNT_ALREADY_PAID_OR_VOIDED_INVOICE');
        }
        if (invoice.discountType !== 'NONE') {
          throw new Error(
            'SINGLE_INVOICE_DISCOUNT_ONLY: Mỗi hóa đơn chỉ áp dụng 1 khoản giảm giá cấp hóa đơn, không cộng dồn nhiều khoản.'
          );
        }

        const calc = calculateInvoiceDiscountVnd({
          subtotalVnd: invoice.subtotalVnd,
          discountType: params.discountType,
          discountValue: params.discountValue,
        });

        const effectivePercent =
          invoice.subtotalVnd > 0
            ? (calc.discountAmountVnd / invoice.subtotalVnd) * 100
            : 0;

        const exceedsCashierLimit =
          effectivePercent > branch.cashierMaxDiscountPercent ||
          calc.discountAmountVnd > branch.cashierMaxDiscountAmountVnd;

        if (exceedsCashierLimit && params.requester.role === 'CASHIER') {
          if (!params.approver) {
            throw new Error(
              `DISCOUNT_EXCEEDS_CASHIER_LIMIT: Giảm giá ${calc.discountAmountVnd} VND (${effectivePercent.toFixed(1)}%) vượt hạn mức Thu ngân. Cần Quản lý hoặc Chủ chuỗi phê duyệt.`
            );
          }
          validateSensitiveActionApproval({
            actionType: 'DISCOUNT_OVER_LIMIT',
            requestedByUserId: params.requester.userId,
            requestedByRole: params.requester.role,
            approvedByUserId: params.approver.userId,
            approvedByRole: params.approver.role,
            reason: params.reason,
            requireIndependentApprover: true,
          });
        }

        invoice.discountType = params.discountType;
        invoice.discountValue = params.discountValue;
        invoice.discountAmountVnd = calc.discountAmountVnd;
        invoice.discountReason = params.reason;
        invoice.discountByUserId = params.requester.userId;
        invoice.totalAmountVnd = Math.max(
          0,
          calc.finalTotalVnd - invoice.adjustmentAmountVnd
        );
        invoice.debtAmountVnd = Math.max(
          0,
          invoice.totalAmountVnd - invoice.paidAmountVnd
        );

        tx.auditLogs.push({
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          actorUserId: params.approver?.userId ?? params.requester.userId,
          actorRole: params.approver?.role ?? params.requester.role,
          supportGrantId: null,
          action: 'APPLY_INVOICE_DISCOUNT',
          resourceType: 'INVOICE',
          resourceId: invoice.id,
          reason: params.reason,
          beforeJson: { subtotalVnd: invoice.subtotalVnd, discountAmountVnd: 0 },
          afterJson: {
            discountType: invoice.discountType,
            discountAmountVnd: invoice.discountAmountVnd,
            totalAmountVnd: invoice.totalAmountVnd,
          },
          occurredAtIso: nowIso,
        });

        return invoice;
      },
    });

    return res.data;
  }

  /**
   * Splits an unpaid parent invoice equally into N child invoices.
   * Sum of child subtotals, discounts, and totals matches the parent invoice to the exact 1 VND.
   */
  public splitInvoiceEqually(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    parentInvoiceId: string;
    partsCount: number;
    idempotencyKey: string;
    nowIso?: string;
  }): InvoiceEntity[] {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      isFinancialTransactionMutation: true,
      nowIso,
    });

    const res = this.orderingService.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'SPLIT_INVOICE_EQUALLY',
      payload: {
        parentInvoiceId: params.parentInvoiceId,
        partsCount: params.partsCount,
      },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx) => {
        const parent = tx.invoices.find(
          (inv) => inv.id === params.parentInvoiceId && inv.branchId === params.branchId
        );
        if (!parent || parent.status !== 'UNPAID') {
          throw new Error('PARENT_INVOICE_MUST_BE_UNPAID_TO_SPLIT');
        }

        const splitParts = splitInvoiceEquallyVnd({
          subtotalVnd: parent.subtotalVnd,
          discountAmountVnd: parent.discountAmountVnd,
          partsCount: params.partsCount,
        });

        // Mark parent as VOIDED due to split so its revenue is never double-counted alongside children
        parent.status = 'VOIDED';
        parent.voidReason = `Tách thành ${params.partsCount} hóa đơn chia đều`;
        parent.debtAmountVnd = 0;

        const childInvoices: InvoiceEntity[] = splitParts.map((part) => {
          const child: InvoiceEntity = {
            id: crypto.randomUUID(),
            tenantId: params.tenantId,
            branchId: params.branchId,
            tableSessionId: parent.tableSessionId,
            parentInvoiceId: parent.id,
            splitIndex: part.partIndex,
            splitTotalParts: part.totalParts,
            displayCode: `${parent.displayCode}-P${part.partIndex}`,
            businessDateYmd: parent.businessDateYmd,
            subtotalVnd: part.subtotalVnd,
            discountType: parent.discountType !== 'NONE' ? 'AMOUNT' : 'NONE',
            discountValue: part.discountAmountVnd,
            discountAmountVnd: part.discountAmountVnd,
            discountReason: parent.discountReason,
            discountByUserId: parent.discountByUserId,
            discountApprovalId: parent.discountApprovalId,
            adjustmentAmountVnd: 0,
            adjustmentReason: null,
            adjustmentApprovalId: null,
            totalAmountVnd: part.totalAmountVnd,
            paidAmountVnd: 0,
            refundedAmountVnd: 0,
            debtAmountVnd: part.totalAmountVnd,
            status: 'UNPAID',
            voidReason: null,
            voidApprovalId: null,
            createdAtIso: nowIso,
          };
          tx.invoices.push(child);
          return child;
        });

        return childInvoices;
      },
    });

    return res.data;
  }

  /**
   * Records a payment (CASH or BANK_TRANSFER_STATIC_QR).
   * - Supports partial/multi-method payments.
   * - Enforces idempotency so retrying a lost response never creates a duplicate payment.
   * - When paying off debt from a previously closed table (`isDebtCollection`),
   *   records `collectedBusinessDateYmd` as the actual date money was received,
   *   without creating duplicate revenue.
   */
  public recordInvoicePayment(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    invoiceId: string;
    method: PaymentMethod;
    amountVnd: number;
    referenceCode?: string;
    cashierVerifiedBankApp?: boolean;
    idempotencyKey: string;
    nowIso?: string;
  }): {
    payment: PaymentEntity;
    invoice: InvoiceEntity;
    receiptPrintJob: PrintJobEntity | null;
    durabilityState: TransactionDurabilityState;
    standbyWarning: string | null;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      isFinancialTransactionMutation: true,
      nowIso,
    });
    assertIntegerVnd(params.amountVnd, 'amountVnd');
    if (params.amountVnd <= 0) {
      throw new Error('PAYMENT_AMOUNT_MUST_BE_POSITIVE');
    }

    if (
      params.method === 'BANK_TRANSFER_STATIC_QR' &&
      !params.cashierVerifiedBankApp
    ) {
      throw new Error(
        'CASHIER_BANK_VERIFICATION_REQUIRED: Thu ngân phải kiểm tra giao dịch thực tế trên ứng dụng ngân hàng trước khi xác nhận đã nhận tiền chuyển khoản QR tĩnh.'
      );
    }

    const res = this.orderingService.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'RECORD_INVOICE_PAYMENT',
      payload: {
        invoiceId: params.invoiceId,
        method: params.method,
        amountVnd: params.amountVnd,
        referenceCode: params.referenceCode ?? null,
      },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx, durabilityState) => {
        const branch = tx.branches.find((b) => b.id === params.branchId)!;
        const invoice = tx.invoices.find(
          (inv) => inv.id === params.invoiceId && inv.branchId === params.branchId
        );
        if (!invoice) {
          throw new Error('INVOICE_NOT_FOUND');
        }
        if (invoice.status === 'VOIDED' || invoice.status === 'PAID') {
          throw new Error(`CANNOT_PAY_INVOICE_IN_STATUS_${invoice.status}`);
        }
        if (params.amountVnd > invoice.debtAmountVnd) {
          throw new Error(
            `PAYMENT_EXCEEDS_REMAINING_DEBT: Số tiền thu (${params.amountVnd} VND) vượt quá số còn phải thu (${invoice.debtAmountVnd} VND).`
          );
        }

        const collectedBusinessDateYmd = resolveVietnamBusinessDateYmd(
          nowIso,
          branch.businessDayStartHour
        );
        const session = tx.tableSessions.find(
          (s) => s.id === invoice.tableSessionId
        );
        const isDebtCollection =
          session?.status === 'CLOSED_WITH_DEBT' ||
          collectedBusinessDateYmd !== invoice.businessDateYmd;

        const payment: PaymentEntity = {
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          invoiceId: invoice.id,
          method: params.method,
          amountVnd: params.amountVnd,
          referenceCode: params.referenceCode ?? null,
          recordedByUserId: params.actor.userId,
          paidAtIso: nowIso,
          collectedBusinessDateYmd,
          isDebtCollection,
          durabilityState,
        };
        tx.payments.push(payment);

        invoice.paidAmountVnd += params.amountVnd;
        invoice.debtAmountVnd = invoice.totalAmountVnd - invoice.paidAmountVnd;
        invoice.status = invoice.debtAmountVnd === 0 ? 'PAID' : 'PARTIALLY_PAID';

        // Check if all active invoices for this session are now PAID -> close session and release table
        let receiptPrintJob: PrintJobEntity | null = null;
        const cashierPrinter = tx.printerDevices.find(
          (p) => p.branchId === params.branchId && p.role === 'CASHIER'
        );
        const printerOnline = cashierPrinter ? cashierPrinter.isOnline : true;

        receiptPrintJob = {
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          printerRole: 'CASHIER',
          jobType: 'INVOICE_RECEIPT',
          referenceId: invoice.id,
          isReprint: false,
          reprintBannerText: null,
          payloadJson: {
            disclaimer: 'PHIẾU THANH TOÁN NỘI BỘ (Không phải hóa đơn điện tử thuế)',
            displayCode: invoice.displayCode,
            totalAmountVnd: invoice.totalAmountVnd,
            paidAmountVnd: invoice.paidAmountVnd,
            debtAmountVnd: invoice.debtAmountVnd,
            paymentMethod: payment.method,
          },
          status: printerOnline ? 'DISPATCHED_UNVERIFIED' : 'FAILED',
          retryCount: printerOnline ? 0 : 1,
          lastError: printerOnline ? null : 'CASHIER_PRINTER_OFFLINE',
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
        };
        tx.printJobs.push(receiptPrintJob);

        if (session && session.status === 'OPEN') {
          const sessionInvoices = tx.invoices.filter(
            (inv) => inv.tableSessionId === session.id && inv.status !== 'VOIDED'
          );
          if (
            sessionInvoices.length > 0 &&
            sessionInvoices.every((inv) => inv.status === 'PAID')
          ) {
            session.status = 'CLOSED';
            session.closedByUserId = params.actor.userId;
            session.closedAtIso = nowIso;
            session.sessionToken = `revoked-${crypto.randomUUID()}`;

            const tableIds = [session.primaryTableId, ...session.mergedTableIds];
            for (const tid of tableIds) {
              const t = tx.diningTables.find((tbl) => tbl.id === tid);
              if (t) {
                t.status = 'AVAILABLE';
                t.activeSessionId = null;
                t.mergedIntoSessionId = null;
              }
            }
          }
        }

        return { payment, invoice, receiptPrintJob };
      },
    });

    return {
      ...res.data,
      durabilityState: res.durabilityState,
      standbyWarning: res.standbyWarning,
    };
  }

  /**
   * Manager closes a table session while an invoice still has outstanding debt (`UNPAID` or `PARTIALLY_PAID`).
   * Releases the physical table for new guests WITHOUT marking the invoice as PAID.
   */
  public closeTableSessionWithDebt(params: {
    requester: ActorAccessContext;
    approver: ActorAccessContext;
    tenantId: string;
    branchId: string;
    tableSessionId: string;
    reason: string;
    idempotencyKey: string;
    nowIso?: string;
  }): {
    session: TableSessionEntity;
    unpaidInvoices: InvoiceEntity[];
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.requester,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      isFinancialTransactionMutation: true,
      nowIso,
    });

    validateSensitiveActionApproval({
      actionType: 'CLOSE_TABLE_WITH_DEBT',
      requestedByUserId: params.requester.userId,
      requestedByRole: params.requester.role,
      approvedByUserId: params.approver.userId,
      approvedByRole: params.approver.role,
      reason: params.reason,
      requireIndependentApprover:
        params.requester.role !== 'BRANCH_MANAGER' &&
        params.requester.role !== 'CHAIN_OWNER',
    });

    const res = this.orderingService.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'CLOSE_TABLE_WITH_DEBT',
      payload: {
        tableSessionId: params.tableSessionId,
        reason: params.reason,
      },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx) => {
        const session = tx.tableSessions.find(
          (s) => s.id === params.tableSessionId && s.branchId === params.branchId
        );
        if (!session) {
          throw new Error('TABLE_SESSION_NOT_FOUND');
        }

        const unpaidInvoices = tx.invoices.filter(
          (inv) =>
            inv.tableSessionId === session.id &&
            (inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID') &&
            inv.debtAmountVnd > 0
        );
        if (unpaidInvoices.length === 0) {
          throw new Error('NO_OUTSTANDING_DEBT_ON_SESSION');
        }

        session.status = 'CLOSED_WITH_DEBT';
        session.closedByUserId = params.approver.userId;
        session.closedAtIso = nowIso;
        session.closeDebtReason = params.reason;
        session.sessionToken = `revoked-${crypto.randomUUID()}`;

        // Release physical table(s) while keeping invoice status as UNPAID / PARTIALLY_PAID
        const tableIds = [session.primaryTableId, ...session.mergedTableIds];
        for (const tid of tableIds) {
          const table = tx.diningTables.find((t) => t.id === tid);
          if (table) {
            table.status = 'AVAILABLE';
            table.activeSessionId = null;
            table.mergedIntoSessionId = null;
          }
        }

        tx.auditLogs.push({
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          actorUserId: params.approver.userId,
          actorRole: params.approver.role,
          supportGrantId: null,
          action: 'CLOSE_TABLE_WITH_DEBT',
          resourceType: 'TABLE_SESSION',
          resourceId: session.id,
          reason: params.reason,
          beforeJson: { status: 'OPEN' },
          afterJson: {
            status: 'CLOSED_WITH_DEBT',
            totalDebtVnd: unpaidInvoices.reduce((s, i) => s + i.debtAmountVnd, 0),
          },
          occurredAtIso: nowIso,
        });

        return { session, unpaidInvoices };
      },
    });

    return res.data;
  }

  /**
   * Voids an UNPAID invoice (only Manager/Chain Owner, mandatory reason, preserves history).
   * Paid or partially paid invoices cannot be voided directly.
   */
  public voidUnpaidInvoice(params: {
    requester: ActorAccessContext;
    approver: ActorAccessContext;
    tenantId: string;
    branchId: string;
    invoiceId: string;
    reason: string;
    idempotencyKey: string;
    nowIso?: string;
  }): InvoiceEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.requester,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      isFinancialTransactionMutation: true,
      nowIso,
    });

    validateSensitiveActionApproval({
      actionType: 'VOID_INVOICE',
      requestedByUserId: params.requester.userId,
      requestedByRole: params.requester.role,
      approvedByUserId: params.approver.userId,
      approvedByRole: params.approver.role,
      reason: params.reason,
      requireIndependentApprover:
        params.requester.role !== 'BRANCH_MANAGER' &&
        params.requester.role !== 'CHAIN_OWNER',
    });

    const res = this.orderingService.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'VOID_UNPAID_INVOICE',
      payload: { invoiceId: params.invoiceId, reason: params.reason },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx) => {
        const invoice = tx.invoices.find(
          (inv) => inv.id === params.invoiceId && inv.branchId === params.branchId
        );
        if (!invoice) {
          throw new Error('INVOICE_NOT_FOUND');
        }
        if (invoice.paidAmountVnd > 0 || invoice.status !== 'UNPAID') {
          throw new Error(
            'CANNOT_VOID_PAID_OR_PARTIALLY_PAID_INVOICE: Hóa đơn đã thu tiền không được hủy trực tiếp; vui lòng sử dụng quy trình Hoàn tiền hoặc Điều chỉnh.'
          );
        }

        // Ensure kitchen-sent items are cancelled first before voiding invoice
        const activeKitchenItems = tx.orderItems.filter(
          (i) =>
            i.tableSessionId === invoice.tableSessionId &&
            i.status !== 'CANCELLED' &&
            (i.status === 'SENT_TO_KITCHEN' ||
              i.status === 'COOKING' ||
              i.status === 'COMPLETED' ||
              i.status === 'SERVED')
        );
        if (activeKitchenItems.length > 0) {
          throw new Error(
            'MUST_HANDLE_KITCHEN_ITEMS_BEFORE_VOID: Hủy hóa đơn không đồng nghĩa với xóa món đã gửi bếp. Phải xử lý hủy món hoặc điều chỉnh trước.'
          );
        }

        invoice.status = 'VOIDED';
        invoice.voidReason = params.reason;
        invoice.debtAmountVnd = 0;

        tx.auditLogs.push({
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          actorUserId: params.approver.userId,
          actorRole: params.approver.role,
          supportGrantId: null,
          action: 'VOID_INVOICE',
          resourceType: 'INVOICE',
          resourceId: invoice.id,
          reason: params.reason,
          beforeJson: { status: 'UNPAID' },
          afterJson: { status: 'VOIDED', voidReason: params.reason },
          occurredAtIso: nowIso,
        });

        return invoice;
      },
    });

    return res.data;
  }

  /**
   * Creates, approves, and executes a refund on a paid/partially-paid invoice.
   * - Never refunds more than eligible net collected amount (`paidAmountVnd - refundedAmountVnd`).
   * - Never mutates or deletes original payment records.
   * - Enforces idempotency so retries never create duplicate refunds.
   */
  public processRefund(params: {
    requester: ActorAccessContext;
    approver: ActorAccessContext;
    tenantId: string;
    branchId: string;
    invoiceId: string;
    amountVnd: number;
    method: PaymentMethod;
    reason: string;
    externalReference?: string;
    idempotencyKey: string;
    nowIso?: string;
  }): {
    refund: RefundRequestEntity;
    invoice: InvoiceEntity;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.requester,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      isFinancialTransactionMutation: true,
      nowIso,
    });
    assertIntegerVnd(params.amountVnd, 'amountVnd');
    if (params.amountVnd <= 0) {
      throw new Error('REFUND_AMOUNT_MUST_BE_POSITIVE');
    }

    validateSensitiveActionApproval({
      actionType: 'REFUND_PAYMENT',
      requestedByUserId: params.requester.userId,
      requestedByRole: params.requester.role,
      approvedByUserId: params.approver.userId,
      approvedByRole: params.approver.role,
      reason: params.reason,
      requireIndependentApprover:
        params.requester.role !== 'BRANCH_MANAGER' &&
        params.requester.role !== 'CHAIN_OWNER',
    });

    const res = this.orderingService.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'PROCESS_REFUND',
      payload: {
        invoiceId: params.invoiceId,
        amountVnd: params.amountVnd,
        method: params.method,
        reason: params.reason,
      },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx) => {
        const branch = tx.branches.find((b) => b.id === params.branchId)!;
        const invoice = tx.invoices.find(
          (inv) => inv.id === params.invoiceId && inv.branchId === params.branchId
        );
        if (!invoice) {
          throw new Error('INVOICE_NOT_FOUND');
        }

        const eligibleRefundableVnd = invoice.paidAmountVnd - invoice.refundedAmountVnd;
        if (params.amountVnd > eligibleRefundableVnd) {
          throw new Error(
            `REFUND_EXCEEDS_ELIGIBLE_PAID_AMOUNT: Số tiền hoàn (${params.amountVnd} VND) vượt quá số tiền thực thu còn lại (${eligibleRefundableVnd} VND).`
          );
        }

        const refundBusinessDateYmd = resolveVietnamBusinessDateYmd(
          nowIso,
          branch.businessDayStartHour
        );

        const refund: RefundRequestEntity = {
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          invoiceId: invoice.id,
          amountVnd: params.amountVnd,
          method: params.method,
          reason: params.reason,
          externalReference: params.externalReference ?? null,
          requestedByUserId: params.requester.userId,
          approvedByUserId: params.approver.userId,
          status: 'EXECUTED',
          createdAtIso: nowIso,
          executedAtIso: nowIso,
          refundBusinessDateYmd,
        };
        tx.refundRequests.push(refund);

        invoice.refundedAmountVnd += params.amountVnd;
        invoice.status =
          invoice.refundedAmountVnd === invoice.paidAmountVnd
            ? 'REFUNDED_FULL'
            : 'REFUNDED_PARTIAL';

        tx.auditLogs.push({
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          actorUserId: params.approver.userId,
          actorRole: params.approver.role,
          supportGrantId: null,
          action: 'EXECUTE_REFUND',
          resourceType: 'INVOICE',
          resourceId: invoice.id,
          reason: params.reason,
          beforeJson: { refundedAmountVnd: invoice.refundedAmountVnd - params.amountVnd },
          afterJson: { refundedAmountVnd: invoice.refundedAmountVnd, refundId: refund.id },
          occurredAtIso: nowIso,
        });

        return { refund, invoice };
      },
    });

    return res.data;
  }

  /**
   * Generates the daily branch financial report strictly separating:
   * - Revenue (Doanh thu)
   * - Collected Money (Tiền đã thu: Tiền mặt / Chuyển khoản, bao gồm thu nợ ngày trước mà không cộng trùng doanh thu)
   * - Discounts (Giảm giá)
   * - Refunds (Hoàn tiền)
   * - Receivables / Debt (Khoản phải thu)
   * - Adjustments (Điều chỉnh)
   * - Estimated Gross Profit (Lợi nhuận gộp ước tính)
   */
  public getBranchDailyFinancialReport(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    businessDateYmd: string;
    nowIso?: string;
  }): FinancialReportSummary {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    const state = this.db.getState();
    const branch = state.branches.find(
      (b) => b.id === params.branchId && b.tenantId === params.tenantId
    );
    if (!branch) {
      throw new Error('BRANCH_NOT_FOUND');
    }

    // Active invoices belonging to this business date (excluding VOIDED parent invoices from splits)
    const dayInvoices = state.invoices.filter(
      (inv) =>
        inv.branchId === params.branchId &&
        inv.businessDateYmd === params.businessDateYmd &&
        inv.status !== 'VOIDED'
    );

    const grossRevenueVnd = dayInvoices.reduce((s, i) => s + i.subtotalVnd, 0);
    const discountTotalVnd = dayInvoices.reduce((s, i) => s + i.discountAmountVnd, 0);
    const adjustmentTotalVnd = dayInvoices.reduce((s, i) => s + i.adjustmentAmountVnd, 0);
    const netRevenueVnd = dayInvoices.reduce((s, i) => s + i.totalAmountVnd, 0);
    const outstandingReceivablesDebtVnd = dayInvoices.reduce(
      (s, i) => s + i.debtAmountVnd,
      0
    );

    // Payments actually collected on this business date (includes debt payments collected today for older invoices!)
    const dayPayments = state.payments.filter(
      (p) =>
        p.branchId === params.branchId &&
        p.collectedBusinessDateYmd === params.businessDateYmd
    );

    const totalCollectedCashAndTransferVnd = dayPayments.reduce(
      (s, p) => s + p.amountVnd,
      0
    );
    const cashCollectedVnd = dayPayments
      .filter((p) => p.method === 'CASH')
      .reduce((s, p) => s + p.amountVnd, 0);
    const bankTransferCollectedVnd = dayPayments
      .filter((p) => p.method === 'BANK_TRANSFER_STATIC_QR')
      .reduce((s, p) => s + p.amountVnd, 0);
    const debtCollectionFromPriorDaysVnd = dayPayments
      .filter((p) => p.isDebtCollection)
      .reduce((s, p) => s + p.amountVnd, 0);

    const dayRefunds = state.refundRequests.filter(
      (r) =>
        r.branchId === params.branchId &&
        r.refundBusinessDateYmd === params.businessDateYmd &&
        r.status === 'EXECUTED'
    );
    const refundedTotalVnd = dayRefunds.reduce((s, r) => s + r.amountVnd, 0);

    // Calculate estimated cost of goods from order item snapshots of sessions on this business date
    const sessionIds = new Set(dayInvoices.map((i) => i.tableSessionId));
    const billableItems = state.orderItems.filter(
      (oi) => sessionIds.has(oi.tableSessionId) && oi.status !== 'CANCELLED'
    );

    const hasItemsWithMissingCostData = billableItems.some(
      (oi) => oi.estimatedLineCostVnd === null
    );
    const estimatedCostOfGoodsVnd =
      billableItems.length === 0 || hasItemsWithMissingCostData
        ? null
        : billableItems.reduce((s, oi) => s + (oi.estimatedLineCostVnd ?? 0), 0);

    const estimatedGrossProfitVnd =
      estimatedCostOfGoodsVnd !== null
        ? netRevenueVnd - refundedTotalVnd - estimatedCostOfGoodsVnd
        : null;

    return {
      tenantId: params.tenantId,
      branchId: params.branchId,
      businessDateYmd: params.businessDateYmd,
      generatedAtIso: nowIso,
      lastCloudSyncAtIso: branch.lastCloudSyncAt,
      invoiceCount: dayInvoices.length,
      grossRevenueVnd,
      discountTotalVnd,
      adjustmentTotalVnd,
      netRevenueVnd,
      totalCollectedCashAndTransferVnd,
      cashCollectedVnd,
      bankTransferCollectedVnd,
      debtCollectionFromPriorDaysVnd,
      refundedTotalVnd,
      outstandingReceivablesDebtVnd,
      estimatedCostOfGoodsVnd,
      estimatedGrossProfitVnd,
      hasItemsWithMissingCostData,
    };
  }
}
