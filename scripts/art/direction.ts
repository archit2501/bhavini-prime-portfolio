import type { MotifKind, Palette } from '../../src/lib/art/compose.ts';
import type { LockupLine } from '../../src/lib/art/lockup.ts';

/**
 * Art direction per title: palette, motif, title lettering and one motif per episode.
 * Motifs are drawn from each title's own numbers (decision Q6), e.g. seven points on
 * F1Jobs.io's sales line, five export routes for Vastra Kala.
 */
export interface Direction {
  palette: Palette;
  motif: MotifKind;
  lockup: LockupLine[];
  /** One motif per episode, in episode order. */
  episodes?: MotifKind[];
}

const WHITE = '#ffffff';

export const TITLES: Record<string, Direction> = {
  f1jobs: {
    palette: { bg: '#02060f', glows: ['#1a98ff', '#0de0c0', '#3a3cff'], accent: '#7cc7ff' },
    motif: 'rising-line',
    lockup: [
      {
        text: 'SALES & OPERATIONS',
        font: 'Inter-Bold.ttf',
        size: 0.2,
        tracking: 0.32,
        fill: '#7cc7ff',
      },
      {
        text: 'F1JOBS.IO',
        font: 'Archivo-ExpandedBlack.ttf',
        size: 1,
        tracking: -0.01,
        fill: WHITE,
      },
    ],
    episodes: ['funnel', 'bars', 'spotlight', 'tickets'],
  },
  'vastra-kala': {
    palette: { bg: '#120607', glows: ['#ff8a00', '#d6246e', '#ffcc33'], accent: '#ffb347' },
    motif: 'routes',
    lockup: [
      {
        text: 'Vastra',
        font: 'PlayfairDisplay-Black.ttf',
        size: 1,
        tracking: -0.01,
        fill: '#fff4e6',
      },
      {
        text: 'Kala',
        font: 'PlayfairDisplay-ExtraBoldItalic.ttf',
        size: 1,
        indent: 0.55,
        fill: '#ffb347',
      },
    ],
    episodes: ['globe', 'units'],
  },
  clinical: {
    palette: { bg: '#050a10', glows: ['#2bb3a3', '#7a5cff', '#1a98ff'], accent: '#8ff0e0' },
    motif: 'ripples',
    lockup: [
      { text: 'ANR', font: 'Archivo-ExpandedBlack.ttf', size: 1.15, tracking: 0.02, fill: WHITE },
      {
        text: 'HOSPITAL & AAS REHAB CENTRE',
        font: 'Inter-Bold.ttf',
        size: 0.21,
        tracking: 0.16,
        fill: '#8ff0e0',
      },
    ],
    episodes: ['ripples', 'pages', 'mirror', 'checklist'],
  },
  'youth-for-parivarthan': {
    palette: { bg: '#04100a', glows: ['#2fbf71', '#a3d65c', '#0e8a6a'], accent: '#b8f28b' },
    motif: 'clusters',
    lockup: [
      { text: 'YOUTH FOR', font: 'Inter-Bold.ttf', size: 0.3, tracking: 0.3, fill: '#b8f28b' },
      {
        text: 'PARIVARTHAN',
        font: 'Archivo-ExpandedExtraBold.ttf',
        size: 0.78,
        tracking: -0.01,
        fill: WHITE,
      },
    ],
    episodes: ['clusters', 'leaves'],
  },
  'christ-university': {
    palette: { bg: '#060816', glows: ['#3446c9', '#c9a227', '#1a2a8a'], accent: '#f2cf63' },
    motif: 'arches',
    lockup: [
      { text: 'CHRIST', font: 'PlayfairDisplay-Black.ttf', size: 1, tracking: 0.03, fill: WHITE },
      { text: 'UNIVERSITY', font: 'Inter-Bold.ttf', size: 0.22, tracking: 0.62, fill: '#f2cf63' },
    ],
  },
  'cambridge-innovative-school': {
    palette: { bg: '#0d0716', glows: ['#ff7a45', '#8b3ffc', '#ff4f7a'], accent: '#ffb08a' },
    motif: 'steps',
    lockup: [
      { text: 'CAMBRIDGE', font: 'Archivo-Bold.ttf', size: 0.9, tracking: 0.03, fill: WHITE },
      {
        text: 'INNOVATIVE SCHOOL',
        font: 'Inter-Bold.ttf',
        size: 0.24,
        tracking: 0.36,
        fill: '#ffb08a',
      },
    ],
  },
};

export const CERTIFICATIONS: Record<string, Direction> = {
  'hubspot-digital-marketing': {
    palette: { bg: '#0d0806', glows: ['#f0883e', '#c2410c', '#ffd166'], accent: '#ffc58f' },
    motif: 'badge',
    lockup: [
      {
        text: 'HUBSPOT ACADEMY',
        font: 'Inter-Bold.ttf',
        size: 0.2,
        tracking: 0.3,
        fill: '#ffc58f',
      },
      { text: 'Digital Marketing', font: 'PlayfairDisplay-Black.ttf', size: 0.62, fill: WHITE },
      { text: '& Social Media Marketing', font: 'Inter-Medium.ttf', size: 0.26, fill: '#f1f1f1' },
    ],
  },
  'nptel-training-of-trainers': {
    palette: { bg: '#04080f', glows: ['#2a7de1', '#2bb3a3', '#5b5bd6'], accent: '#9cc9ff' },
    motif: 'badge',
    lockup: [
      { text: 'NPTEL', font: 'Inter-Bold.ttf', size: 0.22, tracking: 0.34, fill: '#9cc9ff' },
      { text: 'Training of', font: 'PlayfairDisplay-Black.ttf', size: 0.62, fill: WHITE },
      {
        text: 'Trainers',
        font: 'PlayfairDisplay-ExtraBoldItalic.ttf',
        size: 0.62,
        fill: '#9cc9ff',
      },
    ],
  },
};
