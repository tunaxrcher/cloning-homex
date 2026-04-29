import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

class VideoConversionService {
  private tempDir: string

  constructor() {
    // ใช้ OS temp directory แทน
    this.tempDir = process.env.TEMP_DIR || os.tmpdir()
    this.ensureTempDirExists()
  }

  private async ensureTempDirExists(): Promise<void> {
    try {
      await fs.access(this.tempDir)
    } catch {
      // ถ้า directory ไม่มี ให้สร้างขึ้นมา
      await fs.mkdir(this.tempDir, { recursive: true })
    }
  }

  async convertMovToMp4(movFile: File): Promise<File> {
    // ตรวจสอบ temp directory ก่อนใช้งาน
    await this.ensureTempDirExists()

    const tempId = uuidv4()
    const inputPath = path.join(this.tempDir, `${tempId}.mov`)
    const outputPath = path.join(this.tempDir, `${tempId}.mp4`)

    try {
      // 1. บันทึกไฟล์ MOV ลง temp directory
      const buffer = await movFile.arrayBuffer()
      await fs.writeFile(inputPath, Buffer.from(buffer))

      // ตรวจสอบว่าไฟล์ถูกเขียนสำเร็จ
      await fs.access(inputPath)
      console.log(`Input file saved to: ${inputPath}`)

      // 2. แปลงไฟล์จาก MOV เป็น MP4
      await this.convertVideo(inputPath, outputPath)

      // 3. ตรวจสอบว่าไฟล์ output ถูกสร้างขึ้น
      await fs.access(outputPath)

      // 4. อ่านไฟล์ MP4 ที่แปลงแล้ว
      const mp4Buffer = await fs.readFile(outputPath)

      // 5. สร้าง File object ใหม่
      const mp4FileName = movFile.name.replace(/\.mov$/i, '.mp4')
      const mp4File = new File([mp4Buffer], mp4FileName, {
        type: 'video/mp4',
      })

      // 6. ลบไฟล์ temp
      await this.cleanupTempFiles([inputPath, outputPath])

      return mp4File
    } catch (error: any) {
      // ลบไฟล์ temp ในกรณีที่เกิด error
      await this.cleanupTempFiles([inputPath, outputPath])
      throw new Error(`Failed to convert MOV to MP4: ${error.message}`)
    }
  }

  private convertVideo(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // ตรวจสอบว่า input file มีอยู่จริง
      fs.access(inputPath)
        .then(() => {
          ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
              '-preset medium',
              '-crf 23',
              '-movflags +faststart',
            ])
            .on('start', (commandLine) => {
              console.log('Spawned FFmpeg with command: ' + commandLine)
            })
            .on('end', () => {
              console.log('Video conversion completed')
              resolve()
            })
            .on('error', (err) => {
              console.error('FFmpeg error:', err)
              reject(new Error(`FFmpeg conversion failed: ${err.message}`))
            })
            .on('progress', (progress) => {
              console.log(
                `Processing: ${Math.round(progress.percent || 0)}% done`
              )
            })
            .run()
        })
        .catch((err) => {
          reject(new Error(`Input file not found: ${inputPath}`))
        })
    })
  }

  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        // ตรวจสอบว่าไฟล์มีอยู่จริงก่อนลบ
        await fs.access(filePath)
        await fs.unlink(filePath)
        console.log(`Temp file deleted: ${filePath}`)
      } catch (error: any) {
        // ไม่ต้อง log error ถ้าไฟล์ไม่มีอยู่แล้ว
        if (error.code !== 'ENOENT') {
          console.warn(`Failed to delete temp file ${filePath}:`, error)
        }
      }
    }
  }

  // ฟังก์ชันเสริมสำหรับตรวจสอบว่าเป็นไฟล์วิดีโอหรือไม่
  isVideoFile(filename: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']
    const ext = path.extname(filename).toLowerCase()
    return videoExtensions.includes(ext)
  }

  // ฟังก์ชันเสริมสำหรับดึงข้อมูลวิดีโอ
  async getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve(metadata)
        }
      })
    })
  }
}

export const videoConversionService = new VideoConversionService()
