import { Request, Response } from 'express';
import { config } from 'dotenv';
import { ParamsDictionary } from 'express-serve-static-core';
import { TweetReqBody } from '~/models/requests/Tweet.request';
import tweetService from '~/services/tweets.services';
import { TokenPayload } from '~/models/requests/User.request';
import { TWEET_MESSAGES } from '~/constants/messages';

config();

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await tweetService.createTweet(req.body, user_id);
  res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESFULLY,
    result
  });
};
