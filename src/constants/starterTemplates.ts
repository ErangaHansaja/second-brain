import { Colors } from '../theme/tokens';

export interface TemplateDefinition {
  title: string;
  icon: string;
  color: string;
  description?: string;
  children?: TemplateDefinition[];
}

export const STARTER_TEMPLATES: TemplateDefinition[] = [
  {
    title: 'Food',
    icon: 'restaurant-outline',
    color: Colors.tier.galaxy,
    description: 'Culinary discoveries, dining spots, and recipes',
    children: [
      {
        title: 'Liked',
        icon: 'heart-outline',
        color: Colors.semantic.danger,
        description: 'Favorite foods, dishes, and restaurants',
      },
      {
        title: 'Disliked',
        icon: 'thumbs-down-outline',
        color: Colors.text.muted,
        description: 'Dishes and flavor profiles to avoid',
      },
      {
        title: 'Want to Try',
        icon: 'bookmark-outline',
        color: Colors.tier.core,
        description: 'Must-visit spots and queued recipes',
      },
    ],
  },
  {
    title: 'Entertainment',
    icon: 'film-outline',
    color: Colors.tier.solarSystem,
    description: 'Media, gaming, cinema, and literature',
    children: [
      {
        title: 'Anime',
        icon: 'tv-outline',
        color: Colors.tier.solarSystem,
        description: 'Tracked and completed anime series',
      },
      {
        title: 'Games',
        icon: 'game-controller-outline',
        color: Colors.tier.planet,
        description: 'Video games, tabletop, and backlog',
      },
      {
        title: 'Movies & Series',
        icon: 'film-outline',
        color: Colors.tier.galaxy,
        description: 'Films, documentaries, and TV series',
      },
      {
        title: 'Reading',
        icon: 'book-outline',
        color: Colors.tier.moon,
        description: 'Books, manga, articles, and light novels',
      },
    ],
  },
  {
    title: 'Work',
    icon: 'briefcase-outline',
    color: Colors.tier.core,
    description: 'Professional projects, deliverables, and initiatives',
    children: [
      {
        title: 'Projects',
        icon: 'folder-outline',
        color: Colors.tier.core,
        description: 'Active workstreams and repositories',
      },
      {
        title: 'Tasks',
        icon: 'checkbox-outline',
        color: Colors.semantic.success,
        description: 'Actionable items and sprint tasks',
      },
    ],
  },
  {
    title: 'Study',
    icon: 'school-outline',
    color: Colors.tier.planet,
    description: 'Academic courses, knowledge synthesis, and skill acquisition',
    children: [
      {
        title: 'Notes',
        icon: 'document-text-outline',
        color: Colors.tier.planet,
        description: 'Reference notes and study summaries',
      },
      {
        title: 'Courses',
        icon: 'school-outline',
        color: Colors.tier.galaxy,
        description: 'Curriculum and structured learning',
      },
    ],
  },
  {
    title: 'Hobbies',
    icon: 'compass-outline',
    color: Colors.tier.moon,
    description: 'Creative pursuits, side projects, and passions',
  },
];
