import { Router } from 'express';
import { getConversationsController } from '~/controllers/conversation.controllers';
import { conversationValidator } from '~/middlewares/conversation.middlewares';
import { paginateValidator } from '~/middlewares/tweets.midllewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';

const conversationsRouter = Router();

conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  paginateValidator,
  conversationValidator,
  getConversationsController
);

export default conversationsRouter;
