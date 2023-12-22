import { Request } from 'express';
import sharp from 'sharp';
import { UPLOAD_DIR } from '~/constants/dir';
import { getNameFromFullName, handleUploadImage } from '~/utils/file';
import path from 'path';
import fs from 'fs';
import { isProduction } from '~/constants/config';
import { MediaType } from '~/constants/enums';
import { Media } from '~/models/Others';

class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename);
        const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`);
        await sharp(file.filepath).jpeg().toFile(newPath);
        fs.unlinkSync(file.filepath);
        return {
          url: isProduction
            ? `${process.env.HOST}/static/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/${newName}.jpg`,
          type: MediaType.Image
        };
      })
    );
    return result;
  }
}

const mediaService = new MediaService();
export default mediaService;
