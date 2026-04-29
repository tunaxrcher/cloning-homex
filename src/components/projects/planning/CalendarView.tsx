"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@heroui/react";
import type { CalendarViewProps, CalendarDay } from "@/lib/type";


export default function CalendarView({ data, dependencies = [], projectStart }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthInputRef = useRef<HTMLInputElement>(null);

  const tasks = useMemo(() => {
    return data?.flatMap((p) => p.tasks || []) || [];
  }, [data]);

  const computedProjectStart = useMemo(() => {
    if (projectStart) return new Date(projectStart);
    if (tasks.length === 0) return new Date();

    const startDates = tasks.map(t => new Date(t.startDate).getTime());
    return new Date(Math.min(...startDates));
  }, [projectStart, tasks]);

  const todayStr = new Date().toDateString();

  function applyDependencyShift(tasks: any[], dependencies: any[]) {
    const map = new Map(tasks.map(t => [t.id, { ...t }]));
    let changed = true;

    while (changed) {
      changed = false;

      dependencies.forEach(dep => {
        const task = map.get(dep.taskId);
        const prev = map.get(dep.dependsOnId);

        if (!task || !prev) return;

        const prevEnd = new Date(prev.startDate);
        prevEnd.setDate(prevEnd.getDate() + prev.durationDay);

        if (new Date(task.startDate) < prevEnd) {
          task.startDate = new Date(prevEnd);
          changed = true;
        }
      });
    }

    return Array.from(map.values());
  }

  const adjustedTasks = useMemo(() => {
    return applyDependencyShift(tasks, dependencies);
  }, [tasks, dependencies]);

  const calendarGrid = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];
    const prevLast = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevLast - i), currentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
    }

    while (days.length < 42) {
      days.push({
        date: new Date(year, month + 1, days.length - (firstDay + daysInMonth) + 1),
        currentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const buildTracks = (tasks: any[]) => {
    const tracks: any[][] = [];

    const sorted = [...tasks].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    sorted.forEach(task => {
      const s = new Date(task.startDate).getTime();
      const e = s + task.durationDay * 86400000;

      let placed = false;

      for (let i = 0; i < tracks.length; i++) {
        const overlap = tracks[i].find(t => {
          const ts = new Date(t.startDate).getTime();
          const te = ts + t.durationDay * 86400000;
          return s < te && e > ts;
        });

        if (!overlap) {
          tracks[i].push(task);
          placed = true;
          break;
        }
      }

      if (!placed) tracks.push([task]);
    });

    return tracks;
  };

  const getColor = (task: any) => {
    if (task.progress === 100) return "bg-[#10b981] text-white"; // เขียว
    if (task.progress > 0) return "bg-[#3b82f6] text-white";     // น้ำเงิน
    return "bg-[#3f3f46] text-slate-300";                        // เทา (ยังไม่ทำ)
  };

  const renderWeek = (startIdx: number) => {
    const weekDays = calendarGrid.slice(startIdx, startIdx + 7);

    const weekStart = new Date(weekDays[0].date).setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekDays[6].date).setHours(23, 59, 59, 999);

    const weekTasks = adjustedTasks.filter(t => {
      const s = new Date(t.startDate).getTime();
      const e = s + t.durationDay * 86400000;
      return s <= weekEnd && e >= weekStart;
    });

    const tracks = buildTracks(weekTasks);

    return (
      <div className="absolute inset-0 mt-8 px-1">
        {tracks.slice(0, 3).map((track, i) => (
          <div key={i} className="relative h-6 mb-1">
            {track.map(task => {
              const s = new Date(task.startDate).getTime();
              const e = s + task.durationDay * 86400000;

              const start = Math.max(0, Math.floor((s - weekStart) / 86400000));
              const end = Math.min(6, Math.floor((e - weekStart) / 86400000));

              const left = `${(start * 100) / 7}%`;
              const width = `${((end - start + 1) * 100) / 7}%`;

              const isContinuedFromLastWeek = s < weekStart;

              return (
                <div
                  key={task.id}
                  style={{ left, width }}
                  className={`absolute h-6 px-2 flex items-center text-[10px] font-bold rounded-md shadow-sm border-l-4 border-white/20 transition-all hover:brightness-110 ${getColor(task)}`}
                >
                  <div className="flex items-center gap-1 w-full overflow-hidden">
                    {isContinuedFromLastWeek && (
                      <span className="opacity-70 flex-shrink-0">›</span>
                    )}

                    <span className="truncate drop-shadow-sm">
                      {task.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-default-50 dark:bg-zinc-900 rounded-xl border border-default-200 dark:border-zinc-700">

      <div className="flex justify-between p-4 bg-default-100 dark:bg-zinc-800 border-b border-default-200 dark:border-zinc-700">
        <div className="font-bold flex items-center gap-2">
          <CalendarIcon size={16} /> Calendar
        </div>

        <div className="flex items-center gap-2">
          <ChevronLeft
            className="cursor-pointer hover:text-primary"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          />

          <div
            className="relative mx-2 cursor-pointer"
            onClick={() => monthInputRef.current?.showPicker()}
          >
            <input
              ref={monthInputRef}
              type="month"
              className="absolute inset-0 opacity-0 pointer-events-none"
              value={`${currentMonth.getFullYear()}-${String(
                currentMonth.getMonth() + 1
              ).padStart(2, "0")}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-");
                if (y && m) {
                  setCurrentMonth(new Date(parseInt(y), parseInt(m) - 1));
                }
              }}
            />

            <div className="font-bold text-sm hover:text-primary transition">
              {currentMonth.toLocaleDateString("th-TH", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <ChevronRight
            className="cursor-pointer hover:text-primary"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          />

          <div className="h-6 w-[1px] bg-default-300 dark:bg-zinc-700 mx-2" />

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="bordered"
              onClick={() => setCurrentMonth(computedProjectStart)}
            >
              เริ่มโครงการ
            </Button>

            <Button
              size="sm"
              color="primary"
              onClick={() => setCurrentMonth(new Date())}
            >
              วันนี้
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 text-xs text-center bg-default-100 dark:bg-zinc-800">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
          <div key={d} className="py-2 text-default-500">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 relative">
        {calendarGrid.map((day, i) => {
          const isToday = day.date.toDateString() === todayStr;

          return (
            <div
              key={i}
              className={`min-h-[120px] border border-default-200 dark:border-zinc-700 p-2
              ${!day.currentMonth && "opacity-40"}
              ${isToday && "bg-primary/10"}`}
            >
              <div className="text-xs font-bold text-default-700 dark:text-white">
                {day.date.getDate()}
              </div>
            </div>
          );
        })}

        <div className="absolute inset-0 pointer-events-none">
          {[0, 7, 14, 21, 28, 35].map(i => (
            <div key={i} className="relative h-[120px]">
              {renderWeek(i)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6 justify-center text-xs p-3 border-t border-default-200 dark:border-zinc-700">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" /> เสร็จแล้ว
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" /> กำลังทำ
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-zinc-400 rounded-full" /> ยังไม่ทำ
        </div>
      </div>
    </div>
  );
}