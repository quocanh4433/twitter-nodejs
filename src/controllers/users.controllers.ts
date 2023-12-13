import { Request, Response } from 'express';
import { IRegisterReqBody } from '~/models/requests/User.request';
import { ParamsDictionary } from 'express-serve-static-core';
import usersService from '~/services/users.services';
import { USERS_MESSAGES } from '~/constants/messages';
import { ObjectId } from 'mongodb';
import { User } from '~/models/schemas/User.schema';

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await usersService.login(user_id.toString());
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
};

export const registerController = async (req: Request<ParamsDictionary, any, IRegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.regiser(req.body);
    return res.json({ message: 'Register success', result });
  } catch (error) {
    return res.status(400).json({
      message: 'Register failed'
    });
  }
};
