import fs from 'fs';
import { Request } from 'express';
import formidable, { File } from 'formidable';
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir';

export const initFolder = () => {
  [UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir: string) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // Create folder nested
      });
    }
  });
};

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    keepExtensions: true,
    maxFiles: 4,
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFileSize: 300 * 1024, // 300KB
    maxTotalFileSize: 300 * 1024 * 4,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image'));
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any); // optional make form.parse error
      }
      return valid;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is not empty'));
      }
      resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = (req: Request) => {
  const form = formidable({
    maxFiles: 1,
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'));
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any);
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is not empty'));
      }
      const videos = files.video as File[];
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string);
        fs.renameSync(video.filepath, video.filepath + '.' + ext);
        video.newFilename = video.newFilename + '.' + ext;
      });
      resolve(files.video as File[]);
    });
  });
};

export const getNameFromFullName = (fullName: string) => {
  const nameArr = fullName.split('.');
  nameArr.pop();
  return nameArr.join('');
};

export const getExtension = (fullName: string) => {
  const nameArr = fullName.split('.');
  return nameArr[nameArr.length - 1];
};
