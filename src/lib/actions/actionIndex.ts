"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export const deleteFileS3 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true, message: "ลบไฟล์สำเร็จ" };
  } catch (error) {
    return { success: false, error: error };
  }
};

export const getPresignedUrl = async (
  fileType: string,
  fileSize: number,
  fileFolder: string,
) => {
  try {
    if (fileSize > 200 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 200MB" };
    }

    const randomBytes = crypto.randomBytes(16);
    const uniqueFilename = randomBytes.toString("hex");
    const fileExtension = fileType.split("/")[1];
    const key = `${fileFolder}/${uniqueFilename}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      ACL: "public-read",
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { success: true, url, key };
  } catch (error) {
    console.error("Error creating presigned URL", error);
    return { success: false, error: "Error creating presigned URL" };
  }
};

export const sendbase64toS3Data = async (base64Data: string, path: string) => {
  try {
    const buffer = Buffer.from(base64Data, "base64");

    const randomBytes = crypto.randomBytes(16);
    const key = `${path}/${randomBytes.toString("hex")}.png`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
      ACL: "public-read",
    });

    const data = await s3Client.send(command);

    let publicUrl;
    if (data) {
      publicUrl = `https://sgp1.digitaloceanspaces.com/${process.env.S3_BUCKET}/${key}`;
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading Base64 image:", error);
    return { success: false, error: "Failed to upload image." };
  }
};

export const sendbase64toS3DataVdo = async (
  formData: FormData,
  path: string,
) => {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("ไม่พบไฟล์ที่ส่งมา");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = file.name.split(".").pop();
    const randomBytes = crypto.randomBytes(16);
    const key = `${path}/${randomBytes.toString("hex")}.${extension}`;

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
    console.error("Error uploading video via FormData:", error);
    return { success: false, error: "อัปโหลดวิดีโอไม่สำเร็จ" };
  }
};

export const uploadImageFormData = async (
  formData: FormData,
) => {
  try {
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    if (!file) return { success: false, error: "ไม่พบไฟล์" };
    if (!path) return { success: false, error: "ไม่พบ path" };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.type.split("/")[1] || "png";
    const randomBytes = crypto.randomBytes(16);
    const key = `${path}/${randomBytes.toString("hex")}.${ext}`;

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
    console.error("uploadImageFormData error:", error);
    return { success: false, error: "อัปโหลดรูปไม่สำเร็จ" };
  }
};

export const handleImageUpload = async (
  file: File,
  folder: string,
): Promise<string> => {
  const result = await getPresignedUrl(file.type, file.size, folder);
  if (!result.success || !result.url) {
    throw new Error(result.error || "ไม่สามารถขอสิทธิ์อัปโหลดได้");
  }

  const uploadResponse = await fetch(result.url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type, "x-amz-acl": "public-read" },
  });

  if (!uploadResponse.ok) {
    throw new Error("การอัปโหลดไฟล์ล้มเหลว");
  }

  return result.url.split("?")[0];
};

export const copyFileS3 = async (
  fileUrl: string,
  path: string,
): Promise<
  { success: true; url: string } | { success: false; error: string }
> => {
  try {
    const url = new URL(fileUrl);
    let key = url.pathname.substring(1);
    
    if (key.startsWith(`${process.env.S3_BUCKET}/`)) {
      key = key.replace(`${process.env.S3_BUCKET}/`, "");
    }

    const ext = key.split(".").pop() || "png";

    const randomBytes = crypto.randomBytes(16);
    const newKey = `${path}/${randomBytes.toString("hex")}.${ext}`;

    const command = new CopyObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      CopySource: `${process.env.S3_BUCKET}/${key}`,
      Key: newKey,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const publicUrl = `https://sgp1.digitaloceanspaces.com/${process.env.S3_BUCKET}/${newKey}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("❌ copyFileS3 error:", error);
    return {
      success: false,
      error: "copy file ไม่สำเร็จ",
    };
  }
};
