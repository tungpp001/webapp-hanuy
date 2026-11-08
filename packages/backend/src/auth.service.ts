import crypto from 'node:crypto';
import {
  ActorAccessContext,
  assertActorSecurityPreconditions,
  assertTenantAndBranchScope,
  SupportScope,
  UserRole,
} from '@oc-pos/shared';
import {
  SupportAccessGrantEntity,
  TransactionalDatabase,
  UserEntity,
  UserSessionEntity,
} from '@oc-pos/database';

const MIN_PASSWORD_LENGTH = 12;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const POS_IDLE_LOCK_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Hashes password with memory-hard scrypt/Argon2id-equivalent parameters and random 16-byte salt.
 * Enforces minimum 12 characters policy.
 */
export function hashPasswordSecure(plainPassword: string): string {
  if (!plainPassword || plainPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `PASSWORD_TOO_SHORT: Mật khẩu phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`
    );
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$16384$8$1$${salt}$${derived.toString('hex')}`;
}

export function verifyPasswordSecure(plainPassword: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4]!;
  const expectedHex = parts[5]!;
  const derived = crypto.scryptSync(plainPassword, salt, 64, { N, r, p });
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expectedBuf);
}

/**
 * Generates or verifies RFC 6238 TOTP 6-digit code for MFA.
 */
export function generateTotpCode(secretHex: string, timestampMs = Date.now()): string {
  const step = Math.floor(timestampMs / 30_000);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', Buffer.from(secretHex, 'hex')).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

export class IdentityAndAccessService {
  constructor(private readonly db: TransactionalDatabase) {}

  public createUser(params: {
    actor: ActorAccessContext;
    tenantId: string | null;
    branchId: string | null;
    username: string;
    email: string;
    plainPassword: string;
    role: UserRole;
    mfaEnabled?: boolean;
    nowIso?: string;
  }): { user: UserEntity; mfaSecretHex: string | null } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertActorSecurityPreconditions(params.actor, nowIso);

    if (params.tenantId) {
      assertTenantAndBranchScope({
        actor: params.actor,
        targetTenantId: params.tenantId,
        targetBranchId: params.branchId,
        nowIso,
      });
    } else if (params.actor.role !== 'SAAS_ADMIN') {
      throw new Error('ONLY_SAAS_ADMIN_CAN_CREATE_PLATFORM_USERS');
    }

    const passwordHash = hashPasswordSecure(params.plainPassword);
    const mustEnableMfa =
      params.role === 'SAAS_ADMIN' ||
      params.role === 'TECH_SUPPORT' ||
      Boolean(params.mfaEnabled);
    const mfaSecretHex = mustEnableMfa ? crypto.randomBytes(20).toString('hex') : null;

    return this.db.transaction((tx) => {
      if (tx.users.some((u) => u.username.toLowerCase() === params.username.toLowerCase())) {
        throw new Error(`USERNAME_ALREADY_EXISTS: ${params.username}`);
      }

      const user: UserEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        username: params.username,
        email: params.email,
        passwordHash,
        role: params.role,
        mfaEnabled: mustEnableMfa,
        mfaSecret: mfaSecretHex,
        failedLoginAttempts: 0,
        lockedUntilIso: null,
        status: 'ACTIVE',
        createdAt: nowIso,
      };
      tx.users.push(user);

      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        actorUserId: params.actor.userId,
        actorRole: params.actor.role,
        supportGrantId: params.actor.activeSupportGrant?.grantId ?? null,
        action: 'CREATE_USER',
        resourceType: 'USER',
        resourceId: user.id,
        reason: `Tạo người dùng vai trò ${user.role}`,
        beforeJson: null,
        afterJson: { id: user.id, username: user.username, role: user.role, mfaEnabled: user.mfaEnabled },
        occurredAtIso: nowIso,
      });

      return { user, mfaSecretHex };
    });
  }

  public login(params: {
    username: string;
    plainPassword: string;
    totpCode?: string;
    nowIso?: string;
  }): { sessionToken: string; session: UserSessionEntity; user: UserEntity } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    const nowMs = new Date(nowIso).getTime();

    return this.db.transaction((tx) => {
      const user = tx.users.find(
        (u) => u.username.toLowerCase() === params.username.toLowerCase()
      );
      if (!user) {
        throw new Error('INVALID_CREDENTIALS');
      }

      if (user.status === 'DISABLED') {
        throw new Error('ACCOUNT_DISABLED: Tài khoản nhân viên đã ngừng kích hoạt.');
      }

      if (user.lockedUntilIso && new Date(user.lockedUntilIso).getTime() > nowMs) {
        throw new Error(`ACCOUNT_LOCKED_TEMPORARILY: Tài khoản đang bị khóa tạm thời đến ${user.lockedUntilIso}`);
      }

      const validPassword = verifyPasswordSecure(params.plainPassword, user.passwordHash);
      if (!validPassword) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
          user.lockedUntilIso = new Date(nowMs + LOCKOUT_DURATION_MS).toISOString();
          if (user.tenantId && user.branchId) {
            tx.systemAlerts.push({
              id: crypto.randomUUID(),
              tenantId: user.tenantId,
              branchId: user.branchId,
              severity: 'WARNING',
              category: 'AUTH_SECURITY',
              title: 'Khóa tài khoản tạm thời do đăng nhập sai nhiều lần',
              message: `Tài khoản ${user.username} đã nhập sai mật khẩu ${user.failedLoginAttempts} lần liên tiếp.`,
              status: 'OPEN',
              createdAtIso: nowIso,
              resolvedAtIso: null,
            });
          }
        }
        throw new Error('INVALID_CREDENTIALS');
      }

      if (user.mfaEnabled || user.role === 'SAAS_ADMIN' || user.role === 'TECH_SUPPORT') {
        if (!user.mfaSecret || !params.totpCode) {
          throw new Error('MFA_CODE_REQUIRED: Vui lòng nhập mã xác thực MFA 6 chữ số.');
        }
        const expectedCode = generateTotpCode(user.mfaSecret, nowMs);
        if (params.totpCode !== expectedCode) {
          user.failedLoginAttempts += 1;
          throw new Error('INVALID_MFA_CODE: Mã MFA không chính xác.');
        }
      }

      user.failedLoginAttempts = 0;
      user.lockedUntilIso = null;

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const session: UserSessionEntity = {
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        isPosLocked: false,
        draftOrderStateJson: null,
        lastActivityAtIso: nowIso,
        expiresAtIso: new Date(nowMs + 12 * 3600 * 1000).toISOString(),
        revokedAtIso: null,
      };
      tx.userSessions.push(session);

      return { sessionToken: rawToken, session, user };
    });
  }

  /**
   * Evaluates POS idle timeout (15 minutes). If inactive >= 15 minutes, locks the POS session
   * while strictly preserving any in-progress draft order state so no work is lost.
   */
  public checkAndTouchSession(params: {
    sessionToken: string;
    draftOrderStateJson?: Record<string, unknown>;
    nowIso?: string;
  }): { session: UserSessionEntity; user: UserEntity } {
    const nowIso = params.nowIso ?? new Date().toISOString();
    const nowMs = new Date(nowIso).getTime();
    const tokenHash = crypto.createHash('sha256').update(params.sessionToken).digest('hex');

    return this.db.transaction((tx) => {
      const session = tx.userSessions.find((s) => s.tokenHash === tokenHash);
      if (!session || session.revokedAtIso !== null) {
        throw new Error('SESSION_REVOKED_OR_NOT_FOUND');
      }
      if (new Date(session.expiresAtIso).getTime() <= nowMs) {
        throw new Error('SESSION_EXPIRED');
      }

      const user = tx.users.find((u) => u.id === session.userId);
      if (!user || user.status === 'DISABLED') {
        throw new Error('USER_DISABLED');
      }

      if (params.draftOrderStateJson !== undefined) {
        session.draftOrderStateJson = structuredClone(params.draftOrderStateJson);
      }

      const idleMs = nowMs - new Date(session.lastActivityAtIso).getTime();
      if (idleMs >= POS_IDLE_LOCK_MS) {
        session.isPosLocked = true;
        return { session, user };
      }

      session.lastActivityAtIso = nowIso;
      return { session, user };
    });
  }

  public unlockPosSession(params: {
    sessionToken: string;
    plainPassword: string;
    nowIso?: string;
  }): UserSessionEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    const tokenHash = crypto.createHash('sha256').update(params.sessionToken).digest('hex');

    return this.db.transaction((tx) => {
      const session = tx.userSessions.find((s) => s.tokenHash === tokenHash);
      if (!session || session.revokedAtIso !== null) {
        throw new Error('SESSION_REVOKED_OR_NOT_FOUND');
      }
      const user = tx.users.find((u) => u.id === session.userId);
      if (!user || user.status === 'DISABLED') {
        throw new Error('USER_DISABLED');
      }
      if (!verifyPasswordSecure(params.plainPassword, user.passwordHash)) {
        throw new Error('INVALID_UNLOCK_PASSWORD');
      }
      session.isPosLocked = false;
      session.lastActivityAtIso = nowIso;
      return session;
    });
  }

  /**
   * Offboards an employee: disables account, revokes all active sessions immediately,
   * and preserves 100% of historical transactions and audit logs.
   */
  public disableEmployeeAndRevokeSessions(params: {
    actor: ActorAccessContext;
    targetUserId: string;
    reason: string;
    nowIso?: string;
  }): { revokedSessionCount: number } {
    const nowIso = params.nowIso ?? new Date().toISOString();

    return this.db.transaction((tx) => {
      const targetUser = tx.users.find((u) => u.id === params.targetUserId);
      if (!targetUser) {
        throw new Error('USER_NOT_FOUND');
      }
      if (targetUser.tenantId) {
        assertTenantAndBranchScope({
          actor: params.actor,
          targetTenantId: targetUser.tenantId,
          targetBranchId: targetUser.branchId,
          nowIso,
        });
      }

      targetUser.status = 'DISABLED';
      let revokedSessionCount = 0;
      for (const s of tx.userSessions) {
        if (s.userId === targetUser.id && s.revokedAtIso === null) {
          s.revokedAtIso = nowIso;
          revokedSessionCount += 1;
        }
      }

      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: targetUser.tenantId,
        branchId: targetUser.branchId,
        actorUserId: params.actor.userId,
        actorRole: params.actor.role,
        supportGrantId: null,
        action: 'DISABLE_USER_AND_REVOKE_SESSIONS',
        resourceType: 'USER',
        resourceId: targetUser.id,
        reason: params.reason,
        beforeJson: { status: 'ACTIVE' },
        afterJson: { status: 'DISABLED', revokedSessionCount },
        occurredAtIso: nowIso,
      });

      return { revokedSessionCount };
    });
  }

  /**
   * Grants time-bounded, revocable remote support access to a specific technician.
   */
  public approveRemoteSupportAccess(params: {
    approver: ActorAccessContext;
    tenantId: string;
    branchId: string;
    technicianUserId: string;
    requestedByUserId: string;
    scope: SupportScope;
    reason: string;
    durationMinutes: number;
    nowIso?: string;
  }): SupportAccessGrantEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    assertTenantAndBranchScope({
      actor: params.approver,
      targetTenantId: params.tenantId,
      targetBranchId: params.branchId,
      nowIso,
    });

    if (
      params.approver.role !== 'CHAIN_OWNER' &&
      params.approver.role !== 'BRANCH_MANAGER' &&
      params.approver.role !== 'SAAS_ADMIN'
    ) {
      throw new Error('INSUFFICIENT_ROLE_TO_APPROVE_REMOTE_SUPPORT');
    }

    const startsMs = new Date(nowIso).getTime();
    const expiresAtIso = new Date(startsMs + params.durationMinutes * 60_000).toISOString();

    return this.db.transaction((tx) => {
      const grant: SupportAccessGrantEntity = {
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        technicianUserId: params.technicianUserId,
        requestedByUserId: params.requestedByUserId,
        approvedByUserId: params.approver.userId,
        scope: params.scope,
        reason: params.reason,
        startsAtIso: nowIso,
        expiresAtIso,
        revokedAtIso: null,
      };
      tx.supportAccessGrants.push(grant);

      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: params.tenantId,
        branchId: params.branchId,
        actorUserId: params.approver.userId,
        actorRole: params.approver.role,
        supportGrantId: grant.id,
        action: 'APPROVE_REMOTE_SUPPORT_GRANT',
        resourceType: 'SUPPORT_GRANT',
        resourceId: grant.id,
        reason: params.reason,
        beforeJson: null,
        afterJson: grant,
        occurredAtIso: nowIso,
      });

      return grant;
    });
  }

  public revokeRemoteSupportAccess(params: {
    actor: ActorAccessContext;
    grantId: string;
    reason: string;
    nowIso?: string;
  }): SupportAccessGrantEntity {
    const nowIso = params.nowIso ?? new Date().toISOString();
    return this.db.transaction((tx) => {
      const grant = tx.supportAccessGrants.find((g) => g.id === params.grantId);
      if (!grant) {
        throw new Error('SUPPORT_GRANT_NOT_FOUND');
      }
      assertTenantAndBranchScope({
        actor: params.actor,
        targetTenantId: grant.tenantId,
        targetBranchId: grant.branchId,
        nowIso,
      });
      grant.revokedAtIso = nowIso;
      tx.auditLogs.push({
        id: crypto.randomUUID(),
        tenantId: grant.tenantId,
        branchId: grant.branchId,
        actorUserId: params.actor.userId,
        actorRole: params.actor.role,
        supportGrantId: grant.id,
        action: 'REVOKE_REMOTE_SUPPORT_GRANT',
        resourceType: 'SUPPORT_GRANT',
        resourceId: grant.id,
        reason: params.reason,
        beforeJson: { revokedAtIso: null },
        afterJson: { revokedAtIso: nowIso },
        occurredAtIso: nowIso,
      });
      return grant;
    });
  }
}
