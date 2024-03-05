import { Router } from 'express';
import { bookmarkTweetController, unbookmarkTweetController } from '~/controllers/bookmark.controllers';
import { tweetIdValidator } from '~/middlewares/tweets.midllewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const bookmarkRouter = Router();

/**
 * Description. Bookmark tweet
 * Path: /
 * Method: POST
 * Headers: {Authorization: access_token}
 * Body: { tweet_id: string, user_id: string}
 */
bookmarkRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkTweetController)
);

/**
 * Description. Unbookmark tweet
 * Path: /tweet/:tweet_id
 * Method: DELETE
 * Headers: {Authorization: access_token}
 * Body: { tweet_id: string, user_id: string}
 */
bookmarkRouter.delete(
  'tweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unbookmarkTweetController)
);

export default bookmarkRouter;
