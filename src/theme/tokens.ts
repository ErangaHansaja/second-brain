import { Platform } from 'react-native';
import type { CosmicTier } from '../types';

export type { CosmicTier };

export const Colors = {
  // Deep-space background layers
  bg: {
    void: '#04050A',
    surface: '#0B0D14',
    elevated: '#131622',
    overlay: 'rgba(4, 5, 10, 0.88)',
  },
  // Hairline borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    active: 'rgba(245, 166, 35, 0.45)',
  },
  // High-legibility text hierarchy
  text: {
    primary: '#F2F4F8',
    secondary: '#8C93A8',
    muted: '#4E556B',
  },
  // Cosmic Tier Accents (restrained, high-contrast)
  tier: {
    core: '#F5A623',         // Event Horizon Amber (depth 0 — "Me")
    galaxy: '#818CF8',       // Nebula Indigo (depth 1)
    solarSystem: '#38BDF8',  // Stellar Sky (depth 2)
    planet: '#2DD4BF',       // Orbital Teal (depth 3)
    moon: '#94A3B8',         // Lunar Silver (depth 4+)
  },
  // Semantic signals
  semantic: {
    success: '#2DD4BF',
    warning: '#F5A623',
    danger: '#F43F5E',
  },
} as const;

export const FontFamily = {
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
};

// Helper: map depth → tier accent color
export function tierColor(depth: number): string {
  if (depth === 0) return Colors.tier.core;
  if (depth === 1) return Colors.tier.galaxy;
  if (depth === 2) return Colors.tier.solarSystem;
  if (depth === 3) return Colors.tier.planet;
  return Colors.tier.moon;
}

// Helper: map depth → cosmic tier name
export function getTierName(depth: number): CosmicTier {
  const tiers: CosmicTier[] = ['Core', 'Galaxy', 'Solar System', 'Planet', 'Moon'];
  return tiers[Math.min(depth, 4)] ?? 'Moon';
}
