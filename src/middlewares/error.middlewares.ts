import { Request, Response, NextFunction } from 'express';
import HTTP_STATUS from '~/constants/httpStatus';

export const defaultErrorHanlder = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: err.message });
};
