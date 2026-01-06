/**
 * Tests for Campus types and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  GRID_WIDTH,
  GRID_HEIGHT,
  DEPTH_LAYERS,
  TileType,
  Direction,
  BuildingType,
  CharacterState,
  BUILDINGS,
  gridToScreen,
  screenToGrid,
  calculateDepth,
  DIRECTION_VECTORS,
} from './types';

describe('Campus Types', () => {
  describe('Constants', () => {
    it('has correct tile dimensions', () => {
      expect(TILE_WIDTH).toBe(64);
      expect(TILE_HEIGHT).toBe(32);
    });

    it('has correct grid dimensions', () => {
      expect(GRID_WIDTH).toBe(20);
      expect(GRID_HEIGHT).toBe(20);
    });

    it('has correct depth layers', () => {
      expect(DEPTH_LAYERS.GROUND).toBe(0);
      expect(DEPTH_LAYERS.FLOOR).toBe(0.01);
      expect(DEPTH_LAYERS.BUILDING_BASE).toBe(0.05);
      expect(DEPTH_LAYERS.BUILDING).toBe(0.1);
      expect(DEPTH_LAYERS.CHARACTER).toBe(0.2);
      expect(DEPTH_LAYERS.UI).toBe(0.5);
      expect(DEPTH_LAYERS.OVERLAY).toBe(1);
    });
  });

  describe('TileType', () => {
    it('has all tile types defined', () => {
      expect(TileType.Grass).toBe('grass');
      expect(TileType.Path).toBe('path');
      expect(TileType.Plaza).toBe('plaza');
      expect(TileType.Water).toBe('water');
      expect(TileType.Parking).toBe('parking');
    });
  });

  describe('Direction', () => {
    it('has all directions defined', () => {
      expect(Direction.North).toBe('north');
      expect(Direction.South).toBe('south');
      expect(Direction.East).toBe('east');
      expect(Direction.West).toBe('west');
    });
  });

  describe('BuildingType', () => {
    it('has core building types', () => {
      expect(BuildingType.Headquarters).toBe('headquarters');
      expect(BuildingType.Engineering).toBe('engineering');
      expect(BuildingType.Design).toBe('design');
      expect(BuildingType.Marketing).toBe('marketing');
      expect(BuildingType.Operations).toBe('operations');
    });

    it('has support building types', () => {
      expect(BuildingType.CoffeeShop).toBe('coffee_shop');
      expect(BuildingType.MeetingRoom).toBe('meeting_room');
      expect(BuildingType.ServerRoom).toBe('server_room');
      expect(BuildingType.Lounge).toBe('lounge');
    });

    it('has decorative building types', () => {
      expect(BuildingType.Tree).toBe('tree');
      expect(BuildingType.Fountain).toBe('fountain');
      expect(BuildingType.Bench).toBe('bench');
      expect(BuildingType.Flag).toBe('flag');
    });
  });

  describe('CharacterState', () => {
    it('has all character states defined', () => {
      expect(CharacterState.Idle).toBe('idle');
      expect(CharacterState.Walking).toBe('walking');
      expect(CharacterState.Working).toBe('working');
      expect(CharacterState.Meeting).toBe('meeting');
      expect(CharacterState.Coffee).toBe('coffee');
    });
  });

  describe('BUILDINGS registry', () => {
    it('has definitions for all building types', () => {
      const buildingTypes = Object.values(BuildingType);
      buildingTypes.forEach(type => {
        expect(BUILDINGS[type]).toBeDefined();
        expect(BUILDINGS[type].id).toBe(type);
        expect(BUILDINGS[type].name).toBeTruthy();
        expect(BUILDINGS[type].emoji).toBeTruthy();
        expect(BUILDINGS[type].footprint).toBeDefined();
        expect(BUILDINGS[type].footprint.width).toBeGreaterThan(0);
        expect(BUILDINGS[type].footprint.height).toBeGreaterThan(0);
        expect(typeof BUILDINGS[type].capacity).toBe('number');
        expect(BUILDINGS[type].color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(BUILDINGS[type].description).toBeTruthy();
      });
    });

    it('has correct headquarters definition', () => {
      const hq = BUILDINGS[BuildingType.Headquarters];
      expect(hq.name).toBe('Headquarters');
      expect(hq.emoji).toBe('🏛️');
      expect(hq.footprint).toEqual({ width: 3, height: 3 });
      expect(hq.capacity).toBe(5);
    });

    it('has correct engineering definition', () => {
      const eng = BUILDINGS[BuildingType.Engineering];
      expect(eng.name).toBe('Engineering');
      expect(eng.emoji).toBe('💻');
      expect(eng.footprint).toEqual({ width: 3, height: 2 });
      expect(eng.capacity).toBe(8);
    });

    it('decorative buildings have zero capacity', () => {
      expect(BUILDINGS[BuildingType.Tree].capacity).toBe(0);
      expect(BUILDINGS[BuildingType.Fountain].capacity).toBe(0);
      expect(BUILDINGS[BuildingType.Flag].capacity).toBe(0);
    });
  });

  describe('DIRECTION_VECTORS', () => {
    it('has correct vectors for all directions', () => {
      expect(DIRECTION_VECTORS[Direction.North]).toEqual({ dx: 0, dy: -1 });
      expect(DIRECTION_VECTORS[Direction.South]).toEqual({ dx: 0, dy: 1 });
      expect(DIRECTION_VECTORS[Direction.East]).toEqual({ dx: 1, dy: 0 });
      expect(DIRECTION_VECTORS[Direction.West]).toEqual({ dx: -1, dy: 0 });
    });
  });
});

describe('Coordinate Conversion', () => {
  describe('gridToScreen', () => {
    it('converts origin correctly', () => {
      const result = gridToScreen(0, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('converts positive x correctly', () => {
      const result = gridToScreen(1, 0);
      expect(result.x).toBe(TILE_WIDTH / 2);
      expect(result.y).toBe(TILE_HEIGHT / 2);
    });

    it('converts positive y correctly', () => {
      const result = gridToScreen(0, 1);
      expect(result.x).toBe(-TILE_WIDTH / 2);
      expect(result.y).toBe(TILE_HEIGHT / 2);
    });

    it('converts diagonal correctly', () => {
      const result = gridToScreen(1, 1);
      expect(result.x).toBe(0); // (1-1) * 32 = 0
      expect(result.y).toBe(TILE_HEIGHT); // (1+1) * 16 = 32
    });

    it('handles larger coordinates', () => {
      const result = gridToScreen(5, 3);
      expect(result.x).toBe((5 - 3) * (TILE_WIDTH / 2)); // 2 * 32 = 64
      expect(result.y).toBe((5 + 3) * (TILE_HEIGHT / 2)); // 8 * 16 = 128
    });
  });

  describe('screenToGrid', () => {
    it('converts origin correctly', () => {
      const result = screenToGrid(0, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('is inverse of gridToScreen for simple cases', () => {
      // Test a few grid positions
      const testCases = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 3 },
      ];

      testCases.forEach(({ x, y }) => {
        const screen = gridToScreen(x, y);
        const grid = screenToGrid(screen.x, screen.y);
        expect(grid.x).toBe(x);
        expect(grid.y).toBe(y);
      });
    });
  });

  describe('calculateDepth', () => {
    it('calculates depth for origin', () => {
      const depth = calculateDepth(0, 0);
      expect(depth).toBe(0);
    });

    it('increases depth for higher grid positions', () => {
      const depth1 = calculateDepth(1, 1);
      const depth2 = calculateDepth(2, 2);
      expect(depth2).toBeGreaterThan(depth1);
    });

    it('adds layer offset correctly', () => {
      const baseDepth = calculateDepth(5, 5);
      const withLayer = calculateDepth(5, 5, 0.5);
      expect(withLayer).toBe(baseDepth + 0.5);
    });

    it('uses multiplier of 10', () => {
      const depth = calculateDepth(1, 1);
      expect(depth).toBe(20); // (1 + 1) * 10 = 20
    });
  });
});
