"use client";

import { useState, useEffect } from "react";
import { Video, Plus, Camera as CameraIcon } from "lucide-react";
import { Button, useDisclosure, Spinner } from "@heroui/react";
import { DashboardCameraProp } from "@/lib/type";
import LiveCameraCard from "./LiveCameraCard";
import { toast } from "react-toastify";
import { deleteCamera, getCamerasByProject } from "@/lib/actions/actionCamera";
import CreateCameraForm from "./form/CreateCameraForm";
import UpdateCameraForm from "./form/UpdateCameraForm";
import { useRouter } from "next/navigation";
import DeleteCameraModal from "./form/DeleteCameraModal";

const DashboardCamera = ({
  projectId,
  organizationId,
  currentUserId,
}: DashboardCameraProp) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [cameras, setCameras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingCamera, setEditingCamera] = useState<any>(null);

  const [cameraToDelete, setCameraToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          setCameras(mappedCameras);
        }
      } catch (error) {
        toast.error("ดึงข้อมูลกล้องล้มเหลว");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchCameras();
    }
  }, [projectId]);

  const handleAddSuccess = (newCamDB: any) => {
    setCameras([newCamDB, ...cameras]);
  };

  const handleEditSuccess = (updatedCamDB: any) => {
    setCameras((prevCameras) =>
      prevCameras.map((cam) =>
        cam.dbId === updatedCamDB.dbId ? updatedCamDB : cam,
      ),
    );
  };

  const handleConfirmDelete = async () => {
    if (!cameraToDelete?.dbId) return;
    setIsDeleting(true);

    try {
      const res = await deleteCamera(cameraToDelete.dbId);

      if (res.success) {
        setCameras((prevCameras) =>
          prevCameras.filter((cam) => cam.dbId !== cameraToDelete.dbId),
        );
        toast.success("ลบข้อมูลกล้องสำเร็จ!");
        setCameraToDelete(null); // ปิด Modal
        router.refresh();
      } else {
        toast.error(res.error || "ลบล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-default-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-primary" /> ระบบกล้องวงจรปิด (CCTV)
          </h1>
          <p className="text-default-500 text-sm mt-1">
            จัดการและดูสถานะกล้องวงจรปิดหน้างานแบบ Real-time
          </p>
        </div>

        <Button
          onPress={onOpen}
          color="primary"
          endContent={<Plus size={18} />}
          className="font-bold shadow-lg"
        >
          เพิ่มกล้องใหม่
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((cam) => (
            <LiveCameraCard
              key={cam.id}
              camera={cam}
              onEdit={(clickedCam) => setEditingCamera(clickedCam)}
              onDelete={(clickedCam) => setCameraToDelete(clickedCam)}
            />
          ))}

          {cameras.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-default-200 rounded-3xl text-default-400">
              <CameraIcon size={48} strokeWidth={1} />
              <p className="mt-4">ยังไม่มีการเพิ่มกล้องในระบบ</p>
            </div>
          )}
        </div>
      )}

      <CreateCameraForm
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        projectId={Number(projectId)}
        organizationId={Number(organizationId)}
        currentUserId={Number(currentUserId)}
        onSuccess={handleAddSuccess}
      />

      <UpdateCameraForm
        camera={editingCamera}
        isOpen={!!editingCamera}
        onOpenChange={(open) => {
          if (!open) setEditingCamera(null);
        }}
        projectId={Number(projectId)}
        onSuccess={handleEditSuccess}
      />

      <DeleteCameraModal
        camera={cameraToDelete}
        isOpen={!!cameraToDelete}
        isDeleting={isDeleting}
        onClose={() => setCameraToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default DashboardCamera;
