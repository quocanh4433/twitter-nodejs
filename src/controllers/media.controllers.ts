import { Request, Response } from 'express';
import { MEDIAS_MESSAGE } from '~/constants/messages';
import mediaService from '~/services/medias.services';
import path from 'path';
import { UPLOAD_DIR } from '~/constants/dir';

export const uploadImageController = async (req: Request, res: Response) => {
  const urls = await mediaService.uploadImage(req);
  res.json({
    message: MEDIAS_MESSAGE.UPLOAD_SUCCESS,
    result: urls
  });
};

export const serveImageController = async (req: Request, res: Response) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send('Not found');
    }
  });
};
