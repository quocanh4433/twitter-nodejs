import { Request } from 'express';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIR } from '~/constants/dir';
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file';
import path from 'path';
import fs from 'fs';
import fsPromise from 'fs/promises';
import { isProduction } from '~/constants/config';
import { MediaType } from '~/constants/enums';
import { Media } from '~/models/Others';
import { uploadFileToS3 } from '~/utils/s3';
import mime from 'mime';
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';

class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename);
        const newFullFileName = `${newName}.jpg`;
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFileName);

        await sharp(file.filepath).jpeg().toFile(newPath);

        const s3Result = await uploadFileToS3({
          fileName: 'images/' + newFullFileName,
          filePath: newPath,
          contentType: mime.getType(newFullFileName) as string
        });

        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)]);

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        };
      })
    );
    return result;
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        console.log(file);
        const s3Result = await uploadFileToS3({
          fileName: 'videos/' + file.newFilename,
          filePath: file.filepath,
          contentType: mime.getType(file.filepath) as string
        });

        fsPromise.unlink(file.filepath);

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        };
      })
    );
    return result;
  }
}

const mediaService = new MediaService();
export default mediaService;
