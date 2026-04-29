"use client";

import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  useDisclosure,
} from "@heroui/react";
import { Plus, Search, Building2, FolderSearch } from "lucide-react";
import ProjectCard from "./ProjectCard";
import { CreateProject } from "./forms/createProject";
import React, { useMemo, useState } from "react";
import { MainPageProjectProps } from "@/lib/type";

const MainPageProject = ({
  organizationId,
  currentUserId,
  projects,
  userType,
  users,
}: MainPageProjectProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const editModal = useDisclosure();

  const [projectToEdit, setProjectToEdit] = useState<any>(null);
  const tabs = ["All", "IN_PROGRESS", "DONE", "PLANNING"] as const;
  type TabKey = (typeof tabs)[number];

  const labelMap: Record<TabKey, string> = {
    All: "All",
    IN_PROGRESS: "In Progress",
    DONE: "Completed",
    PLANNING: "PLANNING",
  };

  const normalizeStatus = (s?: string) => (s ?? "").toUpperCase().trim();

  const [activeTab, setActiveTab] = useState<TabKey>("All");

  const [q, setQ] = useState("");

  const INITIAL_COUNT = 11;
  const LOAD_MORE_COUNT = 12;

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const norm = (s?: any) =>
    String(s ?? "")
      .toLowerCase()
      .trim();

  const [qDebounced, setQDebounced] = useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [activeTab, qDebounced]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeTab !== "All") {
      list = list.filter((p) => normalizeStatus(p.status) === activeTab);
    }

    const keyword = norm(qDebounced);
    if (!keyword) return list;

    return list.filter((p) => {
      const hay = [
        p.name,
        p.client,
        p.address,
        p.status,
        p.startPlanned,
        p.finishPlanned,
        p.budget,
        p.durationDays,
      ]
        .map(norm)
        .join(" ");

      return hay.includes(keyword);
    });
  }, [projects, activeTab, qDebounced]);

  // infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + LOAD_MORE_COUNT, filteredProjects.length),
          );
        }
      },
      { threshold: 0.3 },
    );

    const current = loadMoreRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [filteredProjects.length]);

  const handleEditClick = (projectData: any) => {
    setProjectToEdit(projectData);
    editModal.onOpen();
  };

  const isCustomer = userType === "Customer";

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Building2 className="text-orange-500 w-5 h-5 sm:w-8 sm:h-8" />{" "}
            Projects
          </h1>
          <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">
            จัดการและติดตามความคืบหน้าโครงการทั้งหมด ({filteredProjects.length})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 sm:gap-3">
          <Input
            classNames={{
              base: "w-full sm:w-64 h-10 sm:h-11",
              mainWrapper: "h-full",
              input: "text-small",
              inputWrapper:
                "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20 rounded-full px-4",
            }}
            value={q}
            onValueChange={setQ}
            isClearable
            onClear={() => setQ("")}
            placeholder="ค้นหา..."
            size="sm"
            startContent={<Search size={16} />}
            type="search"
          />

          {!isCustomer && (
            <Button
              onPress={onOpen}
              className="w-full sm:w-auto bg-black text-white dark:bg-white dark:text-black font-medium shadow-md h-10 sm:h-11"
              radius="full"
            >
              <Plus size={18} /> <span className="text-sm">สร้างโครงการ</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Chip
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={isActive ? "solid" : "bordered"}
              color={isActive ? "primary" : "default"}
              className={`cursor-pointer shrink-0 h-8 transition-all ${
                isActive ? "shadow-sm" : "border-default-200"
              }`}
              size="sm"
            >
              {labelMap[tab]}
            </Chip>
          );
        })}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 w-full animate-fade-in">
          <Card className="w-full max-w-md bg-transparent border-dashed border-2 border-default-300 shadow-none">
            <CardBody className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="p-4 rounded-full bg-default-100 text-default-400">
                <FolderSearch size={48} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-default-700">
                  ไม่พบโครงการที่ค้นหา
                </h3>
                <p className="text-sm text-default-500">
                  ลองเปลี่ยนคำค้นหา หรือสร้างโครงการใหม่
                </p>
              </div>
              <Button
                onPress={onOpen}
                color="primary"
                variant="flat"
                radius="full"
                className="mt-2"
                startContent={<Plus size={18} />}
              >
                สร้างโครงการ
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredProjects.slice(0, visibleCount).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              users={users}
              onEdit={handleEditClick}
            />
          ))}

          <div onClick={onOpen} className="group h-full">
            <Card className="h-full min-h-[160px] sm:min-h-[360px] border border-dashed border-default-300 bg-transparent hover:border-primary hover:bg-default-50 transition-all cursor-pointer shadow-none">
              <CardBody className="flex flex-col items-center justify-center gap-2 text-default-400">
                <div className="p-3 rounded-full bg-default-100 group-hover:bg-primary/10 transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-medium text-sm sm:text-lg">
                  Create New
                </span>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {filteredProjects.length > 0 &&
        visibleCount < filteredProjects.length && (
          <div
            ref={loadMoreRef}
            className="h-16 flex items-center justify-center text-sm text-gray-400"
          >
            กำลังโหลดเพิ่มเติม...
          </div>
        )}

      <CreateProject
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        organizationId={organizationId}
        currentUserId={currentUserId}
      />

      <CreateProject
        isOpen={editModal.isOpen}
        onOpenChange={(isOpen) => {
          editModal.onOpenChange();
          if (!isOpen) {
            setTimeout(() => setProjectToEdit(null), 300);
          }
        }}
        organizationId={organizationId}
        currentUserId={currentUserId}
        editData={projectToEdit}
      />
    </div>
  );
};

export default MainPageProject;
