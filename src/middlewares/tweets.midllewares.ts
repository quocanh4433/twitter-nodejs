import { checkSchema } from 'express-validator';
import { TWEET_MESSAGES } from '~/constants/messages';
import { validate } from '~/utils/validation';
import { ObjectId } from 'mongodb';
import { MediaType, TweetAudience, TweetType } from '~/constants/enums';
import { isEmpty } from 'lodash';
import { enumToArrayValue } from '~/utils/common';

const tweetTypes = enumToArrayValue(TweetType);
const tweetAudiences = enumToArrayValue(TweetAudience);
const mediaTypes = enumToArrayValue(MediaType);
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEET_MESSAGES.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetAudiences],
        errorMessage: TWEET_MESSAGES.INVALID_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType;
          // Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID);
          }
          // nếu `type` là tweet thì `parent_id` phải là `null`
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL);
          }
          return true;
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType;
          const hashtags = req.body.hashtags as string[];
          const mentions = req.body.mentions as string[];
          // Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
          if (
            [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
          }
          // Nếu `type` là retweet thì `content` phải là `''`.
          if (type === TweetType.Retweet && value !== '') {
            throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING);
          }
          return true;
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là string
          if (value.some((item: any) => typeof item !== 'string')) {
            throw new Error(TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING);
          }
          return true;
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là user_id
          if (value.some((item: any) => !ObjectId.isValid(item))) {
            throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID);
          }
          return true;
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là Media Object
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaTypes.includes(item.type);
            })
          ) {
            throw new Error(TWEET_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT);
          }
          return true;
        }
      }
    }
  })
);

// export const createTweetValidator = validate(
//   checkSchema(
//     {
//       type: {
//         isIn: {
//           options: [tweetTypes],
//           // errorMessage: TWEET_MESSAGES.INVALID_TYPE
//         }
//       },
//       audience: {
//         isIn: {
//           options: [tweetAudience],
//           errorMessage: TWEET_MESSAGES.INVALID_AUDIENCE
//         }
//       }
//       // parent_id: {
//       //   custom: {
//       //     options: (value, { req }) => {
//       //       const type = req.body.type as TweetType;
//       //       if (
//       //         [TweetType.Retweet, TweetType.QuoteTweet, TweetType.Comment].includes(type) &&
//       //         !ObjectId.isValid(value)
//       //       ) {
//       //         throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID);
//       //       }

//       //       if (TweetType.Tweet && value !== null) {
//       //         throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL);
//       //       }
//       //       return true;
//       //     }
//       //   }
//       // },
//       // content: {
//       //   isString: true,
//       //   custom: {
//       //     options: (value, { req }) => {
//       //       const type = req.body.type as TweetType;
//       //       const hastags = req.body.hastags as string[];
//       //       const mentions = req.body.hastags as string[];
//       //       if (
//       //         [TweetType.Tweet, TweetType.QuoteTweet, TweetType.Comment].includes(type) &&
//       //         isEmpty(hastags) &&
//       //         isEmpty(mentions) &&
//       //         value == ''
//       //       ) {
//       //         throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
//       //       }

//       //       if (TweetType.Retweet && value !== '') {
//       //         throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING);
//       //       }
//       //       return true;
//       //     }
//       //   }
//       // },
//       // hashtags: {
//       //   isArray: true,
//       //   custom: {
//       //     options: (value) => {
//       //       if (!value.every((item: any) => typeof item === 'string')) {
//       //         throw new Error(TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING);
//       //       }
//       //       return true;
//       //     }
//       //   }
//       // },
//       // mentions: {
//       //   isArray: true,
//       //   custom: {
//       //     options: (value) => {
//       //       if (!value.every((item: any) => ObjectId.isValid(item))) {
//       //         throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID);
//       //       }
//       //       return true;
//       //     }
//       //   }
//       // },
//       // medias: {
//       //   isArray: true,
//       //   custom: {
//       //     options: (value) => {
//       //       if (
//       //         !value.every((item: any) => {
//       //           return typeof item.url === 'string' && mediaType.includes(item.type);
//       //         })
//       //       ) {
//       //         throw new Error(TWEET_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT);
//       //       }
//       //       return true;
//       //     }
//       //   }
//       // }
//     },
//     ['body']
//   )
// );
