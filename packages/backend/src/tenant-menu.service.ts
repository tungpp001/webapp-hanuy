import crypto from 'node:crypto';
import {
  ActorAccessContext,
  assertActorSecurityPreconditions,
  assertIntegerVnd,
  assertTenantAndBranchScope,
  BillingCycle,
  ContractEvaluationResult,
  evaluateContractPolicy,
  MenuItemAvailability,
  PriceInheritanceMode,
  resolveEffectiveBranchPriceVnd,
  resolveVietnamBusinessDateYmd,
  SellingUnit,
} from '@oc-pos/shared';
import {
  ApprovalRequestEntity,
  BranchEntity,
  BranchMenuConfigEntity,
  ContractEntity,
  MenuItemEntity,
  MenuReleaseEntity,
  TenantEntity,
  TransactionalDatabase,
} from '@oc-pos/database';

export class TenantAndMenuService {
  constructor(private readonly db: TransactionalDatabase) {}

  public createTenantWithContractAndBranch(params: {
    actor: ActorAccessContext;
    tenantCode: string;
    brandName: string;
    primaryColor?: string;
    billingCycle: BillingCycle;
    startDateYmd: string;
    endDateYmd: string;
    gracePeriodDays?: number;
    branchCode: string;
    branchName: string;
    branchAddress: string;
    businessDayStartHour?: number;
    nowIso?: string;
  }): {
    tenant: TenantEntity;
    contract: ContractEntity;
    branch: BranchEntity;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertActorSecurityPreconditions(params.actor, nowIso);
    if (params.actor.role !== 'SAAS_ADMIN') {
      throw new Error('ONLY_SAAS_ADMIN_CAN_CREATE_TENANT');
    }

    return this.db.transaction((tx) => {
      if (tx.tenants.some((t) => t.code === params.tenantCode)) {
        throw new Error(`TENANT_CODE_ALREADY_EXISTS: ${params.tenantCode}`);
      }

      const tenant: TenantEntity = {
        id: crypto.randomUUID(),
        code: params.tenantCode,
        brandName: params.brandName,
        status: 'ACTIVE',
        logoUrl: null,
        primaryColor: params.primaryColor ?? '#D9381E',
        coverImageUrl: null,
        bannerUrl: null,
        customDomain: null,
        configVersion: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      tx.tenants.push(tenant);

      const licensePayload = JSON.stringify({
        tenantId: tenant.id,
        endDateYmd: params.endDateYmd,
        gracePeriodDays: params.gracePeriodDays ?? 7,
        issuedAtIso: nowIso,
      });
      const signedLicenseToken = Buffer.from(licensePayload, 'utf8').toString('base64');

      const contract: ContractEntity = {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        billingCycle: params.billingCycle,
        startDateYmd: params.startDateYmd,
        endDateYmd: params.endDateYmd,
        gracePeriodDays: params.gracePeriodDays ?? 7,
        warningDaysBefore: [30, 14, 7, 3, 1],
        termsJson: {},
        status: 'ACTIVE',
        signedLicenseToken,
        createdAt: nowIso,
      };
      tx.contracts.push(contract);

      const branch: BranchEntity = {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        code: params.branchCode.toUpperCase(),
        name: params.branchName,
        address: params.branchAddress,
        phone: '0900000000',
        timezone: 'Asia/Ho_Chi_Minh',
        businessDayStartHour: params.businessDayStartHour ?? 4,
        status: 'ACTIVE',
        activeMenuVersion: 1,
        primaryServerId: `${params.branchCode.toLowerCase()}-primary-01`,
        standbyServerId: `${params.branchCode.toLowerCase()}-standby-01`,
        clusterEpoch: 1,
        cashierMaxDiscountPercent: 10,
        cashierMaxDiscountAmountVnd: 100_000,
        managerMaxPriceDeltaPercent: 15,
        weightVarianceThresholdPercent: 10,
        lastCloudSyncAt: nowIso,
        lastBackupAt: nowIso,
        createdAt: nowIso,
      };
      tx.branches.push(branch);

      tx.clusterStates.push({
        branchId: branch.id,
        clusterEpoch: 1,
        primaryServerId: branch.primaryServerId,
        standbyServerId: branch.standbyServerId,
        primaryRole: 'PRIMARY',
        standbyRole: 'STANDBY',
        standbyReachable: true,
        cloudReachable: true,
        lastStandbyAckSequence: 0,
        lastPrimarySequence: 0,
        requireDualNodeAckForFinancialTx: true,
      });

      tx.printerDevices.push(
        {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          branchId: branch.id,
          role: 'KITCHEN',
          name: 'Máy in nhiệt Bếp Trung tâm',
          ipAddress: '192.168.10.51',
          port: 9100,
          isOnline: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          branchId: branch.id,
          role: 'CASHIER',
          name: 'Máy in hóa đơn Thu ngân',
          ipAddress: '192.168.10.52',
          port: 9100,
          isOnline: true,
        }
      );

      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        branchId: branch.id,
        actorUserId: params.actor.userId,
        actorRole: params.actor.role,
        supportGrantId: null,
        action: 'CREATE_TENANT_CONTRACT_BRANCH',
        resourceType: 'TENANT',
        resourceId: tenant.id,
        reason: 'Khởi tạo khách hàng, hợp đồng và chi nhánh đầu tiên',
        beforeJson: null,
        afterJson: { tenant, contract, branch },
        occurredAtIso: nowIso,
      });

      return { tenant, contract, branch };
    });
  }

  public evaluateTenantContractAtBranch(params: {
    tenantId: string;
    branchId: string;
    nowIso?: string;
  }): ContractEvaluationResult {
    const nowIso = params.nowIso ?? new Date().toISOString();
    const state = this.db.getState();
    const tenant = state.tenants.find((t) => t.id === params.tenantId);
    const branch = state.branches.find(
      (b) => b.id === params.branchId && b.tenantId === params.tenantId
    );
    const contract = state.contracts.find((c) => c.tenantId === params.tenantId);

    if (!tenant || !branch || !contract) {
      throw new Error('TENANT_BRANCH_OR_CONTRACT_NOT_FOUND');
    }

    const currentLocalDateYmd = resolveVietnamBusinessDateYmd(nowIso, 0);
    const adminStatus =
      tenant.status === 'TERMINATED'
        ? 'TERMINATED'
        : tenant.status === 'SUSPENDED'
          ? 'SUSPENDED'
          : 'ACTIVE';

    return evaluateContractPolicy({
      endDateYmd: contract.endDateYmd,
      gracePeriodDays: contract.gracePeriodDays,
      warningDaysBefore: contract.warningDaysBefore,
      administrativeStatus: adminStatus,
      currentLocalDateYmd,
    });
  }

  public createMenuItem(params: {
    actor: ActorAccessContext;
    tenantId: string;
    categoryName: string;
    code: string;
    name: string;
    description?: string;
    sellingUnit: SellingUnit;
    isWeightBased: boolean;
    standardPriceVnd: number;
    standardPricePerKgVnd?: number | null;
    standardEstimatedCostVnd?: number | null;
    standardEstimatedCostPerKgVnd?: number | null;
    standardPrepMinutes?: number;
    allowedPrepNotes?: string[];
    nowIso?: string;
  }): MenuItemEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      nowIso,
    });
    if (params.actor.role !== 'CHAIN_OWNER' && params.actor.role !== 'SAAS_ADMIN') {
      throw new Error('ONLY_CHAIN_OWNER_CAN_CREATE_MASTER_MENU_ITEM');
    }

    assertIntegerVnd(params.standardPriceVnd, 'standardPriceVnd');
    if (params.standardPricePerKgVnd !== undefined && params.standardPricePerKgVnd !== null) {
      assertIntegerVnd(params.standardPricePerKgVnd, 'standardPricePerKgVnd');
    }
    if (params.standardEstimatedCostVnd !== undefined && params.standardEstimatedCostVnd !== null) {
      assertIntegerVnd(params.standardEstimatedCostVnd, 'standardEstimatedCostVnd');
    }
    if (
      params.standardEstimatedCostPerKgVnd !== undefined &&
      params.standardEstimatedCostPerKgVnd !== null
    ) {
      assertIntegerVnd(
        params.standardEstimatedCostPerKgVnd,
        'standardEstimatedCostPerKgVnd'
      );
    }

    return this.db.transaction((tx) => {
      if (tx.menuItems.some((m) => m.tenantId === params.tenantId && m.code === params.code)) {
        throw new Error(`MENU_ITEM_CODE_EXISTS: ${params.code}`);
      }

      const item: MenuItemEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        categoryName: params.categoryName,
        code: params.code,
        name: params.name,
        description: params.description ?? '',
        imageUrl: null,
        sellingUnit: params.sellingUnit,
        isWeightBased: params.isWeightBased,
        standardPriceVnd: params.standardPriceVnd,
        standardPricePerKgVnd: params.standardPricePerKgVnd ?? null,
        // Crucial: Keep NULL if not provided; never default missing cost to 0!
        standardEstimatedCostVnd:
          params.standardEstimatedCostVnd === undefined
            ? null
            : params.standardEstimatedCostVnd,
        standardEstimatedCostPerKgVnd:
          params.standardEstimatedCostPerKgVnd === undefined
            ? null
            : params.standardEstimatedCostPerKgVnd,
        standardPrepMinutes: params.standardPrepMinutes ?? 15,
        allowedPrepNotes: params.allowedPrepNotes ?? ['Ít cay', 'Cay vừa', 'Không hành', 'Làm kỹ'],
        defaultStatus: 'AVAILABLE',
        version: 1,
        copiedFromItemId: null,
        hasTransactions: false,
        createdAtIso: nowIso,
      };
      tx.menuItems.push(item);

      // Automatically initialize branch configs with explicit INHERITED mode for all tenant branches
      const branches = tx.branches.filter((b) => b.tenantId === params.tenantId);
      for (const b of branches) {
        tx.branchMenuConfigs.push({
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: b.id,
          menuItemId: item.id,
          priceMode: 'INHERITED',
          overridePriceVnd: null,
          overridePricePerKgVnd: null,
          costMode: 'INHERITED',
          overrideEstimatedCostVnd: null,
          overrideEstimatedCostPerKgVnd: null,
          availabilityStatus: 'AVAILABLE',
          prepMinutesOverride: null,
          syncedMenuVersion: item.version,
          pendingPriceApprovalId: null,
        });
      }

      return item;
    });
  }

  /**
   * Copies an existing MenuItem to a brand-new independent ID without overwriting the source item.
   */
  public duplicateMenuItem(params: {
    actor: ActorAccessContext;
    tenantId: string;
    sourceMenuItemId: string;
    newCode: string;
    newName: string;
    nowIso?: string;
  }): MenuItemEntity {
    const state = this.db.getState();
    const source = state.menuItems.find(
      (m) => m.id === params.sourceMenuItemId && m.tenantId === params.tenantId
    );
    if (!source) {
      throw new Error('SOURCE_MENU_ITEM_NOT_FOUND');
    }

    const created = this.createMenuItem({
      actor: params.actor,
      tenantId: params.tenantId,
      categoryName: source.categoryName,
      code: params.newCode,
      name: params.newName,
      description: source.description,
      sellingUnit: source.sellingUnit,
      isWeightBased: source.isWeightBased,
      standardPriceVnd: source.standardPriceVnd,
      standardPricePerKgVnd: source.standardPricePerKgVnd,
      standardEstimatedCostVnd: source.standardEstimatedCostVnd,
      standardEstimatedCostPerKgVnd: source.standardEstimatedCostPerKgVnd,
      standardPrepMinutes: source.standardPrepMinutes,
      allowedPrepNotes: [...source.allowedPrepNotes],
      nowIso: params.nowIso,
    });

    this.db.transaction((tx) => {
      const target = tx.menuItems.find((m) => m.id === created.id)!;
      target.copiedFromItemId = source.id;
    });

    return { ...created, copiedFromItemId: source.id };
  }

  /**
   * Updates branch-specific price or availability.
   * If a Branch Manager changes price beyond `managerMaxPriceDeltaPercent`,
   * it creates a PENDING ApprovalRequest for the Chain Owner and does NOT apply immediately.
   */
  public configureBranchMenuItem(params: {
    actor: ActorAccessContext;
    tenantId: string;
    branchId: string;
    menuItemId: string;
    priceMode: PriceInheritanceMode;
    overridePriceVnd?: number | null;
    overridePricePerKgVnd?: number | null;
    availabilityStatus?: MenuItemAvailability;
    reason?: string;
    nowIso?: string;
  }): {
    appliedImmediately: boolean;
    config: BranchMenuConfigEntity;
    approvalRequest: ApprovalRequestEntity | null;
  } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    return this.db.transaction((tx) => {
      const branch = tx.branches.find(
        (b) => b.id === params.branchId && b.tenantId === params.tenantId
      );
      const item = tx.menuItems.find(
        (m) => m.id === params.menuItemId && m.tenantId === params.tenantId
      );
      const config = tx.branchMenuConfigs.find(
        (c) => c.branchId === params.branchId && c.menuItemId === params.menuItemId
      );

      if (!branch || !item || !config) {
        throw new Error('BRANCH_MENU_CONFIG_NOT_FOUND');
      }

      if (params.availabilityStatus) {
        config.availabilityStatus = params.availabilityStatus;
      }

      if (params.priceMode === 'INHERITED') {
        config.priceMode = 'INHERITED';
        config.overridePriceVnd = null;
        config.overridePricePerKgVnd = null;
        return { appliedImmediately: true, config, approvalRequest: null };
      }

      // Price mode is OVERRIDE
      const baseStandard = item.isWeightBased
        ? item.standardPricePerKgVnd ?? 0
        : item.standardPriceVnd;
      const requestedPrice = item.isWeightBased
        ? params.overridePricePerKgVnd ?? null
        : params.overridePriceVnd ?? null;

      if (requestedPrice === null) {
        throw new Error('OVERRIDE_PRICE_REQUIRED');
      }
      assertIntegerVnd(requestedPrice, 'requestedPrice');

      const deltaPercent =
        baseStandard > 0 ? (Math.abs(requestedPrice - baseStandard) / baseStandard) * 100 : 0;

      if (
        params.actor.role === 'BRANCH_MANAGER' &&
        deltaPercent > branch.managerMaxPriceDeltaPercent
      ) {
        if (!params.reason || params.reason.trim().length < 5) {
          throw new Error(
            'PRICE_CHANGE_REASON_REQUIRED: Thay đổi giá vượt giới hạn bắt buộc nhập lý do trình Chủ chuỗi duyệt.'
          );
        }
        const approval: ApprovalRequestEntity = {
          id: crypto.randomUUID(),
          tenantId: params.tenantId,
          branchId: params.branchId,
          actionType: 'PRICE_CHANGE_OVER_LIMIT',
          resourceType: 'BRANCH_MENU_CONFIG',
          resourceId: config.id,
          requestedByUserId: params.actor.userId,
          requestedByRole: params.actor.role,
          approvedByUserId: null,
          approvedByRole: null,
          reason: params.reason,
          payloadJson: {
            menuItemId: item.id,
            overridePriceVnd: params.overridePriceVnd ?? null,
            overridePricePerKgVnd: params.overridePricePerKgVnd ?? null,
          },
          status: 'PENDING',
          createdAtIso: nowIso,
          decidedAtIso: null,
        };
        tx.approvalRequests.push(approval);
        config.pendingPriceApprovalId = approval.id;

        return {
          appliedImmediately: false,
          config,
          approvalRequest: approval,
        };
      }

      config.priceMode = 'OVERRIDE';
      if (item.isWeightBased) {
        config.overridePricePerKgVnd = requestedPrice;
      } else {
        config.overridePriceVnd = requestedPrice;
      }
      return { appliedImmediately: true, config, approvalRequest: null };
    });
  }

  /**
   * Publishes a new Master Menu Release version.
   * Branches with INHERITED priceMode receive the new standard price upon sync;
   * branches with OVERRIDE keep their custom price untouched.
   * Historical OrderItems/Invoices are never mutated.
   */
  public publishMasterMenuRelease(params: {
    actor: ActorAccessContext;
    tenantId: string;
    priceUpdates: Array<{
      menuItemId: string;
      newStandardPriceVnd?: number;
      newStandardPricePerKgVnd?: number;
      newStandardEstimatedCostVnd?: number | null;
    }>;
    scheduledForIso?: string;
    syncOnlineBranchesImmediately?: boolean;
    nowIso?: string;
  }): MenuReleaseEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.actor,
      targetTenantId: params.tenantId,
      nowIso,
    });
    if (params.actor.role !== 'CHAIN_OWNER' && params.actor.role !== 'SAAS_ADMIN') {
      throw new Error('ONLY_CHAIN_OWNER_CAN_PUBLISH_MENU_RELEASE');
    }

    return this.db.transaction((tx) => {
      for (const upd of params.priceUpdates) {
        const item = tx.menuItems.find(
          (m) => m.id === upd.menuItemId && m.tenantId === params.tenantId
        );
        if (!item) {
          throw new Error(`MENU_ITEM_NOT_FOUND: ${upd.menuItemId}`);
        }
        if (upd.newStandardPriceVnd !== undefined) {
          assertIntegerVnd(upd.newStandardPriceVnd, 'newStandardPriceVnd');
          item.standardPriceVnd = upd.newStandardPriceVnd;
        }
        if (upd.newStandardPricePerKgVnd !== undefined) {
          assertIntegerVnd(upd.newStandardPricePerKgVnd, 'newStandardPricePerKgVnd');
          item.standardPricePerKgVnd = upd.newStandardPricePerKgVnd;
        }
        if (upd.newStandardEstimatedCostVnd !== undefined) {
          item.standardEstimatedCostVnd = upd.newStandardEstimatedCostVnd;
        }
        item.version += 1;
      }

      const existingReleases = tx.menuReleases.filter((r) => r.tenantId === params.tenantId);
      const nextVersion =
        existingReleases.reduce((max, r) => Math.max(max, r.versionNumber), 1) + 1;

      const tenantItems = structuredClone(
        tx.menuItems.filter((m) => m.tenantId === params.tenantId)
      );

      const release: MenuReleaseEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        versionNumber: nextVersion,
        scheduledForIso: params.scheduledForIso ?? nowIso,
        publishedAtIso: nowIso,
        snapshotJson: { items: tenantItems },
        createdByUserId: params.actor.userId,
        restoredFromVersion: null,
        createdAtIso: nowIso,
      };
      tx.menuReleases.push(release);

      if (params.syncOnlineBranchesImmediately !== false) {
        const branches = tx.branches.filter((b) => b.tenantId === params.tenantId);
        for (const b of branches) {
          const cluster = tx.clusterStates.find((c) => c.branchId === b.id);
          if (!cluster || cluster.cloudReachable) {
            b.activeMenuVersion = nextVersion;
            const configs = tx.branchMenuConfigs.filter((c) => c.branchId === b.id);
            for (const c of configs) {
              c.syncedMenuVersion = nextVersion;
            }
          }
        }
      }

      return release;
    });
  }

  /**
   * Resolves the effective menu catalog for a branch, including formatted cost display
   * ("Chưa có dữ liệu giá vốn" when cost is NULL).
   */
  public getEffectiveBranchCatalog(tenantId: string, branchId: string): Array<{
    menuItemId: string;
    code: string;
    name: string;
    categoryName: string;
    sellingUnit: SellingUnit;
    isWeightBased: boolean;
    priceMode: PriceInheritanceMode;
    effectivePriceVnd: number;
    effectivePricePerKgVnd: number | null;
    effectiveEstimatedCostVnd: number | null;
    effectiveEstimatedCostPerKgVnd: number | null;
    costDisplayLabel: string;
    availabilityStatus: MenuItemAvailability;
    syncedMenuVersion: number;
  }> {
    const state = this.db.getState();
    const items = state.menuItems.filter((m) => m.tenantId === tenantId);
    const configs = state.branchMenuConfigs.filter(
      (c) => c.tenantId === tenantId && c.branchId === branchId
    );

    return items.map((item) => {
      const cfg = configs.find((c) => c.menuItemId === item.id);
      const priceMode: PriceInheritanceMode = cfg?.priceMode ?? 'INHERITED';
      const effectivePriceVnd = item.isWeightBased
        ? 0
        : resolveEffectiveBranchPriceVnd({
            standardPriceVnd: item.standardPriceVnd,
            priceMode,
            overridePriceVnd: cfg?.overridePriceVnd ?? null,
          });
      const effectivePricePerKgVnd = item.isWeightBased
        ? resolveEffectiveBranchPriceVnd({
            standardPriceVnd: item.standardPricePerKgVnd ?? 0,
            priceMode,
            overridePriceVnd: cfg?.overridePricePerKgVnd ?? null,
          })
        : null;

      const effectiveEstimatedCostVnd =
        cfg?.costMode === 'OVERRIDE'
          ? cfg.overrideEstimatedCostVnd
          : item.standardEstimatedCostVnd;
      const effectiveEstimatedCostPerKgVnd =
        cfg?.costMode === 'OVERRIDE'
          ? cfg.overrideEstimatedCostPerKgVnd
          : item.standardEstimatedCostPerKgVnd;

      const hasCost = item.isWeightBased
        ? effectiveEstimatedCostPerKgVnd !== null
        : effectiveEstimatedCostVnd !== null;

      return {
        menuItemId: item.id,
        code: item.code,
        name: item.name,
        categoryName: item.categoryName,
        sellingUnit: item.sellingUnit,
        isWeightBased: item.isWeightBased,
        priceMode,
        effectivePriceVnd,
        effectivePricePerKgVnd,
        effectiveEstimatedCostVnd,
        effectiveEstimatedCostPerKgVnd,
        costDisplayLabel: hasCost
          ? `${(effectiveEstimatedCostVnd ?? effectiveEstimatedCostPerKgVnd ?? 0).toLocaleString('vi-VN')} VND`
          : 'Chưa có dữ liệu giá vốn',
        availabilityStatus: cfg?.availabilityStatus ?? item.defaultStatus,
        syncedMenuVersion: cfg?.syncedMenuVersion ?? item.version,
      };
    });
  }
}
