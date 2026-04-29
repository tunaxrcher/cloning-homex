"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Avatar,
  Divider
} from "@heroui/react";

import {
  Users,
  Search,
  UserPlus,
  X
} from "lucide-react";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  addProjectMember,
  removeProjectMember
} from "@/lib/actions/actionProjectMember";

export default function UpdateProjectMembers({
  isOpen,
  onOpenChange,
  project,
  users
}: any) {

  const router = useRouter();
  const [q, setQ] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const handleAdd = async (userId: number) => {
    if (loadingId) return;
    setLoadingId(userId);
    const res = await addProjectMember(project.id, userId);
    if (res.success) {
      toast.success("เพิ่มสมาชิกแล้ว");
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setLoadingId(null);
  };

  const handleRemove = async (id: number) => {
    if (loadingId) return;
    setLoadingId(id);
    const res = await removeProjectMember(id);
    if (res.success) {
      toast.success("ลบสมาชิกแล้ว");
      router.refresh();
    }
    setLoadingId(null);
  };

  const filteredUsers = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return users.filter((u: any) => {
      const exists = project.members?.some(
        (m: any) => m.user.id === u.id
      );
      if (exists) return false;
      if (!keyword) return true;
      return (
        (u.displayName ?? "").toLowerCase().includes(keyword) ||
        (u.position?.positionName ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [users, project.members, q]);

  return (

    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      scrollBehavior="inside"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      classNames={{
        base: "mx-2 sm:mx-4 md:mx-6 w-full sm:max-w-xl md:max-w-3xl lg:max-w-5xl",
        body: "py-4"
      }}
    >

      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100">
                <Users size={20} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  จัดการทีมโครงการ
                </h2>
                <p className="text-xs text-default-400">
                  {project.name}
                </p>
              </div>
            </ModalHeader>
            <ModalBody className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
              {/* MEMBERS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    สมาชิกในโครงการ
                  </p>
                  <span className="text-xs text-default-400">
                    {project.members?.length || 0} คน
                  </span>
                </div>
                <div className="space-y-2 max-h-[220px] lg:max-h-[420px] overflow-y-auto pr-1">
                  {project.members?.length ? (
                    project.members.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-default-50/70 hover:bg-default-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="sm"
                            name={m.user.displayName}
                            className="bg-gradient-to-br from-orange-400 to-red-500 text-white"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {m.user.displayName}
                            </p>
                            <p className="text-xs text-default-400">
                              {m.user.position?.positionName}
                            </p>
                          </div>
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          className="opacity-60 hover:opacity-100"
                          isLoading={loadingId === m.id}
                          onPress={() => handleRemove(m.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-default-400 text-sm">
                      ยังไม่มีสมาชิกในโครงการ
                    </div>
                  )}
                </div>
              </div>
              <Divider className="opacity-40 lg:hidden" />

              {/* ADD MEMBERS */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  เพิ่มสมาชิก
                </p>
                <Input
                  placeholder="ค้นหาพนักงาน..."
                  radius="full"
                  startContent={<Search size={16} />}
                  value={q}
                  onValueChange={setQ}
                  classNames={{
                    inputWrapper:
                      "shadow-sm border-default-200 bg-default-50"
                  }}
                />
                <div className="space-y-2 max-h-[260px] lg:max-h-[420px] overflow-y-auto pr-1">
                  {filteredUsers.length === 0 && (

                    <div className="text-center py-6 text-default-400 text-sm">
                      ไม่พบพนักงาน
                    </div>
                  )}
                  {filteredUsers.map((u: any) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-default-50/70 hover:bg-default-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="sm"
                          name={u.displayName}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {u.displayName}
                          </p>
                          <p className="text-xs text-default-400">
                            {u.position?.positionName}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        radius="full"
                        startContent={<UserPlus size={14} />}
                        isLoading={loadingId === u.id}
                        onPress={() => handleAdd(u.id)}
                      >
                        เพิ่ม
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                radius="full"
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