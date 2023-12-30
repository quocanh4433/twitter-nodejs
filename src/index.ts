import express from 'express';
import usersRouter from './routes/users.routes';
import databaseService from './services/data.servieces';
import { defaultErrorHandler } from './middlewares/error.middlewares';
import mediaRouter from './routes/media.routes';
import { initFolder } from './utils/file';
import { config } from 'dotenv';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir';
import staticRouter from './routes/static.routes';
import tweetRouter from './routes/tweet.routes';
import bookmarkRouter from './routes/bookmark.routes';
import searchRouter from './routes/search.routes';
import './utils/s3';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Conversation from './models/schemas/Conversation.schema';
import conversationsRouter from './routes/conversation.routes';
import { ObjectId } from 'mongodb';

config();

databaseService.connect();

const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer(app);
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

initFolder();

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000'
  })
);
app.use('/users', usersRouter);
app.use('/medias', mediaRouter);
app.use('/tweets', tweetRouter);
app.use('/search', searchRouter);
app.use('/bookmarks', bookmarkRouter);
app.use('/conversations', conversationsRouter);
app.use('/static', staticRouter);
// app.use('/static', express.static(UPLOAD_IMAGE_DIR));
// app.use('/static/videos', express.static(UPLOAD_VIDEO_DIR));
app.use(defaultErrorHandler);

io.on('connection', (socket) => {
  console.log(`user ${socket.id} connected`);
  const user_id = socket.handshake.auth._id;
  users[user_id] = {
    socket_id: socket.id
  };

  socket.on('reciever private message', async (data) => {
    const reciever_socket_id = users[data.to]?.socket_id;

    if (!reciever_socket_id) return;

    await databaseService.conversations.insertOne(
      new Conversation({
        sender_id: new ObjectId(data.from),
        receiver_id: new ObjectId(data.to),
        content: data.message
      })
    );

    socket.to(reciever_socket_id).emit('private message', {
      message: data.message,
      from: user_id
    });
  });

  socket.on('disconnect', () => {
    delete users[user_id];
    console.log(`${socket.id} disconnected`);
  });
});

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
