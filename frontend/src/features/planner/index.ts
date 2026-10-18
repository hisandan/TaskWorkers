// API pública del planificador PARA LAS FEATURES (tasks, schedule, workers, assignments).
// No exporta <Planner>: Planner importa a las features y esto evita imports circulares.
// La página monta <Planner> desde '@src/features/planner/root'.

export {
  draggableId,
  droppableId,
  readDragData,
  readDropData,
  usePlannerDraggable,
  usePlannerDroppable,
  type DragData,
  type DropData,
} from '@src/features/planner/dnd';
export {
  PlannerContext,
  useActiveDrag,
  useDialogs,
  usePlanner,
  type ActiveDrag,
  type DialogState,
  type DialogsApi,
  type PlannerContextValue,
} from '@src/features/planner/PlannerContext';
export { usePlannerData, type PlannerData } from '@src/features/planner/usePlannerData';
export {
  CALENDAR_WEEKS,
  TEAM_WEEKS,
  type PlannerActions,
  type PlannerUrlState,
  type PlannerView,
} from '@src/features/planner/usePlannerState';
