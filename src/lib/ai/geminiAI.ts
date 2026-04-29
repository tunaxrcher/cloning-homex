"use server";

import { GoogleGenAI } from "@google/genai";
import {
  sendbase64toS3Data,
  sendbase64toS3DataVdo,
} from "../actions/actionIndex";
import { ActionRequiredTask } from "../type";

const ai_gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model_version = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model_version_img =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const model_visesion_video =
  process.env.GEMINI_VIDEO_MODEL || "veo-3.1-generate-preview";

export async function startVideoJob(prompt: string, img_Url: string) {
  try {
    const API_KEY =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) throw new Error("ไม่พบ API KEY ในระบบ");

    const imageResponse = await fetch(img_Url);
    if (!imageResponse.ok)
      throw new Error(`ไม่สามารถโหลดรูปภาพได้: ${imageResponse.statusText}`);

    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBytesBase64 = Buffer.from(arrayBuffer).toString("base64");

    const initialOperation = await ai_gemini.models.generateVideos({
      model: model_visesion_video,
      prompt: prompt,
      image: {
        imageBytes: imageBytesBase64,
        mimeType: mimeType,
      },
    });

    const operationName = initialOperation.name;
    console.log(`✅ เริ่มสร้างวิดีโอสำเร็จ... บัตรคิวเลขที่: ${operationName}`);

    return {
      success: true,
      operationName: operationName,
    };
  } catch (error: any) {
    console.error("Start Job Error:", error);
    return { success: false, error: error.message };
  }
}

