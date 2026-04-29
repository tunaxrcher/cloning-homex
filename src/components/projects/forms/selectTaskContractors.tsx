"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Avatar, Button, Input } from "@heroui/react";
import { Search, UserPlus, X } from "lucide-react";
import { SelectContractorProps } from "@/lib/type";

export default function SelectTaskContractors({
  contractors,
  selected,
  setSelected,
}: SelectContractorProps) {

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------------- CLICK OUTSIDE ---------------- */

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---------------- AUTO FOCUS ---------------- */

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ---------------- FILTER ---------------- */

  const filtered = useMemo(() => {
    const keyword = q.toLowerCase();

    return contractors.filter((c) => {

      if (selected.some((s) => s.id === c.id)) return false;

      return (
        (c.contractorName ?? "").toLowerCase().includes(keyword) ||
        (c.contractorPhone ?? "").toLowerCase().includes(keyword) ||
        (c.contractorEmail ?? "").toLowerCase().includes(keyword)
      );

    });

  }, [q, contractors, selected]);

  /* ---------------- ADD ---------------- */

  const add = (c: any) => {
    setSelected([...selected, c]);
    setQ("");
  };

  /* ---------------- REMOVE ---------------- */

  const remove = (id: number) => {
    setSelected(selected.filter((c) => c.id !== id));
  };

  return (
    <div ref={wrapperRef} className="relative">

      {/* SELECTED */}

      <div className="flex flex-wrap items-center gap-2">

        {selected.map((c) => (
          <div
            key={c.id}
            className="group flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full bg-default-100 border hover:bg-default-200 transition"
          >
            <Avatar size="sm" name={c.contractorName} />

            <span className="text-xs font-medium">
              {c.contractorName}
            </span>

            <button
              onClick={() => remove(c.id)}
              className="opacity-50 group-hover:opacity-100 transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* ADD BUTTON */}

        <Button
          isIconOnly
          size="sm"
          radius="full"
          variant="flat"
          className="bg-default-100 hover:bg-default-200"
          onPress={() => setOpen((v) => !v)}
        >
          <UserPlus size={16} />
        </Button>

      </div>

      {/* DROPDOWN */}

      {open && (
        <div className="absolute z-50 mt-2 w-full border rounded-xl p-3 bg-background shadow-lg">

          <Input
            ref={inputRef}
            placeholder="ค้นหาผู้รับจ้าง..."
            startContent={<Search size={16} />}
            value={q}
            onValueChange={setQ}
            radius="full"
            size="sm"
          />

          <div className="max-h-56 overflow-y-auto mt-2 space-y-1">

            {filtered.length === 0 && (
              <p className="text-xs text-default-400 text-center py-2">
                ไม่พบผู้รับจ้าง
              </p>
            )}

            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-default-100 transition"
              >
                <div className="flex items-center gap-2">
                  <Avatar size="sm" name={c.contractorName} />

                  <div>
                    <p className="text-sm font-medium">
                      {c.contractorName}
                    </p>

                    <p className="text-xs text-default-400">
                      {c.contractorPhone || "-"}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  className="text-xs"
                  onPress={() => add(c)}
                >
                  เพิ่ม
                </Button>
              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
}