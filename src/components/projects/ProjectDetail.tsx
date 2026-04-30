"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Building2,
  FileText,
  ShoppingCart,
  Cctv,
  Banknote,
  Rss,
  View,
  Sparkles,
  Calendar,
  LayoutDashboard,
} from "lucide-react";

import {
  Button,
  Chip,
  Progress,
  Modal,
  Input,
  ModalContent,
  ModalBody,
  useDisclosure,
  Spinner,
} from "@heroui/react";

import {
  DndContext,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import type { TabTask, ProjectDetailProps, SectionType } from "@/lib/type";
import { useRouter } from "next/navigation";
import CreateMainTask from "./forms/createMainTask";
import { calculateTaskProgress, getMediaType } from "@/lib/setting_data";
import { EmptyStateCard } from "./EmptyStateCard";
import { DropColumn } from "./DropColumn";
import { toast } from "react-toastify";
import { deleteFileS3, sendbase64toS3DataVdo } from "@/lib/actions/actionIndex";
import {
  createSubTask,
  toggleSubtaskStatus,
  updateMainTask,
  updateTaskStatus,
  updateVdoProject,
  updateSubtask,
  updateProjectProgressDB,
  deleteSubtask,
  updateMainTaskForm,
} from "@/lib/actions/actionProject";
import {
  checkVideoStatus,
  generationImage3D,
  startVideoJob,
} from "@/lib/ai/geminiAI";
import MainTaskCard from "./MainTaskCard";
import TaskFilterTabs from "./TaskFilterTabs";
import SubtaskItem from "./SubtaskItem";
import CreateSubtaskForm from "./forms/createSubtaskForm";
import UpdateMainTask from "./forms/updateMainTask";
import DeleteTaskModal from "./DeleteTaskModal";
import TaskActionButtons from "./TaskActionButtons";
import DeleteSubtaskModal from "./DeleteSubtaskModal";
import { getProjectMembers } from "@/lib/actions/actionTaskMember";
import { getContractors } from "@/lib/actions/actionTaskContractor";
import { getSuppliers } from "@/lib/actions/actionSupplier";
import DocumentSection from "./DocumentSection";
import FeedSection from "./feed/FeedSection";
import DashboardCamera from "./camera/DashboardCamera";
import ProcurementSection from "./procurement/ProcurementSection";
import DasboardMapping360 from "./360mapping/DasboardMapping360";
import TaskV2Section from "./taskv2/TaskV2Section";
import PlanningSection from "./planning/PlanningSection";
import ProjectDashboard from "./dashboard/projects/ConstructionDashboard";

const ProjectDetail = ({
  organizationId,
  currentUserId,
  dataDetail,
  isSpadmin,
}: ProjectDetailProps) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [tasks, setTasks] = useState<any[]>([]);
  const [view, setView] = useState<"card" | "board">("card");
  const [activeSection, setActiveSection] = useState<SectionType>("dashboard");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabTask>("all");
  const [priority, setPriority] = useState<"urgent" | "high" | "normal" | null>(
    null,
  );
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [projectInfo, setProjectInfo] = useState({
    id: "",
    code: "",
    name: "",
    customer: "",
    image: "",
    video: "",
    budget: 0,
  });

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatingStatusMainTask, setIsUpdatingStatusMainTask] =
    useState(false);

  // States for Subtask
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    detailName: "",
    detailDesc: "",
    startPlanned: "",
    durationDays: "",
    weightPercent: "",
  });
  const [updatingSubtaskId, setUpdatingSubtaskId] = useState<number | null>(
    null,
  );

  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskData, setEditingSubtaskData] = useState<any>({});
  const [isSavingSubtaskEdit, setIsSavingSubtaskEdit] = useState(false);

  const [subtaskIdToDelete, setSubtaskIdToDelete] = useState<number | null>(
    null,
  );
  const [isDeletingSubtask, setIsDeletingSubtask] = useState(false);

  const [visibleCount, setVisibleCount] = useState(10);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const lastLoadedMemberId = useRef<number | null>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeTab, debouncedQ, view]);

  useEffect(() => {
    const id = localStorage.getItem("currentProjectId");
    if (!id) {
      router.push("/projects");
      return;
    }

    setProjectInfo({
      id,
      code: localStorage.getItem("currentProjectCode") || "",
      name: localStorage.getItem("currentProjectName") || "",
      customer: localStorage.getItem("currentProjectCustomer") || "",
      image: localStorage.getItem("currentProjectImage") || "",
      video: localStorage.getItem("currentProjectVideo") || "",
      budget: parseInt(localStorage.getItem("currentProjectBudget") ?? "0"),
    });

    const initialFilteredTasks = dataDetail.filter(
      (t: any) => t.projectId === Number(id),
    );
    setTasks(initialFilteredTasks);
  }, [dataDetail, router]);

  useEffect(() => {
    if (view === "board") {
      setActiveTab("all");
      setQ("");
    }
  }, [view]);

  useEffect(() => {
    const pId = Number(projectInfo.id);
    if (pId && pId !== lastLoadedMemberId.current) {
      const load = async () => {
        const data = await getProjectMembers(pId);
        setProjectMembers(data || []);
        lastLoadedMemberId.current = pId;
      };
      load();
    }
  }, [projectInfo.id]);

  useEffect(() => {
    if (organizationId) {
      const load = async () => {
        const [cData, sData] = await Promise.all([
          getContractors(organizationId),
          getSuppliers(organizationId),
        ]);
        setContractors(cData || []);
        setSuppliersList(sData || []);
      };
      load();
    }
  }, [organizationId]);

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedId) || null,
    [tasks, selectedId],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      let matchTab = false;
      if (activeTab === "all") {
        matchTab = true;
      } else if (activeTab === "user") {
        matchTab = Number(t.createdById) === Number(currentUserId);
      } else {
        matchTab = (t.status || "").toUpperCase() === activeTab.toUpperCase();
      }

      const matchQ =
        debouncedQ === "" ||
        (t.taskName || "").toLowerCase().includes(debouncedQ.toLowerCase());

      return matchTab && matchQ;
    });
  }, [tasks, activeTab, debouncedQ, , currentUserId]);

  const displayedTasks = useMemo(() => {
    return filteredTasks.slice(0, visibleCount);
  }, [filteredTasks, visibleCount]);

  // useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       if (entries[0].isIntersecting) {
  //         setVisibleCount((prev) => {
  //           if (prev >= filteredTasks.length) return prev;
  //           return prev + 10;
  //         });
  //       }
  //     },
  //     { threshold: 0.1 },
  //   );

  //   const currentTarget = observerTarget.current;
  //   if (currentTarget) {
  //     observer.observe(currentTarget);
  //   }

  //   return () => {
  //     if (currentTarget) observer.unobserve(currentTarget);
  //   };
  // }, [filteredTasks.length, visibleCount]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();

    if (node) {
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setVisibleCount((prev) => {
              // โหลดเพิ่มทีละ 10
              return prev + 10;
            });
          }
        },
        { threshold: 0.1 },
      );

      observer.current.observe(node);
    }
  }, []);

  const projectProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((acc, t) => {
      if (t.status === "DONE") return acc + 100;
      return acc + (Number(t.progressPercent) || 0);
    }, 0);
    return Math.round(total / tasks.length);
  }, [tasks]);

  const lastSavedProgress = useRef<number | null>(null);

  useEffect(() => {
    if (!projectInfo.id || tasks.length === 0) return;

    const saveToDB = async () => {
      if (lastSavedProgress.current !== projectProgress) {
        const projectIdNum = parseInt(projectInfo.id);

        if (!isNaN(projectIdNum)) {
          let newProjectStatus = "PLANNING";
          if (projectProgress === 100) {
            newProjectStatus = "DONE";
          } else if (projectProgress > 0) {
            newProjectStatus = "IN_PROGRESS";
          }

          const res = await updateProjectProgressDB(
            projectIdNum,
            projectProgress,
            newProjectStatus,
          );

          if (res.success) {
            lastSavedProgress.current = projectProgress;
          }
        }
      }
    };

    const timer = setTimeout(() => {
      saveToDB();
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectProgress, projectInfo.id, tasks.length]);

  const handleSelectTask = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const handleUploadVideo = async (file: File) => {
    if (!projectInfo.id) {
      toast.error("ไม่พบข้อมูลโปรเจกต์");
      return;
    }
    setIsUploadingVideo(true);

    try {
      if (projectInfo.video) {
        try {
          const urlObj = new URL(projectInfo.video);
          let fileKey = urlObj.pathname.substring(1);
          if (fileKey.startsWith("homex/")) {
            fileKey = fileKey.replace("homex/", "");
          }
          await deleteFileS3(fileKey);
        } catch (err) {
          console.warn("Failed to delete old video or invalid URL", err);
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await sendbase64toS3DataVdo(formData, "vdo_projects");

      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || "อัปโหลดขึ้นระบบไม่สำเร็จ");
      }

      await updateVdoProject(parseInt(projectInfo.id), uploadRes.url);

      setProjectInfo((prev) => ({
        ...prev,
        video: uploadRes.url || "",
      }));
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการสร้างวิดีโอ");
    } finally {
      toast.success("สร้างและบันทึกสำเร็จ!");
      setIsUploadingVideo(false);
    }
  };

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) return;
      const taskId = active.id as number;
      const newStatus = over.id as string;
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate || taskToUpdate.status === newStatus) return;

      const newProgress =
        newStatus === "DONE" ? 100 : taskToUpdate.progressPercent;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus, progressPercent: newProgress }
            : t,
        ),
      );

      try {
        const res = await updateTaskStatus(taskId, newStatus);
        if (!res.success) throw new Error(res.error || "บันทึกไม่สำเร็จ");

        if (newStatus === "DONE") {
          await updateMainTask(taskId, { progressPercent: 100 });
        }

        toast.success(`เปลี่ยนสถานะงานเป็น ${newStatus} แล้ว`);
      } catch (error) {
        toast.error("อัปเดตสถานะไม่สำเร็จ ระบบจะดึงข้อมูลเดิมกลับมา");
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: taskToUpdate.status,
                  progressPercent: taskToUpdate.progressPercent,
                }
              : t,
          ),
        );
      }
    },
    [tasks],
  );

  useEffect(() => {
    if (selected) {
      setEditFormData({
        ...selected,
        assigneeIds: selected.assignees?.map((a: any) => a.id) || [],
        contractorIds: selected.contractors?.map((c: any) => c.id) || [],
      });
      setIsEditMode(false);
    }
  }, [selected]);

  const handleSaveTaskEdit = async () => {
    if (!editFormData || !editFormData.id) return;
    setIsSaving(true);
    try {
      let dataToSave = { ...editFormData, status: "PROGRESS" };
      if (dataToSave.startPlanned && dataToSave.durationDays) {
        const startDate = new Date(dataToSave.startPlanned);
        startDate.setDate(
          startDate.getDate() + Number(dataToSave.durationDays),
        );
        dataToSave.finishPlanned = startDate;
      }

      const res = await updateMainTaskForm(editFormData.id, dataToSave);
      if (!res.success) throw new Error(res.error || "บันทึกข้อมูลไม่สำเร็จ");
      setTasks((prev) =>
        prev.map((t) =>
          Number(t.id) === Number(dataToSave.id) ? { ...t, ...dataToSave } : t,
        ),
      );
      toast.success("บันทึกข้อมูลเรียบร้อย");
      setIsEditMode(false);
    } catch (error: any) {
      toast.error(error.message || "บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selected) return;
    setIsDeletingTask(true);
    try {
      await updateTaskStatus(selected.id, "DELETED");
      await new Promise((resolve) => setTimeout(resolve, 800));
      setTasks((prev) => prev.filter((t) => t.id !== selected.id));
      setSelectedId(null);
      setIsDeleteModalOpen(false);
      toast.success("ลบงานเรียบร้อย");
    } catch (error) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleSaveSubtask = async () => {
    if (!newSubtask.detailName.trim()) {
      toast.warning("กรุณากรอกชื่อรายการย่อย");
      return;
    }
    if (!selected || !selected.id) return;

    setIsSavingSubtask(true);
    try {
      const payload = {
        detailName: newSubtask.detailName,
        detailDesc: newSubtask.detailDesc || undefined,
        startPlanned: newSubtask.startPlanned
          ? new Date(newSubtask.startPlanned).toISOString()
          : undefined,
        durationDays: newSubtask.durationDays
          ? Number(newSubtask.durationDays)
          : undefined,
        weightPercent: newSubtask.weightPercent
          ? Number(newSubtask.weightPercent)
          : 0,
        organizationId: organizationId,
        projectId: Number(projectInfo.id),
        taskId: selected.id,
        status: false,
      };

      const res = await createSubTask(payload);
      if (!res.success || !res.data)
        throw new Error(res.message || "สร้างรายการย่อยไม่สำเร็จ");

      const updatedDetails = [...(selected.details || []), res.data];
      const newProgress = calculateTaskProgress(updatedDetails);
      await updateMainTask(selected.id, { progressPercent: newProgress });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, details: updatedDetails, progressPercent: newProgress }
            : t,
        ),
      );

      toast.success("เพิ่มรายการย่อยสำเร็จ");
      setIsAddingSubtask(false);
      setNewSubtask({
        detailName: "",
        detailDesc: "",
        startPlanned: "",
        durationDays: "",
        weightPercent: "",
      });
    } catch (error: any) {
      toast.error(error.message || "บันทึกไม่สำเร็จ");
    } finally {
      setIsSavingSubtask(false);
    }
  };

  const startEditSubtask = (subtask: any) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskData({
      detailName: subtask.detailName || "",
      detailDesc: subtask.detailDesc || "",
      startPlanned: subtask.startPlanned
        ? new Date(subtask.startPlanned).toISOString().split("T")[0]
        : "",
      durationDays: subtask.durationDays || "",
      weightPercent: subtask.weightPercent || "",
    });
  };

  const handleSaveSubtaskEdit = async () => {
    if (!editingSubtaskData.detailName.trim()) {
      toast.warning("กรุณากรอกชื่อรายการย่อย");
      return;
    }
    if (!selected || !editingSubtaskId) return;

    setIsSavingSubtaskEdit(true);
    try {
      const payload = { ...editingSubtaskData };
      const res = await updateSubtask(editingSubtaskId, payload);

      if (!res.success || !res.data)
        throw new Error(res.error || "แก้ไขไม่สำเร็จ");

      const updatedDetails = (selected.details || []).map((sub: any) =>
        sub.id === editingSubtaskId ? res.data : sub,
      );

      const newProgress = calculateTaskProgress(updatedDetails);
      await updateMainTask(selected.id, { progressPercent: newProgress });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === selected.id) {
            return {
              ...t,
              details: updatedDetails,
              progressPercent: newProgress,
            };
          }
          return t;
        }),
      );

      toast.success("แก้ไขรายการย่อยสำเร็จ");
      setEditingSubtaskId(null);
    } catch (error: any) {
      toast.error(error.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setIsSavingSubtaskEdit(false);
    }
  };

  const confirmDeleteSubtask = async () => {
    if (!selected || subtaskIdToDelete === null) return;

    setIsDeletingSubtask(true);
    try {
      const res = await deleteSubtask(subtaskIdToDelete);
      if (!res.success) throw new Error(res.error || "ลบไม่สำเร็จ");

      const updatedDetails = (selected.details || []).filter(
        (sub: any) => sub.id !== subtaskIdToDelete,
      );

      const newProgress = calculateTaskProgress(updatedDetails);
      await updateMainTask(selected.id, { progressPercent: newProgress });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === selected.id) {
            return {
              ...t,
              details: updatedDetails,
              progressPercent: newProgress,
            };
          }
          return t;
        }),
      );

      toast.success("ลบรายการย่อยสำเร็จ");
      setSubtaskIdToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "ลบรายการย่อยไม่สำเร็จ");
    } finally {
      setIsDeletingSubtask(false);
    }
  };

  const handleUpdateStatusMainTask = async (newStatus: string) => {
    if (!selected) return;
    setIsUpdatingStatusMainTask(true);
    try {
      const res = await updateTaskStatus(selected.id, newStatus);
      if (!res.success) throw new Error(res.error || "อัปเดตสถานะไม่สำเร็จ");

      let newProgress = selected.progressPercent;
      if (newStatus === "DONE") {
        newProgress = 100;
        await updateMainTask(selected.id, { progressPercent: 100 });
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, status: newStatus, progressPercent: newProgress }
            : t,
        ),
      );
      toast.success(`เปลี่ยนสถานะงานเป็น ${newStatus} แล้ว`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setIsUpdatingStatusMainTask(false);
    }
  };

  const handleToggleSubtask = async (
    subtaskId: number,
    currentStatus: boolean,
    imageUrl?: string,
  ) => {
    if (!selected) return;
    setUpdatingSubtaskId(subtaskId);
    try {
      const newStatus = !currentStatus;

      const currentSubtask = selected.details.find(
        (sub: any) => sub.id === subtaskId,
      );
      // 👉 ถ้าเป็น "ยกเลิก"
      if (currentStatus && currentSubtask?.imageUrl) {
        try {
          const urlObj = new URL(currentSubtask.imageUrl);
          let fileKey = urlObj.pathname.substring(1);
          if (fileKey.startsWith("homex/")) {
            fileKey = fileKey.replace("homex/", "");
          }
          await deleteFileS3(fileKey);
        } catch (err) {
          console.warn("ลบรูปไม่สำเร็จ", err);
        }
      }

      const res = await toggleSubtaskStatus(subtaskId, newStatus, imageUrl);
      if (!res.success) throw new Error(res.error || "อัปเดตไม่สำเร็จ");

      const updatedDetails = (selected.details || []).map((sub: any) =>
        sub.id === subtaskId
          ? {
              ...sub,
              status: newStatus,
              ...(newStatus
                ? imageUrl
                  ? { imageUrl }
                  : {}
                : { imageUrl: null }),
            }
          : sub,
      );

      const newProgress = calculateTaskProgress(updatedDetails);
      let updatePayload: any = { progressPercent: newProgress };
      let updatedMainTaskStatus = selected.status;

      if (newProgress !== 100) {
        updatedMainTaskStatus = "PROGRESS";
        updatePayload.status = "PROGRESS";
      } else {
        updatedMainTaskStatus = "DONE";
        updatePayload.status = "DONE";
      }

      await updateMainTask(selected.id, updatePayload);
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === selected.id) {
            return {
              ...task,
              details: updatedDetails,
              progressPercent: newProgress,
              status: updatedMainTaskStatus,
            };
          }
          return task;
        }),
      );
    } catch (error: any) {
      toast.error(error.message || "อัปเดตรายการย่อยไม่สำเร็จ");
    } finally {
      setUpdatingSubtaskId(null);
    }
  };

  const budgetSummary = useMemo(() => {
    const totalBudget = tasks.reduce(
      (sum, t) => sum + (Number(t.budget) || 0),
      0,
    );

    return {
      expenses: totalBudget,
    };
  }, [tasks]);

  const handleAISuccess = async (subtasks: any[]) => {
    if (!selected) return;

    try {
      const savePromises = subtasks.map((item) =>
        createSubTask({
          detailName: item.detailName,
          detailDesc: item.detailDesc || "",
          weightPercent: Number(item.weightPercent) || 0,
          taskId: selected.id,
          projectId: Number(projectInfo.id),
          organizationId: organizationId,
          status: false,
        }),
      );

      const results = await Promise.all(savePromises);

      const newSavedSubtasks = results
        .filter((res) => res.success)
        .map((res) => res.data);

      if (newSavedSubtasks.length === 0) throw new Error("บันทึกไม่สำเร็จ");

      const updatedDetails = [...(selected.details || []), ...newSavedSubtasks];
      const newProgress = calculateTaskProgress(updatedDetails);

      await updateMainTask(selected.id, { progressPercent: newProgress });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? {
                ...t,
                details: updatedDetails,
                progressPercent: newProgress,
              }
            : t,
        ),
      );
    } catch (error) {
      console.error("AI Save Error:", error);
    }
  };

  const handleTabChange = (newSection: string) => {
    if (activeSection === "camera" && newSection !== "camera") {
      window.dispatchEvent(new Event("force-stop-camera"));
      setTimeout(() => {
        setActiveSection(newSection);
      }, 300);
    } else {
      setActiveSection(newSection);
    }
  };

  const isOwner =
    selected && Number(selected.createdById) === Number(currentUserId);
  const spadmin = isSpadmin === "Spadmin";
  const canManage = isOwner || spadmin;
  const isCustomer = isSpadmin === "Customer";

  const mediaUrl = projectInfo.video;
  const mediaType = getMediaType(mediaUrl);

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 overflow-x-hidden box-border">
      {/* --- HERO SECTION --- */}
      <div className="bg-default-100 dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[400px_1fr] xl:grid-cols-[560px_1fr] gap-6 items-center w-full max-w-full">
        <div className="relative w-full max-w-full h-[200px] sm:h-[240px] lg:h-[320px] rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-800 shrink-0">
          {(isGeneratingVideo || isUploadingVideo) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Spinner color="primary" size="lg" />
              <p className="text-white text-xs sm:text-sm mt-3 animate-pulse">
                โปรดรอสักครู่...
              </p>
            </div>
          )}
          {mediaType === "video" ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              src={mediaUrl}
              key={mediaUrl}
            />
          ) : mediaType === "image" ? (
            <img
              src={mediaUrl}
              alt="Project Media"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/50 border-2 border-dashed border-zinc-700 text-zinc-500">
              <p className="text-sm font-medium">ไม่มีรูปภาพหรือวิดีโอ</p>
            </div>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4 w-full min-w-0 flex flex-col justify-center h-full">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight break-words line-clamp-2">
            {projectInfo.name || "Project Name"}
          </h1>
          <p className="text-default-500 dark:text-zinc-400 text-xs sm:text-sm truncate">
            ลูกค้า: {projectInfo.customer || "-"}
          </p>
          <div className="grid grid-cols-2 gap-2 py-1">
            <div className="bg-background/50 dark:bg-zinc-800/50 p-2 rounded-xl border border-default-100">
              <p className="text-[10px] uppercase text-default-400 font-bold mb-0.5">
                งบประมาณโครงการ
              </p>
              <p className="text-sm sm:text-base font-bold text-primary flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{projectInfo.budget.toLocaleString()}</span>
              </p>
            </div>
            <div className="bg-background/50 dark:bg-zinc-800/50 p-2 rounded-xl border border-default-100">
              <p className="text-[10px] uppercase text-default-400 font-bold mb-0.5">
                ค่าใช้จ่ายโดยประมาณ
              </p>
              <p
                className={`text-sm sm:text-base font-bold flex items-center gap-1.5 ${
                  budgetSummary.expenses > projectInfo.budget
                    ? "text-danger"
                    : "text-warning"
                }`}
              >
                <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{budgetSummary.expenses.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Chip color="primary" size="sm">
              IN PROGRESS
            </Chip>
            <Chip variant="flat" size="sm">
              {projectProgress}% Complete
            </Chip>
          </div>
          <Progress
            value={projectProgress}
            color="primary"
            className="py-1 w-full"
          />
          {!isCustomer && (
            <div className="pt-2 w-full max-w-full">
              <div className="relative w-full sm:w-auto block">
                <input
                  type="file"
                  accept=".mp4,.mov"
                  className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isUploadingVideo ? "cursor-not-allowed" : "cursor-pointer"}`}
                  disabled={isUploadingVideo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 10 * 1024 * 1024)
                      await handleUploadVideo(file);
                    else if (file)
                      toast.error("ขนาดไฟล์ใหญ่เกินไป (ไม่เกิน 10MB)");
                    e.target.value = "";
                  }}
                />
                <Button
                  color="primary"
                  variant="shadow"
                  className="font-medium w-full sm:w-auto"
                  isLoading={isUploadingVideo}
                >
                  {isUploadingVideo ? "กำลังอัปโหลด..." : "📤 อัปโหลดวิดีโอ"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 bg-default-100 dark:bg-zinc-800/50 p-1.5 rounded-2xl w-full">
          {[
            {
              id: "dashboard",
              label: "สรุป",
              icon: <LayoutDashboard size={18} />,
            },
            // { id: "tasks", label: "งาน", icon: <Building2 size={18} /> },
            {
              id: "taskv2",
              label: (
                <span>
                  งาน{" "}
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-white leading-none">
                    New
                  </span>
                </span>
              ),
              icon: <Sparkles size={18} />,
            },
            { id: "feed", label: "ฟีด", icon: <Rss size={18} /> },
            {
              id: "purchasing",
              label: "จัดซื้อ",
              icon: <ShoppingCart size={18} />,
            },
            { id: "documents", label: "เอกสาร", icon: <FileText size={18} /> },
            { id: "planning", label: "แผนงาน", icon: <Calendar size={18} /> },
            // { id: "camera", label: "กล้อง", icon: <Cctv size={18} /> },
            // { id: "360mapping", label: "360°", icon: <View size={18} /> },
          ].map((item) => (
            <Button
              key={item.id}
              onPress={() => handleTabChange(item.id)}
              variant={activeSection === item.id ? "solid" : "light"}
              color={activeSection === item.id ? "primary" : "default"}
              size="md"
              radius="lg"
              className={`w-full font-bold h-11 ${activeSection === item.id ? "shadow-md bg-white dark:bg-zinc-700" : "text-default-500"}`}
              startContent={item.icon}
            >
              <span className="text-xs sm:text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full min-h-[400px] overflow-hidden">
        {activeSection === "tasks" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="w-full min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold">Tasks</h2>
                <p className="text-default-500 text-xs sm:text-sm">
                  ติดตามรายการงาน
                </p>
              </div>
              <div className="w-full md:w-auto flex items-center gap-2">
                <div className="flex bg-default-100 p-1 rounded-xl shrink-0">
                  <Button
                    size="sm"
                    variant={view === "card" ? "solid" : "light"}
                    onPress={() => setView("card")}
                  >
                    Card
                  </Button>
                  <Button
                    size="sm"
                    variant={view === "board" ? "solid" : "light"}
                    onPress={() => setView("board")}
                  >
                    Board
                  </Button>
                </div>
                {!isCustomer && (
                  <Button
                    onPress={onOpen}
                    color="primary"
                    radius="full"
                    className="font-bold shrink-0"
                  >
                    + สร้าง Task เอง
                  </Button>
                )}
              </div>
            </div>

            <CreateMainTask
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              projectId={Number(projectInfo.id)}
              organizationId={organizationId}
              currentUserId={currentUserId}
              projectCode={projectInfo.code}
              members={projectMembers}
              contractors={contractors}
            />

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="overflow-x-auto scrollbar-hide shrink-0">
                  <TaskFilterTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </div>
                <Input
                  placeholder="ค้นหา..."
                  value={q}
                  onValueChange={setQ}
                  isClearable
                  size="sm"
                  startContent={<Search size={16} />}
                  className="w-full"
                />
              </div>

              {/* 🌟 คืนค่าการเช็ค Empty State */}
              {filteredTasks.length === 0 ? (
                <EmptyStateCard onOpen={onOpen} />
              ) : (
                <>
                  {view === "card" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {displayedTasks.map((t) => (
                        <MainTaskCard
                          key={t.id}
                          task={t}
                          onSelect={handleSelectTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 w-full min-w-0">
                          <DropColumn
                            status="TODO"
                            tasks={filteredTasks.filter(
                              (t) => t.status === "TODO",
                            )}
                            onTaskClick={handleSelectTask}
                          />
                          <DropColumn
                            status="PROGRESS"
                            tasks={filteredTasks.filter(
                              (t) => t.status === "PROGRESS",
                            )}
                            onTaskClick={handleSelectTask}
                          />
                          <DropColumn
                            status="DONE"
                            tasks={filteredTasks.filter(
                              (t) => t.status === "DONE",
                            )}
                            onTaskClick={handleSelectTask}
                          />
                        </div>
                      </DndContext>
                    </div>
                  )}
                </>
              )}
            </div>
            {view === "card" &&
              visibleCount < filteredTasks.length &&
              filteredTasks.length > 0 && (
                <div ref={lastElementRef} className="flex justify-center py-10">
                  <Spinner color="primary" />
                </div>
              )}
          </div>
        )}

        {activeSection === "documents" && (
          <DocumentSection
            organizationId={organizationId}
            currentUserId={currentUserId}
            isSpadmin={isSpadmin}
            projectId={Number(projectInfo.id)}
          />
        )}

        {activeSection === "feed" && (
          <FeedSection
            projectId={Number(projectInfo.id)}
            organizationId={organizationId}
            currentUserId={currentUserId}
          />
        )}

        {activeSection === "purchasing" && (
          <ProcurementSection
            projectId={Number(projectInfo.id)}
            organizationId={organizationId}
            currentUserId={currentUserId}
            suppliers={suppliersList}
            tasks={tasks.map((t: any) => ({
              id: t.id,
              taskName: t.taskName,
              status: t.status,
              startPlanned: t.startPlanned,
              coverImageUrl: t.coverImageUrl || null,
            }))}
          />
        )}

        {activeSection === "planning" && (
          <PlanningSection
            projectId={Number(projectInfo.id)}
            organizationId={organizationId}
            currentUserId={currentUserId}
          />
        )}

        {/* camera and 360 features hidden for generic version */}
        {/* {activeSection === "camera" && (
          <DashboardCamera
            projectId={Number(projectInfo.id)}
            organizationId={organizationId}
            currentUserId={currentUserId}
          />
        )}

        {activeSection === "360mapping" && (
          <DasboardMapping360
            projectId={Number(projectInfo.id)}
            organizationId={organizationId}
            currentUserId={currentUserId}
          />
        )} */}

        {activeSection === "taskv2" && (
          <TaskV2Section
            tasks={tasks}
            setTasks={setTasks}
            projectInfo={projectInfo}
            organizationId={organizationId}
            currentUserId={currentUserId}
            isCustomer={isCustomer}
            projectMembers={projectMembers}
            contractors={contractors}
          />
        )}

        {activeSection === "dashboard" && (
          <ProjectDashboard
            currentUserId={currentUserId}
            projectId={Number(projectInfo.id)}
            organizationId={organizationId}
            projectInfo={projectInfo}
            projectProgress={projectProgress}
            expenses={budgetSummary.expenses}
          />
        )}

        {/* Section อื่นๆ */}
        {![
          "dashboard",
          "tasks",
          "documents",
          "feed",
          "purchasing",
          "planning",
          "taskv2",
        ].includes(activeSection) && (
          <div className="flex flex-col items-center justify-center p-20 bg-default-50 rounded-3xl border-2 border-dashed">
            <p className="text-default-400 font-bold uppercase tracking-widest">
              Coming Soon
            </p>
          </div>
        )}
      </div>

      {/* --- MODAL (จัดกึ่งกลางเป๊ะสำหรับ iPhone 14) --- */}
      <Modal
        isOpen={!!selected}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedId(null);
        }}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        size="3xl"
        placement="center"
        classNames={{
          base: "max-h-[90vh] md:max-h-[85vh] rounded-2xl mx-4 sm:mx-auto overflow-hidden",
          closeButton: "top-3 right-3 bg-default-100 hover:bg-default-200 z-50",
        }}
      >
        <ModalContent className="flex flex-col overflow-hidden">
          {selected && (
            <ModalBody className="space-y-5 md:py-8 overflow-y-auto scrollbar-hide flex-1 p-4">
              {canManage && (
                <TaskActionButtons
                  isEditMode={isEditMode}
                  setIsEditMode={setIsEditMode}
                  isSaving={isSaving}
                  handleSaveTaskEdit={handleSaveTaskEdit}
                  setIsDeleteModalOpen={setIsDeleteModalOpen}
                />
              )}
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={selected.coverImageUrl || "/placeholder-image.jpg"}
                  className="w-full md:w-80 h-48 object-cover rounded-2xl"
                  alt="Cover"
                />
                <div className="flex-1 min-w-0 space-y-4">
                  <UpdateMainTask
                    isEditMode={isEditMode}
                    selected={selected}
                    editFormData={editFormData}
                    setEditFormData={setEditFormData}
                    isUpdatingStatusMainTask={isUpdatingStatusMainTask}
                    handleUpdateStatusMainTask={handleUpdateStatusMainTask}
                    members={projectMembers}
                    contractors={contractors}
                    isOwner={canManage}
                  />
                </div>
              </div>
              {!isEditMode && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">รายการย่อย (Subtasks)</h3>
                  <div className="overflow-y-auto max-h-80 space-y-2">
                    {(selected.details || []).length > 0 ? (
                      selected.details.map((s: any) => (
                        <SubtaskItem
                          key={s.id}
                          subtask={s}
                          updatingSubtaskId={updatingSubtaskId}
                          editingSubtaskId={editingSubtaskId}
                          editingSubtaskData={editingSubtaskData}
                          isSavingSubtaskEdit={isSavingSubtaskEdit}
                          setEditingSubtaskData={setEditingSubtaskData}
                          startEditSubtask={startEditSubtask}
                          setEditingSubtaskId={setEditingSubtaskId}
                          handleSaveSubtaskEdit={handleSaveSubtaskEdit}
                          handleToggleSubtask={handleToggleSubtask}
                          handleDeleteSubtask={setSubtaskIdToDelete}
                          canManage={canManage}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center text-default-400 bg-default-50 rounded-xl border border-dashed">
                        ไม่มีรายการย่อย
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <CreateSubtaskForm
                      isAddingSubtask={isAddingSubtask}
                      setIsAddingSubtask={setIsAddingSubtask}
                      newSubtask={newSubtask}
                      setNewSubtask={setNewSubtask}
                      handleSaveSubtask={handleSaveSubtask}
                      isSavingSubtask={isSavingSubtask}
                      taskName={selected?.taskName}
                      onAISuccess={handleAISuccess}
                    />
                  )}
                </div>
              )}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>

      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        taskName={selected?.taskName}
        isDeleting={isDeletingTask}
        onConfirm={handleDeleteTask}
      />
      <DeleteSubtaskModal
        isOpen={subtaskIdToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSubtaskIdToDelete(null);
        }}
        isDeleting={isDeletingSubtask}
        onConfirm={confirmDeleteSubtask}
      />
    </div>
  );
};

export default ProjectDetail;
