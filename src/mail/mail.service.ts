/* eslint-disable */

import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  public async sendLoginEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Login to Your Account",
        template: "login",
        context: {
          name,
          otp,
          otpLink,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending login email:", error);
    }
  }

  public async sendResetPasswordEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Reset Password",
        template: "admin_reset_password_request",
        context: {
          name,
          otp,
          otpLink,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending reset password email:", error);
    }
  }

  public async sendAdminSignupEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Admin Signup",
        template: "admin_signup",
        context: {
          name,
          otp,
          otpLink,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending admin signup email:", error);
    }
  }

  public async sendContactUsEmail(
    name: string,
    email: string,
    message: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Contact Us",
        template: "contact_us",
        context: {
          name,
          email,
          message,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending contact us email:", error);
    }
  }

  public async sendDoctorSignupEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Doctor Signup",
        template: "doctor_signup",
        context: {
          name,
          otp,
          otpLink,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending doctor signup email:", error);
    }
  }

  public async sendUpdateDoctorEmail(
    name: string,
    email: string,
    otp: string,
    link: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Update Doctor Email",
        template: "doctor_update_email",
        context: {
          name,
          otp,
          link,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending update doctor email:", error);
    }
  }

  public async sendResendCodeEmail(
    name: string,
    email: string,
    otp: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Resend Code",
        template: "resend_code",
        context: {
          name,
          otp,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending resend code email:", error);
    }
  }

  public async sendUpdateMyAdminDataEmail(
    name: string,
    email: string,
    redirectLink: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Update My Admin Data",
        template: "update_my_admin_data",
        context: {
          name,
          redirectLink,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending update my admin data email:", error);
    }
  }
  public async sendDoctorResetPasswordEmail(
    name: string,
    email: string,
    otp: string,
    otpLink: string
  ): Promise<void> {
    try {
      const mailOptions = {
        to: email,
        subject: "Doctor Reset Password",
        template: "doctor_reset_password_request",
        context: {
          name,
          otp,
          otpLink,
        },
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending doctor reset password email:", error);
    }
  }
}
