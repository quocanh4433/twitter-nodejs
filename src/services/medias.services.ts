import { Request } from 'express';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIR } from '~/constants/dir';
import { getExtension, getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file';
import path from 'path';
import fs from 'fs';
import fsPromise from 'fs/promises';
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
  // /Users/quocanh/Desktop/Twitter/twitter-server/uploads/videos/temp/ed7bb637aa29b0904f4796500 videos/ed7bb637aa29b0904f4796500.mp4 null
  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const ext = getExtension(file.originalFilename as string);

        const s3Result = await uploadFileToS3({
          fileName: 'videos/' + file.newFilename,
          filePath: file.filepath + '.' + ext,
          contentType: mime.getType(file.newFilename) as string
        });

        await fsPromise.unlink(file.filepath + '.' + ext);

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Video
        };
      })
    );
    return result;
  }
}

const mediaService = new MediaService();
export default mediaService;
