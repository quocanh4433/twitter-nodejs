import { Request } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';
import { capitalize } from 'lodash';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Error';
import { verifyToken } from './jwt';
import { envConfig } from '~/constants/config';

export const enumToArrayValue = (enumValue: { [key: string]: string | number }) => {
  return Object.values(enumValue).filter((value) => typeof value === 'number') as number[];
};

export const verifyAccessToken = async (accessToken: string, req?: Request) => {
  if (!accessToken) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  try {
    const decode_authorization = await verifyToken({
      token: accessToken,
      secretOrPublicKey: envConfig.jwtAccessTokenSecret as string
    });

    if (req) {
      (req as Request).decode_authorization = decode_authorization;
      return true;
    }
    return decode_authorization;
  } catch (error) {
    throw new ErrorWithStatus({
      message: capitalize((error as JsonWebTokenError).message),
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  return true;
};
