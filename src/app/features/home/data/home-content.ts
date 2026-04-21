export type HomeFeature = {
  icon: string;
  title: string;
  description: string;
};

export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: 'pi pi-sitemap text-base',
    title: 'Procesos claros',
    description: 'Organiza etapas, responsables y decisiones en un solo flujo.'
  },
  {
    icon: 'pi pi-clock text-base',
    title: 'Seguimiento rapido',
    description: 'Consulta avances y pendientes sin perder contexto operativo.'
  },
  {
    icon: 'pi pi-users text-base',
    title: 'Acceso por rol',
    description: 'Cada usuario entra directo a la vista que realmente necesita.'
  }
];
