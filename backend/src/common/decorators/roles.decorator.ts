import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'requiredRoles';

/**
 * Mark a route handler as requiring one of the given roles.
 * Combined with `RolesGuard` (Sprint 1 stretch) — for now, ownership
 * checks are done inline in service methods.
 *
 * @example
 *   @Roles('OWNER', 'ADMIN')
 *   @Delete(':id')
 *   async remove(...) { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