export async function checkVideoStatus(operationName: string) {
  try {
    const API_KEY =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) throw new Error("ไม่พบ API KEY ในระบบ");

    const checkUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`;
    const res = await fetch(checkUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`HTTP Error ตอนเช็คสถานะ: ${res.status}`);

    const data = await res.json();

    if (!data.done) {
      console.log(`บัตรคิว ${operationName}: กำลังประมวลผล...`);
      return { status: "processing" };
    }

    console.log("✅ AI สร้างวิดีโอเสร็จแล้ว กำลังจัดการไฟล์...");

    if (data.error) {
      throw new Error(data.error.message || "เกิดข้อผิดพลาดจากฝั่ง AI");
    }

    const resBody = data.response || {};
    let finalVideoUri =
      resBody.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      resBody.generatedVideos?.[0]?.video?.uri ||
      resBody.videos?.[0]?.video?.uri;

    if (!finalVideoUri) {
      throw new Error(
        "ระบบ AI ทำงานเสร็จแต่ไม่พบวิดีโอ (อาจติด Safety Filter)",
      );
    }

    let downloadUrl = finalVideoUri;
    if (downloadUrl.includes("?")) {
      downloadUrl = `${downloadUrl}&key=${API_KEY}&alt=media`;
    } else {
      downloadUrl = `${downloadUrl}?key=${API_KEY}&alt=media`;
    }

    const videoFetchRes = await fetch(downloadUrl);
    if (!videoFetchRes.ok)
      throw new Error("ไม่สามารถดาวน์โหลดไฟล์วิดีโอจาก Google API ได้");

    const videoArrayBuffer = await videoFetchRes.arrayBuffer();

    const blob = new Blob([videoArrayBuffer], { type: "video/mp4" });
    const formData = new FormData();
    formData.append("file", blob, "ai_generated_video.mp4");

    console.log("ดาวน์โหลดไฟล์สำเร็จ! กำลังอัปโหลดขึ้น S3...");

    const s3Response = await sendbase64toS3DataVdo(formData, "vdo_projects");

    if (s3Response && s3Response.url) {
      console.log(`✅ อัปโหลดขึ้น S3 สมบูรณ์! URL: ${s3Response.url}`);
      return {
        status: "success",
        videoUrl: s3Response.url,
      };
    } else {
      throw new Error("การอัปโหลดไฟล์ไปยัง S3 ล้มเหลว (ไม่พบ URL ตอบกลับ)");
    }
  } catch (error: any) {
    console.error("Check Status Error:", error);
    return { status: "error", error: error.message };
  }
}

export const generationImage = async (userCommand: string) => {
  const prompt = `A photorealistic, professional photography of "${userCommand}", bright natural daylight, cinematic lighting, high detailed, optimized for web.`;

  try {
    const response = await ai_gemini.models.generateContent({
      model: model_version_img,
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
      let url;
      let imageData: string | undefined;
      for (const part of parts) {
        if (part.inlineData) {
          imageData = part.inlineData?.data;
        }
      }

      if (imageData) {
        url = await sendbase64toS3Data(imageData, "img_tasks");
      }

      return {
        success: true,
        answer: url?.url,
      };
    }

    return {
      success: false,
      error: "Failed to process gen with AI.",
    };
  } catch (error) {
    console.error("Gemini image generation error:", error);
    return { success: false, error: "Failed to process gen with AI." };
  }
};

export const generationImage3D = async (img_Url: string, progress: number) => {
  let progressStageDesc = "";

  const safeProgress = Math.max(0, Math.min(100, progress));

  if (safeProgress <= 25) {
    progressStageDesc = `Early stage of the project (around ${safeProgress}% complete). Initial setup and preparation are visible. Resources and materials are being organized. The workspace shows early signs of activity with planning documents and initial work in progress.`;
  } else if (safeProgress <= 65) {
    progressStageDesc = `Mid-stage of the project (approximately ${safeProgress}% complete). Active work is clearly visible with significant progress. Team members are engaged in core tasks. Key deliverables are taking shape and the project momentum is strong.`;
  } else {
    progressStageDesc = `Late stage of the project nearing completion (around ${safeProgress}% complete). Most major work is finished. Final quality checks and finishing touches are being applied. The project is transitioning towards delivery and handover.`;
  }

  const promptText = `A professional photograph showing project progress based on the reference image. The project is actively in progress. ${progressStageDesc} Team members and resources are visible on site. The surrounding environment matches the reference image. Realistic daylight, highly detailed texture.`;

  try {
    let imagePart = null;
    if (img_Url) {
      const imageResponse = await fetch(img_Url);
      if (!imageResponse.ok) {
        throw new Error(`ไม่สามารถโหลดรูปภาพได้: ${imageResponse.statusText}`);
      }
      const mimeType =
        imageResponse.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBytesBase64 = Buffer.from(arrayBuffer).toString("base64");

      imagePart = {
        inlineData: {
          data: imageBytesBase64,
          mimeType: mimeType,
        },
      };
    }

    const contentsPayload = imagePart ? [promptText, imagePart] : promptText;

    const response = await ai_gemini.models.generateContent({
      model: model_version_img,
      contents: contentsPayload,
    });

    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
      let url;
      let imageData: string | undefined;

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data;

          if (imageData && imageData.startsWith("data:")) {
            imageData = imageData.replace(/^data:image\/\w+;base64,/, "");
          }
        }
      }

      if (imageData) {
        url = await sendbase64toS3Data(imageData, "vdo_projects");
      }

      return {
        success: true,
        error: false,
        answer: url?.url,
      };
    }

    return {
      success: false,
      error: "AI ประมวลผลสำเร็จ แต่ไม่พบข้อมูลรูปภาพตอบกลับมา",
    };
  } catch (error) {
    console.error("Gemini image generation error:", error);
    return { success: false, error: "Failed to process gen with AI." };
  }
};

export const generateSubtasksAI = async (prompt: string) => {
  try {
    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `คุณคือผู้จัดการโครงการมืออาชีพ 
        หน้าที่ของคุณคือการวิเคราะห์งานหลักชื่อที่ได้รับ และแตกเป็นรายการย่อย (Subtasks) ที่จำเป็น
        เงื่อนไขการตอบกลับ:
        - พิจารณาจำนวนข้อตามความเหมาะสมและความซับซ้อนของงานจริง (ไม่จำกัดจำนวนข้อ แต่ต้องครอบคลุมเนื้องานทั้งหมด)
        - ตอบกลับเป็น JSON array ของวัตถุเท่านั้น
        - แต่ละวัตถุต้องมีฟิลด์: 
          1. "detailName" (ชื่อขั้นตอนสั้นๆ ภาษาไทย)
          2. "detailDesc" (คำอธิบายวิธีการทำงานเบื้องต้น ภาษาไทย)
          3. "weightPercent" (ตัวเลขน้ำหนักงาน โดยผลรวมของทุกข้อที่เจนออกมาต้องเท่ากับ 100 พอดี)
        - ห้ามมีข้อความนำหรือคำลงท้าย ห้ามมี Markdown format (เช่น \`\`\`json)`,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("AI Response structure is invalid or empty:", result);
      return [];
    }
    try {
      const subtasks = JSON.parse(responseText);

      if (Array.isArray(subtasks)) {
        return subtasks.map((item: any) => ({
          detailName: item.detailName || "งานย่อยไม่มีชื่อ",
          detailDesc: item.detailDesc || "",
          weightPercent: Number(item.weightPercent) || 10,
        }));
      }

      return [];
    } catch (parseError) {
      console.error("JSON Parse Error. Raw response:", responseText);
      return [];
    }
  } catch (error) {
    console.error("Error generating subtasks with AI:", error);
    throw error;
  }
};

