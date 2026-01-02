// 用户角色常量
export const UserRole = {
  STUDENT: 5,    // 学生
  TEACHER: 4,   // 教师
  ADMIN: 0,     // 管理员
} as const;

// 角色类型
export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// 角色名称映射
export const RoleName: Record<UserRoleType, string> = {
  [UserRole.STUDENT]: '学生',
  [UserRole.TEACHER]: '教师',
  [UserRole.ADMIN]: '管理员',
};

