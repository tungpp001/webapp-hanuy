import crypto from 'node:crypto';
import {
  ActorAccessContext,
  assertOrderItemTransition,
  assertTenantAndBranchScope,
  calculateWeightBasedAmountVnd,
  OrderItemStatus,
  OrderRoundSource,
  requiresCustomerWeightReconfirmation,
  resolveEffectiveBranchPriceVnd,
  resolveVietnamBusinessDateYmd,
  TransactionDurabilityState,
  validateSensitiveActionApproval,
} from '@oc-pos/shared';
import {
  CustomerRatingEntity,
  DatabaseStateSnapshot,
  DiningTableEntity,
  OrderItemEntity,
  OrderRoundEntity,
  PrintJobEntity,
  TableSessionEntity,
  TransactionalDatabase,
} from '@oc-pos/database';
import { TenantAndMenuService } from './tenant-menu.service.js';

export class OrderingAndKitchenService {
  constructor(
    private readonly db: TransactionalDatabase,
    private readonly tenantMenuService: TenantAndMenuService
  ) {}

  /**
   * Executes an idempotent branch mutation and enforces Primary+Standby Dual-Node confirmation
   * for critical operations.
   */
  public executeIdempotentMutation<T>(params: {
    tenantId: string;
    branchId: string;
    idempotencyKey: string;
    endpoint: string;
    payload: unknown;
    requireDualNodeAck?: boolean;
    nowIso?: string;
    mutationFn: (
      tx: DatabaseStateSnapshot,
      durabilityState: TransactionDurabilityState
    ) => T;
  }): {
    replayedFromIdempotencyCache: boolean;
    durabilityState: TransactionDurabilityState;
    standbyWarning: string | null;
    data: T;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    if (!params.idempotencyKey || params.idempotencyKey.trim().length < 4) {
      throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    }

    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(params.payload ?? {}))
      .digest('hex');

