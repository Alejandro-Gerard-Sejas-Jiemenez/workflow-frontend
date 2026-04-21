export type EmployeeTask = {
  title: string;
  description: string;
  colorClass: string;
  headerClass: string;
};

export const EMPLOYEE_TASKS: EmployeeTask[] = [
  {
    title: 'Solicitud de Vacaciones #402',
    description: 'Requiere revisión de documentos adjuntos y validación de fechas.',
    colorClass: 'border-blue-500',
    headerClass: 'text-blue-900'
  },
  {
    title: 'Revisión de Gastos #109',
    description: 'Monto excedido en viáticos. Justificación pendiente.',
    colorClass: 'border-orange-500',
    headerClass: 'text-orange-900'
  }
];
