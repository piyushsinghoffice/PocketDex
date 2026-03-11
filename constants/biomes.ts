import { Biome } from '@/types';

export interface BiomeInfo {
  id: Biome;
  label: string;
  description: string;
  icon: string; // Ionicons name
  tip: string;
  color: string;
}

export const BIOMES: BiomeInfo[] = [
  {
    id: 'Forest',
    label: 'Forest',
    description: 'Dense woodland and mixed forest ecosystems teeming with secretive mammals and songbirds.',
    icon: 'leaf',
    tip: 'Dawn and dusk are peak activity times. Move slowly and quietly.',
    color: '#16a34a',
  },
  {
    id: 'Wetland',
    label: 'Wetland',
    description: 'Rivers, ponds, marshes and estuaries — hotspots for waterfowl, amphibians and otters.',
    icon: 'water',
    tip: 'Scan along riverbanks at twilight for the best chance of rare sightings.',
    color: '#0891b2',
  },
  {
    id: 'Urban',
    label: 'Urban',
    description: 'Cities and suburbs harbour surprisingly diverse wildlife adapted to human environments.',
    icon: 'business',
    tip: 'Check rooftops, alleyways and parks — the city is full of hidden wildlife.',
    color: '#64748b',
  },
  {
    id: 'Grassland',
    label: 'Grassland',
    description: 'Open meadows, farmland, and rolling plains supporting large herbivores and raptors.',
    icon: 'sunny',
    tip: 'Wide open sightlines — scan field edges and fence posts for perching birds.',
    color: '#ca8a04',
  },
  {
    id: 'Mountain',
    label: 'Mountain',
    description: 'Remote uplands and rocky crags home to the rarest and most powerful creatures.',
    icon: 'triangle',
    tip: 'Legendary animals favour remote highland areas. Explore further from paths.',
    color: '#7c3aed',
  },
  {
    id: 'Coastal',
    label: 'Coastal',
    description: 'Cliffs, beaches and coastal grassland hosting seabirds and marine mammals.',
    icon: 'navigate',
    tip: 'Scan cliffside ledges and tidal pools for extraordinary coastal wildlife.',
    color: '#0284c7',
  },
];
