"use client";

import { useState, useMemo, useRef, useLayoutEffect, useEffect } from "react";
import {
    ChevronRight,
    ChevronDown,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Sparkles,
} from "lucide-react";
import { Button } from "@heroui/react";

import { generatePlanningAI } from "@/lib/ai/geminiAI";

import {
    getPlanningTasksForAI,
    updatePlanningFromAI,
    getPlanningData,
    calculateTimeline,
} from "@/lib/actions/actionPlanning";

export default function GanttView({
    data,
    projectId,
    projectStart,
}: {
    data?: any[];
    projectId: number;
    projectStart: Date | null;
}) {
    const headerRef = useRef<HTMLDivElement>(null);

    const [todayLeft, setTodayLeft] = useState(0);
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
        {},
    );
    const [isGenerating, setIsGenerating] = useState(false);

    const [localData, setLocalData] = useState<any[]>(data ?? []);

    const projectStartDate = useMemo(() => {
        return projectStart ? new Date(projectStart) : new Date();
    }, [projectStart]);

    useEffect(() => {
        const sorted = (data ?? []).map((group) => ({
            ...group,
            tasks: [...group.tasks].sort((a, b) => {
                const aTime = new Date(a.startDate || projectStartDate).getTime();
                const bTime = new Date(b.startDate || projectStartDate).getTime();

                if (a.phaseAi === b.phaseAi && aTime !== bTime) {
                    return aTime - bTime;
                }

                return a.orderAi - b.orderAi;
            }),
        }));

        setLocalData(sorted);
    }, [data, projectStartDate]);



    const togglePhase = (id: string) => {
        setExpandedPhases((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const sidebarWidth = 350;

    const renderData = useMemo(() => localData ?? [], [localData]);

    const isEmpty = !renderData.some(
        (p) => p.tasks && p.tasks.some((t: any) => t.startDate && t.durationDay),
    );

    const totalDays = useMemo(() => {
        if (isEmpty) return 1;

        const all = renderData.flatMap((p) => p.tasks);

        const min = Math.min(
            ...all.map((t) => new Date(t.startDate || projectStartDate).getTime()),
        );

        const max = Math.max(
            ...all.map((t) => {
                const s = new Date(t.startDate);
                const e = new Date(s);
                e.setDate(s.getDate() + t.durationDay);
                return e.getTime();
            }),
        );

        return Math.ceil((max - min) / (1000 * 60 * 60 * 24));
    }, [renderData, isEmpty, projectStartDate]);

    const currentDay = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(projectStartDate);
        start.setHours(0, 0, 0, 0);

        return Math.floor(
            (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
    }, [projectStartDate]);

    const isOutOfRange = currentDay > totalDays - 1;

    useLayoutEffect(() => {
        if (isEmpty) return;

        const update = () => {
            if (!headerRef.current) return;

            const headerWidth = headerRef.current.clientWidth;
            const dayWidth = headerWidth / totalDays;
            const safeCurrentDay = Math.min(currentDay, totalDays - 1);

            setTodayLeft(sidebarWidth + safeCurrentDay * dayWidth);
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [currentDay, totalDays, isEmpty]);

    const getPosition = (task: any) => {
        const start = new Date(task.startDate || projectStartDate);
        start.setHours(0, 0, 0, 0);

        const base = new Date(projectStartDate);
        base.setHours(0, 0, 0, 0);

        const diff = (start.getTime() - base.getTime()) / (1000 * 60 * 60 * 24);

        return {
            start: diff,
            duration: task.durationDay || 1,
        };
    };

    const getStyle = (start: number, duration: number) => ({
        left: `${(start / totalDays) * 100}%`,
        width: `${(duration / totalDays) * 100}%`,
    });

    const getStatus = (task: any) => {
        const today = new Date();
        const start = new Date(task.startDate);

        const end = new Date(start);
        end.setDate(start.getDate() + task.durationDay);

        if (task.progress === 100) {
            return {
                label: "เสร็จสิ้น",
                icon: <CheckCircle2 size={12} className="text-emerald-400" />,
                color: "bg-emerald-500",
            };
        }

        if (today < start) {
            if (task.progress > 0) {
                return {
                    label: "เริ่มก่อนแผน",
                    icon: <AlertTriangle size={12} className="text-yellow-400" />,
                    color: "bg-yellow-500",
                };
            }
            return {
                label: "รอเริ่ม",
                icon: <Clock size={12} className="text-default-500" />,
                color: "bg-gray-500",
            };
        }

        const diff = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

        const expected = (diff / task.durationDay) * 100;

        if (task.progress < expected - 10) {
            return {
                label: "ล่าช้า",
                icon: <AlertTriangle size={12} className="text-red-400" />,
                color: "bg-red-500",
            };
        }

        return {
            label: "ตามแผน",
            icon: <CheckCircle2 size={12} className="text-blue-400" />,
            color: "bg-blue-500",
        };
    };

    const handleGenerateAI = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const aiTasks = await getPlanningTasksForAI(projectId);
            const compactTasks = aiTasks.map((t) => ({
                id: t.id,
                name: t.name,
                d: t.estimatedDurationDays,
            }));
            const prompt = `
                    Project start date: ${projectStartDate.toISOString().split("T")[0]}
                    Tasks:
                    ${JSON.stringify(compactTasks)}
                    `;

            const result = await generatePlanningAI(prompt);
            if (!result.success || !result.data.length) {
                console.error("[AI_GENERATE_FAIL]");
                return;
            }
            const withTimeline = await calculateTimeline(
                result.data,
                projectStartDate.toISOString().split("T")[0]
            );
            const updateRes = await updatePlanningFromAI(withTimeline);
            if (!updateRes.success) {
                console.error("[UPDATE_FAIL]", updateRes);
                return;
            }
            const res = await getPlanningData(projectId);
            const sorted = (res.data || []).map((group) => ({
                ...group,
                tasks: [...group.tasks].sort((a, b) => {
                    const aTime = new Date(a.startDate || projectStartDate).getTime();
                    const bTime = new Date(b.startDate || projectStartDate).getTime();
                    if (a.phaseAi === b.phaseAi && aTime !== bTime) {
                        return aTime - bTime;
                    }
                    return a.orderAi - b.orderAi;
                }),
            }));
            setLocalData(sorted);
        } catch (e) {
            console.error("[GENERATE_AI_ERROR]", e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-default-50 dark:bg-zinc-900 p-4 rounded-xl border border-default-200 dark:border-zinc-700 overflow-x-auto">
            {isEmpty ? (
                <div className="text-center p-10">
                    <div className="text-default-500 mb-4">ยังไม่มีแผนงาน</div>

                    <Button
                        color="secondary"
                        variant="flat"
                        radius="full"
                        className="font-bold"
                        startContent={<Sparkles size={16} />}
                        isLoading={isGenerating}
                        onClick={handleGenerateAI}
                    >
                        Generate Plan AI
                    </Button>
                </div>
            ) : (
                <div className="min-w-[1200px] relative">
                    {/* TODAY LINE */}
                    <div
                        className={`absolute top-0 bottom-0 w-[2px] z-50 ${isOutOfRange ? "bg-gray-500" : "bg-warning-400"
                            }`}
                        style={{ left: `${todayLeft}px` }}
                    />
                    {/* HEADER */}
                    <div className="flex items-end mb-4 h-12 border-b border-default-200 dark:border-zinc-700">
                        <div
                            style={{ width: sidebarWidth }}
                            className="flex items-end px-2 pb-1"
                        >
                            <Button
                                color="secondary"
                                variant="flat"
                                radius="full"
                                size="sm"
                                className="font-bold"
                                startContent={
                                    <Sparkles
                                        size={14}
                                        className={!isEmpty ? "animate-pulse" : ""}
                                    />
                                }
                                isLoading={isGenerating}
                                onClick={handleGenerateAI}
                            >
                                {isGenerating ? "AI กำลังปรับ..." : "ปรับแผนด้วย AI"}
                            </Button>
                        </div>

                        {/* 🔥 timeline header */}
                        <div ref={headerRef} className="flex flex-1 items-end">
                            {Array.from({ length: totalDays }).map((_, i) => {
                                const d = new Date(projectStartDate);
                                d.setDate(d.getDate() + i);

                                if (d.getDate() !== 1)
                                    return <div key={i} className="flex-1" />;

                                return (
                                    <div key={i} className="flex-1 text-xs text-default-500">
                                        {d.toLocaleDateString("th-TH", {
                                            month: "short",
                                            year: "2-digit",
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* PHASE */}
                    {renderData.map((phase) => (
                        <div key={phase.id} className="mb-4">
                            <div
                                onClick={() => togglePhase(phase.id)}
                                className="flex items-center gap-2 bg-default-100 dark:bg-zinc-800 p-2 rounded cursor-pointer"
                            >
                                {expandedPhases[phase.id] !== false ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                                <div className={`w-3 h-3 ${phase.color}`} />
                                <span className="text-sm font-semibold">{phase.title}</span>
                            </div>

                            {expandedPhases[phase.id] !== false && (
                                <div className="relative bg-default-50 dark:bg-zinc-800/40 p-2">
                                    {/* 🔥 GRID แบบเดิม */}
                                    <div
                                        className="absolute inset-y-0 right-0 flex pointer-events-none"
                                        style={{ left: sidebarWidth }}
                                    >
                                        {Array.from({ length: Math.ceil(totalDays) }).map(
                                            (_, i) => {
                                                if (i % 7 !== 0) return null;

                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex-1 border-l border-default-200 dark:border-zinc-700/30"
                                                    />
                                                );
                                            },
                                        )}
                                    </div>

                                    {phase.tasks.map((task: any, i: number) => {
                                        const pos = getPosition(task);
                                        const status = getStatus(task);
                                        const base = getStyle(pos.start, pos.duration);

                                        return (
                                            <div key={i} className="flex items-center h-10">
                                                <div
                                                    className="flex items-center px-4"
                                                    style={{ width: sidebarWidth }}
                                                >
                                                    <div className="flex-1 text-xs">{task.name}</div>

                                                    <div className="text-xs w-[40px] text-right">
                                                        {task.progress}%
                                                    </div>

                                                    <div className="text-xs text-default-500 w-[50px] text-right">
                                                        {task.durationDay}d
                                                    </div>

                                                    <div className="flex items-center gap-1 w-[90px] justify-end">
                                                        {status.icon}
                                                        <span className="text-[10px]">{status.label}</span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 relative h-6">
                                                    <div
                                                        className="absolute h-full bg-default-200 dark:bg-zinc-700/50 rounded"
                                                        style={base}
                                                    />

                                                    <div
                                                        className={`absolute h-full rounded ${status.color}`}
                                                        style={{
                                                            left: base.left,
                                                            width: `calc(${base.width} * ${task.progress / 100})`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
