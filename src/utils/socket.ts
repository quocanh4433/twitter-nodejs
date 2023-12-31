import { Server } from 'socket.io';
import { verifyAccessToken } from './common';
import { TokenPayload } from '~/models/requests/User.request';
import { UserVerifyStatus } from '~/constants/enums';
import { ErrorWithStatus } from '~/models/Error';
import { USERS_MESSAGES } from '~/constants/messages';
import HTTP_STATUS from '~/constants/httpStatus';
import Conversation from '~/models/schemas/Conversation.schema';
import { ObjectId } from 'mongodb';
import databaseService from '~/services/data.servieces';
import { Server as ServerHttp } from 'http';

const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000'
    }
  });

  const users: {
    [key: string]: {
      socket_id: string;
    };
  } = {};

  // Socket.io middleware
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth;
    const accessToken = Authorization?.split(' ')[1];
    try {
      const decode_authorization = await verifyAccessToken(accessToken);
      const { verify } = decode_authorization as TokenPayload;
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      socket.handshake.auth.decode_authorization = decode_authorization;
      socket.handshake.auth.access_token = accessToken;
      next();
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      });
    }
  });

  io.on('connection', (socket) => {
    console.log(`user ${socket.id} connected`);
    const { user_id } = socket.handshake.auth.decode_authorization;
    users[user_id] = {
      socket_id: socket.id
    };

    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth;
      try {
        await verifyAccessToken(access_token);
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    socket.on('send_message', async (data) => {
      const reciever_socket_id = users[data.to]?.socket_id;
      const converstaion = new Conversation({
        sender_id: new ObjectId(data.from),
        receiver_id: new ObjectId(data.to),
        content: data.message
      });

      const result = await databaseService.conversations.insertOne(converstaion);
      converstaion._id = result.insertedId;

      if (!reciever_socket_id) return;
      socket.to(reciever_socket_id).emit('receive_message', converstaion);
    });

    socket.on('disconnect', () => {
      delete users[user_id];
      console.log(`${socket.id} disconnected`);
    });
  });
};

export default initSocket;
