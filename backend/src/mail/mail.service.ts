import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST', 'mh'),
      port: 1025,
      ignoreTLS: true,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetLink = `${this.config.get<string>('APP_URL', 'http://localhost:6002')}/auth/reset-password?token=${resetToken}`;
    await this.transporter.sendMail({
      from: '"SMS Monitor" <noreply@sms-monitor.local>',
      to,
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour.</p>`,
    });
    this.logger.log(`Password reset email sent to ${to}`);
  }
}
