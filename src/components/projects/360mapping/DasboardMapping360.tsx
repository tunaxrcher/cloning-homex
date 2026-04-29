"use client";

import { useEffect, useState } from "react";
import { Map, Plus, Layers, Camera, Trash2 } from "lucide-react";
import {
  Button,
  useDisclosure,
  Card,
  CardBody,
  CardFooter,
  Tooltip,
  Spinner,
} from "@heroui/react";
import { toast } from "react-toastify";
// import FloorPlanModal from "./CombinedFloorPlanViewerModal";
// import Viewer360Modal from "./Viewer360Modal";
import AddFloorPlanModal from "./form/AddFloorPlanModal";
import AddPointModal from "./form/AddPointModal";
import { DashboardCameraProp } from "@/lib/type";
import {
  addPointVersion,
  createFloorPlan,
  createPoint360Action,
  deleteFloorPlanAction,
  deletePoint360Action,
  getFloorPlansByProject,
} from "@/lib/actions/actiom360";
import { useRouter } from "next/navigation";
import {
  handleImageUpload,
  uploadImageFormData,
} from "@/lib/actions/actionIndex";
import DeleteFloorPlanModal from "./DeleteFloorPlanModal";
import DeletePointModal from "./DeletePointModal";
import AddHistoryModal from "./form/AddHistoryModal";
import CombinedFloorPlanViewerModal from "./CombinedFloorPlanViewerModal";

