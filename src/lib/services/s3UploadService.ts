import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Client = new S3Client({
  endpoint: process.env.ENDPOINT!,
  region: process.env.REGION!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

class S3UploadService {
  private static instance: S3UploadService;

  public static getInstance(): S3UploadService {
    if (!S3UploadService.instance) {
      S3UploadService.instance = new S3UploadService();
    }
    return S3UploadService.instance;
  }

  async uploadFile(
    file: File,
    folder: string = "thumbnails",
  ): Promise<{ success: boolean; url: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext = file.type.split("/")[1] || "jpg";
      const randomBytes = crypto.randomBytes(16);
      const key = `${folder}/${randomBytes.toString("hex")}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      });

      await s3Client.send(command);

      const publicUrl = `https://sgp1.digitaloceanspaces.com/${process.env.S3_BUCKET}/${key}`;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error("S3UploadService.uploadFile error:", error);
      return { success: false, url: "" };
    }
  }
}

export const s3UploadService = S3UploadService.getInstance();
