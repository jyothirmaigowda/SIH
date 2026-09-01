import { prisma } from '@/lib/db';
import { AuditAction, AuditResult, UserRole } from '@prisma/client';

export interface AuditEventParams {
  actorId?: string;
  actorRole?: UserRole;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  caseId?: string;
  result: AuditResult;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write an immutable audit event. APPEND-ONLY — never updates or deletes.
 * Sensitive data (tokens, passwords) must NEVER appear in metadata.
 */
export async function writeAuditEvent(params: AuditEventParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      caseId: params.caseId,
      result: params.result,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: (params.metadata ?? {}) as object,
    },
  });
}