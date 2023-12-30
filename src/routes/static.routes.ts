import { Router } from 'express';
import {
  serveImageController,
  serveVideoController,
  serveVideoStreamController
} from '~/controllers/media.controllers';
const staticRouter = Router();

staticRouter.get('/images/:name', serveImageController);
// staticRouter.get('/videos/:name', serveVideoController);
staticRouter.get('/videos-stream/:name', serveVideoStreamController);

export default staticRouter;
