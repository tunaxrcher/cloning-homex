"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { CameraOff } from "lucide-react";
import { getCamerasByProject } from "@/lib/actions/actionCamera";
import LiveCameraCard from "../../camera/LiveCameraCard";

interface ReadOnlyLiveViewProps {
  projectId: number;
}

const ReadOnlyLiveView = ({ projectId }: ReadOnlyLiveViewProps) => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCameras = async () => {
      setIsLoading(true);
      try {
        const res = await getCamerasByProject(Number(projectId));
        if (res.success && res.data) {
          const mappedCameras = res.data.map((cam: any) => ({
            dbId: cam.id,
            id: cam.cameraSN,
            name: cam.cameraName,
            location: cam.cameraLocation || "",
            status: cam.status,
          }));
          setCameras(mappedCameras.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch cameras:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) fetchCameras();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Spinner size="sm" color="success" />
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-zinc-600 italic text-[10px]">
        <CameraOff size={20} className="mb-1 opacity-50" />
        <p>ไม่มีกล้องออนไลน์</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto custom-scrollbar">
      {cameras.map((cam) => (
        <div key={cam.id} className="relative group">
          <LiveCameraCard camera={cam} hideAiButton={true} />
        </div>
      ))}
    </div>
  );
};

export default ReadOnlyLiveView;
