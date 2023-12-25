import { Request, Response } from 'express';
import { config } from 'dotenv';
import { ParamsDictionary } from 'express-serve-static-core';
import { TweetParam, TweetQuery, TweetReqBody } from '~/models/requests/Tweet.request';
import tweetService from '~/services/tweets.services';
import { TokenPayload } from '~/models/requests/User.request';
import { TWEET_MESSAGES } from '~/constants/messages';
import { TweetType } from '~/constants/enums';
import { Pagination } from '~/models/requests/Pagination.requests';

config();

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await tweetService.createTweet(req.body, user_id);
  res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESSFULLY,
    result
  });
};

export const getTweetController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await tweetService.increaseView(req.params.tweet_id, user_id);
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    views: result.guest_views + result.user_views,
    updated_at: result.updated_at
  };
  res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESSFULLY,
    result: tweet
  });
};

export const getTweetChildrenController = async (req: Request, res: Response) => {
  const tweet_id = req.params.tweet_id;
  const tweet_type = Number(req.query.tweet_type as string) as TweetType;
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const { user_id } = req.decode_authorization as TokenPayload;
  const { tweets, totalPage } = await tweetService.getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  });
  res.json({
    message: TWEET_MESSAGES.GET_TWEET_CHILDREN_SUCCESSFULLY,
    result: {
      tweets,
      limit,
      page,
      tweet_type,
      totalPage
    }
  });
};

export const getNewFeedController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const { user_id } = req.decode_authorization as TokenPayload;
  const { tweets, totalPage } = await tweetService.getNewFeed({ user_id, page, limit });
  res.json({
    message: TWEET_MESSAGES.GET_NEW_FEEDS_SUCCESSFULLY,
    result: {
      tweets,
      limit,
      page,
      totalPage
    }
  });
};