const DasboardMapping360 = ({
  projectId,
  organizationId,
  currentUserId,
}: DashboardCameraProp) => {
  const router = useRouter();

  const {
    isOpen: isAddFloorPlanOpen,
    onOpen: onAddFloorPlanOpen,
    onOpenChange: onAddFloorPlanChange,
  } = useDisclosure();
  const {
    isOpen: isAddPointOpen,
    onOpen: onAddPointOpen,
    onOpenChange: onAddPointChange,
  } = useDisclosure();

  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [tempPoint, setTempPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [newFloorPlan, setNewFloorPlan] = useState({ name: "", imageUrl: "" });
  const [newPointData, setNewPointData] = useState({
    title: "",
    location: "",
    thumbnail: "",
  });

  const [floorPlans, setFloorPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFloorPlan, setIsSavingFloorPlan] = useState(false);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanToDelete, setFloorPlanToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [point360File, setPoint360File] = useState<File | null>(null);
  const [isSavingPoint, setIsSavingPoint] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<any>(null);
  const [isDeletingPoint, setIsDeletingPoint] = useState(false);
  const [pointToUpdateHistory, setPointToUpdateHistory] = useState<any>(null);
  const {
    isOpen: isAddHistoryOpen,
    onOpen: onAddHistoryOpen,
    onOpenChange: onAddHistoryChange,
  } = useDisclosure();

  const handleSaveFloorPlan = async () => {
    if (!newFloorPlan.name || !floorPlanFile) {
      toast.error("กรุณากรอกชื่อและเลือกไฟล์แปลนพื้น");
      return;
    }

    setIsSavingFloorPlan(true);

    try {
      const s3Url = await handleImageUpload(
        floorPlanFile,
        "360mapping/floorplans",
      );

      const res = await createFloorPlan({
        name: newFloorPlan.name,
        imageUrl: s3Url,
        projectId: Number(projectId),
        organizationId: Number(organizationId),
        userId: Number(currentUserId),
      });

      if (res.success && res.data) {
        setFloorPlans([res.data as any, ...floorPlans]);

        setNewFloorPlan({ name: "", imageUrl: "" });
        setFloorPlanFile(null);
        onAddFloorPlanChange();

        toast.success("อัปโหลดและเพิ่มแปลนพื้นใหม่สำเร็จ!");
        router.refresh();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error: any) {
      toast.error(error.message || "อัปโหลดหรือเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    } finally {
      setIsSavingFloorPlan(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!floorPlanToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteFloorPlanAction(
        Number(floorPlanToDelete.id),
        floorPlanToDelete.imageUrl,
        Number(projectId),
      );

      if (res.success) {
        setFloorPlans(
          floorPlans.filter((fp) => fp.id !== floorPlanToDelete.id),
        );
        setFloorPlanToDelete(null);
        toast.success("ลบแปลนพื้นและรูปภาพสำเร็จ!");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTempPoint({ x, y });
    setIsAddingMode(false);
    onAddPointOpen();
  };

  const handleSavePoint = async () => {
    if (
      !newPointData.title ||
      !tempPoint ||
      !selectedFloorPlan ||
      !point360File
    ) {
      toast.error("กรุณากรอกข้อมูลและเลือกไฟล์ภาพ 360 ให้ครบถ้วน");
      return;
    }

    setIsSavingPoint(true);
    try {
      const s3Url = await handleImageUpload(point360File, "360mapping/history");
      const res = await createPoint360Action({
        title: newPointData.title,
        location: newPointData.location || "ไม่ระบุตำแหน่ง",
        thumbnail: s3Url,
        x: tempPoint.x,
        y: tempPoint.y,
        floorPlanId: selectedFloorPlan.id,
        organizationId: Number(organizationId),
        projectId: Number(projectId),
        userId: Number(currentUserId),
      });

      if (res.success && res.data) {
        const updatedPlans = floorPlans.map((fp) =>
          fp.id === selectedFloorPlan.id
            ? { ...fp, points: [...fp.points, res.data] }
            : fp,
        );
        setFloorPlans(updatedPlans as any);
        setSelectedFloorPlan({
          ...selectedFloorPlan,
          points: [...selectedFloorPlan.points, res.data],
        });

        setTempPoint(null);
        setPoint360File(null);
        setNewPointData({ title: "", location: "", thumbnail: "" });
        onAddPointChange();
        toast.success("ปักหมุดสำเร็จ!");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการปักหมุด");
    } finally {
      setIsSavingPoint(false);
    }
  };

  const handleDeletePoint = (point: any) => {
    setPointToDelete(point);
  };

  const handleConfirmDeletePoint = async () => {
    if (!pointToDelete) return;

    setIsDeletingPoint(true);
    try {
      const imageFallback =
        pointToDelete.thumbnail ||
        (pointToDelete.histories?.length > 0
          ? pointToDelete.histories[0].imageUrl
          : "");

      const res = await deletePoint360Action(
        pointToDelete.id,
        imageFallback,
        Number(projectId),
      );

      if (res.success) {
        const updatedPoints = selectedFloorPlan.points.filter(
          (p: any) => p.id !== pointToDelete.id,
        );


        const updatedPlans = floorPlans.map((fp) =>
          fp.id === selectedFloorPlan.id
            ? { ...fp, points: updatedPoints }
            : fp,
        );


        setFloorPlans(updatedPlans as any);
        setSelectedFloorPlan({ ...selectedFloorPlan, points: updatedPoints });
        setPointToDelete(null);
        toast.success("ลบจุดและรูปภาพทั้งหมดสำเร็จ!");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error("Delete Point Error:", error);
      toast.error("ลบข้อมูลล้มเหลว โปรดลองอีกครั้ง");
    } finally {
      setIsDeletingPoint(false);
    }
  };

  const handleAddNewHistory = (point: any) => {
    setPointToUpdateHistory(point);
    onAddHistoryOpen();
  };

  const handleSaveNewVersion = async () => {
    if (!point360File || !pointToUpdateHistory) return;

    setIsSavingPoint(true);
    try {
      const formData = new FormData();
      formData.append("file", point360File);
      formData.append("path", "360mapping/history");

      const uploadRes = await uploadImageFormData(formData);

      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || "อัปโหลดรูปภาพล้มเหลว");
      }

      const res = await addPointVersion({
        pointId: pointToUpdateHistory.id,
        imageUrl: uploadRes.url,
        projectId: Number(projectId),
      });

      if (res.success) {
        const updatedPlans = floorPlans.map((fp) => {
          const updatedPoints = fp.points.map((p: any) => {
            if (p.id === pointToUpdateHistory.id) {
              return {
                ...p,
                histories: [res.data, ...(p.histories || [])],
              };
            }
            return p;
          });
          return { ...fp, points: updatedPoints };
        });

        setFloorPlans(updatedPlans as any);

        if (selectedFloorPlan) {
          const activePlan = updatedPlans.find(
            (fp) => fp.id === selectedFloorPlan.id,
          );
          setSelectedFloorPlan(activePlan);
        }

        if (selectedMedia && selectedMedia.id === pointToUpdateHistory.id) {
          setSelectedMedia((prev: any) => ({
            ...prev,
            histories: [res.data, ...(prev.histories || [])],
          }));
        }
        setPoint360File(null);
        setPointToUpdateHistory(null);
        onAddHistoryChange();
        toast.success("บันทึกรูปภาพเวอร์ชันใหม่สำเร็จ!");
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error(
        error.message || "อัปโหลดล้มเหลว (ตรวจสอบขนาดไฟล์และอินเทอร์เน็ต)",
      );
    } finally {
      setIsSavingPoint(false);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const res = await getFloorPlansByProject(
          Number(projectId),
          Number(organizationId),
        );
        if (res.success && res.data) {
          setFloorPlans(res.data as any[]);
        } else {
          toast.error(res.error || "โหลดข้อมูลแปลนพื้นไม่สำเร็จ");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && organizationId) {
      fetchPlans();
    }
  }, [projectId, organizationId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-default-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Map className="text-primary" /> ระบบสำรวจไซต์งาน 360°
          </h1>
          <p className="text-default-500 text-sm mt-1">
            เลือกแปลนพื้นที่ต้องการ เพื่อดูและจัดการภาพ 360 องศา
          </p>
        </div>
        <Button
          color="primary"
          className="font-bold shadow-lg"
          endContent={<Plus size={18} />}
          onPress={onAddFloorPlanOpen}
        >
          เพิ่มแปลนพื้นใหม่
        </Button>
      </div>
      {isLoading ? (
        <div className="w-full py-32 flex flex-col items-center justify-center space-y-4">
          <Spinner
            size="lg"
            color="primary"
            labelColor="primary"
            label="กำลังโหลดข้อมูลแปลนพื้น..."
          />
        </div>
      ) : floorPlans.length === 0 ? (
        <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-700/50 rounded-3xl text-zinc-500 bg-zinc-900/30">
          <Layers size={48} strokeWidth={1} className="mb-4 opacity-50" />
          <p className="font-medium">ยังไม่มีแปลนพื้นในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {floorPlans.map((plan) => (
            <Card
              key={plan.id}
              isPressable
              onPress={() => setSelectedFloorPlan(plan)}
              className="border-none shadow-md bg-zinc-900 text-white overflow-hidden h-full group transition-transform hover:-translate-y-1"
            >
              <CardBody className="p-0 relative aspect-video flex items-center justify-center bg-black shrink-0 overflow-hidden">
                <img
                  src={plan.imageUrl}
                  alt={plan.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold shadow-lg flex items-center gap-1">
                  <Camera size={14} className="text-primary" />{" "}
                  {plan.points?.length || 0} จุด
                </div>
                <Tooltip
                  content="ลบแปลนพื้นนี้"
                  color="danger"
                  placement="right"
                >
                  <div
                    className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20 hover:scale-110 bg-danger text-white w-8 h-8 flex items-center justify-center rounded-medium cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFloorPlanToDelete(plan);
                    }}
                  >
                    <Trash2 size={16} />
                  </div>
                </Tooltip>
              </CardBody>
              <CardFooter className="px-4 py-4 bg-zinc-800/80 border-t border-white/5 flex flex-col items-start">
                <h3 className="font-bold text-sm sm:text-base truncate w-full text-zinc-100 group-hover:text-primary transition-colors">
                  {plan.name}
                </h3>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CombinedFloorPlanViewerModal
        selectedFloorPlan={selectedFloorPlan}
        setSelectedFloorPlan={setSelectedFloorPlan}
        isAddingMode={isAddingMode}
        setIsAddingMode={setIsAddingMode}
        setTempPoint={setTempPoint}
        handleCancelAddPoint={() => {
          setIsAddingMode(false);
          setTempPoint(null);
        }}
        handleMapClick={handleMapClick}
        setSelectedMedia={setSelectedMedia}
        tempPoint={tempPoint}
        handleDeletePoint={handleDeletePoint}
        handleAddNewHistory={handleAddNewHistory}
        selectedMedia={selectedMedia}
      />

      {/* <Viewer360Modal
        selectedMedia={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        handleAddNewHistory={handleAddNewHistory}
      /> */}

      <AddFloorPlanModal
        isOpen={isAddFloorPlanOpen}
        onOpenChange={(open: boolean) => {
          if (!open) setFloorPlanFile(null);
          onAddFloorPlanChange();
        }}
        newFloorPlan={newFloorPlan}
        setNewFloorPlan={setNewFloorPlan}
        handleSaveFloorPlan={handleSaveFloorPlan}
        isSaving={isSavingFloorPlan}
        floorPlanFile={floorPlanFile}
        setFloorPlanFile={setFloorPlanFile}
      />

      <AddPointModal
        isOpen={isAddPointOpen}
        onOpenChange={onAddPointChange}
        setTempPoint={setTempPoint}
        newPointData={newPointData}
        setNewPointData={setNewPointData}
        handleSavePoint={handleSavePoint}
        point360File={point360File}
        setPoint360File={setPoint360File}
        isSavingPoint={isSavingPoint}
      />

      <AddHistoryModal
        isOpen={isAddHistoryOpen}
        onOpenChange={(open: boolean) => {
          if (!open) setPoint360File(null);
          onAddHistoryChange();
        }}
        pointToUpdateHistory={pointToUpdateHistory}
        point360File={point360File}
        setPoint360File={setPoint360File}
        isSaving={isSavingPoint}
        onSave={handleSaveNewVersion}
      />

      <DeleteFloorPlanModal
        isOpen={!!floorPlanToDelete}
        onOpenChange={(open: boolean) => {
          if (!open && !isDeleting) setFloorPlanToDelete(null);
        }}
        floorPlanToDelete={floorPlanToDelete}
        isDeleting={isDeleting}
        handleConfirmDelete={handleConfirmDelete}
      />

      <DeletePointModal
        isOpen={!!pointToDelete}
        onOpenChange={(open: boolean) => {
          if (!open && !isDeletingPoint) setPointToDelete(null);
        }}
        pointToDelete={pointToDelete}
        isDeleting={isDeletingPoint}
        handleConfirmDeletePoint={handleConfirmDeletePoint}
      />
    </div>
  );
};

export default DasboardMapping360;
