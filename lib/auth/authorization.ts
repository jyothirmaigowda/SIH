import { prisma } from '@/lib/db';

export const UserRole = {
  IO: 'IO',
  SUPERVISOR: 'SUPERVISOR',
  LEGAL: 'LEGAL',
  CONFIG: 'CONFIG'
} as const;

export type UserRole = keyof typeof UserRole | string;

export async function isUserAssignedToCase(userId: string, caseId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId, active: true },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === UserRole.CONFIG) return true;
  const assignment = await prisma.caseAssignment.findFirst({
    where: { caseId, userId, active: true },
  });
  return assignment !== null;
}

export async function checkCaseAccess(
  userId: string,
  caseId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId, active: true },
    select: { role: true, active: true },
  });
  if (!user) return { allowed: false, reason: 'USER_NOT_FOUND' };
  if (!user.active) return { allowed: false, reason: 'USER_INACTIVE' };
  if (user.role === UserRole.CONFIG) return { allowed: true };
  const assignment = await prisma.caseAssignment.findFirst({
    where: { caseId, userId, active: true },
  });
  if (!assignment) return { allowed: false, reason: 'NOT_ASSIGNED' };
  return { allowed: true };
}

export function isSupervisorOrConfig(role: UserRole): boolean {
  return role === UserRole.SUPERVISOR || role === UserRole.CONFIG;
}