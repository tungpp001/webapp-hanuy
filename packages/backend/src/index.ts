import http from 'node:http';
import { TransactionalDatabase } from '@oc-pos/database';
import { IdentityAndAccessService } from './auth.service.js';
import { TenantAndMenuService } from './tenant-menu.service.js';
import { OrderingAndKitchenService } from './ordering-kitchen.service.js';
import { BillingAndPaymentService } from './billing-payment.service.js';
import { SyncFailoverAndExportService } from './sync-failover-export.service.js';

export interface OcPosBackendContainer {
  db: TransactionalDatabase;
  authService: IdentityAndAccessService;
  tenantMenuService: TenantAndMenuService;
  orderingService: OrderingAndKitchenService;
  billingService: BillingAndPaymentService;
  syncFailoverService: SyncFailoverAndExportService;
}

export function createOcPosBackendContainer(
  options?: { storageFilePath?: string }
): OcPosBackendContainer {
  const db = new TransactionalDatabase(options);
  const authService = new IdentityAndAccessService(db);
  const tenantMenuService = new TenantAndMenuService(db);
  const orderingService = new OrderingAndKitchenService(db, tenantMenuService);
  const billingService = new BillingAndPaymentService(db, orderingService);
  const syncFailoverService = new SyncFailoverAndExportService(db);

  return {
    db,
    authService,
    tenantMenuService,
    orderingService,
    billingService,
    syncFailoverService,
  };
}

/**
 * Creates a lightweight HTTP API Server exposing health, branch status, catalog,
 * order submission, KDS, billing, and sync endpoints for E2E & Load Testing.
 */
export function createOcPosHttpServer(container: OcPosBackendContainer): http.Server {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      const state = container.db.getState();
      res.writeHead(200);
      res.end(
        JSON.stringify({
          status: 'OK',
          timestampIso: new Date().toISOString(),
          tenantCount: state.tenants.length,
          branchCount: state.branches.length,
          openAlertCount: state.systemAlerts.filter((a) => a.status === 'OPEN').length,
        })
      );
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      const tenantId = url.searchParams.get('tenantId') ?? '';
      const branchId = url.searchParams.get('branchId') ?? '';
      const items = container.tenantMenuService.getEffectiveBranchCatalog(tenantId, branchId);
      res.writeHead(200);
      res.end(JSON.stringify({ items }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};

        if (req.method === 'POST' && url.pathname === '/api/orders/rounds') {
          const idempotencyKey =
            (req.headers['idempotency-key'] as string) ?? parsed.idempotencyKey;
          const result = container.orderingService.submitOrderRound({
            ...parsed,
            idempotencyKey,
          });
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'ENDPOINT_NOT_FOUND' }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const status = msg.includes('IDEMPOTENCY_PAYLOAD_MISMATCH')
          ? 409
          : msg.includes('VIOLATION') || msg.includes('FORBIDDEN')
            ? 403
            : 400;
        res.writeHead(status);
        res.end(JSON.stringify({ error: msg }));
      }
    });
  });
}

export * from './auth.service.js';
export * from './tenant-menu.service.js';
export * from './ordering-kitchen.service.js';
export * from './billing-payment.service.js';
export * from './sync-failover-export.service.js';