export const generateMaterialPriceEstimate = async (
  materialName: string,
  specification: string,
  unit: string,
  quantity: number | null,
) => {
  const prompt = `รายการ: "${materialName}"
Specification: "${specification || "ไม่ระบุ"}"
หน่วย: "${unit || "ไม่ระบุ"}"
จำนวน: ${quantity ?? "ไม่ระบุ"}`;

  try {
    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `คุณคือผู้เชี่ยวชาญด้านวัสดุ/อุปกรณ์และการจัดซื้อในประเทศไทย
        หน้าที่ของคุณคือประเมิน "ราคาต่อหน่วย" ของวัสดุ/อุปกรณ์ที่ได้รับ โดยแบ่งเป็น 3 ระดับ
        เงื่อนไขการตอบกลับ:
        - ประเมินราคาโดยอ้างอิงจากราคาตลาดในประเทศไทย
        - ตอบกลับเป็น JSON Object เพียง 1 ก้อน
        - วัตถุต้องมีฟิลด์เหล่านี้เท่านั้น:
          1. "priceMin" (ตัวเลข ราคาต่อหน่วยระดับประหยัด/พอใช้ หน่วยบาท)
          2. "priceMid" (ตัวเลข ราคาต่อหน่วยระดับกลาง/นิยม หน่วยบาท)
          3. "priceMax" (ตัวเลข ราคาต่อหน่วยระดับ Premium/คุณภาพสูง หน่วยบาท)
          4. "reason" (คำอธิบายสั้นๆ 1-2 บรรทัด)
        - ห้ามมีข้อความนำหรือคำลงท้าย ห้ามครอบด้วย Markdown format`,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return null;

    try {
      const data = JSON.parse(responseText);
      return {
        priceMin: Number(data.priceMin) || 0,
        priceMid: Number(data.priceMid) || 0,
        priceMax: Number(data.priceMax) || 0,
        reason: data.reason || "",
      };
    } catch {
      console.error("AI Price Parse Error:", responseText);
      return null;
    }
  } catch (error) {
    console.error("generateMaterialPriceEstimate error:", error);
    return null;
  }
};

