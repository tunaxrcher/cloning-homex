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
  Input,
} from "@heroui/react";

import {
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
  Shield,
} from "lucide-react";

export default function PositionTable({
  positions = [],
  onAdd,
  onEdit,
  onToggle,
  onPermission,
}: {
  positions: any[];
  onAdd: () => void;
  onEdit: (p: any) => void;
  onToggle: (p: any) => void;
  onPermission: (p: any) => void;
}) {

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  /* ========================= */
  /* FILTER */
  /* ========================= */

  const filtered = useMemo(() => {

    if (!q) return positions;

    const keyword = q.toLowerCase().trim();
    const isExactActive = keyword === "active";
    const isExactInactive = keyword === "inactive";

    return positions.filter((p) => {

      const isActive = Number(p.isActive) === 1;
      const statusText = isActive ? "active" : "inactive";

      // ✅ พิมพ์ครบคำ → กรองเฉพาะสถานะ
      if (isExactActive) return isActive;
      if (isExactInactive) return !isActive;

      // ✅ ค้นหาปกติ (รวม status ด้วย)
      return (
        (p.positionName ?? "").toLowerCase().includes(keyword) ||
        (p.positionDesc ?? "").toLowerCase().includes(keyword) ||
        statusText.includes(keyword)
      );

    });

  }, [positions, q]);

  const pages = Math.ceil(filtered.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, filtered]);

  return (
    <Card className="bg-background/60 backdrop-blur-xl border border-default-200 dark:border-zinc-800 shadow-xl rounded-2xl">
      <CardBody className="p-4 md:p-6 space-y-6">

        {/* HEADER + SEARCH + BUTTON */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* ซ้าย: Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10">
              <span className="text-orange-500 text-lg">💼</span>
            </div>

            <div>
              <p className="font-semibold text-lg">
                ตำแหน่ง ({filtered.length})
              </p>
              <p className="text-xs text-default-400">
                จัดการตำแหน่งในองค์กร
              </p>
            </div>
          </div>

          {/* กลาง: Search */}
          <Input
            size="sm"
            startContent={<Search size={16} />}
            placeholder="ค้นหาตำแหน่ง..."
            value={q}
            onValueChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            className="w-full md:max-w-xs"
            classNames={{
              inputWrapper: "rounded-full shadow-sm",
            }}
          />

          {/* ขวา: Add Button */}
          <Button
            size="sm"
            radius="full"
            className="bg-black text-white dark:bg-white dark:text-black"
            startContent={<UserPlus size={16} />}
            onPress={onAdd}
          >
            เพิ่มตำแหน่ง
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

            <TableColumn>ชื่อตำแหน่ง</TableColumn>

            {/* Desktop only */}
            <TableColumn className="hidden md:table-cell">
              รายละเอียด
            </TableColumn>

            <TableColumn className="hidden md:table-cell">
              สถานะ
            </TableColumn>

            <TableColumn className="text-center">
              จัดการ
            </TableColumn>
          </TableHeader>

          <TableBody emptyContent="ยังไม่มีตำแหน่ง">
            {items.map((p, i) => (
              <TableRow key={p.id}>

                <TableCell>
                  {(page - 1) * rowsPerPage + i + 1}
                </TableCell>

                {/* ✅ แสดงตลอด */}
                <TableCell className="font-medium">
                  {p.positionName}
                </TableCell>

                {/* ❌ ซ่อนบนมือถือ */}
                <TableCell className="hidden md:table-cell">
                  {p.positionDesc ?? "-"}
                </TableCell>

                {/* ❌ ซ่อนบนมือถือ */}
                <TableCell className="hidden md:table-cell">
                  <Chip
                    size="sm"
                    color={p.isActive ? "success" : "default"}
                    variant="flat"
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </Chip>
                </TableCell>

                {/* ✅ แสดงตลอด */}
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="flat"
                      className="text-orange-500 bg-orange-500/10 hover:bg-orange-500/20"
                      onPress={() => onPermission(p)}
                    >
                      <Shield size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="flat"
                      onPress={() => onEdit(p)}
                    >
                      <Pencil size={16} />
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="flat"
                      color={p.isActive ? "danger" : "primary"}
                      onPress={() => onToggle(p)}
                    >
                      {p.isActive
                        ? <Trash2 size={16} />
                        : <RotateCcw size={16} />}
                    </Button>
                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center justify-between pt-4">

            <div className="flex items-center gap-3 text-sm text-default-500">
              <span>Rows per page</span>

              <select
                value={
                  rowsPerPage === filtered.length
                    ? "all"
                    : rowsPerPage
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setRowsPerPage(
                    val === "all"
                      ? filtered.length
                      : Number(val)
                  );
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
              <Button isIconOnly size="sm" variant="flat"
                onPress={() => setPage(1)}
                isDisabled={page === 1}>
                <ChevronsLeft size={16} />
              </Button>

              <Button isIconOnly size="sm" variant="flat"
                onPress={() => setPage(page - 1)}
                isDisabled={page === 1}>
                <ChevronLeft size={16} />
              </Button>

              <Button isIconOnly size="sm" variant="flat"
                onPress={() => setPage(page + 1)}
                isDisabled={page === pages}>
                <ChevronRight size={16} />
              </Button>

              <Button isIconOnly size="sm" variant="flat"
                onPress={() => setPage(pages)}
                isDisabled={page === pages}>
                <ChevronsRight size={16} />
              </Button>
            </div>

          </div>
        )}

      </CardBody>
    </Card>
  );
}