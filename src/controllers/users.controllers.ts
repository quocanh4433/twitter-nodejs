import { Request, Response } from 'express';
import { User } from '~/models/schemas/User.schema';
import databaseService from '~/services/data.servieces';
import usersService from '~/services/users.services';

export const loginController = (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Login success' });
};

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await usersService.regiser({ email, password });
    return res.json({ message: 'Register success', result });
  } catch (error) {
    return res.status(400).json({
      message: 'Register failed'
    });
  }
};
