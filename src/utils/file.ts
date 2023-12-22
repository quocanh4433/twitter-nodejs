import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import formidable, { File } from 'formidable';
import { UPLOAD_TEMP_DIR } from '~/constants/dir';

export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_TEMP_DIR, {
      recursive: true // Create folder nested
    });
  }
};

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    keepExtensions: true,
    maxFiles: 4,
    uploadDir: UPLOAD_TEMP_DIR,
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

export const getNameFromFullName = (fullName: string) => {
  const nameArr = fullName.split('.');
  nameArr.pop();
  return nameArr.join('');
};