    const existing = this.db
      .getState()
      .idempotencyRecords.find(
        (r) =>
          r.tenantId === params.tenantId &&
          r.branchId === params.branchId &&
          r.idempotencyKey === params.idempotencyKey
      );

    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        this.db.transaction((tx) => {
          tx.systemAlerts.push({
            id: crypto.randomUUID(),
            tenantId: params.tenantId,
            branchId: params.branchId,
            severity: 'WARNING',
            category: 'UNCERTAIN_TRANSACTION',
            title: 'Xung đột Idempotency-Key với nội dung khác',
            message: `Idempotency-Key ${params.idempotencyKey} tại ${params.endpoint} bị gửi lại với payload khác.`,
            status: 'OPEN',
            createdAtIso: nowIso,
            resolvedAtIso: null,
          });
        });
        throw new Error(
          'IDEMPOTENCY_PAYLOAD_MISMATCH: Cùng Idempotency-Key nhưng nội dung yêu cầu khác với giao dịch gốc.'
        );
      }

      return {
        replayedFromIdempotencyCache: true,
        durabilityState: existing.durabilityState,
        standbyWarning:
          existing.durabilityState === 'PERSISTED_LOCAL'
            ? 'CẢNH BÁO: Giao dịch mới chỉ lưu trên Máy chủ chính, Máy chủ dự phòng chưa xác nhận.'
            : null,
        data: structuredClone(existing.responseBodyJson) as T,
      };
    }

    return this.db.transaction((tx) => {
      const cluster = tx.clusterStates.find((c) => c.branchId === params.branchId);
      if (cluster && cluster.primaryRole === 'QUARANTINED_READONLY') {
        throw new Error(
          'SPLIT_BRAIN_PROTECTION_READONLY: Máy chủ này đang bị cách ly quyền ghi để chống Split-Brain.'
        );
      }

      const standbyOk = cluster ? cluster.standbyReachable : true;
      const requireDual =
        params.requireDualNodeAck ??
        cluster?.requireDualNodeAckForFinancialTx ??
        true;

      let durabilityState: TransactionDurabilityState = 'CONFIRMED_DUAL_NODE';
      let standbyWarning: string | null = null;

      if (!standbyOk) {
        if (requireDual) {
          durabilityState = 'PERSISTED_LOCAL';
          standbyWarning =
            'CẢNH BÁO AN TOÀN DỮ LIỆU: Máy chủ dự phòng (Standby) không phản hồi xác nhận. Giao dịch đang ở trạng thái PERSISTED_LOCAL (chưa đạt xác nhận kép 2 máy chủ).';
          tx.systemAlerts.push({
            id: crypto.randomUUID(),
            tenantId: params.tenantId,
            branchId: params.branchId,
            severity: 'CRITICAL',
            category: 'REPLICATION',
            title: 'Máy chủ dự phòng chưa xác nhận dữ liệu giao dịch',
            message: `Giao dịch tại ${params.endpoint} (Key: ${params.idempotencyKey}) chưa nhận được ACK từ máy dự phòng.`,
            status: 'OPEN',
            createdAtIso: nowIso,
            resolvedAtIso: null,
          });
        }
      }

      const data = params.mutationFn(tx, durabilityState);

      const nextSeq =
        tx.outboxEvents
          .filter((e) => e.branchId === params.branchId)
          .reduce((m, e) => Math.max(m, e.sequenceNumber), 0) + 1;

      tx.outboxEvents.push({
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        sequenceNumber: nextSeq,
        eventType: params.endpoint,
        aggregateType: 'BRANCH_MUTATION',
        aggregateId: params.idempotencyKey,
        payloadJson: { data },
        standbyAckedAtIso: standbyOk ? nowIso : null,
        cloudSyncedAtIso: null,
        syncStatus: 'PENDING',
        retryCount: 0,
        lastError: null,
        createdAtIso: nowIso,
      });

      if (cluster) {
        cluster.lastPrimarySequence = nextSeq;
        if (standbyOk) {
          cluster.lastStandbyAckSequence = nextSeq;
        }
      }

      tx.idempotencyRecords.push({
        tenantId: params.tenantId,
        branchId: params.branchId,
        idempotencyKey: params.idempotencyKey,
        endpoint: params.endpoint,
        payloadHash,
        durabilityState,
        responseStatusCode: durabilityState === 'CONFIRMED_DUAL_NODE' ? 200 : 202,
        responseBodyJson: structuredClone(data),
        createdAtIso: nowIso,
      });

      return {
        replayedFromIdempotencyCache: false,
        durabilityState,
        standbyWarning,
        data,
      };
    });
  }

  public createDiningTable(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    code: string;
    name: string;
    areaName: string;
    capacity: number;
    nowIso?: string;
  }): DiningTableEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    return this.db.transaction((tx) => {
      const table: DiningTableEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        code: params.code.toUpperCase(),
        name: params.name,
        areaName: params.areaName,
        capacity: params.capacity,
        status: 'AVAILABLE',
        qrStaticKey: `qr-${params.branchId.slice(0, 6)}-${params.code.toLowerCase()}-v1-${crypto.randomBytes(6).toString('hex')}`,
        qrVersion: 1,
        activeSessionId: null,
        mergedIntoSessionId: null,
      };
      tx.diningTables.push(table);
      return table;
    });
  }

  /**
   * Revokes and re-issues a table's fixed QR static key when a security incident or sticker damage occurs.
   */
  public reissueTableQrCode(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    tableId: string;
    reason: string;
    nowIso?: string;
  }): DiningTableEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });
    if (params.actor.role !== 'BRANCH_MANAGER' && params.actor.role !== 'CHAIN_OWNER') {
      throw new Error('ONLY_MANAGER_CAN_REISSUE_QR');
    }

    return this.db.transaction((tx) => {
      const table = tx.diningTables.find(
        (t) => t.id === params.tableId && t.branchId === params.branchId
      );
      if (!table) {
        throw new Error('TABLE_NOT_FOUND');
      }
      const oldKey = table.qrStaticKey;
      table.qrVersion += 1;
      table.qrStaticKey = `qr-${params.branchId.slice(0, 6)}-${table.code.toLowerCase()}-v${table.qrVersion}-${crypto.randomBytes(6).toString('hex')}`;

      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        actorUserId: params.actor.userId,
        actorRole: params.actor.role,
        supportGrantId: null,
        action: 'REISSUE_TABLE_QR',
        resourceType: 'DINING_TABLE',
        resourceId: table.id,
        reason: params.reason,
        beforeJson: { qrStaticKey: oldKey },
        afterJson: { qrStaticKey: table.qrStaticKey, qrVersion: table.qrVersion },
        occurredAtIso: nowIso,
      });

      return table;
    });
  }

  /**
   * Opens a new TableSession. Checks contract expiration policy first:
   * if past the 7-day grace period, opening a new table session is strictly blocked.
   */
  public openTableSession(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    tableId: string;
    nowIso?: string;
  }): TableSessionEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    const contractEval = this.tenantMenuService.evaluateTenantContractAtBranch({
      tenantId: params.tenantId,
      branchId: params.branchId,
      nowIso,
    });

    if (!contractEval.canOpenNewTableSession) {
      throw new Error(
        `CONTRACT_EXPIRED_CANNOT_OPEN_SESSION: ${contractEval.warningMessage}`
      );
    }

    return this.db.transaction((tx) => {
      const branch = tx.branches.find((b) => b.id === params.branchId)!;
      const table = tx.diningTables.find(
        (t) => t.id === params.tableId && t.branchId === params.branchId
      );
      if (!table) {
        throw new Error('TABLE_NOT_FOUND');
      }
      if (table.status !== 'AVAILABLE' || table.activeSessionId !== null) {
        throw new Error(`TABLE_NOT_AVAILABLE: Bàn ${table.code} đang ở trạng thái ${table.status}`);
      }

      const businessDateYmd = resolveVietnamBusinessDateYmd(
        nowIso,
        branch.businessDayStartHour
      );

      const session: TableSessionEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        primaryTableId: table.id,
        mergedTableIds: [],
        sessionToken: `sess-tok-${crypto.randomBytes(16).toString('hex')}`,
        businessDateYmd,
        status: 'OPEN',
        openedByUserId: params.actor.userId,
        closedByUserId: null,
        openedAtIso: nowIso,
        closedAtIso: null,
        closeDebtApprovalId: null,
        closeDebtReason: null,
      };
      tx.tableSessions.push(session);

      table.status = 'OCCUPIED';
      table.activeSessionId = session.id;

      return session;
    });
  }

  /**
   * Transfers a session from one table to another or merges two tables without losing order history
   * or duplicating any transactions.
   */
  public transferOrMergeTable(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    mode: 'TRANSFER' | 'MERGE';
    sourceTableId: string;
    targetTableId: string;
    reason: string;
    nowIso?: string;
  }): TableSessionEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    return this.db.transaction((tx) => {
      const sourceTable = tx.diningTables.find(
        (t) => t.id === params.sourceTableId && t.branchId === params.branchId
      );
      const targetTable = tx.diningTables.find(
        (t) => t.id === params.targetTableId && t.branchId === params.branchId
      );
      if (!sourceTable || !targetTable || !sourceTable.activeSessionId) {
        throw new Error('SOURCE_OR_TARGET_TABLE_INVALID');
      }

      const sourceSession = tx.tableSessions.find(
        (s) => s.id === sourceTable.activeSessionId
      );
      if (!sourceSession || sourceSession.status !== 'OPEN') {
        throw new Error('SOURCE_SESSION_NOT_OPEN');
      }

      if (params.mode === 'TRANSFER') {
        if (targetTable.status !== 'AVAILABLE' || targetTable.activeSessionId !== null) {
          throw new Error('TARGET_TABLE_NOT_AVAILABLE_FOR_TRANSFER');
        }
        sourceTable.status = 'AVAILABLE';
        sourceTable.activeSessionId = null;

        targetTable.status = 'OCCUPIED';
        targetTable.activeSessionId = sourceSession.id;
        sourceSession.primaryTableId = targetTable.id;
      } else {
        // MERGE mode: merge sourceTable into targetTable's active session (or attach targetTable to sourceSession)
        if (targetTable.activeSessionId && targetTable.activeSessionId !== sourceSession.id) {
          const targetSession = tx.tableSessions.find(
            (s) => s.id === targetTable.activeSessionId
          )!;
          // Move all order rounds & items from sourceSession into targetSession without duplicating
          for (const round of tx.orderRounds) {
            if (round.tableSessionId === sourceSession.id) {
              round.tableSessionId = targetSession.id;
            }
          }
          for (const item of tx.orderItems) {
            if (item.tableSessionId === sourceSession.id) {
              item.tableSessionId = targetSession.id;
            }
          }
          targetSession.mergedTableIds.push(sourceTable.id);
          sourceTable.activeSessionId = targetSession.id;
          sourceTable.mergedIntoSessionId = targetSession.id;
          sourceSession.status = 'CLOSED';
          sourceSession.closedAtIso = nowIso;
          return targetSession;
        } else {
          targetTable.status = 'OCCUPIED';
          targetTable.activeSessionId = sourceSession.id;
          targetTable.mergedIntoSessionId = sourceSession.id;
          if (!sourceSession.mergedTableIds.includes(targetTable.id)) {
            sourceSession.mergedTableIds.push(targetTable.id);
          }
        }
      }

      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        actorUserId: params.actor.userId,
        actorRole: params.actor.role,
        supportGrantId: null,
        action: params.mode === 'TRANSFER' ? 'TRANSFER_TABLE' : 'MERGE_TABLE',
        resourceType: 'TABLE_SESSION',
        resourceId: sourceSession.id,
        reason: params.reason,
        beforeJson: { sourceTableId: sourceTable.id, targetTableId: targetTable.id },
        afterJson: { primaryTableId: sourceSession.primaryTableId, mergedTableIds: sourceSession.mergedTableIds },
        occurredAtIso: nowIso,
      });

      return sourceSession;
    });
  }

  /**
   * Submits an Order Round (either via Customer QR using fixed QR key + active session token,
   * or via Staff POS).
   * - Never allows bypassing session token verification just by supplying table number.
   * - Checks server-side out-of-stock status.
   * - Snapshots selling price and estimated cost at the moment of ordering.
   */
  public submitOrderRound(params: {
    tenantId: string;
    branchId: string;
    tableId: string;
    source: OrderRoundSource;
    qrStaticKey?: string;
    sessionToken?: string;
    actor?: ActorAccessContext;
    idempotencyKey: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      estimatedWeightKg?: number;
      prepNotes?: string;
    }>;
    nowIso?: string;
  }): {
    round: OrderRoundEntity;
    items: OrderItemEntity[];
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();

    // Prevent abusing an old open session to place new orders after contract expiration
    const contractEval = this.tenantMenuService.evaluateTenantContractAtBranch({
      tenantId: params.tenantId,
      branchId: params.branchId,
      nowIso,
    });
    if (!contractEval.canAddOrderRoundToExistingSession) {
      throw new Error(
        `CONTRACT_EXPIRED_CANNOT_ADD_NEW_ORDER_ROUND: ${contractEval.warningMessage}`
      );
    }

    const res = this.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'SUBMIT_ORDER_ROUND',
      payload: {
        tableId: params.tableId,
        source: params.source,
        items: params.items,
      },
      requireDualNodeAck: false,
      nowIso,
      mutationFn: (tx) => {
        const table = tx.diningTables.find(
          (t) => t.id === params.tableId && t.branchId === params.branchId
        );
        if (!table || !table.activeSessionId) {
          throw new Error('TABLE_HAS_NO_ACTIVE_SESSION');
        }

        const session = tx.tableSessions.find(
          (s) => s.id === table.activeSessionId && s.branchId === params.branchId
        );
        if (!session || session.status !== 'OPEN') {
          throw new Error('TABLE_SESSION_CLOSED_OR_LOCKED: Phiên bàn đã đóng, không thể gọi thêm món.');
        }

        if (params.source === 'CUSTOMER_QR') {
          if (!params.qrStaticKey || params.qrStaticKey !== table.qrStaticKey) {
            throw new Error('INVALID_OR_REVOKED_QR_KEY: Mã QR bàn không hợp lệ hoặc đã bị thu hồi.');
          }
          if (!params.sessionToken || params.sessionToken !== session.sessionToken) {
            throw new Error('INVALID_OR_EXPIRED_SESSION_TOKEN: Token phiên bàn đã hết hiệu lực.');
          }
        } else {
          if (!params.actor) {
            throw new Error('STAFF_ACTOR_REQUIRED');
          }
          assertTenantAndBranchScope({
            actor: params.actor,
            targetTenantId: params.tenantId,
            targetBranchId: params.branchId,
            nowIso,
          });
        }

        const existingRounds = tx.orderRounds.filter(
          (r) => r.tableSessionId === session.id
        );
        const nextRoundNum =
          existingRounds.reduce((max, r) => Math.max(max, r.roundNumber), 0) + 1;

        const round: OrderRoundEntity = {
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          tableSessionId: session.id,
          roundNumber: nextRoundNum,
          source: params.source,
          status: 'PENDING_APPROVAL',
          approvedByUserId: null,
          createdAtIso: nowIso,
          approvedAtIso: null,
        };
        tx.orderRounds.push(round);

        const createdItems: OrderItemEntity[] = [];
        for (const reqItem of params.items) {
          const menuItem = tx.menuItems.find(
            (m) => m.id === reqItem.menuItemId && m.tenantId === params.tenantId
          );
          const branchCfg = tx.branchMenuConfigs.find(
            (c) => c.branchId === params.branchId && c.menuItemId === reqItem.menuItemId
          );
          if (!menuItem) {
            throw new Error(`MENU_ITEM_NOT_FOUND: ${reqItem.menuItemId}`);
          }

          const availability = branchCfg?.availabilityStatus ?? menuItem.defaultStatus;
          if (availability !== 'AVAILABLE') {
            throw new Error(
              `ITEM_OUT_OF_STOCK_OR_HIDDEN: Món "${menuItem.name}" hiện đang ${availability}.`
            );
          }

          const priceMode = branchCfg?.priceMode ?? 'INHERITED';
          const unitPriceVndSnapshot = menuItem.isWeightBased
            ? 0
            : resolveEffectiveBranchPriceVnd({
                standardPriceVnd: menuItem.standardPriceVnd,
                priceMode,
                overridePriceVnd: branchCfg?.overridePriceVnd ?? null,
              });
          const pricePerKgVndSnapshot = menuItem.isWeightBased
            ? resolveEffectiveBranchPriceVnd({
                standardPriceVnd: menuItem.standardPricePerKgVnd ?? 0,
                priceMode,
                overridePriceVnd: branchCfg?.overridePricePerKgVnd ?? null,
              })
            : null;

          const estimatedUnitCostVndSnapshot =
            branchCfg?.costMode === 'OVERRIDE'
              ? branchCfg.overrideEstimatedCostVnd
              : menuItem.standardEstimatedCostVnd;
          const estimatedCostPerKgVndSnapshot =
            branchCfg?.costMode === 'OVERRIDE'
              ? branchCfg.overrideEstimatedCostPerKgVnd
              : menuItem.standardEstimatedCostPerKgVnd;

          let lineTotalVnd = 0;
          let estimatedLineCostVnd: number | null = null;
          let initialStatus: OrderItemStatus = 'PENDING_APPROVAL';
          let weightKg: number | null = null;

          if (menuItem.isWeightBased) {
            initialStatus = 'PENDING_WEIGHT_CONFIRM';
            if (reqItem.estimatedWeightKg && pricePerKgVndSnapshot !== null) {
              const calc = calculateWeightBasedAmountVnd(
                reqItem.estimatedWeightKg,
                pricePerKgVndSnapshot
              );
              weightKg = calc.normalizedWeightKg;
              lineTotalVnd = calc.amountVnd;
              if (estimatedCostPerKgVndSnapshot !== null) {
                estimatedLineCostVnd = calculateWeightBasedAmountVnd(
                  calc.normalizedWeightKg,
                  estimatedCostPerKgVndSnapshot
                ).amountVnd;
              }
            }
          } else {
            lineTotalVnd = unitPriceVndSnapshot * reqItem.quantity;
            if (estimatedUnitCostVndSnapshot !== null) {
              estimatedLineCostVnd = estimatedUnitCostVndSnapshot * reqItem.quantity;
            }
          }

          menuItem.hasTransactions = true;

          const orderItem: OrderItemEntity = {
            id: crypto.randomUUID(),
            tenantId: params.tenantId,
            branchId: params.branchId,
            tableSessionId: session.id,
            orderRoundId: round.id,
            menuItemId: menuItem.id,
            itemNameSnapshot: menuItem.name,
            sellingUnitSnapshot: menuItem.sellingUnit,
            isWeightBasedSnapshot: menuItem.isWeightBased,
            unitPriceVndSnapshot,
            pricePerKgVndSnapshot,
            estimatedUnitCostVndSnapshot,
            estimatedCostPerKgVndSnapshot,
            standardPrepMinutesSnapshot:
              branchCfg?.prepMinutesOverride ?? menuItem.standardPrepMinutes,
            quantity: reqItem.quantity,
            weightKg,
            weighedByUserId: null,
            weighedAtIso: null,
            customerConfirmedWeightAtIso: null,
            lineTotalVnd,
            estimatedLineCostVnd,
            prepNotes: reqItem.prepNotes ?? '',
            status: initialStatus,
            replacedFromOrderItemId: null,
            replacementReason: null,
            customerAgreedReplacementAtIso: null,
            kitchenSentAtIso: null,
            cookingStartedAtIso: null,
            completedAtIso: null,
            servedAtIso: null,
            cancelledAtIso: null,
            cancellationReason: null,
            cancellationApprovalId: null,
            incurredKitchenWaste: false,
          };
          tx.orderItems.push(orderItem);
          createdItems.push(orderItem);
        }

        return { round, items: createdItems };
      },
    });

    return res.data;
  }

  /**
   * Staff enters actual weight for a weight-based snail item, and records customer confirmation.
   * Never automatically increases what the customer pays without customer confirmation.
   */
  public recordActualWeightAndCustomerConfirmation(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    orderItemId: string;
    actualWeightKg: number;
    customerConfirmed: boolean;
    nowIso?: string;
  }): {
    orderItem: OrderItemEntity;
    requiresReconfirmation: boolean;
    increasePercent: number;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    return this.db.transaction((tx) => {
      const branch = tx.branches.find((b) => b.id === params.branchId)!;
      const item = tx.orderItems.find(
        (i) => i.id === params.orderItemId && i.branchId === params.branchId
      );
      if (!item || !item.isWeightBasedSnapshot || item.pricePerKgVndSnapshot === null) {
        throw new Error('ORDER_ITEM_NOT_WEIGHT_BASED');
      }

      const previousAmountVnd = item.lineTotalVnd;
      const calc = calculateWeightBasedAmountVnd(
        params.actualWeightKg,
        item.pricePerKgVndSnapshot
      );

      const variance = requiresCustomerWeightReconfirmation({
        initialEstimatedAmountVnd: previousAmountVnd,
        actualAmountVnd: calc.amountVnd,
        varianceThresholdPercent: branch.weightVarianceThresholdPercent,
      });

      item.weightKg = calc.normalizedWeightKg;
      item.lineTotalVnd = calc.amountVnd;
      if (item.estimatedCostPerKgVndSnapshot !== null) {
        item.estimatedLineCostVnd = calculateWeightBasedAmountVnd(
          calc.normalizedWeightKg,
          item.estimatedCostPerKgVndSnapshot
        ).amountVnd;
      }
      item.weighedByUserId = params.actor.userId;
      item.weighedAtIso = nowIso;

      if (params.customerConfirmed) {
        item.customerConfirmedWeightAtIso = nowIso;
        assertOrderItemTransition(item.status, 'PENDING_APPROVAL');
        item.status = 'PENDING_APPROVAL';
      } else {
        // Keep in PENDING_WEIGHT_CONFIRM until customer agrees
        item.status = 'PENDING_WEIGHT_CONFIRM';
      }

      return {
        orderItem: item,
        requiresReconfirmation: variance.requiresReconfirmation,
        increasePercent: variance.increasePercent,
      };
    });
  }

  /**
   * Handles out-of-stock discovered after customer requested an item:
   * - Keeps original item history and reason (marked CANCELLED with out-of-stock reason)
   * - Only adds replacement item if customer explicitly agreed (`customerAgreed: true`)
   * - Never automatically switches to a more expensive item without customer consent.
   */
  public replaceOutOfStockOrderItem(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    originalOrderItemId: string;
    replacementMenuItemId: string;
    customerAgreed: boolean;
    reason: string;
    nowIso?: string;
  }): {
    cancelledOriginalItem: OrderItemEntity;
    replacementItem: OrderItemEntity;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    if (!params.customerAgreed) {
      throw new Error(
        'CUSTOMER_CONSENT_REQUIRED_FOR_REPLACEMENT: Chỉ được thêm món thay thế khi khách hàng đã đồng ý.'
      );
    }

    return this.db.transaction((tx) => {
      const original = tx.orderItems.find(
        (i) => i.id === params.originalOrderItemId && i.branchId === params.branchId
      );
      if (!original) {
        throw new Error('ORIGINAL_ORDER_ITEM_NOT_FOUND');
      }
      const newMenu = tx.menuItems.find(
        (m) => m.id === params.replacementMenuItemId && m.tenantId === params.tenantId
      );
      const branchCfg = tx.branchMenuConfigs.find(
        (c) =>
          c.branchId === params.branchId && c.menuItemId === params.replacementMenuItemId
      );
      if (!newMenu) {
        throw new Error('REPLACEMENT_MENU_ITEM_NOT_FOUND');
      }

      const newUnitPrice = resolveEffectiveBranchPriceVnd({
        standardPriceVnd: newMenu.standardPriceVnd,
        priceMode: branchCfg?.priceMode ?? 'INHERITED',
        overridePriceVnd: branchCfg?.overridePriceVnd ?? null,
      });

      original.status = 'CANCELLED';
      original.cancelledAtIso = nowIso;
      original.cancellationReason = `Hết hàng - Đổi sang món ${newMenu.name}: ${params.reason}`;

      const replacementItem: OrderItemEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        tableSessionId: original.tableSessionId,
        orderRoundId: original.orderRoundId,
        menuItemId: newMenu.id,
        itemNameSnapshot: newMenu.name,
        sellingUnitSnapshot: newMenu.sellingUnit,
        isWeightBasedSnapshot: newMenu.isWeightBased,
        unitPriceVndSnapshot: newUnitPrice,
        pricePerKgVndSnapshot: newMenu.standardPricePerKgVnd,
        estimatedUnitCostVndSnapshot: newMenu.standardEstimatedCostVnd,
        estimatedCostPerKgVndSnapshot: newMenu.standardEstimatedCostPerKgVnd,
        standardPrepMinutesSnapshot: newMenu.standardPrepMinutes,
        quantity: original.quantity,
        weightKg: null,
        weighedByUserId: null,
        weighedAtIso: null,
        customerConfirmedWeightAtIso: null,
        lineTotalVnd: newUnitPrice * original.quantity,
        estimatedLineCostVnd:
          newMenu.standardEstimatedCostVnd !== null
            ? newMenu.standardEstimatedCostVnd * original.quantity
            : null,
        prepNotes: original.prepNotes,
        status: 'PENDING_APPROVAL',
        replacedFromOrderItemId: original.id,
        replacementReason: params.reason,
        customerAgreedReplacementAtIso: nowIso,
        kitchenSentAtIso: null,
        cookingStartedAtIso: null,
        completedAtIso: null,
        servedAtIso: null,
        cancelledAtIso: null,
        cancellationReason: null,
        cancellationApprovalId: null,
        incurredKitchenWaste: false,
      };
      tx.orderItems.push(replacementItem);

      return { cancelledOriginalItem: original, replacementItem };
    });
  }

  /**
   * Staff approves an OrderRound and dispatches ONLY the newly approved items in this round
   * to the Kitchen Display System (KDS) and Kitchen Print Queue.
   * If the kitchen printer is offline, KDS and order persistence still succeed without losing data.
   */
  public approveOrderRoundAndSendToKitchen(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    orderRoundId: string;
    idempotencyKey: string;
    nowIso?: string;
  }): {
    round: OrderRoundEntity;
    sentItems: OrderItemEntity[];
    kitchenPrintJob: PrintJobEntity;
    durabilityState: TransactionDurabilityState;
    standbyWarning: string | null;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    const result = this.executeIdempotentMutation({
      tenantId: params.tenantId,
      branchId: params.branchId,
      idempotencyKey: params.idempotencyKey,
      endpoint: 'APPROVE_ORDER_ROUND_AND_SEND_KITCHEN',
      payload: { orderRoundId: params.orderRoundId },
      requireDualNodeAck: true,
      nowIso,
      mutationFn: (tx) => {
        const round = tx.orderRounds.find(
          (r) => r.id === params.orderRoundId && r.branchId === params.branchId
        );
        if (!round) {
          throw new Error('ORDER_ROUND_NOT_FOUND');
        }

        const roundItems = tx.orderItems.filter(
          (i) => i.orderRoundId === round.id && i.status !== 'CANCELLED'
        );
        if (roundItems.some((i) => i.status === 'PENDING_WEIGHT_CONFIRM')) {
          throw new Error(
            'WEIGHT_CONFIRMATION_PENDING: Còn món bán theo cân chưa được khách xác nhận mức giá.'
          );
        }

        round.status = 'APPROVED';
        round.approvedByUserId = params.actor.userId;
        round.approvedAtIso = nowIso;

        const sentItems: OrderItemEntity[] = [];
        for (const item of roundItems) {
          assertOrderItemTransition(item.status, 'APPROVED');
          item.status = 'APPROVED';
          assertOrderItemTransition(item.status, 'SENT_TO_KITCHEN');
          item.status = 'SENT_TO_KITCHEN';
          item.kitchenSentAtIso = nowIso;
          sentItems.push(item);
        }

        const session = tx.tableSessions.find((s) => s.id === round.tableSessionId)!;
        const table = tx.diningTables.find((t) => t.id === session.primaryTableId)!;
        const kitchenPrinter = tx.printerDevices.find(
          (p) => p.branchId === params.branchId && p.role === 'KITCHEN'
        );

        const isPrinterOnline = kitchenPrinter ? kitchenPrinter.isOnline : true;

        // Only print items belonging to THIS newly approved OrderRound!
        const printJob: PrintJobEntity = {
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          printerRole: 'KITCHEN',
          jobType: 'KITCHEN_ROUND_TICKET',
          referenceId: round.id,
          isReprint: false,
          reprintBannerText: null,
          payloadJson: {
            branchId: params.branchId,
            tableCode: table.code,
            tableSessionId: session.id,
            roundNumber: round.roundNumber,
            approvedByUserId: params.actor.userId,
            approvedAtIso: nowIso,
            items: sentItems.map((i) => ({
              orderItemId: i.id,
              name: i.itemNameSnapshot,
              quantity: i.quantity,
              weightKg: i.weightKg,
              prepNotes: i.prepNotes,
            })),
          },
          status: isPrinterOnline ? 'DISPATCHED_UNVERIFIED' : 'FAILED',
          retryCount: isPrinterOnline ? 0 : 1,
          lastError: isPrinterOnline
            ? null
            : 'PRINTER_OFFLINE: Không kết nối được máy in nhiệt bếp qua LAN. Đơn đã lưu trên màn hình bếp KDS.',
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
        };
        tx.printJobs.push(printJob);

        if (!isPrinterOnline) {
          tx.systemAlerts.push({
            id: crypto.randomUUID(),
            tenantId: params.tenantId,
            branchId: params.branchId,
            severity: 'WARNING',
            category: 'PRINT_QUEUE',
            title: 'Lỗi máy in nhiệt Bếp — Màn hình KDS vẫn hoạt động',
            message: `Phiếu bếp lượt #${round.roundNumber} bàn ${table.code} chưa in được do máy in mất kết nối. Đơn vẫn hiển thị trên màn hình bếp.`,
            status: 'OPEN',
            createdAtIso: nowIso,
            resolvedAtIso: null,
          });
        }

        return { round, sentItems, kitchenPrintJob: printJob };
      },
    });

    return {
      ...result.data,
      durabilityState: result.durabilityState,
      standbyWarning: result.standbyWarning,
    };
  }

  /**
   * Kitchen staff updates item status on KDS:
   * - SENT_TO_KITCHEN -> COOKING (starts preparation timer!)
   * - COOKING -> COMPLETED
   * - COMPLETED -> SERVED (by waiter/kitchen)
   */
  public updateKitchenItemStatus(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    orderItemId: string;
    nextStatus: 'COOKING' | 'COMPLETED' | 'SERVED';
    nowIso?: string;
  }): OrderItemEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    return this.db.transaction((tx) => {
      const item = tx.orderItems.find(
        (i) => i.id === params.orderItemId && i.branchId === params.branchId
      );
      if (!item) {
        throw new Error('ORDER_ITEM_NOT_FOUND');
      }

      assertOrderItemTransition(item.status, params.nextStatus);
      item.status = params.nextStatus;

      if (params.nextStatus === 'COOKING') {
        item.cookingStartedAtIso = nowIso;
      } else if (params.nextStatus === 'COMPLETED') {
        item.completedAtIso = nowIso;
      } else if (params.nextStatus === 'SERVED') {
        item.servedAtIso = nowIso;
      }

      return item;
    });
  }

  /**
   * Cancels an OrderItem according to stage-specific rules:
   * 1. Before approval: allowed by waiter/manager.
   * 2. After sent to kitchen (SENT_TO_KITCHEN or COOKING): requires independent manager approval,
   *    mandatory reason, audit log, and marks `incurredKitchenWaste = true` if already COOKING.
   *    Also refuses silent cancellation if print job status is uncertain unless explicitly confirmed.
   * 3. Already COMPLETED or SERVED: strictly forbidden to cancel/delete history (must use discount/adjustment).
   */
  public cancelOrderItem(params: {
    requester: ActorAccessContext;
    approver?: ActorAccessContext;
    tenantId: string;
    branchId: string;
    orderItemId: string;
    reason: string;
    confirmKitchenNotifiedOnUncertainPrint?: boolean;
    nowIso?: string;
  }): OrderItemEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.requester,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    return this.db.transaction((tx) => {
      const item = tx.orderItems.find(
        (i) => i.id === params.orderItemId && i.branchId === params.branchId
      );
      if (!item) {
        throw new Error('ORDER_ITEM_NOT_FOUND');
      }

      if (item.status === 'COMPLETED' || item.status === 'SERVED') {
        throw new Error(
          'CANNOT_CANCEL_COMPLETED_OR_SERVED_ITEM: Món đã hoàn thành hoặc đã phục vụ không được hủy xóa lịch sử. Vui lòng dùng quy trình Giảm giá hoặc Điều chỉnh/Miễn tiền.'
        );
      }

      if (item.status === 'PENDING_WEIGHT_CONFIRM' || item.status === 'PENDING_APPROVAL') {
        item.status = 'CANCELLED';
        item.cancelledAtIso = nowIso;
        item.cancellationReason = params.reason;
        return item;
      }

      // Sent to kitchen or cooking -> Sensitive Action requiring approval & reason
      if (!params.approver) {
        throw new Error(
          'APPROVAL_REQUIRED_AFTER_KITCHEN: Hủy món sau khi gửi bếp bắt buộc có Quản lý hoặc Chủ chuỗi phê duyệt.'
        );
      }

      validateSensitiveActionApproval({
        actionType: 'CANCEL_ITEM_AFTER_KITCHEN',
        requestedByUserId: params.requester.userId,
        requestedByRole: params.requester.role,
        approvedByUserId: params.approver.userId,
        approvedByRole: params.approver.role,
        reason: params.reason,
        requireIndependentApprover: params.requester.role !== 'CHAIN_OWNER',
      });

      const relatedPrintJob = tx.printJobs.find(
        (j) => j.referenceId === item.orderRoundId && j.printerRole === 'KITCHEN'
      );
      if (
        relatedPrintJob &&
        relatedPrintJob.status === 'DISPATCHED_UNVERIFIED' &&
        !params.confirmKitchenNotifiedOnUncertainPrint
      ) {
        throw new Error(
          'UNCERTAIN_PRINT_STATUS_CONFIRMATION_REQUIRED: Trạng thái phiếu in bếp chưa được xác nhận chắc chắn. Phải xác nhận đã báo trực tiếp với bếp trước khi hoàn tất hủy món.'
        );
      }

      const wasCooking = item.status === 'COOKING';
      item.status = 'CANCELLED';
      item.cancelledAtIso = nowIso;
      item.cancellationReason = params.reason;
      item.incurredKitchenWaste = wasCooking;

      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        actorUserId: params.approver.userId,
        actorRole: params.approver.role,
        supportGrantId: null,
        action: 'CANCEL_ITEM_AFTER_KITCHEN',
        resourceType: 'ORDER_ITEM',
        resourceId: item.id,
        reason: params.reason,
        beforeJson: { status: wasCooking ? 'COOKING' : 'SENT_TO_KITCHEN' },
        afterJson: {
          status: 'CANCELLED',
          incurredKitchenWaste: item.incurredKitchenWaste,
          requestedByUserId: params.requester.userId,
        },
        occurredAtIso: nowIso,
      });

      return item;
    });
  }

  /**
   * Manual reprint with mandatory "IN LẠI" banner.
   */
  public manualReprintJob(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    sourcePrintJobId: string;
    reason: string;
    nowIso?: string;
  }): PrintJobEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    return this.db.transaction((tx) => {
      const sourceJob = tx.printJobs.find(
        (j) => j.id === params.sourcePrintJobId && j.branchId === params.branchId
      );
      if (!sourceJob) {
        throw new Error('PRINT_JOB_NOT_FOUND');
      }

      const reprintJob: PrintJobEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        printerRole: sourceJob.printerRole,
        jobType: sourceJob.jobType,
        referenceId: sourceJob.referenceId,
        isReprint: true,
        reprintBannerText: 'IN LẠI',
        payloadJson: {
          ...structuredClone(sourceJob.payloadJson),
          reprintBanner: 'IN LẠI',
          reprintReason: params.reason,
          reprintedByUserId: params.actor.userId,
        },
        status: 'DISPATCHED_UNVERIFIED',
        retryCount: 0,
        lastError: null,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };
      tx.printJobs.push(reprintJob);

      return reprintJob;
    });
  }

  /**
   * Customer submits 1-5 star rating after session is paid and closed.
   * Enforces max 1 rating per table session without requiring customer login.
   */
  public submitCustomerSessionRating(params: {
    tenantId: string;
    branchId: string;
    tableSessionId: string;
    stars: number;
    comment?: string;
    nowIso?: string;
  }): CustomerRatingEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    if (!Number.isSafeInteger(params.stars) || params.stars < 1 || params.stars > 5) {
      throw new Error('INVALID_RATING_STARS: Điểm đánh giá phải từ 1 đến 5 sao.');
    }

    return this.db.transaction((tx) => {
      const session = tx.tableSessions.find(
        (s) => s.id === params.tableSessionId && s.branchId === params.branchId
      );
      if (!session || (session.status !== 'CLOSED' && session.status !== 'CLOSED_WITH_DEBT')) {
        throw new Error('RATING_ONLY_ALLOWED_AFTER_SESSION_CLOSED');
      }

      if (tx.customerRatings.some((r) => r.tableSessionId === session.id)) {
        throw new Error('SESSION_ALREADY_RATED: Mỗi phiên bàn chỉ được gửi 1 đánh giá.');
      }

      const rating: CustomerRatingEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        tableSessionId: session.id,
        stars: params.stars,
        comment: params.comment ?? null,
        createdAtIso: nowIso,
      };
      tx.customerRatings.push(rating);
      return rating;
    });
  }
}
