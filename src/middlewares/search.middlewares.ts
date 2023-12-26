import { checkSchema } from 'express-validator';
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums';
import { SEARCH_MESSAGES } from '~/constants/messages';
import { validate } from '~/utils/validation';

export const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: SEARCH_MESSAGES.CONTENT_MUST_BE_STRING
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)],
          errorMessage: SEARCH_MESSAGES.MEDIA_TYPE_MUST_BE_ONE_OF + ' ' + Object.values(MediaTypeQuery).join(', ')
        }
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: SEARCH_MESSAGES.MEDIA_TYPE_MUST_BE_ONE_OF + ' ' + Object.values(PeopleFollow).join(', ')
        }
      }
    },
    ['query']
  )
);
