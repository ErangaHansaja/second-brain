import { Colors } from '../theme/tokens';
import type { NodeStatus } from '../types';

export interface StatusConfig {
  value: NodeStatus;
  label: string;
  icon: string;
  color: string;
}

export const STATUS_PRESETS: Record<
  'planned' | 'in_progress' | 'completed' | 'dropped',
  StatusConfig
> = {
  planned: {
    value: 'planned',
    label: 'Planned',
    icon: 'calendar-outline',
    color: Colors.tier.solarSystem,
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    icon: 'time-outline',
    color: Colors.semantic.warning,
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    icon: 'checkmark-circle-outline',
    color: Colors.semantic.success,
  },
  dropped: {
    value: 'dropped',
    label: 'Dropped',
    icon: 'close-circle-outline',
    color: Colors.semantic.danger,
  },
} as const;

export const STATUS_LIST: StatusConfig[] = Object.values(STATUS_PRESETS);
