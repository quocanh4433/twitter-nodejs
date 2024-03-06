import { Router } from 'express';
import { searchController } from '~/controllers/search.controllers';
import { searchValidator } from '~/middlewares/search.middlewares';
import { paginateValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const searchRouter = Router();

/**
 * Description. Search content
 * Path: /
 * Method: Get
 * Query: {content: string}
 */
searchRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  searchValidator,
  paginateValidator,
  wrapRequestHandler(searchController)
);

export default searchRouter;
