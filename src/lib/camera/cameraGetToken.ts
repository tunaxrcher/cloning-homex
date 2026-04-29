"use server";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function getCameraCredentials(
  deviceSerial: string,
  channelNo: string = "1",
) {
  try {
    const res = await fetch("https://open.ezvizlife.com/api/lapp/token/get", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        appKey: process.env.CAMERA_APP_KEY || "",
        appSecret: process.env.CAMERA_SECRET_KEY || "",
      }),
      cache: "no-store",
    });

    const rawText = await res.text();

    if (rawText.trim().startsWith("<")) {
      console.error("❌ ได้รับ HTML Error:", rawText.substring(0, 200));
      return { success: false, error: "Server EZVIZ ปฏิเสธการเชื่อมต่อ" };
    }

    const data = JSON.parse(rawText);

    if (data.code !== "200") {
      let errorMessage = `EZVIZ แจ้งว่า: ${data.msg}`;

      switch (data.code) {
        case "10001":
          errorMessage =
            "พารามิเตอร์ไม่ถูกต้อง (ตรวจสอบ AppKey/Secret ใน .env)";
          break;
        case "10005":
          errorMessage = "AppKey นี้ถูกระงับการใช้งาน (Frozen)";
          break;
        case "10017":
          errorMessage = "ไม่มี AppKey นี้ในระบบ (AppKey ไม่ถูกต้อง)";
          break;
        case "10030":
          errorMessage = "AppKey และ AppSecret ไม่ตรงกัน";
          break;
        case "49999":
          errorMessage = "ระบบเชื่อมต่อ API ของ EZVIZ ขัดข้องชั่วคราว";
          break;
      }

      console.error(`❌ EZVIZ API Error [${data.code}]:`, data.msg);
      return { success: false, error: errorMessage };
    }

    const accessToken = data.data.accessToken;
    const areaDomain = data.data.areaDomain;

    const ezopenUrl = `ezopen://open.ezviz.com/${deviceSerial}/${channelNo}.live`;

    return {
      success: true,
      accessToken,
      ezopenUrl,
      areaDomain,
    };
  } catch (error) {
    console.error("Action Error:", error);
    return {
      success: false,
      error: "ดึงข้อมูลล้มเหลว ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
    };
  }
}


export async function captureSnapshotAction(accessToken: string, deviceSerial: string) {
  try {
    if (!accessToken || !deviceSerial) {
      throw new Error("ข้อมูลไม่ครบถ้วน (accessToken หรือ deviceSerial หายไป)");
    }

    // 1. สั่ง EZVIZ API ให้ถ่ายภาพ (Capture)
    const ezvizParams = new URLSearchParams();
    ezvizParams.append("accessToken", accessToken);
    ezvizParams.append("deviceSerial", deviceSerial);
    ezvizParams.append("channelNo", "1");

    const captureRes = await fetch("https://open.ezvizlife.com/api/lapp/device/capture", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: ezvizParams.toString(),
    });
    
    const captureData = await captureRes.json();

    if (captureData.code !== "200" || !captureData.data?.picUrl) {
      throw new Error(`EZVIZ API Error: ${captureData.msg}`);
    }

    // 2. ไปดึงไฟล์รูปภาพจาก URL ที่ EZVIZ ให้มา
    const picUrl = captureData.data.picUrl;
    const imgRes = await fetch(picUrl);
    
    if (!imgRes.ok) throw new Error("ไม่สามารถดาวน์โหลดรูปภาพจากเซิร์ฟเวอร์กล้องได้");
    
    const arrayBuffer = await imgRes.arrayBuffer();
    
    // 3. แปลงรูปเป็น Base64 เพื่อส่งกลับไปให้ Client (Next.js Action รับข้อมูลแบบนี้ได้ดีที่สุด)
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return { 
      success: true, 
      imageUrl: `data:image/jpeg;base64,${base64}` 
    };

  } catch (error: any) {
    console.error("❌ captureSnapshotAction Error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดภายในระบบ" };
  }
}