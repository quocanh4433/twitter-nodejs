/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import path from 'path';
import fs from 'fs';
import { envConfig } from '~/constants/config';

// Create SES service object.
const sesClient = new SESClient({
  region: envConfig.awsRegion,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey as string,
    accessKeyId: envConfig.awsAccessKeyId as string
  }
});

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string;
  toAddresses: string | string[];
  ccAddresses?: string | string[];
  body: string;
  subject: string;
  replyToAddresses?: string | string[];
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  });
};

const sendVerifyEmail = (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: envConfig.sesFromAddress as string,
    toAddresses: toAddress,
    body,
    subject
  });
  console.log('toAddress', toAddress)
  console.log('envConfig.sesFromAddress', envConfig.sesFromAddress)
  return sesClient.send(sendEmailCommand);
};

const templateVerifyEmail = fs.readFileSync(path.resolve('src/template/verify-email.html'), 'utf8');
export const sendVerifyRegisterEmail = async (
  toAddress: string,
  email_verify_token: string,
  template: string = templateVerifyEmail
) => {
  try {
    const result = await sendVerifyEmail(
      toAddress,
      'Verify your email',
      template
        .replace('{{title}}', 'Please verify your email')
        .replace('{{content}}', 'Click your button below to verify your email')
        .replace('{{titleLink}}', 'Verify')
        .replace('{{link}}', `${envConfig.clientUrl}/verify-email?token=${email_verify_token}`)
    );
    return result;
  } catch (err) {
    console.log('Errr', err);
    return err;
  }
};

export const sendForgotPasswordEmail = (
  toAddress: string,
  forgot_password_token: string,
  template: string = templateVerifyEmail
) => {
  return sendVerifyEmail(
    toAddress,
    'Forgot Password',
    template
      .replace('{{title}}', 'You are receiving this email because you requested to reset your password')
      .replace('{{content}}', 'Click the button below to reset your password')
      .replace('{{titleLink}}', 'Reset Password')
      .replace('{{link}}', `${envConfig.clientUrl}/reset-password?token=${forgot_password_token}`)
  );
};
