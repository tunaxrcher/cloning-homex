"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { createCamera } from "@/lib/actions/actionCamera";
import { useRouter } from "next/navigation";

// กำหนด Props ที่ต้องรับมาจากหน้า Dashboard
type CreateCameraFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId: number;
  organizationId: number;
  currentUserId: number;
  onSuccess: (newCamera: any) => void; // ส่งข้อมูลกลับไปให้ Dashboard
};

export default function CreateCameraForm({
  isOpen,
  onOpenChange,
  projectId,
  organizationId,
  currentUserId,
  onSuccess,
}: CreateCameraFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false); // เพิ่ม State โหลดตอนกดปุ่ม
  const [newCamera, setNewCamera] = useState({
    id: "",
    name: "",
    location: "",
    status: "online",
  });

  const handleAddCamera = async () => {
    if (!newCamera.id || !newCamera.name) return;
    setIsSaving(true);

    try {
      const res = await createCamera({
        cameraName: newCamera.name,
        cameraSN: newCamera.id,
        cameraLocation: newCamera.location,
        status: newCamera.status,
        organizationId: Number(organizationId),
        projectId: Number(projectId),
        userId: Number(currentUserId),
      });

      if (res.success && res.data) {
        const cameraData = res.data as any;

        const newCamDB = {
          dbId: cameraData.id,
          id: cameraData.cameraSN,
          name: cameraData.cameraName,
          location: cameraData.cameraLocation || "",
          status: cameraData.status,
        };

        // ส่งข้อมูลกลับไปให้แม่ (Dashboard) เพื่ออัปเดตหน้าจอ
        onSuccess(newCamDB);

        // ล้างฟอร์ม
        setNewCamera({ id: "", name: "", location: "", status: "online" });
        onOpenChange(false); // สั่งปิด Modal
        toast.success("เพิ่มกล้องสำเร็จ!");
        router.refresh();
      } else {
        toast.error(res.error || "เพิ่มกล้องไม่สำเร็จ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      classNames={{
        base: "bg-zinc-900 text-white",
        header: "border-b border-white/10",
        footer: "border-t border-white/10",
        closeButton: "hover:bg-white/10",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex gap-2 items-center">
              <Settings2 size={20} className="text-primary" />
              <span>ลงทะเบียนกล้องใหม่</span>
            </ModalHeader>
            <ModalBody className="py-6 space-y-4">
              <Input
                label="Device Serial Number (ID)"
                placeholder="เช่น BG123456"
                labelPlacement="outside"
                variant="bordered"
                value={newCamera.id}
                onValueChange={(val) => setNewCamera({ ...newCamera, id: val })}
                classNames={{ label: "text-zinc-300" }}
              />
              <Input
                label="ชื่อเรียกกล้อง"
                placeholder="เช่น กล้องประตูหน้า"
                labelPlacement="outside"
                variant="bordered"
                value={newCamera.name}
                onValueChange={(val) =>
                  setNewCamera({ ...newCamera, name: val })
                }
                classNames={{ label: "text-zinc-300" }}
              />
              <Input
                label="ตำแหน่งที่ติดตั้ง (Location)"
                placeholder="เช่น โซน A ทางเข้า"
                labelPlacement="outside"
                variant="bordered"
                value={newCamera.location}
                onValueChange={(val) =>
                  setNewCamera({ ...newCamera, location: val })
                }
                classNames={{ label: "text-zinc-300" }}
              />
              <Select
                label="สถานะเริ่มต้น"
                labelPlacement="outside"
                variant="bordered"
                selectedKeys={[newCamera.status]}
                onChange={(e) =>
                  setNewCamera({ ...newCamera, status: e.target.value })
                }
                classNames={{ label: "text-zinc-300", trigger: "text-white" }}
              >
                <SelectItem key="online" textValue="Online">
                  Online
                </SelectItem>
                <SelectItem key="offline" textValue="Offline">
                  Offline
                </SelectItem>
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button
                color="primary"
                onPress={handleAddCamera}
                isDisabled={!newCamera.id || !newCamera.name || isSaving}
                isLoading={isSaving}
                className="font-bold px-8"
              >
                บันทึกข้อมูล
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