export const extractMaterialsFromImage = async (
  base64Data: string,
  mimeType: string,
) => {
  try {
    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `คุณคือผู้เชี่ยวชาญด้านวัสดุ/อุปกรณ์และอ่านเอกสารรายการจัดซื้อ
        หน้าที่ของคุณคือ วิเคราะห์รูปภาพหรือ PDF ที่ได้รับ แล้วแยกรายการวัสดุ/อุปกรณ์ออกมาให้ครบถ้วน
        เงื่อนไขการตอบกลับ:
        - ตอบกลับเป็น JSON Array ของวัตถุ
        - แต่ละวัตถุต้องมีฟิลด์เหล่านี้:
          1. "materialName" (string - ชื่อวัสดุ/อุปกรณ์)
          2. "specification" (string - รายละเอียด spec ถ้ามี)
          3. "unit" (string - หน่วย เช่น m², m, pcs, kg, ชุด, ตัว)
          4. "quantity" (number - จำนวน ถ้าอ่านได้)
          5. "partType" (string - "EXT" หรือ "INT" หรือ "OTHER")
          6. "materialGroup" (string - "MAIN" หรือ "GENERAL" หรือ "MACHINERY" หรือ "OTHER")
          7. "note" (string - หมายเหตุถ้ามี)
        - ถ้าอ่านจำนวนไม่ได้ ให้ใส่ null
        - ถ้าไม่แน่ใจ partType/materialGroup ให้ใส่ "OTHER" / "GENERAL"
        - ห้ามมีข้อความนำหรือคำลงท้าย ห้ามครอบด้วย Markdown format`,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            { text: "วิเคราะห์รายการวัสดุ/อุปกรณ์จากเอกสารนี้" },
          ],
        },
      ],
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return null;

    try {
      const materials = JSON.parse(responseText);
      if (!Array.isArray(materials)) return null;

      return materials.map((m: any) => ({
        materialName: m.materialName || "รายการไม่ระบุชื่อ",
        specification: m.specification || "",
        unit: m.unit || "",
        quantity: m.quantity != null ? Number(m.quantity) : null,
        partType: m.partType || "OTHER",
        materialGroup: m.materialGroup || "GENERAL",
        note: m.note || "",
      }));
    } catch {
      console.error("AI Material Extract Parse Error:", responseText);
      return null;
    }
  } catch (error) {
    console.error("extractMaterialsFromImage error:", error);
    return null;
  }
};

export const suggestTasksForMaterial = async (
  materialName: string,
  specification: string,
  taskList: { id: number; taskName: string | null; status: string }[],
) => {
  if (taskList.length === 0) return [];

  const tasksText = taskList
    .map(
      (t) => `ID:${t.id} ชื่อ:"${t.taskName || "ไม่มีชื่อ"}" สถานะ:${t.status}`,
    )
    .join("\n");

  const prompt = `วัสดุ: "${materialName}"
Spec: "${specification || "ไม่ระบุ"}"

รายการ Task ที่มีอยู่ในโครงการ:
${tasksText}`;

  try {
    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `คุณคือผู้เชี่ยวชาญด้านการบริหารโครงการในประเทศไทย
        หน้าที่ของคุณคือ วิเคราะห์ว่าวัสดุ/อุปกรณ์ที่ได้รับ น่าจะเกี่ยวข้องกับ Task ใดบ้างในรายการ
        เงื่อนไข:
        - ตอบกลับเป็น JSON Array ของวัตถุ
        - แต่ละวัตถุมี:
          1. "taskId" (number - ID ของ Task ที่เกี่ยวข้อง)
          2. "confidence" (number 0.0-1.0 - ระดับความมั่นใจ)
          3. "reason" (string - เหตุผลสั้นๆ)
        - เรียงจากความมั่นใจสูง → ต่ำ
        - คืนเฉพาะ Task ที่เกี่ยวข้องจริงๆ (confidence >= 0.5)
        - ถ้าไม่มี Task ที่เกี่ยวข้องเลย ให้คืน []
        - ห้ามมีข้อความนำหรือคำลงท้าย ห้ามครอบด้วย Markdown`,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return [];

    try {
      const suggestions = JSON.parse(responseText);
      if (!Array.isArray(suggestions)) return [];

      return suggestions
        .filter((s: any) => s.taskId && s.confidence >= 0.5)
        .map((s: any) => ({
          taskId: Number(s.taskId),
          confidence: Number(s.confidence) || 0.5,
          reason: s.reason || "",
        }));
    } catch {
      console.error("AI Task Suggest Parse Error:", responseText);
      return [];
    }
  } catch (error) {
    console.error("suggestTasksForMaterial error:", error);
    return [];
  }
};

