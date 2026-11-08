import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChefHat,
  Clock,
  CreditCard,
  Database,
  Lock,
  Printer,
  QrCode,
  RefreshCw,
  Scale,
  Server,
  ShieldAlert,
  Split,
  Store,
  Unlock,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  calculateWeightBasedAmountVnd,
  evaluateContractPolicy,
  resolveEffectiveBranchPriceVnd,
  splitInvoiceEquallyVnd,
  OrderItemStatus,
  PriceInheritanceMode,
} from '@oc-pos/shared';

type PortalTab =
  | 'CUSTOMER_QR'
  | 'WAITER_POS'
  | 'KITCHEN_KDS'
  | 'CASHIER_BILLING'
  | 'BRANCH_MANAGER'
  | 'CHAIN_OWNER'
  | 'SAAS_ADMIN';

interface LiveOrderItem {
  id: string;
  roundNumber: number;
  name: string;
  isWeightBased: boolean;
  quantity: number;
  weightKg: number | null;
  pricePerKgVnd: number | null;
  unitPriceVnd: number;
  estimatedCostVnd: number | null;
  lineTotalVnd: number;
  prepNotes: string;
  status: OrderItemStatus;
  cookingStartedAt: string | null;
  incurredWaste: boolean;
}

interface LivePrintJob {
  id: string;
  printerRole: 'KITCHEN' | 'CASHIER';
  title: string;
  roundNumber: number;
  isReprint: boolean;
  status: 'DISPATCHED_UNVERIFIED' | 'CONFIRMED_BY_STAFF' | 'FAILED';
  itemsSummary: string[];
  createdAt: string;
}

