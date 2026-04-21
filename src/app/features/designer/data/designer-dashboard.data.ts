export type DesignerInfoItem = {
  label: string;
  value: string;
  valueClass: string;
};

export const DESIGNER_INFO_ITEMS: DesignerInfoItem[] = [
  { label: 'Editor Activo', value: 'GoJS Pro v3.0', valueClass: 'font-bold text-violet-700' },
  { label: 'Última Modificación', value: 'Reciente', valueClass: 'italic text-gray-800' }
];

export const DESIGNER_GUIDELINES =
  'Diseña siguiendo los estándares definidos en tus Skills. Recuerda que los nodos deben representar departamentos válidos del sistema.';
