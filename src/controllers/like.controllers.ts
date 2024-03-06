import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { TokenPayload } from '~/models/requests/User.request';
import { LikeTweetReqBody } from '~/models/requests/Like.request';
import likeService from '~/services/like.services';

export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeTweetReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await likeService.likeTweet(user_id, req.body.tweet_id);
  res.json(result);
};

export const unLikeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await likeService.unlikeTweet(user_id, req.params.tweet_id);
  res.json(result);
};
