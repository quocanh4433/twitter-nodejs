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
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESSFULLY,
    result
  });
};

export const getTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await tweetService.increaseView(req.params.tweet_id, user_id);
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    views: result.guest_views + result.user_views
  };
  res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFULLY,
    result: tweet
  });
};
