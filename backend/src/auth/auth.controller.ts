import { BadRequestException, Body, Controller, HttpCode, Post, Req, Res, UsePipes } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { loginSchema } from '@sms-monitor/shared-types';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(100),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: process.env['NODE_ENV'] === 'production' ? ('strict' as const) : ('lax' as const),
  path: '/',
};

@Public()
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UsePipes(new ZodValidationPipe(signupSchema))
  @Post('signup')
  @HttpCode(201)
  @Throttle({ default: { limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10), ttl: 60000 } })
  async signup(
    @Body() body: { name: string; email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const tokens = await this.auth.signup(body);
    this.setAuthCookies(res, tokens);
    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  @UsePipes(new ZodValidationPipe(loginSchema))
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10), ttl: 60000 } })
  async login(
    @Body() body: { tenantSlug?: string; email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const tokens = await this.auth.login(body);
    this.setAuthCookies(res, tokens);
    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const raw = (req as Request & { cookies?: Record<string, string> }).cookies?.['refresh_jwt'];
    if (!raw) {
      res.status(401);
      return { accessToken: '', expiresIn: 0 };
    }
    const tokens = await this.auth.refresh(raw);
    this.setAuthCookies(res, tokens);
    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const raw = (req as Request & { cookies?: Record<string, string> }).cookies?.['refresh_jwt'];
    if (raw) await this.auth.logout(raw);
    res.clearCookie('jwt', COOKIE_OPTIONS);
    res.clearCookie('refresh_jwt', COOKIE_OPTIONS);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() body: { email: string }): Promise<{ message: string }> {
    if (!body.email || typeof body.email !== 'string') {
      throw new BadRequestException('Email is required');
    }
    await this.auth.forgotPassword(body.email);
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() body: { token: string; password: string }): Promise<{ message: string }> {
    if (!body.token || !body.password) {
      throw new BadRequestException('Token and password are required');
    }
    await this.auth.resetPassword(body.token, body.password);
    return { message: 'Password has been reset successfully.' };
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string; expiresIn: number }): void {
    res.cookie('jwt', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: tokens.expiresIn * 1000 });
    res.cookie('refresh_jwt', tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });
  }
}