export const transcribeVideoAudio = async (videoUrl: string) => {
  try {
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`ไม่สามารถโหลดวิดีโอได้: ${videoResponse.statusText}`);
    }

    const mimeType = videoResponse.headers.get("content-type") || "video/mp4";
    const arrayBuffer = await videoResponse.arrayBuffer();
    const videoBytesBase64 = Buffer.from(arrayBuffer).toString("base64");

    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `คุณคือระบบถอดเสียงจากวิดีโอ (Speech-to-Text)
        หน้าที่ของคุณคือ ฟังเสียงในวิดีโอที่ได้รับ แล้วถอดข้อความออกมาให้ครบถ้วน
        เงื่อนไขการตอบกลับ:
        - ตอบกลับเป็น JSON Object เพียง 1 ก้อน
        - วัตถุต้องมีฟิลด์เหล่านี้:
          1. "transcript" (string - ข้อความที่ถอดจากเสียงทั้งหมด ภาษาอะไรก็ตามที่พูด)
          2. "language" (string - ภาษาหลักที่พูดในวิดีโอ เช่น "th", "en")
          3. "summary" (string - สรุปเนื้อหาสั้นๆ 1-2 ประโยค)
        - ถ้าไม่มีเสียงพูดในวิดีโอ ให้ใส่ transcript เป็น "" และ summary เป็น "ไม่มีเสียงพูดในวิดีโอ"
        - ห้ามมีข้อความนำหรือคำลงท้าย ห้ามครอบด้วย Markdown format`,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: videoBytesBase64,
                mimeType: mimeType,
              },
            },
            { text: "ถอดเสียงจากวิดีโอนี้" },
          ],
        },
      ],
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return null;

    try {
      const data = JSON.parse(responseText);
      return {
        transcript: data.transcript || "",
        language: data.language || "th",
        summary: data.summary || "",
      };
    } catch {
      console.error("AI Transcript Parse Error:", responseText);
      return null;
    }
  } catch (error) {
    console.error("transcribeVideoAudio error:", error);
    return null;
  }
};

export const generateTakeBudget_Durationday = async (prompt: string) => {
  try {
    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `คุณคือผู้เชี่ยวชาญด้านการประเมินต้นทุนและวางแผนโครงการมืออาชีพ (Estimator & Planner) ในประเทศไทย
        หน้าที่ของคุณคือการวิเคราะห์ชื่องานที่ได้รับ และประเมิน "ต้นทุนโดยประมาณ (บาท)" และ "ระยะเวลาทำงานคร่าวๆ (วัน)"
        เงื่อนไขการตอบกลับ:
        - ประเมินตัวเลขโดยอ้างอิงจากมาตรฐานโครงการทั่วไปในประเทศไทย (สมมติว่าเป็นโครงการขนาดกลาง)
        - ตอบกลับเป็น JSON Object เพียง 1 ก้อนเท่านั้น ห้ามเป็น Array
        - วัตถุต้องมี 3 ฟิลด์นี้เท่านั้น: 
          1. "estimatedBudget" (ตัวเลขจำนวนเต็ม ราคากลางโดยประมาณ หน่วยเป็นบาท ห้ามใส่ลูกน้ำ)
          2. "estimatedDurationDays" (ตัวเลขจำนวนเต็ม ระยะเวลาทำงานคร่าวๆ หน่วยเป็นวัน)
          3. "reason" (คำอธิบายสั้นๆ 1-2 บรรทัด ว่าทำไมถึงประเมินราคากับเวลานี้ อ้างอิงจากปริมาณงานหรือวัสดุอะไร)
        - ห้ามมีข้อความนำหรือคำลงท้าย ห้ามครอบด้วย Markdown format (เช่น \`\`\`json)`,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("AI Response structure is invalid or empty:", result);
      return null; // เปลี่ยนจากคืนค่า [] เป็น null เพื่อให้เช็ค error ได้ง่ายขึ้น
    }

    try {
      const estimate = JSON.parse(responseText);

      // คืนค่าเป็น Object แทน Array
      return {
        estimatedBudget: Number(estimate.estimatedBudget) || 0,
        estimatedDurationDays: Number(estimate.estimatedDurationDays) || 1, // ค่าเริ่มต้นให้เป็น 1 วัน
        reason: estimate.reason || "ประเมินจากมาตรฐานโครงการทั่วไป",
      };
    } catch (parseError) {
      console.error("JSON Parse Error. Raw response:", responseText);
      return null;
    }
  } catch (error) {
    console.error("Error generating estimate with AI:", error);
    throw error;
  }
};

