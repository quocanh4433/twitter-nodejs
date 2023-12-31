import { config } from 'dotenv';
import argv from 'minimist';

const env = argv(process.argv.slice(2));
const isProduction = Boolean(env.production);
const isStaging = Boolean(env.staging);

config({
  path: isProduction ? '.env.production' : isStaging ? '.env.staging' : '.env'
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