export function OcPosWorkspaceApp(): React.JSX.Element {
  const seqRef = useRef<number>(200);
  const [activePortal, setActivePortal] = useState<PortalTab>('WAITER_POS');
  const [cloudOnline, setCloudOnline] = useState<boolean>(true);
  const [standbyOnline, setStandbyOnline] = useState<boolean>(true);
  const [kitchenPrinterOnline, setKitchenPrinterOnline] = useState<boolean>(true);
  const [isPosLocked, setIsPosLocked] = useState<boolean>(false);
  const [contractEndDateYmd, setContractEndDateYmd] = useState<string>('2026-12-31');
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string>('2026-11-08 14:10:00 (Asia/Ho_Chi_Minh)');
  const [clusterEpoch, setClusterEpoch] = useState<number>(1);
  const [primaryServerName, setPrimaryServerName] = useState<string>('vk01-primary-01 (192.168.10.10)');
  const [standbyServerName, setStandbyServerName] = useState<string>('vk01-standby-01 (192.168.10.11)');

  // Menu catalog with explicit INHERITED vs OVERRIDE and NULL cost support
  const [masterPriceOcHuongKg, setMasterPriceOcHuongKg] = useState<number>(450_000);
  const [branchModeOcHuong, setBranchModeOcHuong] = useState<PriceInheritanceMode>('INHERITED');
  const [branchOverrideOcHuong] = useState<number>(460_000);

  // Weight-based snail input state (never lost when POS auto-locks)
  const [weightKgInput, setWeightKgInput] = useState<string>('0.92');
  const [prepNoteInput, setPrepNoteInput] = useState<string>('Rang muối ớt vừa cay');
  const [customerAgreedWeight, setCustomerAgreedWeight] = useState<boolean>(true);

  const [orderItems, setOrderItems] = useState<LiveOrderItem[]>([
    {
      id: 'oi-101',
      roundNumber: 1,
      name: 'Ốc hương thiên nhiên (Bán theo kg)',
      isWeightBased: true,
      quantity: 1,
      weightKg: 0.92,
      pricePerKgVnd: 450_000,
      unitPriceVnd: 0,
      estimatedCostVnd: 257_600,
      lineTotalVnd: 414_000,
      prepNotes: 'Hấp sả ớt, ít cay',
      status: 'COOKING',
      cookingStartedAt: '14:05:12',
      incurredWaste: false,
    },
    {
      id: 'oi-102',
      roundNumber: 1,
      name: 'Sò điệp nướng mỡ hành',
      isWeightBased: false,
      quantity: 1,
      weightKg: null,
      pricePerKgVnd: null,
      unitPriceVnd: 86_000,
      estimatedCostVnd: null, // Demonstrates "Chưa có dữ liệu giá vốn"
      lineTotalVnd: 86_000,
      prepNotes: 'Nhiều đậu phộng',
      status: 'SENT_TO_KITCHEN',
      cookingStartedAt: null,
      incurredWaste: false,
    },
  ]);

  const [printJobs, setPrintJobs] = useState<LivePrintJob[]>([
    {
      id: 'PJ-20261108-01',
      printerRole: 'KITCHEN',
      title: 'Phiếu Bếp Bàn B01 — Lượt #1',
      roundNumber: 1,
      isReprint: false,
      status: 'CONFIRMED_BY_STAFF',
      itemsSummary: ['Ốc hương thiên nhiên (0.92 kg)', 'Sò điệp nướng mỡ hành (x1)'],
      createdAt: '14:04:00',
    },
  ]);

  // Billing & Split & Debt state
  const [splitPartsCount, setSplitPartsCount] = useState<number>(3);
  const [discountAmountVnd, setDiscountAmountVnd] = useState<number>(0);
  const [paidCashVnd, setPaidCashVnd] = useState<number>(300_000);
  const [paidTransferVnd, setPaidTransferVnd] = useState<number>(0);
  const [bankVerifiedByCashier, setBankVerifiedByCashier] = useState<boolean>(false);
  const [closedWithDebtReason, setClosedWithDebtReason] = useState<string>('');
  const [tableClosedWithDebt, setTableClosedWithDebt] = useState<boolean>(false);
  const [priorDayDebtCollectedTodayVnd] = useState<number>(150_000);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const contractEval = evaluateContractPolicy({
    endDateYmd: contractEndDateYmd,
    gracePeriodDays: 7,
    warningDaysBefore: [30, 14, 7, 3, 1],
    administrativeStatus: 'ACTIVE',
    currentLocalDateYmd: '2026-11-08',
  });

  const effectiveOcHuongPricePerKg = resolveEffectiveBranchPriceVnd({
    standardPriceVnd: masterPriceOcHuongKg,
    priceMode: branchModeOcHuong,
    overridePriceVnd: branchOverrideOcHuong,
  });

  const parsedWeight = Number(weightKgInput) > 0 ? Number(weightKgInput) : 0.5;
  const previewWeightCalc = calculateWeightBasedAmountVnd(
    parsedWeight,
    effectiveOcHuongPricePerKg
  );

  const activeBillableItems = orderItems.filter((i) => i.status !== 'CANCELLED');
  const subtotalVnd = activeBillableItems.reduce((s, i) => s + i.lineTotalVnd, 0);
  const totalAfterDiscountVnd = Math.max(0, subtotalVnd - discountAmountVnd);
  const totalPaidVnd = paidCashVnd + paidTransferVnd;
  const remainingDebtVnd = Math.max(0, totalAfterDiscountVnd - totalPaidVnd);

  const equalSplitParts = splitInvoiceEquallyVnd({
    subtotalVnd,
    discountAmountVnd,
    partsCount: Math.max(2, splitPartsCount),
  });

  function handleAddSupplementaryRound(): void {
    if (!contractEval.canAddOrderRoundToExistingSession) {
      setStatusBanner(
        `CHẶN NGHIỆP VỤ: ${contractEval.warningMessage}`
      );
      return;
    }
    if (!customerAgreedWeight) {
      setStatusBanner(
        'CHỜ KHÁCH XÁC NHẬN: Món bán theo cân phải được khách hàng xác nhận mức giá thực tế trước khi gửi bếp.'
      );
      return;
    }

    seqRef.current += 1;
    const seqId = seqRef.current;
    const nextRound =
      orderItems.reduce((max, i) => Math.max(max, i.roundNumber), 0) + 1;
    const newItem: LiveOrderItem = {
      id: `oi-${seqId}`,
      roundNumber: nextRound,
      name: 'Ốc hương thiên nhiên (Bán theo kg)',
      isWeightBased: true,
      quantity: 1,
      weightKg: previewWeightCalc.normalizedWeightKg,
      pricePerKgVnd: effectiveOcHuongPricePerKg,
      unitPriceVnd: 0,
      estimatedCostVnd: Math.round(previewWeightCalc.normalizedWeightKg * 280_000),
      lineTotalVnd: previewWeightCalc.amountVnd,
      prepNotes: prepNoteInput,
      status: 'SENT_TO_KITCHEN',
      cookingStartedAt: null,
      incurredWaste: false,
    };

    setOrderItems((prev) => [...prev, newItem]);

    // Crucial Rule: Supplementary order round ONLY prints the newly approved item(s)!
    const newPrintJob: LivePrintJob = {
      id: `PJ-20261108-${seqId}`,
      printerRole: 'KITCHEN',
      title: `Phiếu Bếp Bàn B01 — Lượt bổ sung #${nextRound} (Chỉ in món mới)`,
      roundNumber: nextRound,
      isReprint: false,
      status: kitchenPrinterOnline ? 'DISPATCHED_UNVERIFIED' : 'FAILED',
      itemsSummary: [
        `${newItem.name} — ${newItem.weightKg} kg x ${effectiveOcHuongPricePerKg.toLocaleString('vi-VN')} = ${newItem.lineTotalVnd.toLocaleString('vi-VN')} VND (${newItem.prepNotes})`,
      ],
      createdAt: '14:20:00',
    };
    setPrintJobs((prev) => [newPrintJob, ...prev]);

    if (!standbyOnline) {
      setStatusBanner(
        'CẢNH BÁO REPLICATION: Đơn đã lưu trên Máy chủ chính (PERSISTED_LOCAL) nhưng Máy chủ dự phòng chưa phản hồi xác nhận kép!'
      );
    } else if (!kitchenPrinterOnline) {
      setStatusBanner(
        'CẢNH BÁO MÁY IN: Máy in nhiệt bếp mất kết nối LAN — Đơn đã lưu bền vững và hiển thị trên Màn hình Bếp (KDS).'
      );
    } else {
      setStatusBanner(
        `Đã duyệt và gửi Lượt gọi món #${nextRound} xuống Bếp (Đã xác nhận kép Primary + Standby, chỉ in món mới).`
      );
    }
  }

  function handleKitchenStatusChange(
    itemId: string,
    nextStatus: 'COOKING' | 'COMPLETED' | 'SERVED'
  ): void {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          status: nextStatus,
          cookingStartedAt:
            nextStatus === 'COOKING'
              ? '14:21:00'
              : item.cookingStartedAt,
        };
      })
    );
  }

  function handleReprintJob(job: LivePrintJob): void {
    seqRef.current += 1;
    const reprint: LivePrintJob = {
      ...job,
      id: `${job.id}-REPRINT-${seqRef.current}`,
      isReprint: true,
      title: `[IN LẠI] ${job.title}`,
      status: 'DISPATCHED_UNVERIFIED',
      createdAt: '14:22:00',
    };
    setPrintJobs((prev) => [reprint, ...prev]);
    setStatusBanner(`Đã tạo lệnh in lại có nhãn "IN LẠI" cho phiếu ${job.id}.`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Status & Hybrid Connectivity Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-lg shadow">
              ỐC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg text-white">
                  OcPOS SaaS — Chuỗi Ốc Đảo Vĩnh Khánh
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300">
                  CN: VK01 (Múi giờ Asia/Ho_Chi_Minh)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đồng bộ Cloud gần nhất: <strong className="text-slate-200">{lastCloudSyncAt}</strong>{' '}
                {!cloudOnline && (
                  <span className="text-amber-400 font-semibold">
                    (ĐANG OFFLINE INTERNET — Vận hành nội bộ qua LAN, dữ liệu Cloud đánh dấu cũ)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Hardware & Network State Toggles for Live Verification */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCloudOnline((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium ${
                cloudOnline
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-600 text-amber-300'
              }`}
            >
              {cloudOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {cloudOnline ? 'Internet Cloud: ONLINE' : 'Internet Cloud: MẤT MẠNG (LAN Active)'}
            </button>

            <button
              type="button"
              onClick={() => setStandbyOnline((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium ${
                standbyOnline
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-600 text-rose-300'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              {standbyOnline ? 'Replication 2 Máy chủ: OK' : 'Máy chủ Dự phòng: MẤT KẾT NỐI'}
            </button>

            <button
              type="button"
              onClick={() => setKitchenPrinterOnline((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium ${
                kitchenPrinterOnline
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-rose-950/80 border-rose-600 text-rose-300'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              {kitchenPrinterOnline ? '2 Máy in Nhiệt: SẴN SÀNG' : 'Máy in Bếp: LỖI KẾT NỐI'}
            </button>

            <button
              type="button"
              onClick={() => setIsPosLocked((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium ${
                isPosLocked
                  ? 'bg-amber-700 border-amber-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {isPosLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {isPosLocked ? 'Đang khóa POS (15p)' : 'Khóa POS 15p'}
            </button>
          </div>
        </div>
      </header>

      {/* Critical Operational Alert Banners */}
      {(!standbyOnline || !kitchenPrinterOnline || contractEval.warningMessage || statusBanner) && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto space-y-1.5">
            {!standbyOnline && (
              <div className="flex items-center gap-2 text-xs bg-rose-950/90 border border-rose-700 text-rose-200 px-3 py-2 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>CẢNH BÁO TOÀN VẸN CẤP CAO:</strong> Máy chủ dự phòng ({standbyServerName}) không xác nhận dữ liệu. Hệ thống KHÔNG âm thầm báo xác nhận kép thành công; các giao dịch mới được đánh dấu <code>PERSISTED_LOCAL</code> chờ đối soát.
                </span>
              </div>
            )}
            {contractEval.warningMessage && (
              <div className="flex items-center gap-2 text-xs bg-amber-950/80 border border-amber-700 text-amber-200 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>TRẠNG THÁI HỢP ĐỒNG ({contractEval.effectiveStatus}):</strong>{' '}
                  {contractEval.warningMessage}
                </span>
              </div>
            )}
            {statusBanner && (
              <div className="flex items-center justify-between text-xs bg-sky-950/70 border border-sky-700 text-sky-200 px-3 py-2 rounded-lg">
                <span>{statusBanner}</span>
                <button
                  type="button"
                  onClick={() => setStatusBanner(null)}
                  className="underline ml-3 text-sky-300"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7 Role Portals Navigation */}
      <nav className="bg-slate-900/50 border-b border-slate-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-1.5">
          {(
            [
              { id: 'CUSTOMER_QR', label: '1. QR Khách Đặt Món', icon: QrCode },
              { id: 'WAITER_POS', label: '2. Phục Vụ & Cân Ốc', icon: Scale },
              { id: 'KITCHEN_KDS', label: '3. Màn Hình Bếp (KDS)', icon: ChefHat },
              { id: 'CASHIER_BILLING', label: '4. Thu Ngân & Tách Bill', icon: CreditCard },
              { id: 'BRANCH_MANAGER', label: '5. Quản Lý Chi Nhánh', icon: Store },
              { id: 'CHAIN_OWNER', label: '6. Chủ Chuỗi (Cloud)', icon: Building2 },
              { id: 'SAAS_ADMIN', label: '7. SaaS Admin & Failover', icon: Database },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activePortal === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePortal(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium flex items-center gap-2 transition ${
                  active
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 flex-1 space-y-6">
        {isPosLocked && activePortal !== 'CUSTOMER_QR' ? (
          <div className="bg-slate-900 border border-amber-600/60 rounded-2xl p-8 max-w-lg mx-auto my-12 text-center space-y-4">
            <Lock className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">
              Phiên POS Đã Tự Khóa Sau 15 Phút Không Hoạt Động
            </h2>
            <p className="text-sm text-slate-300">
              Dữ liệu đơn hàng và trọng lượng ốc đang nhập (<strong>{weightKgInput} kg</strong> — ghi chú: <em>"{prepNoteInput}"</em>) được <strong>giữ nguyên 100%</strong> trong bộ nhớ phiên.
            </p>
            <button
              type="button"
              onClick={() => setIsPosLocked(false)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm"
            >
              Xác thực Mở khóa Phiên POS & Tiếp tục công việc
            </button>
          </div>
        ) : (
          <>
            {/* PORTAL 1 & 2: CUSTOMER QR & WAITER POS + WEIGHT CONFIRMATION */}
            {(activePortal === 'CUSTOMER_QR' || activePortal === 'WAITER_POS') && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {activePortal === 'CUSTOMER_QR'
                          ? 'Giao diện Khách Quét QR Cố định — Bàn B01 (Không cần tạo tài khoản)'
                          : 'Giao diện Phục Vụ — Cân Món Ốc Thực Tế & Duyệt Lượt Gọi Món'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Token phiên động gắn với Bàn B01 • Hoạt động qua Wi-Fi/LAN nội bộ ngay cả khi mất Internet
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      Phiên Bàn: ĐANG MỞ
                    </span>
                  </div>

                  {/* Weight-based snail calculation box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-400 text-sm flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Quy trình Món Bán Theo Cân: Ốc hương thiên nhiên ({effectiveOcHuongPricePerKg.toLocaleString('vi-VN')} VND/kg)
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Chế độ giá CN: {branchModeOcHuong}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          1. Trọng lượng cân thực tế (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={weightKgInput}
                          onChange={(e) => setWeightKgInput(e.target.value)}
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          2. Thành tiền dự kiến (Số nguyên VND)
                        </label>
                        <div className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm font-bold text-emerald-400">
                          {previewWeightCalc.amountVnd.toLocaleString('vi-VN')} VND
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Ghi chú chế biến cho phép
                        </label>
                        <input
                          type="text"
                          value={prepNoteInput}
                          onChange={(e) => setPrepNoteInput(e.target.value)}
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customerAgreedWeight}
                          onChange={(e) => setCustomerAgreedWeight(e.target.checked)}
                          className="rounded border-slate-600"
                        />
                        <span>
                          3. Khách hàng đã xác nhận đồng ý trọng lượng{' '}
                          <strong>{previewWeightCalc.normalizedWeightKg} kg</strong> ({previewWeightCalc.amountVnd.toLocaleString('vi-VN')} VND) trước khi gửi bếp
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAddSupplementaryRound}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs md:text-sm"
                      >
                        Duyệt & Gửi Lượt Gọi Món Mới Tới Bếp
                      </button>
                    </div>
                  </div>

                  {/* Active Items in Session */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-300">
                      Danh sách món trong phiên bàn (Tách biệt rõ trạng thái từng lượt gọi)
                    </h3>
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                      {orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">
                              [Lượt #{item.roundNumber}] {item.name}{' '}
                              {item.weightKg ? `(${item.weightKg} kg)` : `(x${item.quantity})`}
                            </div>
                            <div className="text-slate-400">
                              Ghi chú: {item.prepNotes} • Giá vốn ước tính:{' '}
                              <span className="text-slate-300">
                                {item.estimatedCostVnd !== null
                                  ? `${item.estimatedCostVnd.toLocaleString('vi-VN')} VND`
                                  : 'Chưa có dữ liệu giá vốn'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-amber-300">
                              {item.lineTotalVnd.toLocaleString('vi-VN')} VND
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-medium text-sky-300">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Print Queue Side Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Printer className="w-4 h-4 text-amber-400" />
                      Hàng Đợi In Nhiệt Bền Vững
                    </h3>
                    <span className="text-xs text-slate-400">2 Máy in (Bếp & Thu ngân)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Chỉ in món mới trong lượt bổ sung. Không coi lệnh gửi TCP là chắc chắn đã ra giấy; khởi động lại không tự in lại phiếu đã hoàn tất.
                  </p>
                  <div className="space-y-2.5">
                    {printJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{job.title}</span>
                          {job.isReprint && (
                            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">
                              IN LẠI
                            </span>
                          )}
                        </div>
                        <ul className="list-disc list-inside text-slate-400">
                          {job.itemsSummary.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`font-semibold ${
                              job.status === 'FAILED' ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {job.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReprintJob(job)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          >
                            In lại (Nhãn "IN LẠI")
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PORTAL 3: KITCHEN DISPLAY SYSTEM (KDS) */}
            {activePortal === 'KITCHEN_KDS' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-amber-400" />
                      Màn Hình Bếp (KDS) — Hoạt động trực tiếp qua LAN kể cả khi mất Internet hoặc hỏng máy in
                    </h2>
                    <p className="text-xs text-slate-400">
                      "SENT_TO_KITCHEN" (Đã gửi phiếu bếp) tách biệt với "COOKING" (Đang chế biến). Bộ đếm giờ chỉ tính khi bấm Bắt đầu chế biến.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-xs font-bold">
                            Bàn B01 • Lượt #{item.roundNumber}
                          </span>
                          <span className="text-xs font-semibold text-sky-300">
                            Trạng thái: {item.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">{item.name}</h3>
                        <p className="text-xs text-slate-300">
                          Định lượng:{' '}
                          <strong>
                            {item.weightKg ? `${item.weightKg} kg` : `${item.quantity} phần`}
                          </strong>{' '}
                          • Ghi chú: <strong className="text-amber-300">{item.prepNotes}</strong>
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Bắt đầu chế biến:{' '}
                          {item.cookingStartedAt ?? 'Chưa bắt đầu (Đang chờ bếp nhận nấu)'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                        {item.status === 'SENT_TO_KITCHEN' && (
                          <button
                            type="button"
                            onClick={() => handleKitchenStatusChange(item.id, 'COOKING')}
                            className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                          >
                            1. Bếp Xác Nhận Bắt Đầu Chế Biến (Tính giờ)
                          </button>
                        )}
                        {item.status === 'COOKING' && (
                          <button
                            type="button"
                            onClick={() => handleKitchenStatusChange(item.id, 'COMPLETED')}
                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          >
                            2. Đánh Dấu Đã Hoàn Thành Món
                          </button>
                        )}
                        {item.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleKitchenStatusChange(item.id, 'SERVED')}
                            className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                          >
                            3. Phục Vụ Đánh Dấu Đã Mang Ra Bàn
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PORTAL 4: CASHIER BILLING, EQUAL SPLIT & DEBT MANAGEMENT */}
            {activePortal === 'CASHIER_BILLING' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Hóa Đơn Nội Bộ: VK01-20261108-0001 (Bàn B01)
                      </h2>
                      <p className="text-xs text-amber-300">
                        Lưu ý: Đây là phiếu thanh toán thông thường, KHÔNG quảng cáo là hóa đơn điện tử thuế.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-semibold">
                      {remainingDebtVnd === 0
                        ? 'PAID (Đã thanh toán đủ)'
                        : totalPaidVnd > 0
                          ? 'PARTIALLY_PAID (Thanh toán 1 phần)'
                          : 'UNPAID (Chưa thanh toán)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400">Tổng tiền món (Subtotal):</span>
                      <div className="text-base font-bold text-white">
                        {subtotalVnd.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Giảm giá cấp hóa đơn (1 khoản):</span>
                      <input
                        type="number"
                        step="10000"
                        min="0"
                        max={subtotalVnd}
                        value={discountAmountVnd}
                        onChange={(e) =>
                          setDiscountAmountVnd(
                            Math.min(subtotalVnd, Math.max(0, Math.round(Number(e.target.value))))
                          )
                        }
                        className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Đã trả (Tiền mặt + CK QR tĩnh):</span>
                      <div className="text-base font-bold text-emerald-400">
                        {totalPaidVnd.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Còn nợ (Khoản phải thu):</span>
                      <div className="text-base font-bold text-rose-400">
                        {remainingDebtVnd.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                  </div>

                  {/* Multi-method Payment Controls */}
                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
                    <h3 className="font-bold text-slate-200">
                      Ghi nhận Thanh toán (Tiền mặt kết hợp Chuyển khoản QR tĩnh)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Tiền mặt (VND)</label>
                        <input
                          type="number"
                          step="10000"
                          value={paidCashVnd}
                          onChange={(e) => setPaidCashVnd(Math.max(0, Math.round(Number(e.target.value))))}
                          className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Chuyển khoản QR tĩnh (VND)</label>
                        <input
                          type="number"
                          step="10000"
                          value={paidTransferVnd}
                          onChange={(e) =>
                            setPaidTransferVnd(Math.max(0, Math.round(Number(e.target.value))))
                          }
                          className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bankVerifiedByCashier}
                        onChange={(e) => setBankVerifiedByCashier(e.target.checked)}
                      />
                      <span>
                        Thu ngân xác nhận đã kiểm tra tiền vào trên ứng dụng ngân hàng (Không chỉ nhìn ảnh chụp màn hình của khách)
                      </span>
                    </label>
                  </div>

                  {/* Close table with debt */}
                  {remainingDebtVnd > 0 && (
                    <div className="space-y-2 bg-rose-950/30 border border-rose-800/70 p-4 rounded-xl text-xs">
                      <h3 className="font-bold text-rose-300">
                        Quy trình Đóng Bàn Còn Nợ ({remainingDebtVnd.toLocaleString('vi-VN')} VND) — Cần Quản lý phê duyệt & lý do
                      </h3>
                      <input
                        type="text"
                        placeholder="Nhập lý do đóng bàn còn nợ và người duyệt..."
                        value={closedWithDebtReason}
                        onChange={(e) => setClosedWithDebtReason(e.target.value)}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (closedWithDebtReason.trim().length < 5) {
                            setStatusBanner('Bắt buộc nhập lý do rõ ràng trước khi đóng bàn còn nợ!');
                            return;
                          }
                          setTableClosedWithDebt(true);
                          setStatusBanner(
                            `Đã giải phóng Bàn B01 về trạng thái Trống nhưng giữ nguyên Hóa đơn nợ ${remainingDebtVnd.toLocaleString('vi-VN')} VND. Khi khách trả nợ sau sẽ ghi vào Tiền thực thu ngày trả, không tính doanh thu lần 2.`
                          );
                        }}
                        className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold"
                      >
                        Phê duyệt Đóng Bàn Còn Nợ & Giải Phóng Bàn
                      </button>
                      {tableClosedWithDebt && (
                        <p className="text-emerald-300 font-medium">
                          ✓ Bàn B01 đã giải phóng. Hóa đơn vẫn ở trạng thái Nợ ({remainingDebtVnd.toLocaleString('vi-VN')} VND).
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Deterministic Equal Bill Split Calculator */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Split className="w-5 h-5 text-amber-400" />
                      Tách Hóa Đơn Chia Đều & Phân Bổ Phần Dư Số Nguyên VND
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tổng các hóa đơn con sau chia khớp chính xác tuyệt đối 100% với tổng hóa đơn gốc ({totalAfterDiscountVnd.toLocaleString('vi-VN')} VND), không lệch 1 đồng.
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="text-slate-300">Số người / Số hóa đơn chia đều:</label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={splitPartsCount}
                      onChange={(e) =>
                        setSplitPartsCount(Math.max(2, Math.min(20, Number(e.target.value) || 2)))
                      }
                      className="w-20 rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    {equalSplitParts.map((part) => (
                      <div
                        key={part.partIndex}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">
                            Hóa đơn con #{part.partIndex}/{part.totalParts}
                          </span>
                          <span className="text-slate-400 ml-2">
                            (Tạm tính: {part.subtotalVnd.toLocaleString('vi-VN')} • Giảm:{' '}
                            {part.discountAmountVnd.toLocaleString('vi-VN')})
                          </span>
                        </div>
                        <span className="font-bold text-amber-300">
                          {part.totalAmountVnd.toLocaleString('vi-VN')} VND
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/70 text-xs flex items-center justify-between">
                    <span className="text-emerald-200 font-semibold">
                      Kiểm tra bất biến tổng các phần sau chia:
                    </span>
                    <span className="font-bold text-emerald-300">
                      {equalSplitParts
                        .reduce((s, p) => s + p.totalAmountVnd, 0)
                        .toLocaleString('vi-VN')}{' '}
                      VND (Khớp 100%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PORTAL 5 & 6: BRANCH MANAGER & CHAIN OWNER DASHBOARD */}
            {(activePortal === 'BRANCH_MANAGER' || activePortal === 'CHAIN_OWNER') && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {activePortal === 'CHAIN_OWNER'
                          ? 'Cloud Dashboard Chủ Chuỗi — Tổng Hợp Đa Chi Nhánh & Quản Lý Menu Chuẩn'
                          : 'Giao Diện Quản Lý Chi Nhánh VK01 — Báo Cáo Tài Chính 8 Chỉ Số & Cấu Hình Giá CN'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Phân biệt rõ Doanh thu phát sinh vs Tiền thực thu (bao gồm thu nợ ngày trước mà không cộng trùng doanh thu) • Chỉ ghi Lợi nhuận gộp ước tính.
                      </p>
                    </div>
                  </div>

                  {/* 8 Distinct Financial Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">1. Doanh thu thuần hôm nay</span>
                      <div className="text-base font-bold text-white mt-1">
                        {totalAfterDiscountVnd.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">2. Tiền đã thu thực tế hôm nay</span>
                      <div className="text-base font-bold text-emerald-400 mt-1">
                        {(totalPaidVnd + priorDayDebtCollectedTodayVnd).toLocaleString('vi-VN')} VND
                      </div>
                      <span className="text-[11px] text-slate-400">
                        (Gồm {priorDayDebtCollectedTodayVnd.toLocaleString('vi-VN')} VND thu nợ hôm trước)
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">3. Tiền mặt / 4. Chuyển khoản</span>
                      <div className="text-sm font-bold text-sky-300 mt-1">
                        TM: {paidCashVnd.toLocaleString('vi-VN')} • CK:{' '}
                        {(paidTransferVnd + priorDayDebtCollectedTodayVnd).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">5. Khoản phải thu (Còn nợ)</span>
                      <div className="text-base font-bold text-rose-400 mt-1">
                        {remainingDebtVnd.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                  </div>

                  {/* Price Inheritance vs Override Control */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <h3 className="font-bold text-amber-300">
                      Kiểm chứng Kế thừa Giá Chuỗi (`INHERITED`) vs Giá Chi Nhánh Tự Đặt (`OVERRIDE`)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Giá Chuẩn Toàn Chuỗi (Ốc hương/kg)
                        </label>
                        <input
                          type="number"
                          step="10000"
                          value={masterPriceOcHuongKg}
                          onChange={(e) => setMasterPriceOcHuongKg(Number(e.target.value) || 450_000)}
                          className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Chế độ giá tại Chi nhánh VK01
                        </label>
                        <select
                          value={branchModeOcHuong}
                          onChange={(e) =>
                            setBranchModeOcHuong(e.target.value as PriceInheritanceMode)
                          }
                          className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-white"
                        >
                          <option value="INHERITED">INHERITED (Kế thừa giá chuẩn)</option>
                          <option value="OVERRIDE">OVERRIDE (Chi nhánh tự đặt giá riêng)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Giá hiệu lực tại Chi nhánh VK01
                        </label>
                        <div className="w-full rounded bg-slate-900 border border-slate-800 px-3 py-1.5 font-bold text-emerald-400">
                          {effectiveOcHuongPricePerKg.toLocaleString('vi-VN')} VND/kg
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PORTAL 7: SAAS ADMIN, CONTRACT EXPIRATION & GUIDED MANUAL FAILOVER */}
            {activePortal === 'SAAS_ADMIN' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    Quản Lý Hợp Đồng Tenant & Chính Sách Gia Hạn 7 Ngày
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sau 7 ngày gia hạn: chặn mở phiên bàn mới và chặn lợi dụng phiên cũ gọi thêm món, nhưng cho phép hoàn tất thanh toán và in hóa đơn các phiên đang mở. Không xóa dữ liệu.
                  </p>
                  <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <label className="block text-slate-300 font-semibold">
                      Thử nghiệm đổi Ngày hết hạn hợp đồng (Hiện tại: 2026-11-08):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setContractEndDateYmd('2026-12-31')}
                        className="px-3 py-1.5 rounded bg-emerald-900/60 border border-emerald-700 text-emerald-200"
                      >
                        Còn hạn (2026-12-31)
                      </button>
                      <button
                        type="button"
                        onClick={() => setContractEndDateYmd('2026-11-04')}
                        className="px-3 py-1.5 rounded bg-amber-900/60 border border-amber-700 text-amber-200"
                      >
                        Trong 7 ngày gia hạn (2026-11-04)
                      </button>
                      <button
                        type="button"
                        onClick={() => setContractEndDateYmd('2026-10-20')}
                        className="px-3 py-1.5 rounded bg-rose-900/60 border border-rose-700 text-rose-200"
                      >
                        Quá hạn &gt; 7 ngày (2026-10-20 — Khóa mở bàn mới)
                      </button>
                    </div>
                    <div className="pt-2 space-y-1 text-slate-300">
                      <div>
                        Trạng thái hiệu lực: <strong className="text-amber-300">{contractEval.effectiveStatus}</strong>
                      </div>
                      <div>
                        Được mở phiên bàn mới:{' '}
                        <strong>{contractEval.canOpenNewTableSession ? 'CÓ' : 'CHẶN'}</strong>
                      </div>
                      <div>
                        Được thanh toán & in hóa đơn phiên đang mở:{' '}
                        <strong>
                          {contractEval.canCompleteExistingSessionPaymentAndPrint ? 'CÓ' : 'KHÔNG'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400" />
                    Chuyển Đổi Máy Chủ Dự Phòng Có Hướng Dẫn (Guided Failover)
                  </h2>
                  <div className="text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div>
                      Cluster Epoch hiện tại: <strong className="text-amber-300">#{clusterEpoch}</strong>
                    </div>
                    <div>
                      Máy chủ Chính (Primary): <strong className="text-emerald-400">{primaryServerName}</strong>
                    </div>
                    <div>
                      Máy chủ Dự phòng (Standby): <strong className="text-sky-300">{standbyServerName}</strong>
                    </div>
                    <p className="text-slate-400 pt-1">
                      Khi chuyển đổi, máy chủ cũ bị hạ quyền sang <code>QUARANTINED_READONLY</code> để chống Split-Brain tuyệt đối khi máy cũ bật lại.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!standbyOnline) {
                          setStatusBanner(
                            'CHẶN FAILOVER AN TOÀN: Không thể chuyển quyền Primary khi Máy chủ dự phòng đang mất kết nối hoặc chưa đồng bộ đủ dữ liệu! Vui lòng dùng biểu mẫu giấy tạm thời.'
                          );
                          return;
                        }
                        const oldPri = primaryServerName;
                        setPrimaryServerName(standbyServerName);
                        setStandbyServerName(`${oldPri} [QUARANTINED_READONLY]`);
                        setClusterEpoch((e) => e + 1);
                        setLastCloudSyncAt(new Date().toLocaleString('vi-VN'));
                        setStatusBanner(
                          `Hoàn tất Guided Failover sang ${standbyServerName} (Epoch #${clusterEpoch + 1}). Máy cũ đã khóa quyền ghi chống Split-Brain.`
                        );
                      }}
                      className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      Thực hiện Kiểm tra Toàn vẹn & Chuyển Máy Chủ Chính (Failover)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
