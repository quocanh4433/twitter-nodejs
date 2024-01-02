import express from 'express';
import usersRouter from './routes/users.routes';
import databaseService from './services/data.servieces';
import { defaultErrorHandler } from './middlewares/error.middlewares';
import mediaRouter from './routes/media.routes';
import { initFolder } from './utils/file';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir';
import staticRouter from './routes/static.routes';
import tweetRouter from './routes/tweet.routes';
import bookmarkRouter from './routes/bookmark.routes';
import searchRouter from './routes/search.routes';
import './utils/s3';
import { createServer } from 'http';
import cors from 'cors';
import conversationsRouter from './routes/conversation.routes';
import initSocket from './utils/socket';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yaml';
import { envConfig } from './constants/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

databaseService.connect();

const app = express();
const port = envConfig.port;
const httpServer = createServer(app);
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Twitter (NodeJs & ExpressJs)',
      version: '1.0.0'
    }
  },
  apis: ['./swagger/*.yaml'] // files containing annotations as above
};
const openapiSpecification = swaggerJsdoc(options);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
});

initFolder();

app.use(limiter);
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
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
app.use(helmet());
app.use(
  cors({
    origin: 'http://localhost:3000'
  })
);

initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
