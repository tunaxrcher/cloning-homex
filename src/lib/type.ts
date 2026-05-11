export interface NavbarProps {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export interface SidebarProps {
  isOpenSideBar: boolean;
  isCollapsed: boolean;
  setIsOpen: (v: boolean) => void;
}

export interface CreateProjectProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organizationId: number;
  currentUserId: number;
}

export type ProjectUI = {
  id: number;
  name: string | null;
  client: string;
  address: string;
  status: string;
  progress: number;
  // dueDate: string;
  image: string;
  budget: number | null;

  startPlanned: Date | string | null;
  finishPlanned: Date | string | null;
  durationDays: number | null;
  startActual: Date | string | null;
  mapUrl: string | null;
};

export interface MainPageProjectProps {
  organizationId: number;
  currentUserId: number;
  projects: ProjectUI[];
  userType: any;
  users: {
    id: number;
    displayName: string | null;
    position?: {
      positionName: string;
    } | null;
  }[];
}

export type Status = "todo" | "progress" | "done";

export type TabTask = "all" | "progress" | "done" | "todo" | "user";

export interface Subtask {
  id: number;
  taskId: number;
  detailName: string;
  detailDesc?: string | null;
  status: boolean;
  weightPercent?: number;
  progressPercent?: number;
  startPlanned?: string | Date | null;
  finishPlanned?: string | Date | null;
  startActual?: string | Date | null;
  finishActual?: string | Date | null;

  durationDays?: number | null;
  sortOrder?: number;
}

export interface Task {
  id: number;
  taskName?: string | null;
  taskDesc?: string | null;
  coverImageUrl?: string | null;
  status: string;

  progressPercent: number;
  startPlanned?: Date | string | null;
  finishPlanned?: Date | string | null;
  startActual?: Date | string | null;
  finishActual?: Date | string | null;

  durationDays?: number | null;
  budget: number | null;
  details?: Subtask[];
  procurementTaskLinks?: {
    id: number;
    procurementItem: {
      id: number;
      materialName: string;
      status: string;
      expectedDate: Date | string | null;
      alertDaysBefore: number | null;
    };
  }[];
  assignees?: { id: number; displayName: string }[];
}

export interface ProjectDetailProps {
  organizationId: number;
  currentUserId: number;
  dataDetail: Task[];
  isSpadmin: any;
}

export interface CreateMainTaskProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  currentUserId: number;
  projectCode: string;
  members: any[];
  contractors: any[];
}

export interface CreateEmployeeProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  positions?: {
    id: number;
    positionName: string;
  }[];
  editData?: any;
}

export interface CreateCustomerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
}

export interface MainPageUserProps {
  users: any[];
  positions: any[];
}

export type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
  taskId?: number;
  data?: any;
};

export interface CreateEmployeeData {
  username: string;
  password?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  positionId: number; // employee เลือกเอง
  avatarUrl?: string;
}

export interface CreateCustomerData {
  username: string;
  password?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  avatarUrl?: string;
}

export interface MainTaskCardProps {
  task: Task;
  onSelect: (id: number) => void;
}

export interface DropColumnProps {
  status: string;
  tasks: Task[];
  onTaskClick: (id: number) => void;
}

export interface TaskFilterTabsProps {
  activeTab: TabTask;
  setActiveTab: (tab: TabTask) => void;
}

export interface SubtaskItemProps {
  subtask: any;
  updatingSubtaskId: number | null;
  editingSubtaskId: number | null;
  editingSubtaskData: any;
  isSavingSubtaskEdit: boolean;
  setEditingSubtaskData: (data: any) => void;
  startEditSubtask: (subtask: any) => void;
  setEditingSubtaskId: (id: number | null) => void;
  handleSaveSubtaskEdit: () => void;
  handleToggleSubtask: (id: number, status: boolean, imageUrl?: string) => void;
  handleDeleteSubtask: (id: number) => void;
  canManage?: boolean;
}

export interface CreateSubtaskFormProps {
  isAddingSubtask: boolean;
  setIsAddingSubtask: (val: boolean) => void;
  newSubtask: any;
  setNewSubtask: (val: any) => void;
  handleSaveSubtask: () => void;
  isSavingSubtask: boolean;
  taskName?: string;
  onAISuccess?: (subtasks: any[]) => void;
}

export interface UpdateMainTaskProps {
  isEditMode: boolean;
  selected: any;
  editFormData: any;
  setEditFormData: (data: any) => void;
  isUpdatingStatusMainTask: boolean;
  handleUpdateStatusMainTask: (status: string) => void;
  members: any[];
  contractors: any[];
  isOwner: any;
}

export interface DeleteTaskModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  taskName?: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export interface TaskActionButtonsProps {
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  isSaving: boolean;
  handleSaveTaskEdit: () => void;
  setIsDeleteModalOpen: (val: boolean) => void;
}

