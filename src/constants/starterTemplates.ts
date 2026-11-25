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
    description: 'Favorite dishes, restaurants, and recipes',
    children: [
      {
        title: 'Liked',
        icon: 'heart-outline',
        color: Colors.semantic.danger,
        description: 'Dishes and restaurants you loved',
      },
      {
        title: 'Disliked',
        icon: 'thumbs-down-outline',
        color: Colors.text.muted,
        description: 'Dishes and spots to skip next time',
      },
      {
        title: 'Want to Try',
        icon: 'bookmark-outline',
        color: Colors.tier.core,
        description: 'Places and recipes to try next',
      },
    ],
  },
  {
    title: 'Entertainment',
    icon: 'film-outline',
    color: Colors.tier.solarSystem,
    description: 'Anime, games, movies, and reading',
    children: [
      {
        title: 'Anime',
        icon: 'tv-outline',
        color: Colors.tier.solarSystem,
        description: 'Anime series you are watching or finished',
      },
      {
        title: 'Games',
        icon: 'game-controller-outline',
        color: Colors.tier.planet,
        description: 'Games played, active, or queued',
      },
      {
        title: 'Movies & Series',
        icon: 'film-outline',
        color: Colors.tier.galaxy,
        description: 'Films and shows to watch or rate',
      },
      {
        title: 'Reading',
        icon: 'book-outline',
        color: Colors.tier.moon,
        description: 'Books, manga, and articles',
      },
    ],
  },
  {
    title: 'Work',
    icon: 'briefcase-outline',
    color: Colors.tier.core,
    description: 'Projects and tasks',
    children: [
      {
        title: 'Projects',
        icon: 'folder-outline',
        color: Colors.tier.core,
        description: 'Ongoing projects and milestones',
      },
      {
        title: 'Tasks',
        icon: 'checkbox-outline',
        color: Colors.semantic.success,
        description: 'Action items and to-dos',
      },
    ],
  },
  {
    title: 'Study',
    icon: 'school-outline',
    color: Colors.tier.planet,
    description: 'Courses and study notes',
    children: [
      {
        title: 'Notes',
        icon: 'document-text-outline',
        color: Colors.tier.planet,
        description: 'Reference notes and summaries',
      },
      {
        title: 'Courses',
        icon: 'school-outline',
        color: Colors.tier.galaxy,
        description: 'Courses and learning tracks',
      },
    ],
  },
  {
    title: 'Hobbies',
    icon: 'compass-outline',
    color: Colors.tier.moon,
    description: 'Side projects and personal interests',
  },
];
