"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
} from "@heroui/react";

import {
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { RotateCcw } from "lucide-react";
export default function CustomerTable({
  users = [],
  onAdd,
  onEdit,
  onDelete,
}: {
  users: any[];
  onAdd: () => void;
  onEdit?: (user: any) => void;
  onDelete?: (user: any) => void;
}) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const pages = Math.ceil(users.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return users.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, users]);

  return (
    <Card className="bg-background/60 backdrop-blur-xl border border-default-200 dark:border-zinc-800 shadow-xl rounded-2xl">

      <CardBody className="p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <span className="text-purple-500 text-lg">👤</span>
            </div>

            <div>
              <p className="font-semibold text-lg">
                ลูกค้า ({users.length})
              </p>
              <p className="text-xs text-default-400">
                จัดการข้อมูลลูกค้า
              </p>
            </div>
          </div>

          <Button
            size="sm"
            radius="full"
            className="bg-black text-white dark:bg-white dark:text-black"
            startContent={<UserPlus size={16} />}
            onPress={onAdd}
          >
            เพิ่มลูกค้า
          </Button>

        </div>

        {/* TABLE */}
        <Table
          isStriped
          removeWrapper
          classNames={{
            th: "bg-default-100 dark:bg-zinc-900 text-default-500 uppercase text-xs tracking-wider",
          }}
        >
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>ชื่อ</TableColumn>

            {/* ซ่อนในมือถือ */}
            <TableColumn className="hidden md:table-cell">Username</TableColumn>
            <TableColumn className="hidden md:table-cell">โทรศัพท์</TableColumn>
            <TableColumn className="hidden md:table-cell">Email</TableColumn>
            <TableColumn className="hidden md:table-cell">ที่อยู่</TableColumn>
            <TableColumn className="hidden md:table-cell">สถานะ</TableColumn>

            <TableColumn className="text-center">จัดการ</TableColumn>
          </TableHeader>

          <TableBody emptyContent="ยังไม่มีลูกค้า">
            {items.map((u, i) => (
              <TableRow key={u.id}>

                <TableCell>
                  {(page - 1) * rowsPerPage + i + 1}
                </TableCell>

                <TableCell className="font-medium">
                  {u.displayName ?? "-"}
                </TableCell>

                {/* Desktop only */}
                <TableCell className="hidden md:table-cell">
                  {u.username ?? "-"}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {u.phone ?? "-"}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {u.email ?? "-"}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <span
                    className="block max-w-[200px] truncate"
                    title={u.address ?? "-"}
                  >
                    {u.address ?? "-"}
                  </span>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <Chip
                    size="sm"
                    color={u.isActive ? "success" : "default"}
                    variant="flat"
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </Chip>
                </TableCell>

                <TableCell>
                  <div className="flex justify-center gap-2">

                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="flat"
                      onPress={() => onEdit?.(u)}
                    >
                      <Pencil size={16} />
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="flat"
                      color={u.isActive ? "danger" : "primary"}
                      onPress={() => onDelete?.(u)}
                    >

                      {u.isActive
                        ? <Trash2 size={16} />
                        : <RotateCcw size={16} />
                      }

                    </Button>

                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        {users.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center justify-between pt-4">

            <div className="flex items-center gap-3 text-sm text-default-500">
              <span>Rows per page</span>

              <select
                value={rowsPerPage === users.length ? "all" : rowsPerPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setRowsPerPage(val === "all" ? users.length : Number(val));
                  setPage(1);
                }}
                className="bg-default-100 dark:bg-zinc-800 rounded-lg px-2 py-1 text-sm"
              >
                {[5, 10, 20, "all"].map((n) => (
                  <option key={n} value={n}>
                    {n === "all" ? "All" : n}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-default-500">
              Page {page} of {pages || 1}
            </div>

            <div className="flex gap-2">

              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setPage(1)}
                isDisabled={page === 1}
              >
                <ChevronsLeft size={16} />
              </Button>

              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setPage(page - 1)}
                isDisabled={page === 1}
              >
                <ChevronLeft size={16} />
              </Button>

              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setPage(page + 1)}
                isDisabled={page === pages}
              >
                <ChevronRight size={16} />
              </Button>

              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setPage(pages)}
                isDisabled={page === pages}
              >
                <ChevronsRight size={16} />
              </Button>

            </div>

          </div>
        )}

      </CardBody>
    </Card>
  );
}