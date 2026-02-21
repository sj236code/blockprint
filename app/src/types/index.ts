// Blueprint Types
export interface Opening {
  type: 'door' | 'window';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Roof {
  type: 'gable' | 'hip';
  height_blocks: number;
  overhang: number;
}

export interface Materials {
  foundation: string;
  wall: string;
  trim: string;
  roof: string;
  window: string;
  door: string;
}

export interface Style {
  theme: string;
  materials: Materials;
  decor: string[];
  variation: number;
}

export interface Building {
  width_blocks: number;
  wall_height_blocks: number;
  depth_blocks: number;
  roof?: Roof | null;
  openings: Opening[];
}

export interface Blueprint {
  view: 'front';
  building?: Building | null;
  segments?: Building[] | null;
  style: Style;
}

/** Return the list of segments (single building as one segment). */
export function getBlueprintSegments(blueprint: Blueprint): Building[] {
  if (blueprint.segments && blueprint.segments.length > 0) return blueprint.segments;
  if (blueprint.building) return [blueprint.building];
  return [];
}

export interface BlueprintResponse {
  success: boolean;
  blueprint: Blueprint;
  warnings: string[];
  raw_ai_json?: Record<string, unknown>;
}

export interface BuildStatus {
  status: 'idle' | 'building' | 'completed' | 'error';
  progress: number;
  blocks_placed: number;
  total_blocks: number;
  current_action: string;
  logs: string[];
  error?: string;
}

export interface BuildRequest {
  blueprint: Blueprint;
  origin: {
    x: number;
    y: number;
    z: number;
  };
}

export type StylePreset = 'ghibli' | 'medieval' | 'modern' | 'fantasy';

export interface StyleOption {
  id: StylePreset;
  name: string;
  description: string;
  icon: string;
}