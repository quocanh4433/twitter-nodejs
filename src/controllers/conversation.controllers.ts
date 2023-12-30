import { Request, Response } from 'express';
import { CONVERSATION_MESSAGES } from '~/constants/messages';
import { TokenPayload } from '~/models/requests/User.request';
import conversationService from '~/services/conversations.services';

export const getConversationsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload;
  const { receiver_id, limit, page } = req.params;
  const result = await conversationService.getConversations({
    receiver_id,
    sender_id: user_id,
    limit: Number(limit),
    page: Number(page)
  });
  res.json({
    message: CONVERSATION_MESSAGES.GET_CONVERSATION_SUCCESS,
    result
  });
};
