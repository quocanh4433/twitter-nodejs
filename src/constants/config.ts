import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

const env = process.env.NODE_ENV;
const envFilename = `.env.${env}`;
if (!env) {
  console.log(
    `Bạn chưa cung cấp biến môi trường NODE_ENV (ví dụ: development, production). Phát hiện NODE_ENV = ${env}`
  );
  process.exit(1);
}

console.log(`Phát hiện NODE_ENV = ${env}, vì thế app sẽ dùng file môi trường là ${envFilename}`);

if (!fs.existsSync(path.resolve(envFilename))) {
  console.log(
    `Không tìm thấy file môi trường ${envFilename}. Lưu ý: App không dùng file .env, ví dụ môi trường là development thì app sẽ dùng file .env.development. Vui lòng tạo file ${envFilename} và tham khảo nội dung ở file .env.example`
  );
  process.exit(1);
}

config({
  path: envFilename
});

export const envConfig = {
  port: process.env.PORT || 4000,
  host: process.env.HOST,

  dbUserName: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  dbUsersCollection: process.env.DB_USERS_COLLECTION,
  dbRefreshTokensCollection: process.env.DB_REFRESH_TOKENS_COLLECTION,
  dbFollowersCollection: process.env.DB_FOLLOWERS_COLLECTION,
  dbTweetsCollection: process.env.DB_TWEETS_COLLECTION,
  dbHashTagsCollection: process.env.DB_HASHTAGS_COLLECTION,
  dbBookmarkCollection: process.env.DB_BOOKMARKS_COLLECTION,
  dbConversationCollection: process.env.DB_CONVERSATION_COLLECTION,
  dbLikeCollection: process.env.DB_LIKE_COLLECTION,

  passwordSecret: process.env.PASSWORD_SECRET,
  jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  jwtRefreshtokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  jwtVerifyemailSecret: process.env.JWT_VERIFY_EMAIL_SECRET,
  jwtForgotPasswordSecret: process.env.JWT_FORGOT_PASSWORD_SECRET,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExppiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  verifyEmailTokenExpiresIn: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN,
  forgotPasswordTokenExpiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN,

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  clientRedirectCallback: process.env.CLIENT_REDIRECT_CALLBACK,

  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  sesFromAddress: process.env.SES_FROM_ADDRESS,
  clientUrl: process.env.CLIENT_URL
};