export interface CreatePositionProps {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  editData?: any;
}

export interface CreatePositionData {
  positionName: string;
  positionDesc?: string;
}

export interface DeleteSubtaskModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
}

export type CreatePermissionProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
};

export interface CreatePermissionData {
  permissionKey: string;
  permissionName: string;
  permissionDesc?: string;
}

export type SectionType =
  | "dashboard"
  | "tasks"
  | "purchasing"
  | "documents"
  | "camera"
  | "360mapping"
  | "feed"
  | "taskv2"
  | "summary"
  | (string & {});

export type CreateSupplierProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
};

export interface CreateSupplierData {
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  supplierDesc?: string;
}

export type CreateContractorProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
};

export interface CreateContractorData {
  contractorName: string;
  contractorPhone?: string;
  contractorEmail?: string;
  contractorAddress?: string;
  contractorDesc?: string;
}
export interface DocumentSectionProps {
  organizationId: number;
  currentUserId: number;
  isSpadmin: any;
  projectId: number;
}

export interface UploadModalDocProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  currentUserId: number;
  onSuccess?: () => void;
}

export interface ProjectFile {
  id?: number;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  note?: string | null;
  createdAt?: Date | string;
  organizationId: number;
  projectId: number;
  uploadedById?: number | null;
}

