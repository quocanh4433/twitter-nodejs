import { Request, Response } from 'express';
import { IRegisterReqBody } from '~/models/requests/User.request';
import { ParamsDictionary } from 'express-serve-static-core';
import usersService from '~/services/users.services';

export const loginController = (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Login success' });
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
