"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function SearchHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownToast = useRef(false);
  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl");
    const error = searchParams.get("error");
    const code = searchParams.get("code");

    if (error && !hasShownToast.current) {
      let message = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";

      if (error === "CallbackRouteError" || error === "AccessDenied") {

        message =
          "บัญชีของคุณยังไม่ได้รับการอนุมัติ หรือถูกระงับการใช้งาน (Contact Admin)";
      } else if (error === "Configuration") {
        message = "การตั้งค่าระบบผิดพลาด";
      } else {
        message = error;
      }

      toast.error(message);
      hasShownToast.current = true;

      router.replace("/");
    }
    if (callbackUrl) {
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);
  return null;
}
