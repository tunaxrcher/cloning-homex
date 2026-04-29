"use client";
import {
  Button,
  Card,
  CardBody,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
  Skeleton,
  Tooltip,
} from "@heroui/react";
import {
  Download,
  Eye,
  FilePlus,
  FileText,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import UploadDocumentForm from "./forms/uploadDocumentForm";
import { useEffect, useState } from "react";
import { DocumentSectionProps, ProjectFile } from "@/lib/type";
import { deleteDocFile, getAllDoc } from "@/lib/actions/actionProject";
import { toast } from "react-toastify";
import { PROJECT_DOC_TYPES } from "@/lib/setting_data";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import CategoryFilterDoc from "./CategoryFilterDoc";

const DocumentSection = ({
  organizationId,
  currentUserId,
  isSpadmin,
  projectId,
}: DocumentSectionProps) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // โหลดข้อมูลครั้งแรก
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

  const uploadModal = useDisclosure();
  const previewModal = useDisclosure();

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePreview = (doc: ProjectFile) => {
    setSelectedFile(doc);
    previewModal.onOpen();
  };

  const fetchDocs = async () => {
    if (!projectId || !organizationId) return;
    try {
      const res = await getAllDoc(projectId, organizationId);
      if (res.success) {
        setDocs(res.data);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  };

  const askDelete = (file: any) => {
    setSelectedFile(file);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFile?.id) return;

    setIsDeleting(true);
    try {
      const res = await deleteDocFile(selectedFile.id, organizationId);
      if (res.success) {
        toast.success("ลบไฟล์เรียบร้อยแล้ว", { theme: "dark" });
        setIsDeleteOpen(false);
        fetchDocs();
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchDocs();
  }, [projectId, organizationId]);

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      (doc.fileName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.note || "").toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = true;
    if (selectedCategory !== "ทั้งหมด") {
      const docTypeText =
        PROJECT_DOC_TYPES.find((t) => t.key === doc.fileType)?.textValue ||
        doc.fileType;
      matchesCategory = (docTypeText || "").includes(selectedCategory);
    }

    return matchesSearch && matchesCategory;
  });

  const isCustomer = isSpadmin === "Customer";

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Search & Action Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="ค้นหาเอกสาร..."
          startContent={<Search size={18} className="text-default-400" />}
          variant="bordered"
          className="flex-1"
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
        />
        {!isCustomer && (
          <Button
            color="primary"
            radius="lg"
            className="shadow-lg shadow-primary/20 bg-blue-600 font-bold"
            onPress={uploadModal.onOpen}
          >
            <Plus size={20} /> เพิ่มเอกสาร
          </Button>
        )}
      </div>

      <CategoryFilterDoc
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Document List with Skeleton */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading
          ? // 🌟 Skeleton Loading State
            Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="bg-default-50 dark:bg-zinc-900 border-none"
              >
                <CardBody className="flex flex-row items-center gap-4 p-4">
                  <Skeleton className="rounded-xl w-12 h-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                    <Skeleton className="h-3 w-1/4 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                </CardBody>
              </Card>
            ))
          : filteredDocs.map((doc) => (
              <Card
                key={doc.id}
                as="div"
                className="bg-default-50 dark:bg-zinc-900 border-none hover:bg-default-100 transition-colors"
              >
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  <div
                    className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handlePreview(doc)}
                  >
                    <FileText size={24} />
                  </div>

                  <div
                    className="flex-1 min-w-0 text-left cursor-pointer"
                    onClick={() => handlePreview(doc)}
                  >
                    <p className="text-sm font-bold truncate">{doc.fileName}</p>
                    <p className="text-[10px] text-default-400 truncate">
                      <span className="text-primary font-medium">
                        {PROJECT_DOC_TYPES.find((t) => t.key === doc.fileType)
                          ?.textValue || doc.fileType}
                      </span>
                      {" • "}
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                      {doc.note && ` • ${doc.note}`}
                    </p>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Tooltip content="ดูตัวอย่าง">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => handlePreview(doc)}
                      >
                        <Eye size={18} className="text-default-500" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="ดาวน์โหลด">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Download size={18} className="text-default-500" />
                      </Button>
                    </Tooltip>
                    {!isCustomer && (
                      <Tooltip content="ลบไฟล์" color="danger">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          color="danger"
                          onPress={() => askDelete(doc)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>

      {/* Empty State */}
      {!isLoading && filteredDocs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-default-400 border-2 border-dashed rounded-3xl border-default-200 bg-default-50/50">
          <FilePlus size={48} className="mb-3 opacity-20" />
          <p className="font-medium">
            {docs.length === 0
              ? "ยังไม่มีการอัปโหลดเอกสาร"
              : "ไม่พบเอกสารที่ค้นหา"}
          </p>
          <p className="text-xs opacity-60">
            คุณสามารถอัปโหลดไฟล์ใหม่ได้โดยกดปุ่มด้านบน
          </p>
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={previewModal.isOpen}
        onOpenChange={previewModal.onOpenChange}
        size="2xl"
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
        className="dark text-foreground mx-4"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-row items-center gap-3 border-b border-default-100 py-4">
                <div className="p-2.5 bg-default-100 rounded-lg text-default-500">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold truncate">
                    {selectedFile?.fileName}
                  </h2>
                  <p className="text-[10px] font-medium text-default-400 uppercase tracking-wider">
                    {selectedFile?.fileType}
                  </p>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  radius="full"
                  size="sm"
                  onPress={() => {
                    if (selectedFile?.fileUrl) {
                      navigator.clipboard.writeText(selectedFile.fileUrl);
                      toast.success("คัดลอกลิงก์แล้ว");
                    }
                  }}
                >
                  <Share2 size={18} />
                </Button>
              </ModalHeader>

              <ModalBody className="p-0 bg-default-50/50 min-h-[50vh] flex items-center justify-center overflow-hidden">
                {(() => {
                  const url = selectedFile?.fileUrl || "";
                  const extension = url.split(".").pop()?.toUpperCase() || "";

                  if (["JPG", "PNG", "JPEG", "WEBP"].includes(extension)) {
                    return (
                      <div className="p-4 w-full h-full flex items-center justify-center">
                        <Image
                          src={url}
                          alt="preview"
                          className="max-h-[70vh] object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    );
                  }
                  if (extension === "PDF") {
                    return (
                      <iframe
                        src={`${url}#toolbar=0`}
                        className="w-full h-[70vh] border-none"
                      />
                    );
                  }
                  if (["DOC", "DOCX", "XLS", "XLSX"].includes(extension)) {
                    return (
                      <iframe
                        src={`https://docs.google.com/gview?url=${url}&embedded=true`}
                        className="w-full h-[70vh] border-none"
                      />
                    );
                  }
                  return (
                    <div className="flex flex-col items-center gap-4 py-20">
                      <div className="p-6 bg-primary/10 rounded-full text-primary shadow-inner">
                        <FileText size={60} />
                      </div>
                      <p className="text-sm font-bold">
                        {selectedFile?.fileName}
                      </p>
                      <Button
                        color="primary"
                        onPress={() => window.open(url, "_blank")}
                      >
                        ดาวน์โหลดเพื่อดูไฟล์
                      </Button>
                    </div>
                  );
                })()}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Forms & Helper Modals */}
      <UploadDocumentForm
        isOpen={uploadModal.isOpen}
        onOpenChange={uploadModal.onOpenChange}
        projectId={projectId}
        organizationId={organizationId}
        currentUserId={currentUserId}
        onSuccess={() => {
          setIsLoading(true);
          fetchDocs();
        }}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="ลบเอกสาร"
        description={`คุณต้องการลบไฟล์ "${selectedFile?.fileName}" ใช่หรือไม่? ข้อมูลจะหายไปถาวร`}
      />
    </div>
  );
};

export default DocumentSection;
