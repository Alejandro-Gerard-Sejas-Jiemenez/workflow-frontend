export type AdminMetric = {
  title: string;
  value: string;
  icon: string;
  iconClass: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  departments: string[];
};

export type AdminRole = {
  id: string;
  name: string;
};

export type AdminDepartment = {
  id?: string;
  nombre: string;
  descripcion?: string;
  estado?: string;
};

export type AdminAuditLog = {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: string;
  entidad: string;
  fecha: string;
  detalles: string;
};

export const ADMIN_DEPARTMENTS = [
  'TI',
  'Recursos Humanos',
  'Finanzas',
  'Operaciones',
  'Atención al Cliente',
  'Gerencia'
] as const;

export type AdminUserCreate = {
  nombre: string;
  email: string;
  password: string;
  departamentos: string[];
  rolId: string;
};

export type AdminUserUpdate = {
  id: string;
  nombre: string;
  departamentos: string[];
  rolId: string;
};

export type AdminNotification = {
  id: string;
  message: string;
  type: string;
  read: boolean;
};

export type AdminDashboardVm = {
  metrics: AdminMetric[];
  roles: AdminRole[];
  departments: AdminDepartment[];
  auditLogs: AdminAuditLog[];
  inactiveUsers: number;
  activeUsers: AdminUser[];
  inactiveUserList: AdminUser[];
  recentUsers: AdminUser[];
  recentNotifications: AdminNotification[];
};

export const EMPTY_ADMIN_DASHBOARD: AdminDashboardVm = {
  metrics: [
    { title: 'Usuarios', value: '0', icon: 'pi pi-users', iconClass: 'bg-blue-100 text-blue-600' },
    { title: 'Workflows Activos', value: '0', icon: 'pi pi-sitemap', iconClass: 'bg-green-100 text-green-600' },
    { title: 'Notificaciones', value: '0', icon: 'pi pi-bell', iconClass: 'bg-orange-100 text-orange-600' }
  ],
  roles: [],
  departments: [],
  auditLogs: [],
  inactiveUsers: 0,
  activeUsers: [],
  inactiveUserList: [],
  recentUsers: [],
  recentNotifications: []
};
