import { Request } from 'express';
import { TokenPayload } from './models/requests/User.request';

declare module 'express' {
  interface Request {
    user?: User;
    decode_authorization?: TokenPayload;
    decode_refresh_token?: TokenPayload;
    decode_verify_email_token?: TokenPayload
  }
}
