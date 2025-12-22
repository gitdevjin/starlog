import {
  DeleteObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  readonly s3client: S3Client;
  private readonly endpointUrl =
    process.env.S3_ENDPOINT || `https://s3.${process.env.AWS_REGION}.amazonaws.com`;

  constructor() {
    this.s3client = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.S3_ENDPOINT, // e.g., LocalStack
      forcePathStyle: true, // needed for LocalStack
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined, // uses IAM role if running on EC2
    });
  }

  async uploadPostImages(s3Keys: string[], files: Express.Multer.File[]) {
    return Promise.all(
      files.map(async (file, index) => {
        const s3Key = s3Keys[index];
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read' as ObjectCannedACL,
        };

        const command = new PutObjectCommand(params);
        await this.s3client.send(command);

        return `${this.endpointUrl}/${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`;
      })
    );
  }

  async deleteImagesByKey(s3Keys: string[]) {
    if (!s3Keys || s3Keys.length === 0) return;

    const deletePromises = s3Keys.map(async (key) => {
      try {
        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
        });

        const response = await this.s3client.send(command);
        console.log(`S3 Delete Response for ${key}: ${JSON.stringify(response)}`);
      } catch (err) {
        console.error(`Failed to delete S3 key ${key}: ${err}`);
      }
    });

    await Promise.all(deletePromises);
  }
}
