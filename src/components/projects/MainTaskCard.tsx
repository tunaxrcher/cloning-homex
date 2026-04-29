import { useMemo } from "react";
import { calcProgress, getStatusMainTaskColor } from "@/lib/setting_data";
import { MainTaskCardProps } from "@/lib/type";
import { Card, CardBody, Chip, Progress, Tooltip } from "@heroui/react";
import { Banknote, AlertTriangle, Clock, Package, PackageX, PackageMinus } from "lucide-react";

const MainTaskCard = ({ task, onSelect }: MainTaskCardProps) => {
  const procurementAlerts = useMemo(() => {
    const links = task.procurementTaskLinks || [];
    if (links.length === 0) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueNames: string[] = [];
    const atRiskNames: string[] = [];
    const lowStockNames: string[] = [];
    const outOfStockNames: string[] = [];
    const total = links.length;
    const arrived = links.filter((l) => l.procurementItem.status === "ARRIVED").length;

    for (const link of links) {
      const item = link.procurementItem;
      if (item.status === "ARRIVED") continue;

      if (item.status === "OUT_OF_STOCK") {
        outOfStockNames.push(item.materialName);
        continue;
      }
      if (item.status === "LOW_STOCK") {
        lowStockNames.push(item.materialName);
        continue;
      }

      if (!item.expectedDate) continue;

      const expected = new Date(item.expectedDate);
      expected.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const threshold = item.alertDaysBefore ?? 3;

      if (daysLeft < 0) overdueNames.push(item.materialName);
      else if (daysLeft <= threshold) atRiskNames.push(item.materialName);
    }

    const hasAlerts = overdueNames.length > 0 || atRiskNames.length > 0 || lowStockNames.length > 0 || outOfStockNames.length > 0;
    return { overdueNames, atRiskNames, lowStockNames, outOfStockNames, total, arrived, hasAlerts };
  }, [task.procurementTaskLinks]);

  return (
    <Card
      isPressable
      onPress={() => onSelect(task.id)}
      // 🌟 1. เพิ่ม overflow-hidden เพื่อการันตีว่าไม่มีอะไรในการ์ดนี้ล้นออกไปข้างนอกได้
      className="h-full w-full bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800 transition-all hover:shadow-md overflow-hidden"
    >
      <CardBody className="space-y-2.5 sm:space-y-3 p-3 sm:p-4 w-full overflow-hidden">
        <div className="relative">
          <img
            src={task.coverImageUrl || "/placeholder-image.jpg"}
            className="h-32 sm:h-40 w-full object-cover rounded-lg shrink-0"
            alt={task.taskName || "Task"}
            loading="lazy"
          />
          {procurementAlerts && procurementAlerts.hasAlerts && (
            <div className={`absolute top-2 right-2 ${
              procurementAlerts.overdueNames.length > 0 || procurementAlerts.outOfStockNames.length > 0
                ? "bg-danger-500" : "bg-warning-500"
            } text-white rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-md`}>
              <AlertTriangle size={10} />
              <span className="text-[10px] font-bold">
                {procurementAlerts.overdueNames.length + procurementAlerts.atRiskNames.length + procurementAlerts.lowStockNames.length + procurementAlerts.outOfStockNames.length}
              </span>
            </div>
          )}
        </div>

        {/* 🌟 2. เพิ่ม w-full และ min-w-0 ตรงนี้สำคัญมาก! บังคับให้ flex หดตัวลง เพื่อให้ truncate ทำงานได้ */}
        <div className="flex justify-between items-start gap-2 w-full min-w-0">
          <p className="truncate text-sm sm:text-base font-medium flex-1 min-w-0">
            {task.taskName || "Untitled Task"}
          </p>
          <Chip
            size="sm"
            className="text-[10px] sm:text-xs shrink-0"
            color={getStatusMainTaskColor(task.status)}
            variant="flat"
          >
            {task.status || "TODO"}
          </Chip>
        </div>

        {procurementAlerts && (
          <div className="flex flex-wrap gap-1.5 w-full">
            {procurementAlerts.overdueNames.length > 0 && (
              <Tooltip content={procurementAlerts.overdueNames.join(", ")}>
                <Chip size="sm" color="danger" variant="flat" className="text-[10px]" startContent={<AlertTriangle size={10} />}>
                  เลยกำหนด {procurementAlerts.overdueNames.length}
                </Chip>
              </Tooltip>
            )}
            {procurementAlerts.outOfStockNames.length > 0 && (
              <Tooltip content={procurementAlerts.outOfStockNames.join(", ")}>
                <Chip size="sm" color="danger" variant="flat" className="text-[10px]" startContent={<PackageX size={10} />}>
                  ขาดสต็อก {procurementAlerts.outOfStockNames.length}
                </Chip>
              </Tooltip>
            )}
            {procurementAlerts.lowStockNames.length > 0 && (
              <Tooltip content={procurementAlerts.lowStockNames.join(", ")}>
                <Chip size="sm" color="warning" variant="flat" className="text-[10px]" startContent={<PackageMinus size={10} />}>
                  ใกล้หมด {procurementAlerts.lowStockNames.length}
                </Chip>
              </Tooltip>
            )}
            {procurementAlerts.atRiskNames.length > 0 && (
              <Tooltip content={procurementAlerts.atRiskNames.join(", ")}>
                <Chip size="sm" color="warning" variant="flat" className="text-[10px]" startContent={<Clock size={10} />}>
                  ใกล้กำหนด {procurementAlerts.atRiskNames.length}
                </Chip>
              </Tooltip>
            )}
            {!procurementAlerts.hasAlerts && (
              <Chip size="sm" color="success" variant="flat" className="text-[10px]" startContent={<Package size={10} />}>
                วัสดุพร้อม {procurementAlerts.arrived}/{procurementAlerts.total}
              </Chip>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] sm:text-xs text-default-500 dark:text-zinc-400 w-full">
          <p className="whitespace-nowrap shrink-0">
            Checklist{" "}
            {(task.details || []).filter((s: any) => !!s.status).length || 0}/
            {(task.details || []).length || 0}
          </p>

          <div className="flex items-center gap-1 sm:gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 sm:px-2 rounded-md shrink-0 max-w-full min-w-0">
            <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">
              {(task.budget || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <Progress
          size="sm"
          value={calcProgress(task)}
          color={
            getStatusMainTaskColor(task.status) === "default"
              ? "primary"
              : getStatusMainTaskColor(task.status)
          }
          className="pt-1 sm:pt-0 w-full"
        />
      </CardBody>
    </Card>
  );
};

export default MainTaskCard;
