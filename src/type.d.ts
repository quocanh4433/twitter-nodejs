import { Request } from 'express';
import { TokenPayload } from './models/requests/User.request';
import { TokenExpiredError } from 'jsonwebtoken';
import Tweet from './models/schemas/Tweet.schema';

declare module 'express' {
  interface Request {
    user?: User;
    decode_authorization?: TokenPayload;
    decode_refresh_token?: TokenPayload;
    decode_verify_email_token?: TokenPayload;
    decode_forgot_password_token?: TokenPayload;
    tweet?: Tweet;
  }
}
