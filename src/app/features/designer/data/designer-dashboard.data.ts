export type DesignerInfoItem = {
  label: string;
  value: string;
  valueClass: string;
};

export type DesignerWorkflowStep = {
  nombre: string;
  orden: number;
  departamento: string;
  formularioId: string | null;
};

export type DesignerWorkflow = {
  id: string;
  nombre: string;
  descripcion: string;
  pasos: DesignerWorkflowStep[];
  diagramData: string | null;
  ownerUserId: string | null;
  collaborators: WorkflowCollaborator[];
};

export type WorkflowCollaborator = {
  userId: string;
  nombre: string;
  email: string;
  role: string;
};

export type DesignerUser = {
  id: string;
  email: string;
  nombre: string;
  departamento: string;
  rol: string;
};

export const DESIGNER_INFO_ITEMS: DesignerInfoItem[] = [
  { label: 'Editor Activo', value: 'ng-diagram 1.2.1', valueClass: 'font-bold text-violet-700' },
  { label: 'Última Modificación', value: 'Reciente', valueClass: 'italic text-gray-800' }
];

export const DESIGNER_GUIDELINES =
  'Diseña siguiendo los estándares definidos en tus Skills. Recuerda que los nodos deben representar departamentos válidos del sistema.';
