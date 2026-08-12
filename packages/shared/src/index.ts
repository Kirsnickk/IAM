import { z } from 'zod';

export enum UserRole {
  ADMIN = 'ADMIN',
  ASSET_MANAGER = 'ASSET_MANAGER',
  DEPT_MANAGER = 'DEPT_MANAGER',
  IT_SUPPORT = 'IT_SUPPORT',
  FINANCE = 'FINANCE',
  PROCUREMENT = 'PROCUREMENT',
  EMPLOYEE = 'EMPLOYEE',
  AUDITOR = 'AUDITOR',
}

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  DISPOSED = 'DISPOSED',
  LOST = 'LOST',
  RESERVED = 'RESERVED',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

// Zod schemas for validation
export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const AssetCreateSchema = z.object({
  name: z.string().min(2, 'Tên tài sản không được để trống'),
  serialNumber: z.string().optional(),
  modelId: z.string().min(1, 'Model không được trống'),
  categoryId: z.string().min(1, 'Danh mục không được trống'),
  locationId: z.string().min(1, 'Vị trí không được trống'),
  departmentId: z.string().optional(),
  vendorId: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  warrantyMonths: z.number().int().nonnegative().optional(),
  specifications: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

export const AssignmentCreateSchema = z.object({
  assetId: z.string().min(1),
  employeeId: z.string().min(1),
  assignedDate: z.string().optional(),
  expectedReturnDate: z.string().optional(),
  notes: z.string().optional(),
});

export const TransferCreateSchema = z.object({
  assetId: z.string().min(1),
  fromLocationId: z.string().min(1),
  toLocationId: z.string().min(1),
  fromDepartmentId: z.string().optional(),
  toDepartmentId: z.string().optional(),
  reason: z.string().min(5, 'Lý do điều chuyển tối thiểu 5 ký tự'),
});

export const MaintenanceTicketCreateSchema = z.object({
  assetId: z.string().min(1),
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  description: z.string().min(5, 'Mô tả chi tiết sự cố'),
  priority: z.nativeEnum(MaintenancePriority).default(MaintenancePriority.MEDIUM),
  estimatedCost: z.number().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type AssetCreateInput = z.infer<typeof AssetCreateSchema>;
export type AssignmentCreateInput = z.infer<typeof AssignmentCreateSchema>;
export type TransferCreateInput = z.infer<typeof TransferCreateSchema>;
export type MaintenanceTicketCreateInput = z.infer<typeof MaintenanceTicketCreateSchema>;
