"use client";

import { useMemo } from "react";
import { Users, AlertTriangle } from "lucide-react";

export default function WorkloadView({ data, projectStart }: { data: any[]; projectStart: Date | null }) {
  const sidebarWidth = 280;
  const dayWidth = 15;
  const weekWidth = dayWidth * 7;

  const projectStartDate = useMemo(() => {
    const d = projectStart ? new Date(projectStart) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [projectStart]);

  const flatTasks = useMemo(() => data?.flatMap((p) => p.tasks || []) || [], [data]);

  const totalDays = useMemo(() => {
    if (flatTasks.length === 0) return 98;
    const allEndTimes = flatTasks.map(t => new Date(new Date(t.startDate).getTime() + (t.durationDay * 86400000)).getTime());
    const diff = Math.ceil((Math.max(...allEndTimes) - projectStartDate.getTime()) / 86400000);
    return Math.ceil(diff / 7) * 7 + 21;
  }, [flatTasks, projectStartDate]);

  const totalWeeks = totalDays / 7;

  const resourceData = useMemo(() => {
    const map: Record<string, any> = {};
    flatTasks.forEach((t: any) => {
      const contractors = t.taskContractors?.length > 0 ? t.taskContractors : [{ contractor: { contractorName: "ยังไม่ได้ระบุผู้รับจ้าง" } }];
      contractors.forEach((tc: any) => {
        const name = tc.contractor?.contractorName || "ยังไม่ได้ระบุผู้รับจ้าง";
        if (!map[name]) map[name] = { name, tasks: [] };
        map[name].tasks.push(t);
      });
    });

    return Object.values(map)
      .map((res: any) => {
        const tracks: any[][] = [];
        const sorted = [...res.tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        sorted.forEach(task => {
          let placed = false;
          const s = new Date(task.startDate).getTime(), e = s + (task.durationDay * 86400000);
          for (let i = 0; i < tracks.length; i++) {
            if (!tracks[i].find(n => {
              const ns = new Date(n.startDate).getTime(), ne = ns + (n.durationDay * 86400000);
              return s < ne && e > ns;
            })) { tracks[i].push(task); placed = true; break; }
          }
          if (!placed) tracks.push([task]);
        });
        const allTasks = tracks.flat();
        const workloadDays = allTasks.reduce((sum, t) => sum + (t.durationDay || 0), 0);
        return { ...res, tracks, hasConflict: tracks.length > 1, workloadDays };
      })
      .sort((a, b) => a.name === "ยังไม่ได้ระบุผู้รับจ้าง" ? 1 : b.name === "ยังไม่ได้ระบุผู้รับจ้าง" ? -1 : 0);
  }, [flatTasks]);

  const totalConflictTasks = useMemo(() => {
    return resourceData.reduce((acc, res) => {
      if (res.name === "ยังไม่ได้ระบุผู้รับจ้าง") return acc;
      const redTasksCount = res.tracks.slice(1).reduce((sum: number, track: any[]) => sum + track.length, 0);
      return acc + redTasksCount;
    }, 0);
  }, [resourceData]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-default-200 dark:border-zinc-700 shadow-xl overflow-hidden text-default-700 dark:text-white">
      
      {/* 1. ปรับ Header ให้เข้มเหมือนรูปที่ 2 */}
      <div className="p-5 flex justify-between items-center bg-default-50 dark:bg-zinc-800/80 border-b border-default-200 dark:border-zinc-700">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Users className="text-blue-400" size={20} /> Resource Workload
        </h1>
        <div className="flex gap-4">
          <LegendItem color="bg-primary" label="งานปกติ" />
          <LegendItem color="bg-danger" label="งานซ้อน (Conflict)" />
        </div>
      </div>

      {totalConflictTasks > 0 && (
        <div className="m-4 p-3 bg-red-950/20 border border-red-500/40 rounded-lg flex gap-3 items-center text-xs">
          <AlertTriangle size={16} className="text-red-500 animate-pulse" />
          <span className="text-red-300 font-medium italic">
            พบงานซ้อนทับกันทั้งหมด {totalConflictTasks} รายการ กรุณาตรวจสอบตารางเวลา
          </span>
        </div>
      )}

      <div className="overflow-auto max-h-[70vh] custom-scrollbar">
        <div style={{ width: `${sidebarWidth + (totalDays * dayWidth)}px` }}>

          {/* 2. ปรับ Month & Week Header ให้เข้มและดูเป็นระเบียบ */}
          <div className="sticky top-0 z-40 bg-default-100 dark:bg-zinc-800 border-b border-default-200 dark:border-zinc-700">
            <div className="flex">
              <div style={{ width: sidebarWidth }} className="border-r border-default-200 dark:border-zinc-700/50 sticky left-0 bg-default-100 dark:bg-zinc-800" />
              <div className="flex">
                {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => {
                  const date = new Date(projectStartDate);
                  date.setDate(date.getDate() + (i * 7));
                  const showMonth = date.getDate() <= 7;
                  return (
                    <div key={i} style={{ width: weekWidth }} className="shrink-0 border-l border-default-200/50 dark:border-zinc-700/30 text-center py-2 relative">
                      {showMonth && (
                        <div className="absolute top-1 left-2 text-[9px] font-bold text-blue-400/80 uppercase">
                          {date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-default-400 mt-3">W{i + 1}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="divide-y divide-default-100 dark:divide-zinc-800/50">
            {resourceData.map((res, idx) => {
              const utilization = Math.min(100, (res.workloadDays / totalDays) * 100);

              return (
                <div key={idx} className="flex group hover:bg-default-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  {/* 3. ปรับ Sidebar ให้โปร่งขึ้นเพื่อให้ Timeline เด่น */}
                  <div style={{ width: sidebarWidth }} className="shrink-0 p-4 sticky left-0 z-20 bg-white dark:bg-zinc-900 border-r border-default-200 dark:border-zinc-700/50 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${res.hasConflict ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                      <Users size={14} />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className={`font-bold text-xs truncate ${res.name === "ยังไม่ได้ระบุผู้รับจ้าง" ? "text-default-400 italic" : "text-default-900 dark:text-white"}`}>
                        {res.name}
                      </div>
                      <div className="text-[9px] text-default-500">{res.tracks.flat().length} รายการ</div>
                      <div className="mt-1.5 h-1 w-full bg-default-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${utilization}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* 4. Bars Area - ใช้สีพื้นหลังที่ดูสะอาดขึ้น */}
                  <div className="relative py-4 flex-1 bg-white dark:bg-zinc-900/30" style={{ height: `${Math.max(res.tracks.length * 45 + 25, 85)}px` }}>
                    <div className="absolute inset-0 flex pointer-events-none">
                      {Array.from({ length: totalWeeks }).map((_, i) => (
                        <div key={i} style={{ width: weekWidth }} className="border-l border-default-200/30 dark:border-zinc-700/20" />
                      ))}
                    </div>

                    {/* Today Line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-warning-500/50 z-20 pointer-events-none"
                      style={{ left: `${((new Date().setHours(0, 0, 0, 0) - projectStartDate.getTime()) / 86400000) * dayWidth}px` }}
                    >
                      {idx === 0 && (
                        <div className="bg-warning text-[8px] text-black px-1 absolute top-0 -translate-x-1/2 font-bold rounded-sm shadow-sm">Today</div>
                      )}
                    </div>

                    {res.tracks.map((track: any[], tIdx: number) =>
                      track.map((task: any) => {
                        const start = new Date(task.startDate);
                        const diff = (start.getTime() - projectStartDate.getTime()) / 86400000;
                        return (
                          <div
                            key={task.id}
                            className={`group/task absolute h-7 rounded-md px-2 flex items-center text-[9px] font-bold shadow-md border transition-all z-10
                            ${tIdx > 0 ? "bg-danger/90 border-danger/20 text-white" : "bg-primary border-primary/20 text-white"}`}
                            style={{
                              left: `${diff * dayWidth}px`,
                              width: `${task.durationDay * dayWidth}px`,
                              top: `${tIdx * 45 + 15}px`,
                            }}
                          >
                            <span className="truncate">{task.name}</span>
                            
                            {/* Tooltip */}
                            <div className={`invisible group-hover/task:visible absolute left-0 z-[100] w-max max-w-[200px] bg-white dark:bg-zinc-800 border border-default-200 dark:border-zinc-700 p-2 rounded-lg shadow-2xl pointer-events-none transition-all
                              ${(idx === 0 && tIdx === 0) ? "top-full mt-2" : "bottom-full mb-2"}`}>
                              <div className="text-default-900 dark:text-white font-bold text-[10px] border-b border-default-100 dark:border-zinc-700 pb-1 mb-1">{task.name}</div>
                              <div className="text-[9px] text-default-500 leading-relaxed">
                                ระยะเวลา: {task.durationDay} วัน <br />
                                วันที่: {new Date(task.startDate).toLocaleDateString('th-TH')}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-default-500">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} /> {label}
    </div>
  );
}