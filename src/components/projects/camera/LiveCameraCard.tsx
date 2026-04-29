import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Spinner,
} from "@heroui/react";
import { MapPin, Trash2, VideoOff, Bot } from "lucide-react";
import EzvizCamera from "./EzvizCamera";
import { getCameraCredentials } from "@/lib/camera/cameraGetToken";

const LiveCameraCard = ({
  camera,
  onEdit,
  onDelete,
  hideAiButton,
}: {
  camera: any;
  onEdit?: (cam: any) => void;
  onDelete?: (cam: any) => void;
  hideAiButton?: boolean;
}) => {
  const [liveToken, setLiveToken] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [liveAreaDomain, setLiveAreaDomain] = useState(
    "https://open.ezviz.com",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isAiEnabled, setIsAiEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStream = async () => {
      if (!camera?.id) {
        if (isMounted) {
          setFetchError("ไม่พบหมายเลขซีเรียล (SN) ของกล้องตัวนี้");
          setIsLoading(false);
        }
        return;
      }
      if (camera.status !== "online") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFetchError("");
      try {
        const res = await getCameraCredentials(camera.id, "1");
        if (!isMounted) return;
        if (res.success && res.ezopenUrl && res.accessToken) {
          setLiveToken(res.accessToken);
          setLiveUrl(res.ezopenUrl);
          setLiveAreaDomain(res.areaDomain || "https://open.ezviz.com");
        } else {
          setFetchError(res.error || "เกิดข้อผิดพลาดในการดึงสตรีม");
        }
      } catch (err) {
        if (isMounted) setFetchError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchStream();
    return () => {
      isMounted = false;
    };
  }, [camera.id, camera.status]);

  return (
    <Card className="border-none shadow-md bg-zinc-900 text-white overflow-hidden h-full group flex flex-col">
      <CardBody className="p-0 relative aspect-video flex items-center justify-center bg-black shrink-0">
        <Chip
          color={camera.status === "online" ? "success" : "danger"}
          size="sm"
          className="absolute top-3 right-3 shadow-lg font-bold z-20"
        >
          {camera.status.toUpperCase()}
        </Chip>

        {camera.status !== "online" ? (
          <div className="flex flex-col items-center text-zinc-600">
            <VideoOff size={40} strokeWidth={1.5} />
            <span className="text-xs mt-2 uppercase tracking-wider">
              Offline
            </span>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center">
            <Spinner size="md" color="primary" />
            <span className="text-[10px] text-zinc-500 mt-3 font-mono">
              CONNECTING...
            </span>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center p-6 w-full h-full bg-red-950/10 text-center">
            <VideoOff size={32} className="text-red-500/50 mb-3" />
            <p className="text-red-500 text-xs font-semibold">{fetchError}</p>
          </div>
        ) : liveToken && liveUrl ? (
          <div
            className={
              isModalOpen
                ? "fixed inset-0 z-[9999] bg-black"
                : "w-full h-full relative overflow-hidden"
            }
          >
            <EzvizCamera
              /* 🌟 แก้ตรงนี้: ใช้แค่ camera.id ล้วนๆ ห้ามเอา isModalOpen มาใส่ */
              key={camera.dbId}
              accessToken={liveToken}
              ezopenUrl={liveUrl}
              areaDomain={liveAreaDomain}
              cameraDBId={camera.dbId}
              isAiEnabled={isAiEnabled}
              isModalOpen={isModalOpen}
              onToggleModal={() => setIsModalOpen(!isModalOpen)}
            />
          </div>
        ) : null}
      </CardBody>

      <CardFooter className="flex flex-col items-start px-4 py-4 bg-zinc-800/80 border-t border-white/5 flex-grow">
        <h3 className="font-bold text-sm truncate w-full text-zinc-100 mb-1">
          {camera.name}
        </h3>
        <div className="flex justify-between items-center w-full mt-auto">
          <div className="flex flex-col">
            <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
              <MapPin size={12} className="text-primary" /> {camera.location}
            </p>
            <p className="text-[10px] font-mono text-zinc-500">
              SN: {camera.id || "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {!hideAiButton && camera.status === "online" && liveToken && (
              <Button
                size="sm"
                variant={isAiEnabled ? "solid" : "flat"}
                color={isAiEnabled ? "success" : "default"}
                className="h-8 px-2 min-w-0"
                onPress={() => setIsAiEnabled(!isAiEnabled)}
              >
                <Bot size={16} className={isAiEnabled ? "animate-pulse" : ""} />
                <span className="text-[10px] font-bold">
                  {isAiEnabled ? "AI ON" : "AI"}
                </span>
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="bordered"
                className="h-8 text-[10px]"
                onPress={() => onEdit(camera)}
              >
                แก้ไข
              </Button>
            )}
            {onDelete && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                className="w-8 h-8"
                onPress={() => onDelete(camera)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LiveCameraCard;
