import { ContractStatus } from './enums.js';

export interface ContractLicensePolicyInput {
  endDateYmd: string; // YYYY-MM-DD in Asia/Ho_Chi_Minh
  gracePeriodDays: number; // default 7
  warningDaysBefore: number[]; // default [30, 14, 7, 3, 1]
  administrativeStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  currentLocalDateYmd: string; // YYYY-MM-DD in Asia/Ho_Chi_Minh
}

export interface ContractEvaluationResult {
  effectiveStatus: ContractStatus;
  daysRemainingUntilEnd: number;
  daysRemainingInGrace: number;
  canOpenNewTableSession: boolean;
  canAddOrderRoundToExistingSession: boolean;
  canCompleteExistingSessionPaymentAndPrint: boolean;
  canExportData: boolean;
  warningMessage: string | null;
}

function parseYmdToUtcMidnightMs(ymd: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    throw new Error(`Invalid date format (expected YYYY-MM-DD): ${ymd}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return Date.UTC(year, month, day);
}

/**
 * Evaluates contract status and enforces expiration rules:
 * - Default 7-day grace period after end_date.
 * - After grace period: block opening new table sessions AND block adding new order rounds
 *   to old sessions after the cutoff (preventing abuse of old sessions for new business).
 * - Existing open sessions are still allowed to complete billing, payment, and receipt printing.
 * - Internet outage NEVER causes expiration; evaluation relies on synced license lease.
 */
export function evaluateContractPolicy(
  input: ContractLicensePolicyInput
): ContractEvaluationResult {
  if (input.administrativeStatus === 'TERMINATED') {
    return {
      effectiveStatus: 'TERMINATED',
      daysRemainingUntilEnd: -999,
      daysRemainingInGrace: 0,
      canOpenNewTableSession: false,
      canAddOrderRoundToExistingSession: false,
      canCompleteExistingSessionPaymentAndPrint: true,
      canExportData: true,
      warningMessage: 'Hợp đồng đã chấm dứt. Chỉ cho phép tất toán phiên cũ và xuất dữ liệu bàn giao.',
    };
  }

  if (input.administrativeStatus === 'SUSPENDED') {
    return {
      effectiveStatus: 'SUSPENDED',
      daysRemainingUntilEnd: 0,
      daysRemainingInGrace: 0,
      canOpenNewTableSession: false,
      canAddOrderRoundToExistingSession: false,
      canCompleteExistingSessionPaymentAndPrint: true,
      canExportData: true,
      warningMessage: 'Dịch vụ đang tạm dừng. Chặn mở phiên bàn mới, cho phép hoàn tất phiên đang mở.',
    };
  }

  const endMs = parseYmdToUtcMidnightMs(input.endDateYmd);
  const nowMs = parseYmdToUtcMidnightMs(input.currentLocalDateYmd);
  const msPerDay = 86_400_000;
  const daysRemainingUntilEnd = Math.round((endMs - nowMs) / msPerDay);

  if (daysRemainingUntilEnd >= 0) {
    const maxWarningDay =
      input.warningDaysBefore.length > 0 ? Math.max(...input.warningDaysBefore) : 14;
    if (daysRemainingUntilEnd <= maxWarningDay) {
      return {
        effectiveStatus: 'EXPIRING_SOON',
        daysRemainingUntilEnd,
        daysRemainingInGrace: input.gracePeriodDays,
        canOpenNewTableSession: true,
        canAddOrderRoundToExistingSession: true,
        canCompleteExistingSessionPaymentAndPrint: true,
        canExportData: true,
        warningMessage: `Hợp đồng sẽ hết hạn sau ${daysRemainingUntilEnd} ngày (${input.endDateYmd}). Vui lòng gia hạn.`,
      };
    }

    return {
      effectiveStatus: 'ACTIVE',
      daysRemainingUntilEnd,
      daysRemainingInGrace: input.gracePeriodDays,
      canOpenNewTableSession: true,
      canAddOrderRoundToExistingSession: true,
      canCompleteExistingSessionPaymentAndPrint: true,
      canExportData: true,
      warningMessage: null,
    };
  }

  const daysPastExpiration = Math.abs(daysRemainingUntilEnd);
  const daysRemainingInGrace = input.gracePeriodDays - daysPastExpiration;

  if (daysRemainingInGrace >= 0) {
    return {
      effectiveStatus: 'GRACE_PERIOD',
      daysRemainingUntilEnd,
      daysRemainingInGrace,
      canOpenNewTableSession: true,
      canAddOrderRoundToExistingSession: true,
      canCompleteExistingSessionPaymentAndPrint: true,
      canExportData: true,
      warningMessage: `Hợp đồng đã quá hạn ${daysPastExpiration} ngày. Đang trong thời gian gia hạn (${daysRemainingInGrace} ngày còn lại trước khi khóa mở bàn mới).`,
    };
  }

  return {
    effectiveStatus: 'EXPIRED_RESTRICTED',
    daysRemainingUntilEnd,
    daysRemainingInGrace: 0,
    canOpenNewTableSession: false,
    canAddOrderRoundToExistingSession: false,
    canCompleteExistingSessionPaymentAndPrint: true,
    canExportData: true,
    warningMessage:
      'Đã hết thời gian gia hạn hợp đồng. Hệ thống chặn mở phiên bàn mới và chặn gọi thêm món mới; các phiên bàn đang mở vẫn được thanh toán và in hóa đơn.',
  };
}

/**
 * Computes the branch's business date (YYYY-MM-DD) in Asia/Ho_Chi_Minh (+07:00)
 * given an event timestamp and the branch's configured business_day_start_hour (e.g., 4 for 04:00 AM).
 * Example: An order at 01:30 AM on 2026-10-17 with startHour=4 belongs to business date 2026-10-16.
 */
export function resolveVietnamBusinessDateYmd(
  eventTimestamp: Date | string,
  businessDayStartHour = 4
): string {
  if (
    !Number.isSafeInteger(businessDayStartHour) ||
    businessDayStartHour < 0 ||
    businessDayStartHour > 23
  ) {
    throw new Error(`businessDayStartHour must be 0..23 (got ${businessDayStartHour})`);
  }

  const dateObj =
    typeof eventTimestamp === 'string' ? new Date(eventTimestamp) : new Date(eventTimestamp.getTime());
  if (Number.isNaN(dateObj.getTime())) {
    throw new Error(`Invalid eventTimestamp: ${String(eventTimestamp)}`);
  }

  // Asia/Ho_Chi_Minh is fixed UTC+7 (no DST)
  const vnOffsetMs = 7 * 3600 * 1000;
  const startHourShiftMs = businessDayStartHour * 3600 * 1000;
  const shiftedVnTime = new Date(dateObj.getTime() + vnOffsetMs - startHourShiftMs);

  const year = shiftedVnTime.getUTCFullYear();
  const month = String(shiftedVnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shiftedVnTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
