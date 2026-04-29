import { deleteProject, startCloneProject, getCloneProgress} from "@/lib/actions/actionProject";
import {
  diffDaysInclusive,
  fmtDate,
  fmtMoney,
  getDueInfo,
  getStatusProjectColor,
} from "@/lib/setting_data";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  MapPin,
  MoreVertical,
  ExternalLink,
  Clock,
  Wallet,
  Trash2,
  Edit,
  Users,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import UpdateProjectMembers from "./forms/updateProjectMembers";
import { motion } from "framer-motion";

const ProjectCard = ({
  project,
  users,
  onEdit,
}: {
  project: any;
  users: any[];
  onEdit?: (project: any) => void;
}) => {
  const router = useRouter();
  const startPlanned = project.startPlanned ?? null;
  const finishPlanned = project.finishPlanned ?? null;
  const deleteModal = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const dueInfo = getDueInfo(finishPlanned, project.status, project.progress);
  const [memberOpen, setMemberOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);

  const [cloneOptions, setCloneOptions] = useState<{
    users: boolean;
    files: boolean;
    cameras: boolean;
    point360: boolean;
  }>({
    users: true,
    files: true,
    cameras: true,
    point360: true,
  });

  const handleClone = async () => {
    try {
      setStep(2);
      setIsCloning(true);

      const res = await startCloneProject(project.id, cloneOptions);

      if (!res.success || !res.jobId) {
        throw new Error(res.message);
      }

      const jobId = res.jobId;

      const interval = setInterval(async () => {
        const job = await getCloneProgress(jobId);
        if (!job) return;

        setProgress(job.progress);

        if (job.status === "DONE") {
          clearInterval(interval);
          setStep(3);
          setIsCloning(false);
        }

        if (job.status === "ERROR") {
          clearInterval(interval);
          setIsCloning(false);
        }
      }, 800);

    } catch (err) {
      console.error(err);
      setIsCloning(false);
    }
  };

  const items: {
    key: keyof typeof cloneOptions;
    label: string;
    icon: string;
  }[] = [
      { key: "users", label: "ทีมงาน", icon: "👥" },
      { key: "files", label: "เอกสาร / รูปภาพ", icon: "📁" },
      { key: "cameras", label: "กล้อง", icon: "📷" },
      { key: "point360", label: "360° / แปลน", icon: "🌐" },
    ];

  useEffect(() => {
    if (cloneOpen) {
      setStep(1);
      setProgress(0);
    }
  }, [cloneOpen]);

  const plannedDays =
    project.durationDays != null
      ? Number(project.durationDays)
      : diffDaysInclusive(startPlanned, finishPlanned);

  const startForElapsed = project.startActual ?? startPlanned;
  const elapsedDays = startForElapsed
    ? diffDaysInclusive(startForElapsed, new Date())
    : null;

  const handleViewDetail = () => {
    localStorage.setItem("currentProjectId", project.id.toString());
    localStorage.setItem("currentProjectCode", project.projectsCode ?? "");
    localStorage.setItem("currentProjectName", project.name ?? "");
    localStorage.setItem("currentProjectCustomer", project.customerName ?? "");
    localStorage.setItem("currentProjectImage", project.image ?? "");
    localStorage.setItem("currentProjectVideo", project.video ?? "");
    localStorage.setItem("currentProjectBudget", project.budget ?? "");
    router.push("/projects/projectdetail");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      deleteModal.onClose();
      toast.success("ยกเลิก Project สำเร็จ!");
      router.refresh();
    } catch (error) {
      console.error("ลบไม่สำเร็จ", error);
      toast.error("ยกเลิก Project ไม่สำเร็จ!");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      radius="lg"
      shadow="sm"
      className="w-full h-full overflow-hidden border border-default-200/50 dark:border-white/10 bg-content1/80 dark:bg-content1/60 backdrop-blur-md
                 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
        <img
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          src={project.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Chip
              color={getStatusProjectColor(project.status) as any}
              variant="shadow"
              size="sm"
              classNames={{ base: "border border-white/15 h-6 text-xs" }}
            >
              {project.status}
            </Chip>
          </div>

          <div className="flex items-center gap-1">
            {project.mapUrl ? (
              <Button
                as="a"
                href={project.mapUrl}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="flat"
                className="bg-black/35 text-white border border-white/10 h-8 px-2"
                isIconOnly
              >
                <ExternalLink size={16} />
              </Button>
            ) : null}

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  className="bg-black/35 text-white border border-white/10 h-8"
                >
                  <MoreVertical size={18} />
                </Button>
              </DropdownTrigger>

              <DropdownMenu aria-label="Project Actions" variant="flat">
                <DropdownItem
                  key="members"
                  startContent={<Users size={18} />}
                  onPress={() => setMemberOpen(true)}
                >
                  จัดการทีมโครงการ
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={18} />}
                  onPress={() => {
                    if (onEdit) {
                      onEdit(project);
                    }
                  }}
                >
                  แก้ไขโครงการ
                </DropdownItem>
                <DropdownItem
                  key="clone"
                  startContent={<Copy size={18} />}
                  onPress={() => setCloneOpen(true)}
                >
                  สร้าง Phase ถัดไป
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={18} />}
                  onPress={deleteModal.onOpen}
                >
                  ยกเลิกโครงการ
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* title on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white text-base sm:text-lg font-bold line-clamp-1">
            {project.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-white/80 text-xs sm:text-sm">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{project.address}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <CardBody className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Client + Budget (โปร่งขึ้น) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {project.client?.charAt?.(0) ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-default-400 uppercase tracking-wider font-semibold">
                Client
              </div>
              <div className="text-sm font-semibold truncate">
                {project.client}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] text-default-400 font-semibold flex items-center justify-end gap-1">
              <Wallet size={12} className="text-default-400" /> Budget
            </div>
            <div className="text-sm font-bold">{fmtMoney(project.budget)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Calendar size={12} className="text-default-400" /> Start
            </div>
            <div className="text-sm font-semibold mt-1">
              {fmtDate(startPlanned)}
            </div>
          </div>

          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Calendar size={12} className="text-default-400" /> Finish
            </div>
            <div className="text-sm font-semibold mt-1">
              {fmtDate(finishPlanned)}
            </div>
          </div>

          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Clock size={12} className="text-default-400" /> Planned
            </div>
            <div className="text-sm font-semibold mt-1">
              {plannedDays != null ? `${plannedDays} days` : "-"}
            </div>
          </div>

          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Clock size={12} className="text-default-400" /> Elapsed
            </div>
            <div className="text-sm font-semibold mt-1">
              {elapsedDays != null ? `${Math.max(elapsedDays, 0)} days` : "-"}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-default-500">Progress</span>
            <span className="text-primary">{project.progress ?? 0}%</span>
          </div>
          <Progress
            value={project.progress ?? 0}
            color={getStatusProjectColor(project.status) as any}
            size="sm"
            radius="full"
            classNames={{ track: "h-2", indicator: "h-2" }}
          />
        </div>
      </CardBody>

      <Divider className="opacity-60" />
      <CardFooter className="px-4 py-3 sm:px-5 sm:py-4 flex justify-between items-center bg-default-50/40 dark:bg-zinc-900/20">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Calendar size={14} className="text-default-400" />

          <span
            className={
              dueInfo.tone === "danger"
                ? "text-danger font-semibold"
                : dueInfo.tone === "warning"
                  ? "text-warning font-semibold"
                  : dueInfo.tone === "success"
                    ? "text-success font-semibold"
                    : dueInfo.tone === "primary"
                      ? "text-primary font-semibold"
                      : "text-default-500"
            }
          >
            {dueInfo.label}
          </span>
        </div>
        <div
          onClick={handleViewDetail}
          role="button"
          className="group/link flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-600 transition-colors cursor-pointer"
        >
          View Details
          <ArrowRight
            size={16}
            className="group-hover/link:translate-x-1 transition-transform"
          />
        </div>
      </CardFooter>

      <Modal
        isOpen={deleteModal.isOpen}
        onOpenChange={deleteModal.onOpenChange}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                ยืนยันการยกเลิกโครงการ
              </ModalHeader>
              <ModalBody>
                <p>
                  คุณแน่ใจหรือไม่ที่จะยกเลิกโครงการ <b>{project.name}</b>?
                </p>
                <p className="text-sm text-default-500">
                  การกระทำนี้ไม่สามารถย้อนกลับได้
                  ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบ
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  ปิด
                </Button>
                <Button
                  color="danger"
                  onPress={handleDelete}
                  isLoading={isDeleting}
                >
                  ยืนยันลบ
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={cloneOpen} onOpenChange={setCloneOpen} backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {step === 1 && "สร้าง Phase ใหม่"}
                {step === 2 && "กำลังสร้าง..."}
                {step === 3 && "สำเร็จ 🎉"}
              </ModalHeader>

              <ModalBody>
                {step === 1 && (
                  <div className={`flex flex-col gap-3 ${isCloning ? "opacity-50 pointer-events-none" : ""}`}>
                    {items.map((item) => {
                      const checked = cloneOptions[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() =>
                            setCloneOptions({
                              ...cloneOptions,
                              [item.key]: !checked,
                            })
                          }
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${checked
                            ? "border-primary bg-primary/10"
                            : "border-white/10 hover:bg-white/5"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>

                          <input type="checkbox" checked={checked} readOnly />
                        </div>
                      );
                    })}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                    />
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-default-500">
                      กำลังสร้างเฟสใหม่... {progress}%
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-6xl"
                    >
                      ✅
                    </motion.div>
                    <p className="text-lg font-semibold">
                      สร้างสำเร็จแล้ว
                    </p>
                    <p className="text-sm text-default-500">
                      ระบบได้สร้างเฟสใหม่เรียบร้อย
                    </p>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                {step === 1 && (
                  <>
                    <Button variant="light" onPress={onClose}>
                      ยกเลิก
                    </Button>

                    <Button
                      color="primary"
                      onPress={handleClone}
                      isDisabled={isCloning}
                    >
                      สร้าง
                    </Button>
                  </>
                )}

                {step === 3 && (
                  <Button
                    color="primary"
                    onPress={() => {
                      onClose();
                      router.refresh();
                      setStep(1);
                      setProgress(0);
                    }}
                  >
                    เสร็จสิ้น
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <UpdateProjectMembers
        isOpen={memberOpen}
        onOpenChange={setMemberOpen}
        project={project}
        users={users}
      />
    </Card>
  );
};

export default ProjectCard;