export interface ConfirmDeleteDocModal {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export interface CategoryFilterDocProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export type SelectMemberProps = {
  members: any[];
  selected: any[];
  setSelected: (users: any[]) => void;
};

export type SelectContractorProps = {
  contractors: any[];
  selected: any[];
  setSelected: (contractors: any[]) => void;
};

// =====================================
// Feed Types
// =====================================

export type FeedType =
  | "TASK_CREATED"
  | "SUBTASK_UPDATED"
  | "SUBTASK_COMPLETED"
  | "SUBTASK_DELETED";

export interface FeedPostUser {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface FeedCommentData {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: FeedPostUser;
  parentId: number | null;
  replies: FeedCommentData[];
  _count: { likes: number };
  isLiked: boolean;
}

export interface FeedPostData {
  id: number;
  feedType: FeedType;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: FeedPostUser;
  task: { id: number; taskName: string | null } | null;
  subtask: { id: number; detailName: string } | null;
  _count: { likes: number; comments: number; shares: number };
  isLiked: boolean;
  previewComments: FeedCommentData[];
}

export interface FeedSectionProps {
  projectId: number;
  organizationId: number;
  currentUserId: number;
}

export interface FeedCardProps {
  post: FeedPostData;
  currentUserId: number;
  onLikeToggle: (postId: number) => void;
  onComment: (
    postId: number,
    content: string,
    parentId?: number,
    imageUrl?: string,
  ) => void;
  onShare: (postId: number) => void;
  onLoadComments: (postId: number) => void;
  onLikeComment: (postId: number, commentId: number) => void;
}

export interface CommentSectionProps {
  postId: number;
  comments: FeedCommentData[];
  currentUserId: number;
  onComment: (
    postId: number,
    content: string,
    parentId?: number,
    imageUrl?: string,
  ) => void;
  onLikeComment: (postId: number, commentId: number) => void;
  totalComments: number;
  onLoadAll: () => void;
}

export interface EzvizCameraProps {
  cameraDBId?: number;
  accessToken: string;
  ezopenUrl: string;
  areaDomain?: string;
  isAiEnabled?: boolean;
  isModalOpen?: boolean;
  onToggleModal?: () => void;
}

export interface DashboardCameraProp {
  accessToken?: string;
  projectId: number;
  organizationId: number;
  currentUserId: number;
}

export interface ProjectDashboardProp {
  projectId: number;
  organizationId: number;
  currentUserId: number;
  projectInfo?: {
    id: string;
    code: string;
    name: string;
    customer: string;
    image: string;
    video: string;
    budget: number;
  };
  projectProgress?: number;
  expenses?: number;
}

// =====================================
// Procurement Types
// =====================================

export type ProcurementStatus =
  | "PENDING"
  | "PURCHASING"
  | "DELIVERING"
  | "ARRIVED"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";

export type PartType = "EXT" | "INT" | "OTHER";
export type MaterialGroup = "MAIN" | "GENERAL" | "MACHINERY" | "OTHER";

export type MaterialReadiness = "READY" | "NOT_READY" | "AT_RISK" | "DELAYED";

export interface ProcurementItemImage {
  id: number;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

export interface ProcurementSupplierQuote {
  id: number;
  unitPrice: number | null;
  totalPrice: number | null;
  quoteDate: string | null;
  validUntil: string | null;
  note: string | null;
  fileUrl: string | null;
  isSelected: boolean;
  supplierId: number;
  supplier: {
    id: number;
    supplierName: string;
    contactPerson: string | null;
  };
}

export interface ProcurementTaskLinkData {
  id: number;
  linkedBy: string;
  aiConfidence: number | null;
  confirmedAt: string | null;
  taskId: number;
  task: {
    id: number;
    taskName: string | null;
    status: string;
    startPlanned: string | Date | null;
  };
}

export interface ProcurementItemData {
  id: number;
  materialName: string;
  specification: string | null;
  partType: string | null;
  materialGroup: string | null;
  unit: string | null;
  quantity: number | null;
  status: ProcurementStatus;
  expectedDate: string | null;
  leadTimeDays: number | null;
  alertEnabled: boolean;
  alertDaysBefore: number | null;
  aiEstimateMin: number | null;
  aiEstimateMid: number | null;
  aiEstimateMax: number | null;
  note: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  organizationId: number;
  createdById: number;
  images: ProcurementItemImage[];
  quotes: ProcurementSupplierQuote[];
  taskLinks: ProcurementTaskLinkData[];
}

export interface ProcurementSectionProps {
  projectId: number;
  organizationId: number;
  currentUserId: number;
  suppliers: { id: number; supplierName: string }[];
  tasks: {
    id: number;
    taskName: string | null;
    status: string;
    startPlanned: string | Date | null;
    coverImageUrl: string | null;
  }[];
}

export interface CreateProcurementItemData {
  materialName: string;
  specification?: string;
  partType?: string;
  materialGroup?: string;
  unit?: string;
  quantity?: number;
  status?: string;
  expectedDate?: string;
  leadTimeDays?: number;
  alertEnabled?: boolean;
  alertDaysBefore?: number;
  note?: string;
  sortOrder?: number;
  projectId: number;
  organizationId: number;
}

export interface UpdateProcurementItemData {
  materialName?: string;
  specification?: string;
  partType?: string;
  materialGroup?: string;
  unit?: string;
  quantity?: number;
  status?: string;
  expectedDate?: string;
  leadTimeDays?: number;
  alertEnabled?: boolean;
  alertDaysBefore?: number;
  note?: string;
  sortOrder?: number;
}

export interface CreateSupplierQuoteData {
  procurementItemId: number;
  supplierId: number;
  unitPrice?: number;
  totalPrice?: number;
  quoteDate?: string;
  validUntil?: string;
  note?: string;
  fileUrl?: string;
  isSelected?: boolean;
}

// =====================================
// Story Types
// =====================================

export interface StoryUser {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface StoryData {
  id: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  transcript: string | null;
  duration: number | null;
  isProcessing: boolean;
  expiresAt: string;
  createdAt: string;
  user: StoryUser;
  isViewed: boolean;
}

export interface StoryGroup {
  user: StoryUser;
  stories: StoryData[];
  hasUnviewed: boolean;
}

export interface CreateStoryResponse {
  id: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  transcript: string | null;
  duration: number | null;
  isProcessing: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface StoryBarProps {
  currentUserId: number;
  currentUserAvatar?: string | null;
  currentUserName?: string | null;
  onCreateStory: () => void;
  onOpenViewer: (groupIndex: number) => void;
  storyGroups: StoryGroup[];
  loading: boolean;
}

export interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  currentUserId: number;
  onClose: () => void;
  onViewed: (storyId: number) => void;
}

export interface StoryFABProps {
  onUploadVideo: () => void;
  onRecordVideo: () => void;
}

export interface StoryVideoPreviewProps {
  videoFile: File | null;
  videoUrl: string | null;
  onUpload: (caption: string) => void;
  onCancel: () => void;
  isUploading: boolean;
}

export type CreateCameraInput = {
  id?: number;
  cameraName: string;
  cameraSN: string;
  cameraLocation?: string;
  status: string;
  organizationId: number;
  projectId: number;
  userId: number;
};

export type UpdateCameraInput = {
  cameraName?: string;
  cameraSN?: string;
  cameraLocation?: string;
  status?: string;
};

export type UpdateCameraFormProps = {
  camera: any;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId: number;
  onSuccess: (updatedCamera: any) => void;
};

export type DeleteCameraModalProps = {
  camera: any;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

// =====================================
// Task V2 Types
// =====================================

export interface TaskV2CostBreakdown {
  materialPercent: number;
  materialCost: number;
  laborPercent: number;
  laborCost: number;
  machineryPercent: number;
  machineryCost: number;
}

export interface TaskV2CostEstimation {
  totalEstimate: number;
  breakdown: TaskV2CostBreakdown;
}

export interface TaskV2DurationEstimate {
  totalDays: number;
  assumptions: string;
}

export interface TaskV2Risk {
  name: string;
  description: string;
  mitigation: string;
  status: "risk" | "mitigated";
}

export interface TaskV2ChecklistItem {
  id?: number;
  name: string;
  progressPercent: number;
  checked: boolean;
  finishActual?: string | null;
}

export interface TaskV2Material {
  spec: string;
  quantity: string;
  unitPrice: number;
  unit: string;
  totalPrice: number;
}

export interface TaskV2AIResponse {
  costEstimation: TaskV2CostEstimation;
  durationEstimate: TaskV2DurationEstimate;
  risks: TaskV2Risk[];
  checklist: TaskV2ChecklistItem[];
  materials: TaskV2Material[];
  phase: string;
}

export interface TaskV2SectionProps {
  tasks: any[];
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
  projectInfo: {
    id: string;
    code: string;
    name: string;
    customer: string;
  };
  organizationId: number;
  currentUserId: number;
  isCustomer: boolean;
  projectMembers: any[];
  contractors: any[];
}

export interface TaskV2DetailDialogProps {
  task: any;
  aiData: TaskV2AIResponse | null;
  isOpen: boolean;
  onClose: () => void;
  projectInfo: {
    id: string;
    code: string;
    name: string;
  };
  onChecklistChange: (
    checklist: TaskV2ChecklistItem[],
    toggledIndex: number,
  ) => void;
  onReorderChecklist: (reordered: TaskV2ChecklistItem[]) => void;
  onEditSubtask: (subtaskId: number, newName: string) => void;
  onAddToProcurement: (material: TaskV2Material) => Promise<boolean>;
  onStartTask: (startDate: string) => Promise<void>;
  onSubmitTask: (finishDate: string, submitNote?: string, submitImages?: string[]) => Promise<void>;
  onBudgetChange?: (newBudget: number) => void;
  onDeleteTask?: () => Promise<void>;
  onReanalyze?: (aiData: TaskV2AIResponse) => Promise<void>;
  onUpdateTaskInfo?: (data: {
    taskName?: string;
    aiRefDescription?: string | null;
    aiRefImages?: string[] | null;
    phase?: string | null;
    startPlanned?: string | null;
    finishPlanned?: string | null;
  }) => Promise<void>;
  projectMembers?: any[];
  onAddAssignee?: (userId: number) => Promise<void>;
  onRemoveAssignee?: (userId: number) => Promise<void>;
}

export interface CreateTaskV2ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  currentUserId: number;
  projectCode: string;
}
// =====================================
// Task Actual Cost Types
// =====================================

export type ActualCostCategory = "MATERIAL" | "LABOR" | "MACHINERY";

export interface TaskActualCostEntry {
  id: number;
  category: ActualCostCategory;
  amount: number;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  creator?: {
    id: number;
    displayName: string | null;
  };
}

export interface TaskActualCostSummary {
  material: number;
  labor: number;
  machinery: number;
  total: number;
}

export type Hotspot = {
  id: string;
  yaw: number;
  pitch: number;
  label: string;
  targetPointId: number;
};

export type Insta360ViewerProps = {
  imageUrl: string;
  caption?: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (targetPointId: number) => void;
};

export interface StatusBoardProps {
  todo?: number;
  progress?: number;
  done?: number;
  delay?: number;
  isLoading?: boolean;
}

export interface ProjectMetricsBoard {
  actualProgress: number;
  plannedProgress: number;
  budgetSpentPercent: number;
  delayTasksCount: number;
}

export interface TaskDetailAction {
  detailName: string;
  weightPercent: number;
  progressPercent: number;
  finishPlanned: string | Date | null;
}

export interface TaskActualCostAction {
  category: string;
  amount: number;
  description: string | null;
}

export interface ActionRequiredTask {
  id: number;
  taskName: string | null;
  status: string;
  progressPercent: number;
  budget: number;
  estimatedBudget: number;
  startPlanned: string | Date | null;
  finishPlanned: string | Date | null;
  aiRisks: string | null;
  phase: string | null;

  actualCosts: TaskActualCostAction[];
  details: TaskDetailAction[];

  taskActualCosts: TaskActualCostAction[];
  taskDetails: TaskDetailAction[];
}

export interface ActionRequiredListProps {
  isAnalyzing: boolean;
  aiActions: any[];
}

export interface AIExecutiveSummaryData {
  healthStatus: "GOOD" | "WARNING" | "CRITICAL";
  executiveSummary: string;
  budgetAnalysis: string;
  topRisks: string[];
  recommendation: string;
}

export interface ExecutiveSummaryProps {
  isAnalyzing: boolean;
  summaryData: AIExecutiveSummaryData | null;
}

export interface CalendarViewProps {
  data: any[];
  dependencies?: any[];
  projectStart?: Date | string | null;
}

export interface CalendarDay {
  date: Date;
  currentMonth: boolean;
}
export interface ReadOnlyMapping360Props {
  projectId: number;
  organizationId: number;
}
