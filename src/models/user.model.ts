export interface RoleSummaryModel {
  id: number;
  name: string;
}

export interface UserModel {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: RoleSummaryModel[];
}

export interface RoleModel {
  id: number;
  name: string;
  description: string | null;
  usersCount: number;
  permissionsCount: number;
}

export interface PermissionModel {
  id: number;
  name: string;
  description: string | null;
  module: string;
}

export interface PermissionGroupModel {
  module: string;
  permissions: PermissionModel[];
}

export interface ModuleModel {
  id: number;
  name: string;
  route: string | null;
  icon: string | null;
  parentId: number | null;
  displayOrder: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleIds: number[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  roleIds?: number[];
}
