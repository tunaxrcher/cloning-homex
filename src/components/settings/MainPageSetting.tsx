"use client";

import { Settings, AlertTriangle, Palette, Bot } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
} from "@heroui/react";

import PositionTable from "./position/PositionTable";
import PermissionTable from "./permission/PermissionTable";

import CreatePosition from "./position/forms/createPosition";
import CreatePermission from "./permission/forms/createPermission";
import UpdatePositionPermission from "./position/forms/updatePositionPermission";

import SupplierTable from "./supplier/SupplierTable";
import CreateSupplier from "./supplier/forms/createSupplier";

import ContractorTable from "./contractor/ContractorTable";
import CreateContractor from "./contractor/forms/createContractor";

import AiPromptSetting from "./ai/AiPromptSetting";
import BrandingSetting from "./branding/BrandingSetting";
import { SETTING_KEYS } from "@/lib/settingKeys";

import {
  deleteContractor,
  restoreContractor
} from "@/lib/actions/actionContractor";

import {
  deleteSupplier,
  restoreSupplier
} from "@/lib/actions/actionSupplier";

import {
  deletePosition,
  restorePosition,
} from "@/lib/actions/actionPosition";

import {
  deletePermission,
  restorePermission,
} from "@/lib/actions/actionPermission";

export default function MainPageSetting({
  positions,
  permissions,
  suppliers,
  contractors,
  aiSettings = {},
}: {
  positions: any[];
  permissions: any[];
  suppliers: any[];
  contractors: any[];
  aiSettings?: Record<string, string>;
}) {

  const router = useRouter();

  /* ========================= */
  /* STATE */
  /* ========================= */
  const [positionOpen, setPositionOpen] = useState(false);
  const [editPosition, setEditPosition] = useState<any>(null);

  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editPermission, setEditPermission] = useState<any>(null);

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);

  const [contractorOpen, setContractorOpen] = useState(false);
  const [editContractor, setEditContractor] = useState<any>(null);

  /* 🔐 POSITION PERMISSION */
  const [permissionSettingOpen, setPermissionSettingOpen] = useState(false);
  const [permissionPosition, setPermissionPosition] = useState<any>(null);

  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ========================= */
  /* TOGGLE ACTIVE */
  /* ========================= */
  const handleToggle = (type: "position" | "permission" | "supplier" | "contractor", data: any) => {
    setDeleteModal({
      type,
      data,
    });
  };

  const confirmToggle = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    const { type, data } = deleteModal;
    let res;
    if (type === "position") {
      res = data.isActive
        ? await deletePosition(data.id)
        : await restorePosition(data.id);
    } else if (type === "permission") {
      res = data.isActive
        ? await deletePermission(data.id)
        : await restorePermission(data.id);
    } else if (type === "supplier") {
      res = data.isActive
        ? await deleteSupplier(data.id)
        : await restoreSupplier(data.id);

    } else if (type === "contractor") {
      res = data.isActive
        ? await deleteContractor(data.id)
        : await restoreContractor(data.id);
    }
    setIsDeleting(false);
    if (res?.success) {
      toast.success(
        data.isActive
          ? "ปิดการใช้งานเรียบร้อย"
          : "เปิดใช้งานเรียบร้อย"
      );
      router.refresh();
      setDeleteModal(null);
    } else {
      toast.error(res?.message || "ไม่สำเร็จ");
    }
  };
  const isActive = deleteModal?.data?.isActive;

  return (

    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-orange-500/10">
          <Settings className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            System Setting
          </h1>
          <p className="text-default-400 text-sm">
            จัดการการตั้งค่าระบบ
          </p>
        </div>
      </div>

      {/* TABLE GRID */}
      <div className="grid xl:grid-cols-2 gap-8">
        <PositionTable
          positions={positions}
          onAdd={() => {
            setEditPosition(null);
            setPositionOpen(true);
          }}
          onEdit={(p) => {
            setEditPosition(p);
            setPositionOpen(true);
          }}
          onToggle={(p) => handleToggle("position", p)}
          onPermission={(p) => {
            setPermissionPosition(p);
            setPermissionSettingOpen(true);
          }}
        />

        <PermissionTable
          permissions={permissions}
          onAdd={() => {
            setEditPermission(null);
            setPermissionOpen(true);
          }}
          onEdit={(p) => {
            setEditPermission(p);
            setPermissionOpen(true);
          }}
          onToggle={(p) => handleToggle("permission", p)}
        />

        <SupplierTable
          suppliers={suppliers}
          onAdd={() => {
            setEditSupplier(null);
            setSupplierOpen(true);
          }}
          onEdit={(s) => {
            setEditSupplier(s);
            setSupplierOpen(true);
          }}
          onToggle={(s) => handleToggle("supplier", s)}
        />

        <ContractorTable
          contractors={contractors}
          onAdd={() => {
            setEditContractor(null);
            setContractorOpen(true);
          }}
          onEdit={(c) => {
            setEditContractor(c);
            setContractorOpen(true);
          }}
          onToggle={(c) => handleToggle("contractor", c)}
        />
      </div>

      {/* BRANDING & AI TABS */}
      <Tabs
        aria-label="Setting Tabs"
        variant="underlined"
        color="primary"
        classNames={{
          tabList: "gap-6 border-b border-divider",
          tab: "h-10 px-0",
          cursor: "bg-primary",
        }}
      >
        <Tab
          key="branding"
          title={
            <div className="flex items-center gap-2">
              <Palette size={16} />
              <span>Branding</span>
            </div>
          }
        >
          <div className="max-w-full">
            <BrandingSetting
              initialOrgName={aiSettings[SETTING_KEYS.ORG_NAME] || ""}
              initialLogoUrl={aiSettings[SETTING_KEYS.ORG_LOGO_URL] || ""}
              initialWelcomeText={aiSettings[SETTING_KEYS.ORG_WELCOME_TEXT] || ""}
              initialTagline={aiSettings[SETTING_KEYS.ORG_TAGLINE] || ""}
              initialPrimaryColor={aiSettings[SETTING_KEYS.ORG_PRIMARY_COLOR] || ""}
            />
          </div>
        </Tab>

        <Tab
          key="ai"
          title={
            <div className="flex items-center gap-2">
              <Bot size={16} />
              <span>AI Prompt</span>
            </div>
          }
        >
          <div className="max-w-full pt-6">
            <AiPromptSetting
              initialRolePrompt={aiSettings[SETTING_KEYS.AI_TASK_ROLE_PROMPT] || ""}
              initialPlaceholder={aiSettings[SETTING_KEYS.TASK_PLACEHOLDER] || ""}
            />
          </div>
        </Tab>
      </Tabs>

      {/* POSITION FORM */}
      <CreatePosition
        key={`position-${editPosition?.id ?? "create"}`}
        isOpen={positionOpen}
        onOpenChange={setPositionOpen}
        editData={editPosition}
      />

      {/* PERMISSION FORM */}
      <CreatePermission
        key={`permission-${editPermission?.id ?? "create"}`}
        isOpen={permissionOpen}
        onOpenChange={setPermissionOpen}
        editData={editPermission}
      />

      <CreateSupplier
        key={`supplier-${editSupplier?.id ?? "create"}`}
        isOpen={supplierOpen}
        onOpenChange={setSupplierOpen}
        editData={editSupplier}
      />

      <CreateContractor
        key={`contractor-${editContractor?.id ?? "create"}`}
        isOpen={contractorOpen}
        onOpenChange={setContractorOpen}
        editData={editContractor}
      />

      {/* 🔐 POSITION PERMISSION MODAL */}
      <UpdatePositionPermission
        isOpen={permissionSettingOpen}
        onOpenChange={setPermissionSettingOpen}
        position={permissionPosition}
        permissions={permissions}
      />

      {/* CONFIRM MODAL */}
      <Modal
        isOpen={!!deleteModal}
        onOpenChange={(open) => {
          if (!open) setDeleteModal(null);
        }}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                  <AlertTriangle className="text-danger" size={20} />
                </div>
                <div>
                  <div className="font-semibold">
                    {isActive
                      ? "ยืนยันการปิดการใช้งาน"
                      : "ยืนยันการเปิดใช้งาน"}
                  </div>
                  <div className="text-xs text-default-400">
                    {isActive
                      ? "สามารถเปิดใช้งานใหม่ได้ภายหลัง"
                      : "รายการนี้จะกลับมาใช้งานได้"}
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <p>
                  คุณต้องการ
                  <b
                    className={
                      isActive
                        ? "text-danger"
                        : "text-primary"
                    }
                  >
                    {isActive
                      ? " ปิดการใช้งาน "
                      : " เปิดใช้งาน "}
                  </b>
                  <b>
                    {deleteModal?.data?.permissionName ??
                      deleteModal?.data?.positionName}
                  </b>
                  ใช่หรือไม่?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                >
                  ยกเลิก
                </Button>
                <Button
                  color={
                    isActive ? "danger" : "primary"
                  }
                  onPress={confirmToggle}
                  isLoading={isDeleting}
                >
                  {isActive
                    ? "ปิดการใช้งาน"
                    : "เปิดใช้งาน"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}