export const generatePlanningAI = async (prompt: string) => {
  try {
    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `
          คุณคือ Project Manager มืออาชีพด้านการวางแผนโครงการ

          หน้าที่:
          - วิเคราะห์ชื่อ task แล้วจัด phaseAi ให้ถูกต้อง
          - จัดลำดับ orderAi ตาม flow การทำงานจริง
          - กำหนด dependsOn ให้สอดคล้องกับการทำงานจริง

          Phase:
          Planning | Preparation | Execution | Review | Delivery

          ========================
          กฎลำดับหลัก (บังคับ)
          ========================
          Planning → Preparation → Execution → Review → Delivery

          ========================
          กฎการทำงานจริง (สำคัญมาก)
          ========================
          - ห้ามให้ task ใน phase เดียวกันเริ่มพร้อมกันทั้งหมด

          - ทุก task (ยกเว้นตัวแรกของ phase) ต้องมี dependsOn

          - ในแต่ละ phase:
            - มี root task 1 งาน
            - งานอื่นต้องอิง root หรือ task ก่อนหน้า

          - งานต้อง "ทยอยเริ่ม" (staggered)
            ❌ ห้าม start พร้อมกันทั้งหมด

          - งานส่วนใหญ่:
            ต้องมี dependency อย่างน้อย 1 งาน

          ========================
          ข้อห้าม
          ========================
          ❌ ห้ามทุก task ไม่มี dependsOn  
          ❌ ห้ามทุก task อยู่ใน chain เดียว  
          ❌ ห้าม start พร้อมกันหมด  

          ========================
          รูปแบบคำตอบ
          ========================
          ตอบ JSON เท่านั้น:
          [
            {
              "id": number,
              "orderAi": number,
              "phaseAi": string,
              "estimatedDurationDays": number,
              "dependsOn": number[]
            }
          ]
        `,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("AI empty");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    if (!Array.isArray(parsed)) {
      throw new Error("AI response not array");
    }

    const cleaned = parsed.map((i: any) => ({
      id: Number(i.id),
      orderAi: Number(i.orderAi) || 0,
      phaseAi: i.phaseAi || "Execution",
      estimatedDurationDays: Number(i.estimatedDurationDays) || 1,
      dependsOn: Array.isArray(i.dependsOn)
        ? [...new Set(i.dependsOn.map(Number))]
        : [],
    }));

    return {
      success: true,
      data: cleaned,
    };
  } catch (e) {
    console.error("[generatePlanningAI]", e);
    return {
      success: false,
      data: [],
      error: String(e),
    };
  }
};

