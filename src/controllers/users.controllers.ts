import { Request, Response } from 'express';
import {
  ForgotPasswordReqBody,
  GetProfileReqParam,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyEmailReqBody
} from '~/models/requests/User.request';
import { ParamsDictionary } from 'express-serve-static-core';
import usersService from '~/services/users.services';
import { USERS_MESSAGES } from '~/constants/messages';
import { ObjectId } from 'mongodb';
import { User } from '~/models/schemas/User.schema';
import databaseService from '~/services/data.servieces';
import HTTP_STATUS from '~/constants/httpStatus';
import { UserVerifyStatus } from '~/constants/enums';

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const verify = user.verify as UserVerifyStatus;
  const result = await usersService.login({ user_id: user_id.toString(), verify });
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.regiser(req.body);
    return res.json({ message: 'Register success', result });
  } catch (error) {
    return res.status(400).json({
      message: USERS_MESSAGES.REGISTER_FAILED
    });
  }
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);
  res.json(result);
};

export const verifyEmailTokenController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response
) => {
  const { user_id, token } = req.decode_verify_email_token as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }

  if (user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }

  const result = await usersService.verifyEmail(user_id);
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  });
};

export const resendVerifyEmailTokenController = async (req: Request, res: Response) => {
  const { user_id, verify } = req.decode_authorization as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }

  if (user?.verify === UserVerifyStatus.Verified) {
    res.json({
      messgage: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }

  const result = await usersService.resendVerifyEmail(user_id);
  return res.json(result);
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User;
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId)?.toString(),
    verify: verify as UserVerifyStatus
  });
  res.json(result);
};

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  });
};

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { password } = req.body;
  const { user_id } = req.decode_forgot_password_token as TokenPayload;
  const result = await usersService.resetPassword({ password, user_id });
  res.json(result);
};

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await usersService.getMe(user_id);
  res.json({
    message: USERS_MESSAGES.GET_FROFILE_SUCCESS,
    result
  });
};

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const { body } = req;
  const user = await usersService.updateMe(user_id, body);
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }
  res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  });
};

export const getProfileController = async (req: Request<GetProfileReqParam>, res: Response) => {
  const { username } = req.params;
  const user = await usersService.getProfile(username);
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }
  res.json({
    message: USERS_MESSAGES.GET_FROFILE_SUCCESS,
    result: user
  });
};
