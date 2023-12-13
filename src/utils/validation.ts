import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema';
import HTTP_STATUS from '~/constants/httpStatus';
import { EntityError, ErrorWithStatus } from '~/models/Error';

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req);

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorObject = errors.mapped();
    const enityError = new EntityError({ errors: {} });

    for (const key in errorObject) {
      const { msg } = errorObject[key];
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }
      enityError.errors[key] = errorObject[key];
    }

    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({ errors: errors.mapped() });
  };
};
