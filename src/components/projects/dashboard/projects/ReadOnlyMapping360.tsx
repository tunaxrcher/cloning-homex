"use client";

import { useEffect, useState } from "react";
import { Camera, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { Spinner } from "@heroui/react";
import { getFloorPlansByProject } from "@/lib/actions/actiom360";
import CombinedFloorPlanViewerModal from "../../360mapping/CombinedFloorPlanViewerModal";
import { ReadOnlyMapping360Props } from "@/lib/type";

const ReadOnlyMapping360 = ({
  projectId,
  organizationId,
}: ReadOnlyMapping360Props) => {
  const [floorPlans, setFloorPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const [showAll, setShowAll] = useState(false);

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
        }
      } catch (error) {
        console.error("Fetch 360 Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && organizationId) {
      fetchPlans();
    }
  }, [projectId, organizationId]);

  // 🌟 ปรับให้แสดง 4 รายการ (Grid 2x2) ถ้ายังไม่กด Show All
  const displayedPlans = showAll ? floorPlans : floorPlans.slice(0, 4);
  const hasMore = floorPlans.length > 4;

  return (
    <div className="w-full h-full relative flex flex-col">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Spinner size="md" color="secondary" />
          <p className="text-xs text-zinc-500 animate-pulse">
            กำลังโหลดแปลนพื้น 360°...
          </p>
        </div>
      ) : floorPlans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-700/50 rounded-lg text-zinc-500 bg-zinc-900/30">
          <Layers size={32} strokeWidth={1} className="mb-2 opacity-50" />
          <p className="text-xs font-medium">ยังไม่มีแปลนพื้นในระบบ</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3 pb-2">
          {/* 🌟 เปลี่ยนเป็น Grid 2 คอลัมน์ (ซ้าย-ขวา) 🌟 */}
          <div className="grid grid-cols-2 gap-3">
            {displayedPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedFloorPlan(plan)}
                className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer border border-zinc-800 hover:border-purple-500/50 transition-all shadow-md bg-black flex flex-col justify-end"
              >
                {/* ภาพพื้นหลัง */}
                <img
                  src={plan.imageUrl}
                  alt={plan.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-all duration-500 group-hover:scale-110"
                />

                {/* แถบเงาดำไล่สีจากล่างขึ้นบน เพื่อให้อ่านตัวหนังสือชัดขึ้น */}
                <div className="relative z-10 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-8">
                  <h3 className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-purple-400 transition-colors line-clamp-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                    <Camera size={12} className="text-purple-500" />
                    <span>{plan.points?.length || 0} จุด</span>
                  </div>
                </div>

                {/* 🌟 เอฟเฟกต์ Hover (กดเพื่อดู) จะโผล่มาตรงกลางเมื่อเอาเมาส์ชี้ */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0">
                  <div className="bg-purple-500/20 backdrop-blur-sm text-purple-300 text-[10px] px-2 py-1 rounded-full border border-purple-500/30 font-medium">
                    ดู 360°
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ปุ่ม ดูเพิ่มเติม (จะโชว์ก็ต่อเมื่อมีเกิน 4 รายการ) */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/30 hover:bg-zinc-800/60 rounded-lg border border-zinc-800/50 transition-all"
            >
              {showAll ? (
                <>
                  ย่อรายการลง <ChevronUp size={14} />
                </>
              ) : (
                <>
                  ดูเพิ่มเติมอีก {floorPlans.length - 4} รายการ{" "}
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {selectedFloorPlan && (
        <CombinedFloorPlanViewerModal
          selectedFloorPlan={selectedFloorPlan}
          setSelectedFloorPlan={setSelectedFloorPlan}
          isAddingMode={false}
          setIsAddingMode={() => {}}
          setTempPoint={() => {}}
          handleCancelAddPoint={() => {}}
          handleMapClick={() => {}}
          setSelectedMedia={setSelectedMedia}
          tempPoint={null}
          handleDeletePoint={null}
          handleAddNewHistory={null}
          selectedMedia={selectedMedia}
        />
      )}
    </div>
  );
};

export default ReadOnlyMapping360;
