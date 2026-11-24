import { Colors } from '../theme/tokens';
import type { NodeStatus } from '../types';

export interface StatusConfig {
  value: NodeStatus;
  label: string;
  icon: string;
  color: string;
}

export const STATUS_PRESETS: Record<
  'completed' | 'in_progress' | 'planned' | 'liked' | 'disliked' | 'neutral',
  StatusConfig
> = {
  completed: {
    value: 'completed',
    label: 'Completed',
    icon: 'checkmark-circle-outline',
    color: Colors.semantic.success,
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    icon: 'time-outline',
    color: Colors.tier.core,
  },
  planned: {
    value: 'planned',
    label: 'Planned',
    icon: 'calendar-outline',
    color: Colors.tier.solarSystem,
  },
  liked: {
    value: 'liked',
    label: 'Liked',
    icon: 'heart-outline',
    color: Colors.semantic.danger,
  },
  disliked: {
    value: 'disliked',
    label: 'Disliked',
    icon: 'thumbs-down-outline',
    color: Colors.text.muted,
  },
  neutral: {
    value: 'neutral',
    label: 'Neutral',
    icon: 'remove-circle-outline',
    color: Colors.text.secondary,
  },
} as const;

export const STATUS_LIST: StatusConfig[] = Object.values(STATUS_PRESETS);
