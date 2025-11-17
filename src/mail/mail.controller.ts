/* eslint-disable */

import { Controller, Get } from "@nestjs/common";
import { MailService } from "./mail.service";

@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get("/login")
  sendLoginEmail() {
    return this.mailService.sendLoginEmail(
      "alaaadelnn120@gmail.com",
      "alaaadelnn120",
      "123456",
      "http://localhost:3000/login"
    );
  }
}
