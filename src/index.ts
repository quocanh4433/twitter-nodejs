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
config();

databaseService.connect();
const app = express();
const port = process.env.PORT || 4000;

initFolder();

app.use(express.json());
app.use('/users', usersRouter);
app.use('/medias', mediaRouter);
app.use('/tweets', tweetRouter);
app.use('/search', searchRouter);
app.use('/bookmarks', bookmarkRouter);
app.use('/static', staticRouter);
// app.use('/static', express.static(UPLOAD_IMAGE_DIR));
// app.use('/static/videos', express.static(UPLOAD_VIDEO_DIR));
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
