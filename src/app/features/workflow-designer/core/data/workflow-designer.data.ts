export const WORKFLOW_PALETTE_ITEMS = [
  { id: 'start', type: 'start', data: { kind: 'start', typeLabel: 'Inicio' } },
  { id: 'task', type: 'task', data: { kind: 'task', typeLabel: 'Actividad' } },
  { id: 'decision', type: 'decision', data: { kind: 'decision', typeLabel: 'Decisión' } },
  { id: 'merge', type: 'merge', data: { kind: 'merge', typeLabel: 'Fusión' } },
  { id: 'end', type: 'end', data: { kind: 'end', typeLabel: 'Fin Actividad' } },
  { id: 'flow-final', type: 'flow-final', data: { kind: 'flow-final', typeLabel: 'Fin Flujo' } },
  { id: 'fork', type: 'fork', data: { kind: 'fork', typeLabel: 'Fork (Horizontal)' } },
  { id: 'join', type: 'join', data: { kind: 'join', typeLabel: 'Join (Horizontal)' } },
  { id: 'signal-send', type: 'signal-send', data: { kind: 'signal-send', typeLabel: 'Enviar Señal' } },
  { id: 'signal-receive', type: 'signal-receive', data: { kind: 'signal-receive', typeLabel: 'Recibir Señal' } },
  { id: 'note', type: 'note', data: { kind: 'note', typeLabel: 'Nota' } },
  { id: 'lane', type: 'lane', data: { kind: 'lane', typeLabel: 'Carril (Departamento)' } }
];

export const SUPPORTED_PATTERNS = [
  { kind: 'linear', title: 'Lineal', description: 'Flujo secuencial simple.' },
  { kind: 'alternative', title: 'Alternativo', description: 'Caminos divergentes.' },
  { kind: 'parallel', title: 'Paralelo', description: 'Tareas simultáneas.' }
];

export const WORKFLOW_NODE_RULES: Record<string, { minInputs: number, maxInputs: number, minOutputs: number, maxOutputs: number }> = {
  'start': { minInputs: 0, maxInputs: 0, minOutputs: 1, maxOutputs: 1 },
  'end': { minInputs: 1, maxInputs: 999, minOutputs: 0, maxOutputs: 0 },
  'flow-final': { minInputs: 1, maxInputs: 999, minOutputs: 0, maxOutputs: 0 },
  'task': { minInputs: 1, maxInputs: 999, minOutputs: 1, maxOutputs: 1 },
  'decision': { minInputs: 1, maxInputs: 1, minOutputs: 2, maxOutputs: 2 },
  'merge': { minInputs: 2, maxInputs: 999, minOutputs: 1, maxOutputs: 1 },
  'fork': { minInputs: 1, maxInputs: 1, minOutputs: 2, maxOutputs: 999 },
  'join': { minInputs: 2, maxInputs: 999, minOutputs: 1, maxOutputs: 1 },
  'signal-send': { minInputs: 1, maxInputs: 999, minOutputs: 1, maxOutputs: 1 },
  'signal-receive': { minInputs: 0, maxInputs: 1, minOutputs: 1, maxOutputs: 1 },
  'note': { minInputs: 0, maxInputs: 0, minOutputs: 0, maxOutputs: 0 },
  'lane': { minInputs: 0, maxInputs: 0, minOutputs: 0, maxOutputs: 0 }
};
