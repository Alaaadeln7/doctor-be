import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default registerAs('envConfig', () => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    system: {
      node_env: process.env.NODE_ENV,
      port: isProd ? process.env.PORT_PROD : process.env.PORT_DEV,
    },

    smtp: {
      host: process.env.SMTP_HOST,
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
      port: process.env.SMTP_PORT,
      security: process.env.SMTP_SECURITY,
      fromEmail: process.env.EMAIL_FROM_ADDRESS,
      fromName: process.env.EMAIL_FROM_NAME,
    },

    jwt: {
      pass: process.env.JWT_PASS,
      exp: process.env.JWT_EXPIRES_IN,
    },

    bcrypt: {
      salting: process.env.BCRYPT_SALTING,
    },

    db: {
      type: isProd ? process.env.DB_TYPE_PROD : process.env.DB_TYPE_DEV,
      user: isProd ? process.env.DB_USER_PROD : process.env.DB_USER_DEV,
      pass: isProd ? process.env.DB_PASS_PROD : process.env.DB_PASS_DEV,
      host: isProd ? process.env.DB_HOST_PROD : process.env.DB_HOST_DEV,
      port: isProd ? process.env.DB_PORT_PROD : process.env.DB_PORT_DEV,
      name: isProd ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV,
    },

    links: {
      updateMyEmailRedirectionLink: process.env.UPDATE_MY_EMAIL_REDIRECTION_LINK,
    },

    cloudinary: {
      name: process.env.CLOUDINARY_NAME,
      key: process.env.CLOUDINARY_API_KEY,
      secret: process.env.CLOUDINARY_API_SECRET,
    },

    fe: {
      url: process.env.FE_URL,
    },

    be: {
      url: process.env.BE_URL,
    },
  };
});
