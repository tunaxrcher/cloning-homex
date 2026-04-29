"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Tooltip,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  Layers,
  X as CloseIcon,
  Plus,
  MousePointerClick,
  Camera,
  History,
  Eye,
  Clock,
  PlusCircle,
  View,
  Map,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// 🌟 โหลด Viewer 360 แบบ Dynamic
const DynamicInsta360Viewer = dynamic(() => import("./Insta360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/80">
      <Spinner size="lg" color="primary" label="กำลังโหลดภาพ 360 องศา..." />
    </div>
  ),
});

export default function CombinedFloorPlanViewerModal({
  selectedFloorPlan,
  setSelectedFloorPlan,
  isAddingMode,
  setIsAddingMode,
  setTempPoint,
  handleCancelAddPoint,
  handleMapClick,
  selectedMedia,
  setSelectedMedia,
  tempPoint,
  handleDeletePoint,
  handleAddNewHistory,
}: any) {
  const [currentImage, setCurrentImage] = useState<any>(null);

  useEffect(() => {
    if (selectedMedia) {
      const latestHistory =
        selectedMedia.histories && selectedMedia.histories.length > 0
          ? selectedMedia.histories[0]
          : null;

      setCurrentImage({
        ...selectedMedia,
        imageUrl: latestHistory?.imageUrl || selectedMedia.thumbnail,
        versionDate: latestHistory?.createdAt || null,
      });
    } else {
      setCurrentImage(null);
    }
  }, [selectedMedia]);

  const formattedDate = currentImage?.versionDate
    ? new Date(currentImage.versionDate).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const captionText = currentImage?.title
    ? `<b>${currentImage.title}</b> ${formattedDate ? `(ถ่ายเมื่อ: ${formattedDate})` : ""}`
    : "";

  const currentIndex =
    selectedFloorPlan?.points?.findIndex(
      (p: any) => p.id === selectedMedia?.id,
    ) ?? -1;
  const totalPoints = selectedFloorPlan?.points?.length || 0;

  // ซ้ายย้อนกลับ (-1)
  const handlePrevPoint = () => {
    if (currentIndex > 0) {
      setSelectedMedia(selectedFloorPlan.points[currentIndex - 1]);
    }
  };

  // ขวาไปหน้า (+1)
  const handleNextPoint = () => {
    if (currentIndex >= 0 && currentIndex < totalPoints - 1) {
      setSelectedMedia(selectedFloorPlan.points[currentIndex + 1]);
    }
  };

  return (
    <Modal
      isOpen={!!selectedFloorPlan}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedFloorPlan(null);
          setIsAddingMode(false);
          setTempPoint(null);
          setSelectedMedia(null);
        }
      }}
      size="full"
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      classNames={{
        base: "bg-zinc-950 border border-white/10",
        header: "border-b border-white/10 bg-zinc-900",
        closeButton: "z-50 hover:bg-white/10 text-white",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex justify-between items-center pr-10 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold flex items-center gap-2 text-white">
                  <Layers className="text-primary" size={20} />
                  {selectedFloorPlan?.name}
                </span>
                <span className="text-xs text-zinc-500 font-normal">
                  มีจุด 360 ทั้งหมด {selectedFloorPlan?.points?.length || 0} จุด
                </span>
              </div>
              {isAddingMode ? (
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  onPress={handleCancelAddPoint}
                  endContent={<CloseIcon size={16} />}
                >
                  ยกเลิกการวาง
                </Button>
              ) : (
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => setIsAddingMode(true)}
                  endContent={<Plus size={16} />}
                >
                  เพิ่มจุด 360° ลงบนแปลน
                </Button>
              )}
            </ModalHeader>
            <ModalBody className="p-0 flex flex-col md:flex-row bg-black overflow-hidden h-full">
              {/* =======================================
                  คอลัมน์ซ้าย: แผนที่ (Floor Plan)
              ======================================== */}
              <div className="w-full md:w-[35%] lg:w-[30%] border-r border-white/10 p-4 bg-zinc-950 flex flex-col relative overflow-y-auto custom-scrollbar">
                {isAddingMode && (
                  <div className="bg-primary/20 border border-primary text-primary px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse mb-3">
                    <MousePointerClick size={16} />
                    <p className="font-bold text-xs">คลิกบนแผนที่เพื่อวางจุด</p>
                  </div>
                )}

                <div
                  className={`relative w-full aspect-auto bg-black rounded-xl overflow-hidden group border border-white/10 ${
                    isAddingMode ? "cursor-crosshair" : "cursor-default"
                  }`}
                  onClick={handleMapClick}
                >
                  <img
                    src={selectedFloorPlan?.imageUrl}
                    alt="Floor Plan"
                    className={`w-full h-auto object-contain transition-opacity duration-500 ${
                      isAddingMode
                        ? "opacity-30"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  />
                  {selectedFloorPlan?.points?.map((point: any) => {
                    const isSelected = selectedMedia?.id === point.id;

                    return (
                      <div
                        key={point.id}
                        className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-10 group/pin"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      >
                        <Tooltip
                          content={point.title}
                          placement="top"
                          color="primary"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMedia(point);
                              setIsAddingMode(false);
                            }}
                            className={`relative text-white p-2 rounded-full shadow-lg border transition-all duration-300
                              ${
                                isSelected
                                  ? "bg-warning border-warning scale-125 z-30"
                                  : "bg-primary border-white hover:scale-110"
                              }
                            `}
                          >
                            <Camera
                              size={isSelected ? 16 : 14}
                              className={isSelected ? "text-black" : ""}
                            />
                          </button>
                        </Tooltip>
                        {handleDeletePoint && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePoint(point);
                              if (isSelected) setSelectedMedia(null);
                            }}
                            className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full opacity-0 group-hover/pin:opacity-100 transition-opacity z-40"
                          >
                            <CloseIcon size={10} strokeWidth={3} />
                          </button>
                        )}
                        {isSelected && (
                          <div className="absolute w-10 h-10 bg-warning/40 rounded-full animate-ping opacity-75 -z-10"></div>
                        )}
                      </div>
                    );
                  })}
                  {tempPoint && (
                    <div
                      className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{
                        left: `${tempPoint.x}%`,
                        top: `${tempPoint.y}%`,
                      }}
                    >
                      <div className="relative bg-warning text-black p-2 rounded-full shadow-lg border border-white animate-bounce">
                        <Camera size={14} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* =======================================
                  คอลัมน์กลาง+ขวา: Viewer และ ประวัติ
              ======================================== */}
              <div className="flex-1 flex flex-col md:flex-row bg-black relative">
                {selectedMedia ? (
                  <>
                    <div className="flex-1 h-[50vh] md:h-full relative border-r border-white/10 group/viewer">
                      <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-start pointer-events-none">
                        <div className="flex flex-col">
                          <span className="text-white font-bold flex items-center gap-2 drop-shadow-md">
                            <Eye className="text-primary" size={18} />
                            {currentImage?.title}
                          </span>
                          {formattedDate && (
                            <span className="text-zinc-300 text-xs flex items-center gap-1 drop-shadow-md">
                              <Clock size={12} /> {formattedDate}
                            </span>
                          )}
                        </div>
                      </div>
                      {currentIndex > 0 && (
                        <button
                          onClick={handlePrevPoint}
                          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-primary/80 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-xl opacity-50 hover:opacity-100 hover:scale-110"
                        >
                          <ChevronLeft size={28} />
                        </button>
                      )}
                      {currentIndex >= 0 && currentIndex < totalPoints - 1 && (
                        <button
                          onClick={handleNextPoint}
                          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-primary/80 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-xl opacity-50 hover:opacity-100 hover:scale-110"
                        >
                          <ChevronRight size={28} />
                        </button>
                      )}

                      {currentImage?.imageUrl ? (
                        <DynamicInsta360Viewer
                          key={currentImage.imageUrl}
                          imageUrl={currentImage.imageUrl}
                          caption={captionText}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                          <History size={48} className="mb-4 opacity-30" />
                          <p>ยังไม่มีประวัติรูปภาพในจุดนี้</p>
                        </div>
                      )}
                    </div>
                    <div className="w-full md:w-64 lg:w-72 bg-zinc-900/80 p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-sm font-bold flex items-center gap-2 text-white">
                          <History size={16} className="text-primary" />{" "}
                          ประวัติรูปภาพ
                        </span>
                        <Chip
                          size="sm"
                          color="primary"
                          variant="flat"
                          className="text-[10px]"
                        >
                          {selectedMedia.histories?.length || 0} เวอร์ชัน
                        </Chip>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {selectedMedia.histories &&
                        selectedMedia.histories.length > 0 ? (
                          selectedMedia.histories.map(
                            (history: any, index: number) => {
                              const isActive =
                                currentImage?.versionDate === history.createdAt;
                              return (
                                <button
                                  key={history.id}
                                  onClick={() => {
                                    setCurrentImage({
                                      ...selectedMedia,
                                      imageUrl: history.imageUrl,
                                      versionDate: history.createdAt,
                                    });
                                  }}
                                  className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all ${
                                    isActive
                                      ? "bg-primary/20 border border-primary text-primary shadow-lg"
                                      : "bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300"
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold">
                                      {index === 0 && (
                                        <span className="text-[10px] text-warning mr-1">
                                          [ล่าสุด]
                                        </span>
                                      )}
                                      {new Date(
                                        history.createdAt,
                                      ).toLocaleDateString("th-TH")}
                                    </span>
                                    <span className="text-[10px] opacity-70">
                                      {new Date(
                                        history.createdAt,
                                      ).toLocaleTimeString("th-TH", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  {isActive && <View size={14} />}
                                </button>
                              );
                            },
                          )
                        ) : (
                          <p className="text-xs text-center text-zinc-500 italic mt-4">
                            ไม่มีประวัติก่อนหน้า
                          </p>
                        )}
                      </div>
                      {handleAddNewHistory && (
                        <Button
                          color="primary"
                          className="w-full font-bold shadow-lg"
                          startContent={<PlusCircle size={16} />}
                          onPress={() => handleAddNewHistory(selectedMedia)}
                        >
                          อัปโหลดรูปปัจจุบัน
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500">
                    <Map size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-bold text-zinc-400">
                      โปรดเลือกจุดบนแผนที่
                    </p>
                    <p className="text-sm">
                      คลิกที่ไอคอนกล้องบนแปลนเพื่อดูภาพ 360°
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
