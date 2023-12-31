import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import { envConfig } from '~/constants/config';

const s3 = new S3({ region: envConfig.awsRegion });

export const uploadFileToS3 = ({
  fileName,
  filePath,
  contentType
}: {
  fileName: string;
  filePath: string;
  contentType: string;
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: 'twitter-nodejs-ap-southeast-1',
      Key: fileName,
      Body: fs.readFileSync(filePath),
      ContentType: contentType
    },
    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  });

  parallelUploads3.on('httpUploadProgress', (progress) => {
    console.log(progress);
  });
  return parallelUploads3.done();
};
