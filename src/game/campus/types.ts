/**
 * Campus View Types
 * 
 * Isometric startup campus visualization types.
 */

// Grid configuration
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 20;

// Depth layers for proper rendering order
export const DEPTH_LAYERS = {
  GROUND: 0,
  FLOOR: 0.01,
  BUILDING_BASE: 0.05,
  BUILDING: 0.1,
  CHARACTER: 0.2,
  UI: 0.5,
  OVERLAY: 1,
} as const;

// Tile types for the ground
export const TileType = {
  Grass: 'grass',
  Path: 'path',
  Plaza: 'plaza',
  Water: 'water',
  Parking: 'parking',
} as const;
export type TileType = typeof TileType[keyof typeof TileType];

// Direction for buildings and characters
export const Direction = {
  North: 'north',
  South: 'south',
  East: 'east',
  West: 'west',
} as const;
export type Direction = typeof Direction[keyof typeof Direction];

// Building types representing departments
export const BuildingType = {
  // Core buildings
  Headquarters: 'headquarters',
  Engineering: 'engineering',
  Design: 'design',
  Marketing: 'marketing',
  Operations: 'operations',
  
  // Support buildings
  CoffeeShop: 'coffee_shop',
  MeetingRoom: 'meeting_room',
  ServerRoom: 'server_room',
  Lounge: 'lounge',
  
  // Decorative
  Tree: 'tree',
  Fountain: 'fountain',
  Bench: 'bench',
  Flag: 'flag',
} as const;
export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

// Building definition
export interface BuildingDefinition {
  id: BuildingType;
  name: string;
  emoji: string;
  footprint: { width: number; height: number };
  capacity: number; // Max employees
  color: string; // For procedural rendering
  description: string;
}

// Building registry
export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  [BuildingType.Headquarters]: {
    id: BuildingType.Headquarters,
    name: 'Headquarters',
    emoji: '🏛️',
    footprint: { width: 3, height: 3 },
    capacity: 5,
    color: '#6366f1',
    description: 'The heart of your startup',
  },
  [BuildingType.Engineering]: {
    id: BuildingType.Engineering,
    name: 'Engineering',
    emoji: '💻',
    footprint: { width: 3, height: 2 },
    capacity: 8,
    color: '#22c55e',
    description: 'Where code is written',
  },
  [BuildingType.Design]: {
    id: BuildingType.Design,
    name: 'Design Studio',
    emoji: '🎨',
    footprint: { width: 2, height: 2 },
    capacity: 4,
    color: '#ec4899',
    description: 'Creative workspace',
  },
  [BuildingType.Marketing]: {
    id: BuildingType.Marketing,
    name: 'Marketing',
    emoji: '📢',
    footprint: { width: 2, height: 2 },
    capacity: 4,
    color: '#f59e0b',
    description: 'Growth and outreach',
  },
  [BuildingType.Operations]: {
    id: BuildingType.Operations,
    name: 'Operations',
    emoji: '⚙️',
    footprint: { width: 2, height: 2 },
    capacity: 3,
    color: '#64748b',
    description: 'Keep things running',
  },
  [BuildingType.CoffeeShop]: {
    id: BuildingType.CoffeeShop,
    name: 'Coffee Shop',
    emoji: '☕',
    footprint: { width: 2, height: 1 },
    capacity: 2,
    color: '#78350f',
    description: 'Fuel for productivity',
  },
  [BuildingType.MeetingRoom]: {
    id: BuildingType.MeetingRoom,
    name: 'Meeting Room',
    emoji: '🤝',
    footprint: { width: 2, height: 2 },
    capacity: 6,
    color: '#0ea5e9',
    description: 'Collaboration space',
  },
  [BuildingType.ServerRoom]: {
    id: BuildingType.ServerRoom,
    name: 'Server Room',
    emoji: '🖥️',
    footprint: { width: 2, height: 1 },
    capacity: 1,
    color: '#1e293b',
    description: 'Infrastructure',
  },
  [BuildingType.Lounge]: {
    id: BuildingType.Lounge,
    name: 'Lounge',
    emoji: '🛋️',
    footprint: { width: 2, height: 2 },
    capacity: 4,
    color: '#a855f7',
    description: 'Rest and recharge',
  },
  [BuildingType.Tree]: {
    id: BuildingType.Tree,
    name: 'Tree',
    emoji: '🌳',
    footprint: { width: 1, height: 1 },
    capacity: 0,
    color: '#16a34a',
    description: 'Decorative greenery',
  },
  [BuildingType.Fountain]: {
    id: BuildingType.Fountain,
    name: 'Fountain',
    emoji: '⛲',
    footprint: { width: 2, height: 2 },
    capacity: 0,
    color: '#0284c7',
    description: 'Peaceful water feature',
  },
  [BuildingType.Bench]: {
    id: BuildingType.Bench,
    name: 'Bench',
    emoji: '🪑',
    footprint: { width: 1, height: 1 },
    capacity: 2,
    color: '#92400e',
    description: 'Outdoor seating',
  },
  [BuildingType.Flag]: {
    id: BuildingType.Flag,
    name: 'Company Flag',
    emoji: '🚩',
    footprint: { width: 1, height: 1 },
    capacity: 0,
    color: '#dc2626',
    description: 'Show your colors',
  },
};

// Grid cell
export interface GridCell {
  x: number;
  y: number;
  type: TileType;
  buildingId?: string;
  isOccupied: boolean;
}

// Placed building instance
export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  gridX: number;
  gridY: number;
  direction: Direction;
  employeeIds: string[]; // Employees assigned to this building
}

// Character state for visualization
export interface CampusCharacter {
  id: string;
  employeeId: string;
  name: string;
  emoji: string;
  gridX: number;
  gridY: number;
  targetX: number;
  targetY: number;
  state: CharacterState;
  assignedBuildingId?: string;
  taskName?: string;
}

export const CharacterState = {
  Idle: 'idle',
  Walking: 'walking',
  Working: 'working',
  Meeting: 'meeting',
  Coffee: 'coffee',
} as const;
export type CharacterState = typeof CharacterState[keyof typeof CharacterState];

// Campus state
export interface CampusState {
  grid: GridCell[][];
  buildings: PlacedBuilding[];
  characters: CampusCharacter[];
}

// Coordinate conversion utilities
export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: Math.floor(screenX / TILE_WIDTH + screenY / TILE_HEIGHT),
    y: Math.floor(screenY / TILE_HEIGHT - screenX / TILE_WIDTH),
  };
}

// Calculate depth for proper rendering order
export function calculateDepth(gridX: number, gridY: number, layer: number = 0): number {
  return (gridX + gridY) * 10 + layer;
}

// Direction vectors
export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  [Direction.North]: { dx: 0, dy: -1 },
  [Direction.South]: { dx: 0, dy: 1 },
  [Direction.East]: { dx: 1, dy: 0 },
  [Direction.West]: { dx: -1, dy: 0 },
};
