import { Router } from 'express';
import {
  createTweetController,
  getTweetController,
  getTweetChildrenController,
  getNewFeedController
} from '~/controllers/tweet.controllers';
import {
  audienceValidtor,
  createTweetValidator,
  getTweetChildrenValidator,
  paginateValidator,
  tweetIdValidator
} from '~/middlewares/tweets.midllewares';
import { accessTokenValidator, verifiedUserValidator, isUserLoggedInValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const tweetRouter = Router();

/**
 * Description. Create tweet
 * Path: /
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: TweetReqBody
 */
tweetRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
);

/**
 * Description. Get tweet
 * Path: /:tweet_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  wrapRequestHandler(audienceValidtor),
  wrapRequestHandler(getTweetController)
);

/**
 * Description. Get tweet children
 * Path: /:tweet_id/children
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Body: {limit: number, page: number, tweet_type: TweetType}
 */
tweetRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  getTweetChildrenValidator,
  paginateValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  wrapRequestHandler(audienceValidtor),
  wrapRequestHandler(getTweetChildrenController)
);

/**
 * Description. Get new feeds
 * Path: /
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Parameters: {limit: number, page: number}x
 */
tweetRouter.get(
  '/',
  paginateValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedController)
);

export default tweetRouter;
