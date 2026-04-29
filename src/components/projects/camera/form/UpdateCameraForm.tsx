"use client";

import { useState, useEffect } from "react";
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
import { toast } from "react-toastify";
import { updateCamera } from "@/lib/actions/actionCamera";
import { useRouter } from "next/navigation";
import { UpdateCameraFormProps } from "@/lib/type";


export default function UpdateCameraForm({
  camera,
  isOpen,
  onOpenChange,
  projectId,
  onSuccess,
}: UpdateCameraFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    name: "",
    id: "", // SN
    location: "",
    status: "online",
  });

  // 🌟 เมื่อเปิด Modal หรือเปลี่ยนตัวกล้อง ให้ดึงข้อมูลเก่ามาใส่ฟอร์ม
  useEffect(() => {
    if (camera) {
      setFormData({
        name: camera.name || "",
        id: camera.id || "",
        location: camera.location || "",
        status: camera.status || "online",
      });
    }
  }, [camera]);

  const handleUpdate = async () => {
    if (!formData.id || !formData.name || !camera?.dbId) return;
    setIsSaving(true);

    try {
      const res = await updateCamera(camera.dbId, {
        cameraName: formData.name,
        cameraSN: formData.id,
        cameraLocation: formData.location,
        status: formData.status,
      });

      if (res.success && res.data) {
        const camData = res.data as any;
        
        const updatedCamDB = {
          dbId: camData.id,
          id: camData.cameraSN,
          name: camData.cameraName,
          location: camData.cameraLocation || "",
          status: camData.status,
        };

        onSuccess(updatedCamDB); 
        onOpenChange(false); 
        toast.success("แก้ไขข้อมูลกล้องสำเร็จ!");
        router.refresh();
      } else {
        toast.error(res.error || "แก้ไขข้อมูลไม่สำเร็จ");
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
              <span>แก้ไขข้อมูลกล้อง</span>
            </ModalHeader>
            <ModalBody className="py-6 space-y-4">
              <Input
                label="Device Serial Number (ID)"
                placeholder="เช่น BG123456"
                labelPlacement="outside"
                variant="bordered"
                value={formData.id}
                onValueChange={(val) => setFormData({ ...formData, id: val })}
                classNames={{ label: "text-zinc-300" }}
              />
              <Input
                label="ชื่อเรียกกล้อง"
                placeholder="เช่น กล้องประตูหน้า"
                labelPlacement="outside"
                variant="bordered"
                value={formData.name}
                onValueChange={(val) => setFormData({ ...formData, name: val })}
                classNames={{ label: "text-zinc-300" }}
              />
              <Input
                label="ตำแหน่งที่ติดตั้ง (Location)"
                placeholder="เช่น โซน A ทางเข้า"
                labelPlacement="outside"
                variant="bordered"
                value={formData.location}
                onValueChange={(val) => setFormData({ ...formData, location: val })}
                classNames={{ label: "text-zinc-300" }}
              />
              <Select
                label="สถานะ"
                labelPlacement="outside"
                variant="bordered"
                selectedKeys={[formData.status]}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                classNames={{ label: "text-zinc-300", trigger: "text-white" }}
              >
                <SelectItem key="online" textValue="Online">Online</SelectItem>
                <SelectItem key="offline" textValue="Offline">Offline</SelectItem>
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button
                color="primary"
                onPress={handleUpdate}
                isDisabled={!formData.id || !formData.name || isSaving}
                isLoading={isSaving}
                className="font-bold px-8"
              >
                บันทึกการแก้ไข
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}