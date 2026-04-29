"use client";

import { useTransition, useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import {
  ClipboardList,
  CalendarDays,
  Banknote,
  AlertCircle,
  Clock,
  User,
  Search,
  Sparkles,
  ArrowDownToLine,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainTaskSchema, MainTaskSchema_ } from "@/lib/formValidationSchemas";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreateMainTaskProps } from "@/lib/type";
import {
  generateTakeBudget_Durationday,
  generationImage,
} from "@/lib/ai/geminiAI";
import { createMainTask } from "@/lib/actions/actionProject";

import SelectTaskMembers from "./selectTaskMembers";
import { addTaskMembers } from "@/lib/actions/actionTaskMember";

import SelectTaskContractors from "./selectTaskContractors";
import { addTaskContractors } from "@/lib/actions/actionTaskContractor";
import { getOrgSetting } from "@/lib/actions/actionOrgSetting";
import { SETTING_KEYS } from "@/lib/settingKeys";

const CreateMainTask = ({
  isOpen,
  onOpenChange,
  projectId,
  organizationId,
  currentUserId,
  projectCode,
  members,
  contractors,
}: CreateMainTaskProps) => {
  const router = useRouter();
  const [isCreateTask, setIsCreateTask] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [durationDays, setDurationDays] = useState<number | "">("");
  const [assignees, setAssignees] = useState<any[]>([]);
  const [contractorsSelected, setContractorsSelected] = useState<any[]>([]);

  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [taskPlaceholder, setTaskPlaceholder] = useState("เช่น งานติดตั้ง, งานซ่อมแซม, งานตรวจสอบ");

  useEffect(() => {
    getOrgSetting(SETTING_KEYS.TASK_PLACEHOLDER).then((val) => {
      if (val) setTaskPlaceholder(val);
    });
  }, []);

  const formAddTask = useForm<MainTaskSchema>({
    resolver: zodResolver(MainTaskSchema_),
    defaultValues: {
      taskName: "",
      taskDesc: "",
      status: "TODO",
      budget: "" as unknown as number,
      estimatedBudget: "" as unknown as number,
      startAiPlanned: "",
      startPlanned: "",
      finishPlanned: "",
      coverImageUrl: "",
      createdById: Number(currentUserId) || 0,
      organizationId: Number(organizationId) || 0,
      projectId: Number(projectId) || 0,
    },
  });

  const startPlannedValue = formAddTask.watch("startPlanned");

  useEffect(() => {
    if (startPlannedValue && durationDays) {
      const startDate = new Date(startPlannedValue);
      startDate.setDate(startDate.getDate() + Number(durationDays));
      const finishStr = startDate.toISOString().split("T")[0];

      formAddTask.setValue("finishPlanned", finishStr, {
        shouldValidate: true,
      });
    } else {
      formAddTask.setValue("finishPlanned", "");
    }
  }, [startPlannedValue, durationDays, formAddTask]);

  const resetFormState = () => {
    formAddTask.reset();
    setDurationDays("");
    setAssignees([]);
    setContractorsSelected([]);
    setEstimatedBudget("");
    setEstimatedDuration("");
  };

  const handleModalClose = () => {
    resetFormState();
    onOpenChange(false);
  };

  const handleEstimateSearch = async () => {
    const taskName = formAddTask.getValues("taskName");
    if (!taskName) {
      toast.warning("กรุณาพิมพ์ชื่อหัวข้อ/งาน ก่อนกดค้นหา");
      return;
    }

    setIsEstimating(true);
    try {
      const res = await generateTakeBudget_Durationday(taskName);

      if (res) {
        formAddTask.setValue("estimatedBudget", res.estimatedBudget, {
          shouldValidate: true,
        });
        formAddTask.setValue(
          "estimatedDurationDays",
          res.estimatedDurationDays,
          {
            shouldValidate: true,
          },
        );

        setEstimatedBudget(res.estimatedBudget.toString());
        setEstimatedDuration(res.estimatedDurationDays.toString());

        toast.success("ประเมินราคากลางและระยะเวลาสำเร็จ", { theme: "dark" });
      } else {
        toast.error("AI ไม่สามารถประเมินข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการค้นหาข้อมูล");
    } finally {
      setIsEstimating(false);
    }
  };

  const applyEstimatesToForm = () => {
    if (estimatedBudget) {
      formAddTask.setValue("budget", Number(estimatedBudget), {
        shouldValidate: true,
      });
    }
    if (estimatedDuration) {
      setDurationDays(Number(estimatedDuration));
    }
    toast.info("นำข้อมูลไปใส่ในฟอร์มแล้ว");
  };

  const onSubmit = async (dataForm: any) => {
    if (!formAddTask.getValues("estimatedBudget")) {
      toast.warning("กรุณากดค้นหาราคากลาง (AI) ก่อนสร้างงาน");
      return;
    }

    if (!dataForm.startPlanned || !dataForm.finishPlanned) {
      toast.warning("กรุณาระบุวันเริ่มงานและระยะเวลาให้ครบถ้วน");
      return;
    }

    setIsCreateTask(true);
    try {
      const url = await generationImage(dataForm.taskName);

      const finalData: any = {
        ...dataForm,
        createdById: Number(currentUserId) || 0,
        organizationId: Number(organizationId) || 0,
        projectId: Number(projectId) || 0,
        progressPercent: 0,
        budget: Number(dataForm.budget) || 0,
        coverImageUrl: url?.answer || "",
      };

      const dummyState = { success: false, error: false, message: "" };

      startTransition(async () => {
        const res = await createMainTask(dummyState, finalData);

        if (res?.success) {
          if (res?.taskId && assignees.length > 0) {
            await addTaskMembers(
              res.taskId,
              assignees.map((u: any) => u.id),
            );
          }

          if (res?.taskId && contractorsSelected.length > 0) {
            await addTaskContractors(
              res.taskId,
              contractorsSelected.map((c: any) => c.id),
            );
          }

          toast.success("บันทึกงานใหม่เรียบร้อย!");
          router.refresh();
          handleModalClose();
        } else {
          toast.error(res?.message || "บันทึกไม่สำเร็จ");
        }
        setIsCreateTask(false);
      });
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเตรียมข้อมูล");
      setIsCreateTask(false);
    }
  };

  const onError = (errors: any) => {
    console.error("⚠️ Form Validation Errors:", errors);
    toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
  };

  const isBusy = isPending || isCreateTask;
  const errors = formAddTask.formState.errors;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose();
        else onOpenChange(true);
      }}
      scrollBehavior="inside"
      placement="center"
      backdrop="blur"
      isDismissable={false}
      hideCloseButton={isBusy}
      classNames={{
        wrapper: "z-[9999]",
        base: `mx-4 w-full max-w-2xl max-h-[90dvh] rounded-2xl bg-white dark:bg-[#18181b] shadow-2xl`,
        header: "border-b border-default-100 p-4 sm:p-6",
        body: "p-4 sm:p-6 gap-6",
        footer: "border-t border-default-100 p-4 sm:p-6",
        closeButton: "hover:bg-default-100 active:bg-default-200",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl shrink-0 border border-blue-100 dark:border-blue-500/20">
                <ClipboardList className="text-blue-500" size={24} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Create New Task
                </h2>
                <p className="text-default-400 text-xs font-normal">
                  เพิ่มรายการงานใหม่ (Project CODE: {projectCode})
                </p>
              </div>
            </ModalHeader>

            <form
              onSubmit={formAddTask.handleSubmit(onSubmit, onError)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <ModalBody>
                {/* 1. Task Name */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <Input
                    isRequired
                    label="ชื่อหัวข้อ/งาน"
                    placeholder={taskPlaceholder}
                    labelPlacement="outside"
                    variant="bordered"
                    className="flex-1"
                    isInvalid={!!errors.taskName}
                    errorMessage={errors.taskName?.message}
                    startContent={
                      <ClipboardList className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("taskName")}
                  />
                  {/* 🌟 ปุ่มค้นหา */}
                  <Button
                    color="secondary"
                    variant="flat"
                    className="w-full sm:w-auto shrink-0 font-medium"
                    onPress={handleEstimateSearch}
                    isLoading={isEstimating}
                    startContent={!isEstimating && <Sparkles size={18} />}
                  >
                    ค้นหาราคากลาง
                  </Button>
                </div>

                {/* 🌟 กล่องแสดงผลลัพธ์การค้นหา ราคากลาง & เวลาคร่าวๆ */}
                {(estimatedBudget || estimatedDuration) && (
                  <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-secondary flex items-center gap-2">
                        <Sparkles size={16} /> ผลลัพธ์จากการค้นหา
                        (ข้อมูลอ้างอิง)
                      </p>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="shadow"
                        onPress={applyEstimatesToForm}
                        startContent={<ArrowDownToLine size={14} />}
                      >
                        นำไปใช้ในฟอร์ม
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="number"
                        isRequired
                        readOnly
                        label="ราคากลางโดยประมาณ"
                        labelPlacement="outside"
                        variant="bordered"
                        color="secondary"
                        endContent={
                          <span className="text-default-400 text-xs">บาท</span>
                        }
                        isInvalid={!!errors.estimatedBudget}
                        errorMessage={errors.estimatedBudget?.message as string}
                        value={
                          formAddTask.watch("estimatedBudget")?.toString() || ""
                        }
                        onValueChange={(val) =>
                          formAddTask.setValue(
                            "estimatedBudget",
                            Number(val) || 0,
                            {
                              shouldValidate: true,
                            },
                          )
                        }
                      />

                      <Input
                        type="number"
                        isRequired
                        readOnly
                        label="ระยะเวลาคร่าวๆ (AI)"
                        labelPlacement="outside"
                        variant="bordered"
                        color="secondary"
                        endContent={
                          <span className="text-default-400 text-xs">วัน</span>
                        }
                        isInvalid={!!errors.estimatedDurationDays}
                        errorMessage={
                          errors.estimatedDurationDays?.message as string
                        }
                        value={
                          formAddTask
                            .watch("estimatedDurationDays")
                            ?.toString() || ""
                        }
                        onValueChange={(val) =>
                          formAddTask.setValue(
                            "estimatedDurationDays",
                            Number(val) || 0,
                            {
                              shouldValidate: true,
                            },
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                <Divider className="my-1 opacity-50" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Select
                    label="สถานะงาน"
                    placeholder="เลือกสถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    defaultSelectedKeys={["TODO"]}
                    startContent={
                      <AlertCircle className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("status")}
                  >
                    <SelectItem key="TODO">To Do (รอเริ่ม)</SelectItem>
                  </Select>

                  <Input
                    type="number"
                    label="งบประมาณ (ที่ใช้จริง)"
                    placeholder="0"
                    labelPlacement="outside"
                    variant="bordered"
                    min={0}
                    endContent={
                      <span className="text-default-400 text-xs">บาท</span>
                    }
                    isInvalid={!!errors.budget}
                    errorMessage={errors.budget?.message}
                    startContent={
                      <Banknote className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("budget" as any, {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                {/* 3. Dates (Row) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    type="date"
                    isRequired
                    label="แผนวันเริ่มงาน"
                    labelPlacement="outside"
                    variant="bordered"
                    isInvalid={!!errors.startPlanned}
                    errorMessage={errors.startPlanned?.message}
                    startContent={
                      <CalendarDays className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("startPlanned")}
                  />

                  <Input
                    type="number"
                    isRequired
                    label="จำนวนวันทำงาน (วัน)"
                    placeholder="เช่น 7, 14, 30"
                    labelPlacement="outside"
                    variant="bordered"
                    min={1}
                    value={durationDays.toString()}
                    onValueChange={(val) =>
                      setDurationDays(val ? Number(val) : "")
                    }
                    isInvalid={!!errors.finishPlanned}
                    errorMessage={errors.finishPlanned?.message}
                    startContent={
                      <Clock className="text-default-400" size={18} />
                    }
                    endContent={
                      <span className="text-default-400 text-xs">วัน</span>
                    }
                    description={
                      startPlannedValue && durationDays
                        ? `คาดว่าจะเสร็จ: ${formAddTask.getValues("finishPlanned")}`
                        : "เลือกวันเริ่มงานและใส่จำนวนวัน"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">👷 ผู้รับจ้าง</label>
                  <SelectTaskContractors
                    contractors={contractors}
                    selected={contractorsSelected}
                    setSelected={setContractorsSelected}
                  />
                </div>

                {/* 4. Dummy Assignee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="text-default-400" size={18} />
                    ผู้รับผิดชอบ
                  </label>
                  <SelectTaskMembers
                    members={members}
                    selected={assignees}
                    setSelected={setAssignees}
                  />
                </div>

                {/* 5. Description */}
                <Textarea
                  label="รายละเอียดเพิ่มเติม"
                  placeholder="รายละเอียดเนื้องาน, หมายเหตุ..."
                  labelPlacement="outside"
                  variant="bordered"
                  minRows={3}
                  {...formAddTask.register("taskDesc")}
                />
              </ModalBody>

              {/* --- FOOTER --- */}
              <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  variant="light"
                  color="danger"
                  radius="full"
                  onPress={handleModalClose}
                  isDisabled={isBusy}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  radius="full"
                  className="w-full sm:w-auto h-12 sm:h-10 font-medium bg-black text-white dark:bg-white dark:text-black shadow-lg"
                  isLoading={isBusy}
                >
                  {isCreateTask ? "กำลังบันทึก..." : "สร้าง Task"}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateMainTask;
