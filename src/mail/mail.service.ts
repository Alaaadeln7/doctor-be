/* eslint-disable */

import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

/** Central mail service using EJS templates */
@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  /** Generic method to send any template email */
  private async sendTemplateEmail(params: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: params.to,
        subject: params.subject,
        template: params.template,
        context: params.context,
      });
    } catch (err) {
      console.error(`Error sending ${params.template} email:`, err);
    }
  }

  /** Send login email */
  async sendLoginEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Login to Your Account",
      template: "login",
      context: { name, email, otp, otpLink },
    });
  }

  /** Send reset password email */
  async sendResetPasswordEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Reset Your Password",
      template: "admin_reset_password_request",
      context: { name, email, otp, otpLink },
    });
  }

  /** Admin signup / verify email */
  async sendAdminSignupEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Admin Account Verification",
      template: "admin_signup",
      context: { name, email, otp, otpLink },
    });
  }

  /** Contact-us confirmation email */
  async sendContactUsEmail(
    name: string,
    email: string,
    message: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Your Message Was Received",
      template: "contact_us",
      context: { name, email, message },
    });
  }

  /** Doctor signup email */
  async sendDoctorSignupEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Doctor Account Verification",
      template: "doctor_signup",
      context: { name, email, otp, otpLink },
    });
  }

  /** Doctor email update confirmation */
  async sendUpdateDoctorEmail(
    name: string,
    email: string,
    otp: string,
    link: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Confirm Email Update",
      template: "doctor_update_email",
      context: { name, email, otp, link },
    });
  }

  /** Resend OTP code */
  async sendResendCodeEmail(
    name: string,
    email: string,
    otp: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Your Verification Code",
      template: "resend_code",
      context: { name, email, otp },
    });
  }

  /** Admin updated his data */
  async sendUpdateMyAdminDataEmail(
    name: string,
    email: string,
    redirectLink: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Admin Data Updated",
      template: "update_my_admin_data",
      context: { name, email, redirectLink },
    });
  }

  /** Doctor reset password email */
  async sendDoctorResetPasswordEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    return this.sendTemplateEmail({
      to: email,
      subject: "Reset Your Password",
      template: "doctor_reset_password_request",
      context: { name, email, otp, otpLink },
    });
  }
}
