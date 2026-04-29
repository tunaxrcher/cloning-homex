// src/lib/services/videoThumbnailService.ts
import { spawn } from 'child_process'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import { s3UploadService } from './s3UploadService'

export class VideoThumbnailService {
  private static instance: VideoThumbnailService

  constructor() {}

  public static getInstance(): VideoThumbnailService {
    if (!VideoThumbnailService.instance) {
      VideoThumbnailService.instance = new VideoThumbnailService()
    }
    return VideoThumbnailService.instance
  }

  /**
   * สร้าง thumbnail จากวิดีโอด้วย ffmpeg (server-side)
   *
   * @param videoPath Path ของไฟล์วิดีโอ
   * @param timeInSeconds เวลาในวิดีโอที่ต้องการใช้สร้าง thumbnail (default: 1 วินาที)
   * @returns Promise<string> path ของไฟล์ thumbnail
   */
  async generateThumbnailFromVideo(
    videoPath: string,
    timeInSeconds: number = 1
  ): Promise<string> {
    try {
      // สร้างชื่อไฟล์ที่ไม่ซ้ำกันสำหรับ thumbnail
      const thumbnailFilename = `thumbnail-${uuidv4()}.jpg`

      // ใช้ OS temp directory (เขียนได้ทั้ง local และ server)
      const uploadDir = path.join(os.tmpdir(), 'thumbnails')
      await mkdir(uploadDir, { recursive: true })

      const thumbnailPath = path.join(uploadDir, thumbnailFilename)

      // แปลงเวลาเป็นรูปแบบ HH:MM:SS
      const formattedTime = this.formatTimeForFFmpeg(timeInSeconds)

      return new Promise((resolve, reject) => {
        // ใช้ ffmpeg เพื่อสร้าง thumbnail จากวิดีโอ
        const ffmpeg = spawn('ffmpeg', [
          '-i',
          videoPath,
          '-ss',
          formattedTime, // ใช้เฟรมที่เวลาที่กำหนด
          '-vframes',
          '1',
          '-vf',
          'scale=640:-1', // ปรับขนาดให้กว้าง 640px รักษาสัดส่วน
          thumbnailPath,
        ])

        ffmpeg.stderr.on('data', (data) => {
          console.log(`ffmpeg stderr: ${data}`)
        })

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            // สำเร็จ - ส่งคืน absolute path ของ thumbnail
            resolve(thumbnailPath)
          } else {
            reject(new Error(`ffmpeg process exited with code ${code}`))
          }
        })
      })
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      throw new Error('Failed to generate thumbnail from video')
    }
  }

  /**
   * สร้าง thumbnail จาก URL ของวิดีโอและอัปโหลดไป S3
   *
   * @param videoUrl URL ของวิดีโอที่อัปโหลดแล้ว
   * @param timeInSeconds เวลาในวิดีโอที่ต้องการใช้สร้าง thumbnail (default: 1 วินาที)
   * @returns Promise<string> URL ของ thumbnail บน S3
   */
  async generateAndUploadThumbnailFromUrl(
    videoUrl: string,
    timeInSeconds: number = 1
  ): Promise<string> {
    try {
      // ดาวน์โหลดวิดีโอไปยัง OS temp directory
      const tempVideoPath = path.join(os.tmpdir(), `video-${uuidv4()}.mp4`)

      // ดาวน์โหลดวิดีโอ
      const videoResponse = await fetch(videoUrl)
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
      await writeFile(tempVideoPath, videoBuffer)

      // สร้าง thumbnail (returns absolute path in os.tmpdir())
      const thumbnailAbsPath = await this.generateThumbnailFromVideo(
        tempVideoPath,
        timeInSeconds
      )

      // อ่านไฟล์ thumbnail
      const thumbnailBuffer = await readFile(thumbnailAbsPath)

      // สร้าง File object จาก Buffer
      const thumbnailFile = new File(
        [thumbnailBuffer],
        `thumbnail-${uuidv4()}.jpg`,
        { type: 'image/jpeg' }
      )

      const uploadResult = await s3UploadService.uploadFile(thumbnailFile)

      // ลบไฟล์ชั่วคราว
      try {
        await unlink(tempVideoPath)
        await unlink(thumbnailAbsPath)
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError)
      }

      if (!uploadResult.success) {
        throw new Error('Failed to upload thumbnail to S3')
      }

      return uploadResult.url
    } catch (error) {
      console.error('Error generating and uploading thumbnail:', error)
      throw new Error('Failed to generate and upload thumbnail')
    }
  }

  /**
   * แปลงเวลาในรูปแบบวินาทีเป็นรูปแบบ HH:MM:SS สำหรับ ffmpeg
   *
   * @param seconds เวลาในหน่วยวินาที
   * @returns string เวลาในรูปแบบ HH:MM:SS
   */
  private formatTimeForFFmpeg(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      remainingSeconds.toString().padStart(2, '0'),
    ].join(':')
  }

  /**
   * สร้าง thumbnail จากไฟล์วิดีโอและอัปโหลดไป S3
   *
   * @param videoFile ไฟล์วิดีโอ
   * @param timeInSeconds เวลาในวิดีโอที่ต้องการใช้สร้าง thumbnail (default: 1 วินาที)
   * @returns Promise<string> URL ของ thumbnail บน S3
   */
  async generateAndUploadThumbnail(
    videoFile: File,
    timeInSeconds: number = 1
  ): Promise<string> {
    try {
      // บันทึกไฟล์วิดีโอไปยัง OS temp directory
      const tempVideoPath = path.join(os.tmpdir(), `video-${uuidv4()}.mp4`)

      const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
      await writeFile(tempVideoPath, videoBuffer)

      // สร้าง thumbnail (returns absolute path in os.tmpdir())
      const thumbnailAbsPath = await this.generateThumbnailFromVideo(
        tempVideoPath,
        timeInSeconds
      )

      // อ่านไฟล์ thumbnail
      const thumbnailBuffer = await readFile(thumbnailAbsPath)

      // สร้าง File object จาก Buffer
      const thumbnailFile = new File(
        [thumbnailBuffer],
        `thumbnail-${uuidv4()}.jpg`,
        { type: 'image/jpeg' }
      )

      const uploadResult = await s3UploadService.uploadFile(thumbnailFile)

      // ลบไฟล์ชั่วคราว
      try {
        await unlink(tempVideoPath)
        await unlink(thumbnailAbsPath)
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError)
      }

      if (!uploadResult.success) {
        throw new Error('Failed to upload thumbnail to S3')
      }

      return uploadResult.url
    } catch (error) {
      console.error('Error generating and uploading thumbnail:', error)
      throw new Error('Failed to generate and upload thumbnail')
    }
  }
}

export const videoThumbnailService = VideoThumbnailService.getInstance()
