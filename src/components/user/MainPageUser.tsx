"use client";

import { Input } from "@heroui/react";
import { Users, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import EmployeeTable from "./EmployeeTable";
import CustomerTable from "./CustomerTable";
import CreateEmployee from "./forms/createEmployee";
import CreateCustomer from "./forms/createCustomer";
import type { MainPageUserProps } from "@/lib/type";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import {
    deleteEmployee,
    deleteCustomer,
    restoreEmployee,
    restoreCustomer
} from "@/lib/actions/actionUser";

export default function MainPageUser({
    users,
    positions,
}: MainPageUserProps) {

    const [q, setQ] = useState("");

    const [employeeOpen, setEmployeeOpen] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);

    const [editEmployee, setEditEmployee] = useState<any>(null);
    const [editCustomer, setEditCustomer] = useState<any>(null);

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type: "employee" | "customer" | null;
        user: any;
    }>({
        isOpen: false,
        type: null,
        user: null,
    });

    const [isDeleting, setIsDeleting] = useState(false);

    // 🔥 filter จาก localUsers เท่านั้น
    const filtered = useMemo(() => {

        if (!q) return users;

        const keyword = q.toLowerCase().trim();
        const isExactActive = keyword === "active";
        const isExactInactive = keyword === "inactive";
        
        return users.filter(u => {

            const isActive = Number(u.isActive) === 1;
            const statusText = isActive ? "active" : "inactive";

            // ✅ ถ้าพิมพ์ครบคำ → กรองเฉพาะสถานะนั้น
            if (isExactActive) return isActive;
            if (isExactInactive) return !isActive;

            // ✅ ค้นหาปกติ (รวม status ด้วย)
            return (
                (u.displayName ?? "").toLowerCase().includes(keyword) ||
                (u.username ?? "").toLowerCase().includes(keyword) ||
                (u.phone ?? "").toLowerCase().includes(keyword) ||
                (u.email ?? "").toLowerCase().includes(keyword) ||
                (u.position?.positionName ?? "").toLowerCase().includes(keyword) ||
                statusText.includes(keyword)
            );

        });

    }, [users, q]);

    const employees = useMemo(() => {
        return filtered.filter(u =>
            (u.position?.positionName ?? "").toLowerCase() !== "ลูกค้า"
        );
    }, [filtered]);

    const customers = useMemo(() => {
        return filtered.filter(u =>
            (u.position?.positionName ?? "").toLowerCase() === "ลูกค้า"
        );
    }, [filtered]);

    const router = useRouter();

    const handleDeleteEmployee = (u: any) => {
        setDeleteModal({
            isOpen: true,
            type: "employee",
            user: u,
        });
    };

    const handleDeleteCustomer = (u: any) => {
        setDeleteModal({
            isOpen: true,
            type: "customer",
            user: u,
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.user) return;

        setIsDeleting(true);

        const { user, type } = deleteModal;

        const res =
            type === "employee"
                ? user.isActive
                    ? await deleteEmployee(user.id)
                    : await restoreEmployee(user.id)
                : user.isActive
                    ? await deleteCustomer(user.id)
                    : await restoreCustomer(user.id);

        setIsDeleting(false);

        if (res.success) {
            toast.success(
                user.isActive
                    ? "ปิดการใช้งานเรียบร้อย"
                    : "เปิดใช้งานเรียบร้อย"
            );

            setDeleteModal({ isOpen: false, type: null, user: null });
            router.refresh();
        } else {
            toast.error(res.message || "ไม่สำเร็จ");
        }
    };
    const isActiveUser = deleteModal.user?.isActive;
    return (

        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

            {/* HEADER */}
            <div className="flex items-center gap-4">

                <div className="p-3 rounded-2xl bg-orange-500/10">
                    <Users className="text-orange-500" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-default-400 text-sm">
                        จัดการพนักงานและลูกค้า
                    </p>
                </div>

            </div>

            {/* SEARCH */}
            <Input
                startContent={<Search size={16} />}
                placeholder="ค้นหา..."
                value={q}
                onValueChange={setQ}
                classNames={{
                    inputWrapper: "rounded-full shadow-lg backdrop-blur"
                }}
            />

            {/* TABLE GRID */}
            <div className="grid xl:grid-cols-2 gap-8">

                <EmployeeTable
                    users={employees}
                    onAdd={() => {
                        setEditEmployee(null);
                        setEmployeeOpen(true);
                    }}
                    onEdit={(u) => {
                        setEditEmployee(u);
                        setEmployeeOpen(true);
                    }}
                    onDelete={handleDeleteEmployee}
                />

                <CustomerTable
                    users={customers}
                    onAdd={() => {
                        setEditCustomer(null);        // 🔥 create mode
                        setCustomerOpen(true);
                    }}
                    onEdit={(u) => {
                        setEditCustomer(u);           // 🔥 edit mode
                        setCustomerOpen(true);
                    }}
                    onDelete={handleDeleteCustomer}
                />

            </div>

            {/* MODALS */}
            <CreateEmployee
                key={`employee-${editEmployee?.id ?? "create"}`}
                isOpen={employeeOpen}
                onOpenChange={setEmployeeOpen}
                positions={positions}
                editData={editEmployee}
            />

            <CreateCustomer
                key={`customer-${editCustomer?.id ?? "create"}`}
                isOpen={customerOpen}
                onOpenChange={setCustomerOpen}
                editData={editCustomer}
            />

            <Modal
                isOpen={deleteModal.isOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteModal({ isOpen: false, type: null, user: null });
                    }
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
                                        {isActiveUser
                                            ? "ยืนยันการปิดการใช้งาน"
                                            : "ยืนยันการเปิดใช้งาน"}
                                    </div>

                                    <div className="text-xs text-default-400">
                                        {isActiveUser
                                            ? "สามารถเปิดใช้งานใหม่ได้ภายหลัง"
                                            : "ผู้ใช้นี้จะกลับมาใช้งานได้"}
                                    </div>
                                </div>

                            </ModalHeader>

                            <ModalBody>
                                <p>
                                    คุณต้องการ
                                    <b className={isActiveUser ? "text-danger" : "text-primary"}>
                                        {isActiveUser ? " ปิดการใช้งาน " : " เปิดใช้งาน "}
                                    </b>
                                    <b>{deleteModal.user?.displayName}</b>
                                    ใช่หรือไม่?
                                </p>
                            </ModalBody>

                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    ยกเลิก
                                </Button>

                                <Button
                                    color={isActiveUser ? "danger" : "primary"}
                                    onPress={handleConfirmDelete}
                                    isLoading={isDeleting}
                                >
                                    {isActiveUser ? "ปิดการใช้งาน" : "เปิดใช้งาน"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
