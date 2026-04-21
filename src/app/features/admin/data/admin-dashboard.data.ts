export type AdminMetric = {
  title: string;
  value: string;
  icon: string;
  iconClass: string;
};

export const ADMIN_METRICS: AdminMetric[] = [
  { title: 'Usuarios', value: '42', icon: 'pi pi-users', iconClass: 'bg-blue-100 text-blue-600' },
  { title: 'Workflows Activos', value: '12', icon: 'pi pi-sitemap', iconClass: 'bg-green-100 text-green-600' },
  { title: 'Notificaciones', value: '5', icon: 'pi pi-bell', iconClass: 'bg-orange-100 text-orange-600' }
];
