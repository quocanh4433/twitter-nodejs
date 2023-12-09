import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import usersService from '~/services/users.services';
import { validate } from '~/utils/validation';

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Login failed' });
  }
  next();
};

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: { min: 4, max: 100 }
      }
    },
    email: {
      trim: true,
      isEmail: true,
      notEmpty: true,
      custom: {
        options: async (value) => {
          const result = await usersService.checkEmailExist(value);
          if (result) {
            throw Error('Email already exist');
          }
          return true;
        }
      }
    },
    password: {
      trim: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage:
          'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol'
      }
    },
    confirm_password: {
      trim: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage:
          'Password must be at least 6 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol'
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
          }
          return true;
        }
      }
    },
    date_of_birth: {
      notEmpty: true,
      isISO8601: {
        options: { strict: true, strictSeparator: true }
      }
    }
  })
);
