import { Request, Response, NextFunction } from 'express';
import { BookmarkReqBody } from '~/models/requests/Bookmark.request';
import { TokenPayload } from '~/models/requests/User.request';
import bookmarkService from '~/services/bookmark.services';
import { ParamsDictionary } from 'express-serve-static-core';
import { BOOKMARK_MESSAGES } from '~/constants/messages';

export const bookmarkTweetController = async (req: Request<ParamsDictionary, any, BookmarkReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await bookmarkService.bookmark(user_id, req.body.tweet_id);
  res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    result
  });
};

export const unbookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const result = await bookmarkService.unbookmark(user_id, req.params.tweet_id);
  res.json(result);
};
