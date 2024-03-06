import { Router } from 'express';
import { likeTweetController, unLikeTweetController } from '~/controllers/like.controllers';
import { tweetIdValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const likeRouter = Router();
/**
 * Description. Like tweet
 * Path: /
 * Method: POST
 * Headers: {Authorization: access_token}
 * Body: { tweet_id: string, user_id: string}
 */
likeRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
);

/**
 * Description. Unlike tweet
 * Path: /tweet/:tweet_id
 * Method: DELETE
 * Headers: {Authorization: access_token}
 * Body: { tweet_id: string, user_id: string}
 */
likeRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unLikeTweetController)
);

export default likeRouter;
