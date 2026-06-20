import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as not requiring auth. Used on `/v1/auth/signup`,
 * `/v1/auth/login`, `/v1/auth/refresh`, etc.
 *
 * @example
 *   @Public()
 *   @Post('login')
 *   async login(...) { ... }
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
