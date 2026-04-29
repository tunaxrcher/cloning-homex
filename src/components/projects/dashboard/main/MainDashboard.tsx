"use client";

import { useEffect, useState } from "react";
import {
  Building2, Wallet, AlertTriangle, Activity, TrendingUp,
  ArrowUpRight, ArrowDownRight, CalendarClock, ChevronRight,
  PieChart, AlertCircle,
} from "lucide-react";
import { Progress, Button, Spinner } from "@heroui/react";
import { getGlobalDashboardData } from "@/lib/actions/actionMainDashboard";


// รับ Props organizationId เข้ามาเพื่อดึงข้อมูลให้ตรงบริษัท
export default function MainDashboard({ organizationId }: { organizationId: number }) {
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับเก็บข้อมูลที่ดึงมา
  const [dashboardData, setDashboardData] = useState({
    globalStats: {
      totalProjects: 0, activeProjects: 0, planningProjects: 0,
      totalBudget: 0, totalExpenses: 0, delayedProjects: 0, avgProgress: 0,
    },
    topBurnRateProjects: [] as any[],
    urgentMilestones: [] as any[],
  });

  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return;
      setIsLoading(true);
      try {
        const res = await getGlobalDashboardData(organizationId);
        if (res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [organizationId]);

  const { globalStats, topBurnRateProjects, urgentMilestones } = dashboardData;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <Spinner size="lg" color="primary" label="กำลังโหลดข้อมูลสรุป..." />
      </div>
    );
  }

  return (
    <div className="mb-10 space-y-6">
      {/* --- 1. HEADER --- */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Activity className="text-blue-500" size={24} />
          Executive Overview
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          สรุปภาพรวมการดำเนินงานและงบประมาณทุกโครงการ (Portfolio Summary)
        </p>
      </div>

      {/* --- 2. KPI CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* โครงการทั้งหมด */}
        <div className="bg-[#131820] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-blue-500/10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              โครงการทั้งหมด
            </h3>
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><Building2 size={16} /></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-2">{globalStats.totalProjects}</h2>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                กำลังทำ {globalStats.activeProjects}
              </span>
              <span className="text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                วางแผน {globalStats.planningProjects}
              </span>
            </div>
          </div>
        </div>

        {/* มูลค่าโครงการรวม */}
        <div className="bg-[#131820] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-emerald-500/10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              มูลค่าโครงการรวม
            </h3>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400"><Wallet size={16} /></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-1 mb-2">
              <h2 className="text-3xl font-extrabold text-white">
                {(globalStats.totalBudget / 1000000000).toFixed(1)}
              </h2>
              <span className="text-sm text-zinc-500 font-medium">พันล้านบาท</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              เบิกจ่ายแล้ว <span className="text-white">{(globalStats.totalExpenses / 1000000).toFixed(0)}M</span>
              <span className="text-emerald-400 flex items-center ml-1">
                <ArrowUpRight size={12} />
                {globalStats.totalBudget > 0 ? ((globalStats.totalExpenses / globalStats.totalBudget) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* ความคืบหน้ารวม */}
        <div className="bg-[#131820] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-purple-500/10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              ความคืบหน้ารวม
            </h3>
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400"><TrendingUp size={16} /></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-1 mb-3">
              <h2 className="text-3xl font-extrabold text-white">{globalStats.avgProgress}</h2>
              <span className="text-sm text-zinc-500 font-medium">%</span>
            </div>
            <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${globalStats.avgProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* โครงการที่ล่าช้า */}
        <div className="bg-[#131820] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-danger-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-danger-500/10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              โครงการที่ล่าช้า
            </h3>
            <div className="p-1.5 bg-danger-500/10 rounded-lg text-danger-500"><AlertTriangle size={16} /></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-3xl font-extrabold text-danger-500">{globalStats.delayedProjects}</h2>
              <span className="text-sm text-zinc-500 font-medium">โครงการ</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <span className="text-danger-400 bg-danger-400/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                <ArrowDownRight size={12} /> ต้องการการจัดการด่วน
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. WIDGET SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 📊 Widget ซ้าย: Financial Health */}
        <div className="bg-[#131820] border border-white/5 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="text-orange-500" size={18} /> Financial Burn Rate
            </h3>
            <Button size="sm" variant="light" className="text-zinc-500 text-xs">
              ดูบัญชีรวม <ChevronRight size={14} />
            </Button>
          </div>

          <div className="space-y-5">
            {topBurnRateProjects.length > 0 ? topBurnRateProjects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-bold text-zinc-300 line-clamp-1">{proj.name}</p>
                  <p className="text-[10px] text-zinc-500">
                    <span className={proj.percent > 75 ? "text-danger-500 font-bold" : "text-white font-bold"}>
                      {(proj.spent / 1000000).toFixed(1)}M
                    </span>{" "}
                    / {(proj.budget / 1000000).toFixed(1)}M
                  </p>
                </div>
                <Progress
                  value={proj.percent}
                  color={proj.percent > 75 ? "danger" : proj.percent > 50 ? "warning" : "primary"}
                  className="h-1.5"
                  classNames={{ track: "bg-zinc-800" }}
                />
              </div>
            )) : (
               <p className="text-sm text-zinc-500 text-center py-4">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        {/* 🚨 Widget ขวา: Global Milestones */}
        <div className="bg-[#131820] border border-white/5 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} /> Urgent Milestones
            </h3>
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-bold">
              {urgentMilestones.length} งานด่วน
            </span>
          </div>

          <div className="space-y-3">
            {urgentMilestones.length > 0 ? urgentMilestones.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#0a0c10] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{item.task}</h4>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                    <Building2 size={10} /> {item.project}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {item.daysLeft < 0 ? (
                    <span className="text-[10px] font-bold text-danger-500 bg-danger-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                      Overdue {Math.abs(item.daysLeft)} Days
                    </span>
                  ) : item.daysLeft === 0 ? (
                    <span className="text-[10px] font-bold text-warning-500 bg-warning-500/10 px-2 py-1 rounded-md">
                      Due Today
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                      <CalendarClock size={10} /> In {item.daysLeft} Days
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-sm text-zinc-500 text-center py-4">ไม่มีงานที่ใกล้ถึงกำหนด</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};