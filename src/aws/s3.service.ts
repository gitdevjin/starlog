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
  private readonly endpointUrl: string;

  constructor() {
    const endpoint = process.env.AWS_S3_ENDPOINT_URL;
    const region = process.env.AWS_REGION || 'us-east-1';

    this.endpointUrl = endpoint ? endpoint : `https://s3.${region}.amazonaws.com`;

    this.s3client = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: endpoint || undefined,
      forcePathStyle: true, // needed for LocalStack
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined, // uses IAM role if running on EC2
    });
  }

  async uploadPlanetImages(s3Keys: string[], files: Express.Multer.File[]): Promise<string[]> {
    const uploadedKeys: string[] = [];
    const imageUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const s3Key = s3Keys[i];

      try {
        await this.s3client.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        uploadedKeys.push(s3Key);
        imageUrls.push(`${this.endpointUrl}/${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`);
        console.log(`image saved: ${s3Key}`);
      } catch (err) {
        console.log(`failed to save image: ${err}`);
        throw { error: err, uploadedKeys }; // throw the partially uploaded keys
      }
    }

    return imageUrls;
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
        console.log(`Image Deleted : [${key}: ${JSON.stringify(response)}]`);
      } catch (err) {
        console.error(`Failed to delete S3 key ${key}: ${err}`);
      }
    });

    await Promise.all(deletePromises);
  }

  async updateAvatarImage(s3Key: string, file: Express.Multer.File) {
    const imageUrl = `${this.endpointUrl}/${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`;
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3client.send(command);

      return imageUrl;
    } catch (err) {
      console.error(`Failed to update S3 Image for Avatar ${s3Key}: ${err}`);
    }
  }

  extractKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      return decodeURIComponent(parsed.pathname.slice(1));
    } catch {
      return null;
    }
  }
}
