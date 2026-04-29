import z from "zod";

export const signInSchema_ = z.object({
  username: z.string().min(1, { message: "กรุณากรอก Username" }).max(50),
  passwordHash: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }).max(50),
});
export type SignInSchema = z.infer<typeof signInSchema_>;

export const ProjectSchema_ = z.object({
  id: z.number().optional(),

  projectName: z.string().min(1, { message: "กรุณากรอกชื่อโครงการ" }).max(255),
  customerName: z.string().min(1, { message: "กรุณากรอกชื่อลูกค้า" }).max(255),

  address: z.string().optional(),
  mapUrl: z.string().optional(),

  budget: z.coerce
    .number({ invalid_type_error: "กรุณาระบุตัวเลข" })
    .min(1, "กรุณาระบุงบประมาณ (ต้องมากกว่า 0)")
    .nonnegative("งบประมาณต้องไม่ติดลบ"),

  startPlanned: z.string().optional(),
  finishPlanned: z.string().optional(),

  projectDesc: z.string().optional(),

  coverImageUrl: z.string().optional(),
  coverImageFile: z.any().optional(),

  createdById: z.coerce.number().min(1, "ต้องมี ID ผู้สร้าง"),
  organizationId: z.coerce.number().min(1, "ต้องมีบริษัท"),
});
export type ProjectSchema = z.infer<typeof ProjectSchema_>;

export const MainTaskSchema_ = z.object({
  id: z.number().optional(),
  taskName: z.string().min(1, { message: "กรุณากรอกชื่อหัวข้อ/งาน" }).max(191),
  taskDesc: z.string().optional(),
  status: z.string().optional(),
  progressPercent: z.coerce
    .number()
    .min(0, "ความคืบหน้าต้องไม่ต่ำกว่า 0%")
    .max(100, "ความคืบหน้าต้องไม่เกิน 100%")
    .default(0)
    .optional(),
  budget: z.coerce.number().default(0).optional(),
  estimatedBudget: z.coerce.number().default(0).optional(),
  startAiPlanned: z.string().optional(),
  startPlanned: z.string().optional(),
  finishPlanned: z.string().optional(),
  startActual: z.string().optional(),
  finishActual: z.string().optional(),
  durationDays: z.coerce.number().optional(),
  estimatedDurationDays: z.coerce.number().optional(),
  coverImageUrl: z.string().optional(),
  coverImageFile: z.any().optional(),
  projectId: z.number().optional(),
  createdById: z.coerce.number().min(1, "ต้องมี ID ผู้สร้าง"),
  organizationId: z.coerce.number().min(1, "ต้องมีบริษัท"),
});

export type MainTaskSchema = z.infer<typeof MainTaskSchema_>;

export const SubTaskSchema_ = z.object({
  id: z.number().optional(),
  detailName: z
    .string()
    .min(1, { message: "กรุณากรอกชื่อรายการย่อย" })
    .max(191),
  detailDesc: z.string().optional(),
  status: z.boolean().default(false).optional(),
  weightPercent: z.coerce
    .number()
    .min(0, "น้ำหนักต้องไม่ต่ำกว่า 0%")
    .max(100, "น้ำหนักต้องไม่เกิน 100%")
    .default(0)
    .optional(),

  progressPercent: z.coerce
    .number()
    .min(0, "ความคืบหน้าต้องไม่ต่ำกว่า 0%")
    .max(100, "ความคืบหน้าต้องไม่เกิน 100%")
    .default(0)
    .optional(),

  startPlanned: z.string().optional(),
  finishPlanned: z.string().optional(),
  startActual: z.string().optional(),
  finishActual: z.string().optional(),
  durationDays: z.coerce.number().optional(),

  sortOrder: z.coerce.number().default(0).optional(),

  organizationId: z.coerce.number().min(1, "ต้องมี ID บริษัท"),
  projectId: z.coerce.number().min(1, "ต้องมี ID โครงการ"),
  taskId: z.coerce.number().min(1, "ต้องมี ID งานหลัก (Task)"),
});

export type SubTaskSchema = z.infer<typeof SubTaskSchema_>;

export const EmployeeSchema_ = z.object({
  id: z.number().optional(),
  username: z.string().min(1, { message: "กรุณากรอก Username" }).max(50),
  password: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true; // ว่าง = ผ่าน (edit mode)
        return val.length >= 4; // ถ้าใส่ต้อง >= 4
      },
      {
        message: "รหัสผ่านต้องอย่างน้อย 4 ตัวอักษร",
      },
    ),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .union([
      z.string().email({ message: "รูปแบบ Email ไม่ถูกต้อง" }),
      z.literal(""),
    ])
    .optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  positionId: z.coerce
    .number({ invalid_type_error: "กรุณาเลือกตำแหน่ง" })
    .min(1, { message: "กรุณาเลือกตำแหน่ง" }),
  imageUrl: z.string().optional(),
});

export type EmployeeSchema = z.infer<typeof EmployeeSchema_>;

