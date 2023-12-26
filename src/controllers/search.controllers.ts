import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { SearchQuery } from '~/models/requests/Search.request';
import { TokenPayload } from '~/models/requests/User.request';
import searchService from '~/services/search.services';

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const { content, media_type, people_follow } = req.query;
  const { user_id } = req.decode_authorization as TokenPayload;
  const { tweets, totalPage } = await searchService.search({
    limit,
    page,
    content,
    user_id,
    media_type,
    people_follow
  });
  res.json({
    message: 'Search successfully',
    result: {
      tweets,
      page,
      limit,
      totalPage
    }
  });
};
