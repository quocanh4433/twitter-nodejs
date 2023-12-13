import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { USERS_MESSAGES } from '~/constants/messages';
import databaseService from '~/services/data.servieces';
import usersService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import { validate } from '~/utils/validation';

export const loginValidator = validate(
  checkSchema({
    email: {
      trim: true,
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) });
          if (!user) {
            throw new Error(USERS_MESSAGES.USER_NOT_FOUND);
          }
          req.user = user;
          return true;
        }
      }
    },
    password: {
      trim: true,
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      isStrongPassword: {
        options: {
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    }
  })
);

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: { min: 4, max: 100 },
        errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_4_TO_100
      }
    },
    email: {
      trim: true,
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value) => {
          const result = await usersService.checkEmailExist(value);
          if (result) {
            throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
          }
          return true;
        }
      }
    },
    password: {
      trim: true,
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 8,
          max: 50
        },
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
      },
      isStrongPassword: {
        options: {
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
      trim: true,
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
      },
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
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
          }
          return true;
        }
      }
    },
    date_of_birth: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_IS_REQUIRED
      },
      isISO8601: {
        options: { strict: true, strictSeparator: true },
        errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
      }
    }
  })
);