export const CustomerSchema_ = z.object({
  id: z.number().optional(),
  username: z.string().min(1, { message: "กรุณากรอก Username" }).max(50),
  password: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true; // ว่าง = ผ่าน (edit mode)
        return val.length >= 4; // ถ้าใส่ต้อง >= 4
      },
      {
        message: "รหัสผ่านต้องอย่างน้อย 4 ตัวอักษร",
      },
    ),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .union([
      z.string().email({ message: "รูปแบบ Email ไม่ถูกต้อง" }),
      z.literal(""),
    ])
    .optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type CustomerSchema = z.infer<typeof CustomerSchema_>;

export const PositionSchema_ = z.object({
  id: z.number().optional(),

  positionName: z
    .string()
    .min(1, { message: "กรุณากรอกชื่อตำแหน่ง" })
    .max(100, { message: "ชื่อตำแหน่งยาวเกินไป" }),

  positionDesc: z
    .string()
    .max(255, { message: "รายละเอียดต้องไม่เกิน 255 ตัวอักษร" })
    .optional(),
});

export type PositionSchema = z.infer<typeof PositionSchema_>;

export const PermissionSchema_ = z.object({
  id: z.number().optional(),

  permissionKey: z
    .string()
    .min(1, { message: "กรุณากรอก Permission Key" })
    .max(100, { message: "Permission Key ยาวเกินไป" }),

  permissionName: z
    .string()
    .min(1, { message: "กรุณากรอกชื่อ Permission" })
    .max(100, { message: "ชื่อ Permission ยาวเกินไป" }),

  permissionDesc: z
    .string()
    .max(255, { message: "รายละเอียดต้องไม่เกิน 255 ตัวอักษร" })
    .optional(),
});

export type PermissionSchema = z.infer<typeof PermissionSchema_>;

export const SupplierSchema_ = z.object({
  supplierName: z
    .string()
    .min(1, { message: "กรุณากรอก Supplier Name" })
    .max(150),

  supplierPhone: z.string().max(50).optional(),

  supplierEmail: z
    .string()
    .email("รูปแบบ Email ไม่ถูกต้อง")
    .optional()
    .or(z.literal("")),

  supplierAddress: z.string().max(255).optional(),

  supplierDesc: z.string().max(255).optional(),
});

export type SupplierSchema = z.infer<typeof SupplierSchema_>;

export const ContractorSchema_ = z.object({
  contractorName: z
    .string()
    .min(1, { message: "กรุณากรอก Contractor Name" })
    .max(150),

  contractorPhone: z.string().max(50).optional(),
  contractorEmail: z
    .string()
    .email("รูปแบบ Email ไม่ถูกต้อง")
    .optional()
    .or(z.literal("")),
  contractorAddress: z.string().max(255).optional(),
  contractorDesc: z.string().max(255).optional(),
});

export type ContractorSchema = z.infer<typeof ContractorSchema_>;

// =====================================
// Procurement
// =====================================

export const PART_TYPES = ["EXT", "INT", "OTHER"] as const;
export const MATERIAL_GROUPS = ["MAIN", "GENERAL", "MACHINERY"] as const;
export const PROCUREMENT_STATUSES = [
  "PENDING",
  "PURCHASING",
  "DELIVERING",
  "ARRIVED",
  "LOW_STOCK",
  "OUT_OF_STOCK",
] as const;

export const ProcurementItemSchema_ = z.object({
  id: z.number().optional(),

  materialName: z
    .string()
    .min(1, { message: "กรุณากรอกชื่อวัสดุ" })
    .max(255),

  specification: z.string().optional(),

  partType: z.enum(PART_TYPES).default("OTHER").optional(),

  materialGroup: z.enum(MATERIAL_GROUPS).default("GENERAL").optional(),

  unit: z.string().max(50).optional(),

  quantity: z.coerce
    .number({ invalid_type_error: "กรุณาระบุตัวเลข" })
    .nonnegative("จำนวนต้องไม่ติดลบ")
    .optional(),

  status: z.enum(PROCUREMENT_STATUSES).default("PENDING").optional(),

  expectedDate: z.string().optional(),
  leadTimeDays: z.coerce.number().nonnegative().optional(),

  alertEnabled: z.boolean().default(false).optional(),
  alertDaysBefore: z.coerce.number().nonnegative().default(3).optional(),

  note: z.string().optional(),
  sortOrder: z.coerce.number().default(0).optional(),

  projectId: z.coerce.number().min(1, "ต้องมี ID โครงการ"),
  organizationId: z.coerce.number().min(1, "ต้องมี ID บริษัท"),
});

export type ProcurementItemSchema = z.infer<typeof ProcurementItemSchema_>;

export const ProcurementSupplierQuoteSchema_ = z.object({
  id: z.number().optional(),
  procurementItemId: z.coerce.number().min(1, "ต้องมี ID รายการวัสดุ"),
  supplierId: z.coerce.number().min(1, "กรุณาเลือก Supplier"),
  unitPrice: z.coerce.number().nonnegative().optional(),
  totalPrice: z.coerce.number().nonnegative().optional(),
  quoteDate: z.string().optional(),
  validUntil: z.string().optional(),
  note: z.string().optional(),
  fileUrl: z.string().optional(),
  isSelected: z.boolean().default(false).optional(),
});

export type ProcurementSupplierQuoteSchema = z.infer<typeof ProcurementSupplierQuoteSchema_>;
