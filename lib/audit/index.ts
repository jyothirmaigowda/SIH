import { prisma } from '@/lib/db';

export type UserRole = string;
export type AuditAction = string;
export type AuditResult = string;

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
      metadata: params.metadata ? JSON.stringify(params.metadata) : '{}',
    },
  });
}