export async function askGeminiToCountAction(imageUrl: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("ไม่พบ GEMINI_API_KEY ในระบบ");
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("ไม่สามารถดาวน์โหลดภาพจากกล้องได้");
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const prompt = `
      Count the exact number of people visible in this image. 
      Return ONLY an integer number (e.g., 0, 1, 2, 3). 
      Do not include any other text, punctuation, or explanation.
    `;

    const response = await ai_gemini.models.generateContent({
      model: model_version,
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ],
    });

    // E. ดึงข้อความตอบกลับและแปลงเป็นตัวเลข
    const text = response.text?.trim() || "";
    const count = parseInt(text, 10);

    if (isNaN(count)) {
      console.error("AI ตอบกลับมาผิดรูปแบบ:", text);
      return { success: false, error: "AI คืนค่าผิดรูปแบบ" };
    }

    return { success: true, count: count };
  } catch (error: any) {
    console.error("Gemini Count Error:", error);
    return { success: false, error: error.message || "ระบบ AI ขัดข้อง" };
  }
}

export async function analyzeProjectActions(
  tasks: ActionRequiredTask[],
  projectInfo: {
    name: string;
    status: string;
    overallProgress: number;
    totalBudget: number;
  },
  referenceDate: string,
) {
  const prompt = `
    คุณคือระบบ AI อัจฉริยะสำหรับตรวจสอบและบริหารความเสี่ยงโครงการ
    วันนี้คือวันที่: ${referenceDate}
    
    ข้อมูลพื้นฐานของโครงการ (ภาพรวม):
    - ชื่อโครงการ: ${projectInfo.name}
    - ความคืบหน้าโดยรวม: ${projectInfo.overallProgress}%
    - งบประมาณรวมทั้งโครงการ: ${projectInfo.totalBudget.toLocaleString()} บาท

    จงวิเคราะห์ข้อมูล Tasks ย่อยต่อไปนี้ และสกัด "สิ่งที่ต้องจัดการด่วน (Action Required)" ออกมา
    โดยพิจารณาความสำคัญ (Priority) เทียบกับภาพรวมของโครงการด้วย:
    1. งานที่ล่าช้า (Delayed): ดูจาก finishPlanned เทียบกับ referenceDate (ถ้างบรวมหรือเวลาโดยรวมตึงเครียด ให้ปรับ Priority เป็น HIGH)
    2. งบบานปลาย (Budget): ดูจาก budget (งบที่ตั้งไว้ให้ task) เทียบกับ estimatedBudget หรือ actualCosts ว่าเกินเพดานหรือไม่
    3. ความเสี่ยงจากการดำเนินงาน (Risks): วิเคราะห์จากฟิลด์ aiRisks อย่างละเอียด

    ข้อมูลงานย่อย (Tasks JSON):
    ${JSON.stringify(tasks)}

    ให้ตอบกลับเป็น JSON Array โครงสร้างตามนี้เท่านั้น (ห้ามมี Markdown หรือ Text อื่นปน):
    [
      {
        "id": "string (เช่น delay-12 หรือ ai-26)",
        "type": "DELAY" | "BUDGET" | "AI_DETECTION",
        "title": "string (ชื่อการแจ้งเตือนสั้นๆ กระชับ)",
        "description": "string (รายละเอียด ผลกระทบ และสิ่งที่ควรทำ)",
        "tag": "string (เช่น หมวด: Structure หรือ AI Insight)",
        "time": "string (จำลองเวลาแจ้งเตือน เช่น '2 ชม. ที่แล้ว' หรือ '10:30 น.')",
        "priority": "HIGH" | "MEDIUM",
        "hasCCTV": boolean (ให้เป็น true ถ้าเป็น type AI_DETECTION)
      }
    ]
  `;

  try {
    const response = await ai_gemini.models.generateContent({
      model: model_version, 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }

    return [];
  } catch (error) {
    console.error("❌ AI Analysis Error:", error);
    return []; // ถ้าพังให้คืนค่า Array ว่าง หน้าเว็บจะได้ไม่พัง
  }
}

export async function analyzeProjectOverview(
  tasks: any[],
  projectInfo: {
    name: string;
    status: string;
    overallProgress: number;
    totalBudget: number;
  },
  referenceDate: string,
) {
  const prompt = `
    คุณคือ Project Director ผู้เชี่ยวชาญด้านบริหารโครงการ
    วันนี้คือวันที่: ${referenceDate}
    
    ข้อมูลพื้นฐานของโครงการ:
    - ชื่อโครงการ: ${projectInfo.name}
    - สถานะโครงการ: ${projectInfo.status}
    - ความคืบหน้าโดยรวม: ${projectInfo.overallProgress}%
    - งบประมาณรวมทั้งโครงการ: ${projectInfo.totalBudget.toLocaleString()} บาท

    จงวิเคราะห์ข้อมูลงานทั้งหมด (Tasks) ของโครงการนี้ และสรุป "ภาพรวมโครงการ (Executive Summary)"
    โดยวิเคราะห์จาก:
    1. ความคืบหน้าโดยรวม: พิจารณาจากความคืบหน้ารวมที่ ${projectInfo.overallProgress}% ประกอบกับงานย่อย (งานที่เสร็จแล้ว vs งานที่ล่าช้า vs งานที่กำลังทำ)
    2. สถานะงบประมาณ: เอางบประมาณรวม ${projectInfo.totalBudget.toLocaleString()} บาท เป็นเพดานหลัก เทียบกับ actualCosts และ estimatedBudget ในแต่ละ Task ว่าใช้เงินไปสมเหตุสมผลไหม และมีแนวโน้มจะบานปลายหรือไม่
    3. ความเสี่ยงหลัก: วิเคราะห์เจาะลึกจาก aiRisks และ status ของงานย่อยที่อาจส่งผลกระทบต่อภาพรวม

    ข้อมูลงานย่อย (Tasks JSON):
    ${JSON.stringify(tasks)}

    ให้ตอบกลับเป็น JSON Format โครงสร้างตามนี้เท่านั้น (ห้ามมี Text อื่นปน):
    {
      "healthStatus": "GOOD" | "WARNING" | "CRITICAL",
      "executiveSummary": "string (สรุปภาพรวมสั้นๆ กระชับ เข้าใจง่าย 3-4 บรรทัด)",
      "budgetAnalysis": "string (วิเคราะห์สถานะการเงินในภาพรวมเทียบกับงบหลัก เช่น เป็นไปตามแผน, งบเหลือน้อย, หรือมีแนวโน้มบานปลายเพราะงานส่วนไหน)",
      "topRisks": [
        "string (ความเสี่ยงหลักข้อที่ 1)",
        "string (ความเสี่ยงหลักข้อที่ 2)"
      ],
      "recommendation": "string (คำแนะนำเชิงรุกสำหรับผู้บริหาร ว่าควรเข้าไปโฟกัสหรือแก้ปัญหาจุดไหนเป็นพิเศษในสัปดาห์นี้)"
    }
  `;

  try {
    const response = await ai_gemini.models.generateContent({
      model: model_version, // ตรวจสอบตัวแปรให้ตรงกับที่คุณประกาศไว้
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("❌ AI Overview Analysis Error:", error);
    return null;
  }
}

/* ====================================================== */
/* GENERATE TASK PLACEHOLDER FROM ROLE PROMPT              */
/* ====================================================== */
export async function generateTaskPlaceholder(
  rolePrompt: string,
): Promise<string | null> {
  try {
    const result = await ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `จากบทบาทและบริบทที่ได้รับ ให้สร้างตัวอย่างชื่องาน (Task Name) ที่เหมาะสม 3 ตัวอย่าง
คั่นด้วยเครื่องหมายจุลภาค
ตอบเฉพาะตัวอย่างเท่านั้น ไม่ต้องมีคำนำหรือคำอธิบาย
ตัวอย่างผลลัพธ์: "งานวางฐานราก, งานระบบไฟฟ้า, งานทาสี"`,
        temperature: 0.8,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `บทบาท/บริบทธุรกิจ:\n${rolePrompt}` }],
        },
      ],
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    return `เช่น ${text}`;
  } catch (error) {
    console.error("generateTaskPlaceholder error:", error);
    return null;
  }
}
