/* eslint-disable */

import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /** Generic method to send HTML email */
  private async sendHtmlEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || "Your App"}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    } catch (err) {
      console.error(`Error sending email:`, err);
      throw err;
    }
  }

  /** Generate base HTML template */
  private generateBaseTemplate(content: string, title?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || "Email"}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .otp-code {
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            color: #495057;
            margin: 20px 0;
            letter-spacing: 8px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 15px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .info-box {
            background: #e7f3ff;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .divider {
            height: 1px;
            background: #e9ecef;
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
  }

  /** Send login email */
  async sendLoginEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Welcome Back!</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a login attempt for your account. Use the OTP code below to complete your login:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Or click the button below to login directly:</p>
            <a href="${otpLink}" class="button">Login to Your Account</a>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Security Tip:</strong> This OTP will expire in 10 minutes. 
                If you didn't request this login, please ignore this email and secure your account.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Login to Your Account"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Login to Your Account",
      html,
    });
  }

  /** Send reset password email */
  async sendResetPasswordEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Use the OTP code below to verify your identity:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Or click the button below to reset your password:</p>
            <a href="${otpLink}" class="button">Reset Password</a>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Note:</strong> This OTP will expire in 10 minutes. 
                If you didn't request a password reset, please ignore this email.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Reset Your Password"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Reset Your Password",
      html,
    });
  }

  /** Admin signup / verify email */
  async sendAdminSignupEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Admin Account Verification</h1>
        </div>
        <div class="content">
            <h2>Welcome ${name}!</h2>
            <p>Thank you for registering as an administrator. To complete your account setup, please verify your email address using the OTP code below:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Or click the button below to verify your account:</p>
            <a href="${otpLink}" class="button">Verify Account</a>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Important:</strong> This verification link will expire in 24 hours. 
                Please complete your registration to access the admin dashboard.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Admin Account Verification"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Admin Account Verification",
      html,
    });
  }

  /** Contact-us confirmation email */
  async sendContactUsEmail(
    name: string,
    email: string,
    message: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Message Received</h1>
        </div>
        <div class="content">
            <h2>Thank You, ${name}!</h2>
            <p>We've received your message and will get back to you as soon as possible.</p>
            
            <div class="info-box">
                <strong>Your Message:</strong>
                <p style="margin-top: 10px; font-style: italic;">"${message}"</p>
            </div>
            
            <p>We typically respond within 24-48 hours. For urgent matters, please call our support line.</p>
            
            <div class="divider"></div>
            
            <p><strong>Reference Email:</strong> ${email}</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Message Received"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Your Message Was Received",
      html,
    });
  }

  /** Doctor signup email */
  async sendDoctorSignupEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Doctor Account Verification</h1>
        </div>
        <div class="content">
            <h2>Welcome Dr. ${name}!</h2>
            <p>Thank you for joining our medical platform. To activate your doctor account, please verify your email address using the OTP code below:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Or click the button below to verify your account:</p>
            <a href="${otpLink}" class="button">Verify Account</a>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Next Steps:</strong> After verification, our team will review your credentials 
                and you'll be notified once your account is fully activated.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Doctor Account Verification"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Doctor Account Verification",
      html,
    });
  }

  /** Doctor email update confirmation */
  async sendUpdateDoctorEmail(
    name: string,
    email: string,
    otp: string,
    link: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Confirm Email Update</h1>
        </div>
        <div class="content">
            <h2>Hello Dr. ${name},</h2>
            <p>We received a request to update your email address. Please confirm this change using the OTP code below:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Or click the button below to confirm the email update:</p>
            <a href="${link}" class="button">Confirm Email Update</a>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Security Alert:</strong> If you didn't request this email change, 
                please contact our support team immediately and do not use the OTP code.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Confirm Email Update"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Confirm Email Update",
      html,
    });
  }

  /** Resend OTP code */
  async sendResendCodeEmail(
    name: string,
    email: string,
    otp: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Your Verification Code</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>As requested, here is your new verification code:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Enter this code in the verification page to complete your request.</p>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Expiration:</strong> This code will expire in 10 minutes. 
                If you didn't request this code, please ignore this email.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Your Verification Code"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Your Verification Code",
      html,
    });
  }

  /** Admin updated his data */
  async sendUpdateMyAdminDataEmail(
    name: string,
    email: string,
    redirectLink: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Admin Data Updated</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your administrator account information has been successfully updated.</p>
            
            <p>If you made these changes, no further action is required. If you didn't make these changes, please secure your account immediately.</p>
            
            <a href="${redirectLink}" class="button">View Your Account</a>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Security Notice:</strong> Regularly review your account settings 
                and enable two-factor authentication for enhanced security.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Admin Data Updated"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Admin Data Updated",
      html,
    });
  }

  /** Doctor reset password email */
  async sendDoctorResetPasswordEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    const html = this.generateBaseTemplate(
      `
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <h2>Hello Dr. ${name},</h2>
            <p>We received a request to reset your password. Use the OTP code below to verify your identity:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Or click the button below to reset your password:</p>
            <a href="${otpLink}" class="button">Reset Password</a>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <strong>Important:</strong> This OTP will expire in 10 minutes. 
                If you didn't request a password reset, please contact our support team immediately.
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    `,
      "Reset Your Password"
    );

    return this.sendHtmlEmail({
      to: email,
      subject: "Reset Your Password",
      html,
    });
  }
}
