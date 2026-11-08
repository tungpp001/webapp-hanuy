import { OrderItemStatus, SensitiveActionType, SupportScope, UserRole } from './enums.js';

/**
 * Valid transitions for OrderItemStatus.
 * Note:
 * - "SENT_TO_KITCHEN" is strictly distinct from "COOKING".
 * - Preparation timer only starts when entering "COOKING".
 * - Once "COMPLETED" or "SERVED", direct transition to "CANCELLED" is forbidden
 *   (must preserve history and use discount/adjustment workflow instead).
 */
const ALLOWED_ORDER_ITEM_TRANSITIONS: Record<OrderItemStatus, readonly OrderItemStatus[]> = {
  PENDING_WEIGHT_CONFIRM: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['SENT_TO_KITCHEN', 'CANCELLED'],
  SENT_TO_KITCHEN: ['COOKING', 'PENDING_CANCELLATION'],
  COOKING: ['COMPLETED', 'PENDING_CANCELLATION'],
  PENDING_CANCELLATION: ['CANCELLED', 'SENT_TO_KITCHEN', 'COOKING'],
  COMPLETED: ['SERVED'],
  SERVED: [],
  CANCELLED: [],
};

export function canTransitionOrderItemStatus(
  fromStatus: OrderItemStatus,
  toStatus: OrderItemStatus
): boolean {
  return ALLOWED_ORDER_ITEM_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

export function assertOrderItemTransition(
  fromStatus: OrderItemStatus,
  toStatus: OrderItemStatus
): void {
  if (!canTransitionOrderItemStatus(fromStatus, toStatus)) {
    throw new Error(
      `Invalid OrderItemStatus transition from ${fromStatus} to ${toStatus}. Completed/Served items cannot be cancelled directly.`
    );
  }
}

export interface ActorAccessContext {
  userId: string;
  role: UserRole;
  tenantId: string | null;
  branchId: string | null;
  mfaVerified: boolean;
  isPosLocked: boolean;
  activeSupportGrant?: {
    grantId: string;
    tenantId: string;
    branchId: string;
    scope: SupportScope;
    expiresAtIso: string;
    revokedAtIso: string | null;
  } | null;
}

/**
 * Enforces mandatory MFA for SAAS_ADMIN and TECH_SUPPORT, and checks POS 15-minute idle lock.
 */
export function assertActorSecurityPreconditions(
  actor: ActorAccessContext,
  nowIso = new Date().toISOString()
): void {
  if (actor.isPosLocked) {
    throw new Error('POS_SESSION_LOCKED: Phiên POS đã tự khóa do không hoạt động quá 15 phút. Vui lòng mở khóa.');
  }

  if ((actor.role === 'SAAS_ADMIN' || actor.role === 'TECH_SUPPORT') && !actor.mfaVerified) {
    throw new Error(`MFA_REQUIRED: Vai trò ${actor.role} bắt buộc xác thực MFA trước khi thao tác.`);
  }

  if (actor.role === 'TECH_SUPPORT') {
    const grant = actor.activeSupportGrant;
    if (!grant) {
      throw new Error('SUPPORT_GRANT_REQUIRED: Kỹ thuật viên cần yêu cầu hỗ trợ đã được phê duyệt.');
    }
    if (grant.revokedAtIso !== null) {
      throw new Error('SUPPORT_GRANT_REVOKED: Quyền hỗ trợ từ xa đã bị thu hồi.');
    }
    if (new Date(grant.expiresAtIso).getTime() <= new Date(nowIso).getTime()) {
      throw new Error('SUPPORT_GRANT_EXPIRED: Quyền hỗ trợ từ xa đã hết thời hạn.');
    }
  }
}

/**
 * Enforces strict tenant and branch isolation on server resources.
 * Remote support and SaaS Admin are explicitly blocked from mutating financial transactions.
 */
export function assertTenantAndBranchScope(params: {
  actor: ActorAccessContext;
  targetTenantId: string;
  targetBranchId?: string | null;
  isFinancialTransactionMutation?: boolean;
  nowIso?: string;
}): void {
  const {
    actor,
    targetTenantId,
    targetBranchId = null,
    isFinancialTransactionMutation = false,
    nowIso = new Date().toISOString(),
  } = params;

  assertActorSecurityPreconditions(actor, nowIso);

  if (isFinancialTransactionMutation) {
    if (actor.role === 'SAAS_ADMIN' || actor.role === 'TECH_SUPPORT') {
      throw new Error(
        `FORBIDDEN_FINANCIAL_MUTATION: Vai trò ${actor.role} không được phép tự ý thay đổi hóa đơn, thanh toán hoặc hoàn tiền.`
      );
    }
  }

  if (actor.role === 'SAAS_ADMIN') {
    return;
  }

  if (actor.role === 'TECH_SUPPORT') {
    const grant = actor.activeSupportGrant!;
    if (grant.tenantId !== targetTenantId) {
      throw new Error('TENANT_ISOLATION_VIOLATION: Kỹ thuật viên không có quyền trên tenant này.');
    }
    if (targetBranchId && grant.branchId !== targetBranchId) {
      throw new Error('BRANCH_SCOPE_VIOLATION: Kỹ thuật viên không có quyền trên chi nhánh này.');
    }
    return;
  }

  if (!actor.tenantId || actor.tenantId !== targetTenantId) {
    throw new Error('TENANT_ISOLATION_VIOLATION: Không được phép truy cập dữ liệu của tenant khác.');
  }

  if (actor.role === 'CHAIN_OWNER') {
    return; // Chain owner has access to all branches within their own tenant
  }

  if (targetBranchId && actor.branchId !== targetBranchId) {
    throw new Error('BRANCH_SCOPE_VIOLATION: Người dùng chỉ được thao tác trên chi nhánh được phân quyền.');
  }
}

const SENSITIVE_ACTION_APPROVERS: Record<SensitiveActionType, readonly UserRole[]> = {
  DISCOUNT_OVER_LIMIT: ['BRANCH_MANAGER', 'CHAIN_OWNER'],
  CANCEL_ITEM_AFTER_KITCHEN: ['BRANCH_MANAGER', 'CHAIN_OWNER'],
  VOID_INVOICE: ['BRANCH_MANAGER', 'CHAIN_OWNER'],
  REFUND_PAYMENT: ['BRANCH_MANAGER', 'CHAIN_OWNER'],
  ADJUST_RECEIVABLE: ['BRANCH_MANAGER', 'CHAIN_OWNER'],
  CLOSE_TABLE_WITH_DEBT: ['BRANCH_MANAGER', 'CHAIN_OWNER'],
  REOPEN_CLOSED_SESSION_OR_INVOICE: ['BRANCH_MANAGER', 'CHAIN_OWNER'],
  PRICE_CHANGE_OVER_LIMIT: ['CHAIN_OWNER'],
  DATA_RESTORE_OR_FAILOVER: ['SAAS_ADMIN', 'CHAIN_OWNER'],
};

/**
 * Validates sensitive action approval, enforcing mandatory reason and preventing self-approval
 * when an independent approver is required.
 */
export function validateSensitiveActionApproval(params: {
  actionType: SensitiveActionType;
  requestedByUserId: string;
  requestedByRole: UserRole;
  approvedByUserId: string;
  approvedByRole: UserRole;
  reason: string;
  requireIndependentApprover?: boolean;
}): void {
  const {
    actionType,
    requestedByUserId,
    approvedByUserId,
    approvedByRole,
    reason,
    requireIndependentApprover = true,
  } = params;

  if (!reason || reason.trim().length < 5) {
    throw new Error(`APPROVAL_REASON_REQUIRED: Thao tác ${actionType} bắt buộc nhập lý do rõ ràng (tối thiểu 5 ký tự).`);
  }

  const allowedApprovers = SENSITIVE_ACTION_APPROVERS[actionType];
  if (!allowedApprovers.includes(approvedByRole)) {
    throw new Error(
      `APPROVER_ROLE_FORBIDDEN: Vai trò ${approvedByRole} không đủ thẩm quyền phê duyệt ${actionType}.`
    );
  }

  if (requireIndependentApprover && requestedByUserId === approvedByUserId) {
    throw new Error(
      `SELF_APPROVAL_FORBIDDEN: Người yêu cầu (${requestedByUserId}) không được tự phê duyệt thao tác ${actionType} của chính mình.`
    );
  }
}
