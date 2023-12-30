import { Router } from 'express';
import { uploadImageController, uploadVideoController } from '~/controllers/media.controllers';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const mediaRouter = Router();

/**
 * Description. Upload images
 * Path: /upload-image
 * Method: POST
 * Body: FormData { image: file}
 */
mediaRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
);

/**
 * Description. Upload images
 * Path: /upload-video
 * Method: POST
 * Body: FormData { video: file}
 */
mediaRouter.post(
  '/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
);

export default mediaRouter;
