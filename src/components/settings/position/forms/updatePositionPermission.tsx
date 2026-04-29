"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Input,
  Divider
} from "@heroui/react";

import { ShieldCheck, Search, Check, X } from "lucide-react";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { updatePositionPermission } from "@/lib/actions/actionPositionPermission";

export default function UpdatePositionPermission({
  isOpen,
  onOpenChange,
  position,
  permissions,
}: any) {

  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  /* FILTER */
  const filtered = useMemo(() => {
    if (!permissions) return [];
    const keyword = search.toLowerCase();
    return permissions
      .filter((p: any) => p.isActive)
      .filter((p: any) =>
        (p.permissionName ?? "").toLowerCase().includes(keyword) ||
        (p.permissionDesc ?? "").toLowerCase().includes(keyword)
      );
  }, [permissions, search]);

  /* TOGGLE */
  const handleToggle = (permission: any, allowed: boolean) => {
    setLoadingId(permission.id);
    startTransition(async () => {
      const res = await updatePositionPermission(
        position.id,
        permission.id,
        !allowed
      );
      if (res.success) {
        toast.success(
          `${!allowed ? "เปิดสิทธิ" : "ปิดสิทธิ"} ${permission.permissionName}`
        );
        router.refresh();
      } else {
        toast.error(res.message || "ไม่สามารถบันทึกสิทธิได้");
      }
      setLoadingId(null);
    });
  };

  /* ENABLE ALL */
  const handleEnableAll = () => {
    startTransition(async () => {
      for (const p of filtered) {
        await updatePositionPermission(
          position.id,
          p.id,
          true
        );
      }
      toast.success("เปิดสิทธิทั้งหมดแล้ว");
      router.refresh();
    });
  };

  /* DISABLE ALL */
  const handleDisableAll = () => {
    startTransition(async () => {
      for (const p of filtered) {
        await updatePositionPermission(
          position.id,
          p.id,
          false
        );
      }
      toast.success("ปิดสิทธิทั้งหมดแล้ว");
      router.refresh();
    });
  };
  /* COUNT */

  const enabledCount = filtered.filter((p: any) => {
    const record = p.positions?.find(
      (x: any) => x.positionId === position?.id
    );
    return record?.allowed;
  }).length;
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      backdrop="blur"
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* HEADER */}
            <ModalHeader className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <ShieldCheck className="text-orange-500" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold">
                  ตั้งค่าสิทธิ
                </span>
                <span className="text-xs text-default-400">
                  {position?.positionName}
                </span>
                <span className="text-[11px] text-default-400">
                  เปิดอยู่ {enabledCount} / {filtered.length} สิทธิ
                </span>
              </div>
            </ModalHeader>

            {/* SEARCH + ACTION */}
            <div className="px-6 pb-4 flex items-center gap-3">
              <Input
                size="sm"
                radius="full"
                startContent={<Search size={16} />}
                placeholder="ค้นหาสิทธิ..."
                value={search}
                onValueChange={setSearch}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="success"
                  startContent={<Check size={14} />}
                  onPress={handleEnableAll}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={<X size={14} />}
                  onPress={handleDisableAll}
                >
                  None
                </Button>
              </div>
            </div>
            <Divider className="-mx-6" />

            {/* PERMISSION LIST */}
            <ModalBody className="px-6 py-4">
              <div className="space-y-2">
                {filtered.map((p: any) => {
                  const record = p.positions?.find(
                    (x: any) => x.positionId === position?.id
                  );
                  const allowed = record?.allowed ?? false;
                  return (
                    <div
                      key={p.id}
                      className="
                        flex items-center justify-between
                        bg-default-50/60 backdrop-blur
                        hover:bg-default-100
                        hover:shadow-sm
                        transition
                        rounded-xl
                        px-4 py-3
                      "
                    >
                      {/* LEFT */}
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-default-400">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">
                            {p.permissionName}
                          </span>
                          <span
                            className={`text-xs ${p.permissionDesc
                              ? "text-default-400"
                              : "text-default-300 opacity-60"
                              }`}
                          >
                            {p.permissionDesc || "ไม่มีรายละเอียด"}
                          </span>
                        </div>
                      </div>

                      {/* SWITCH */}
                      <Switch
                        size="md"
                        isSelected={allowed}
                        onValueChange={() => handleToggle(p, allowed)}
                        isDisabled={loadingId === p.id || isPending}
                      />
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-10 text-sm text-default-400">
                    ไม่พบสิทธิที่ค้นหา
                  </div>
                )}
              </div>
            </ModalBody>

            {/* FOOTER */}
            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
              >
                ปิด
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}