/**
 * CampusScene - Main Phaser scene for the isometric campus view
 * 
 * Renders the startup campus with buildings and employees.
 */

import Phaser from 'phaser';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  GRID_WIDTH,
  GRID_HEIGHT,
  DEPTH_LAYERS,
  TileType,
  BuildingType,
  Direction,
  CharacterState,
  BUILDINGS,
  gridToScreen,
  screenToGrid,
  calculateDepth,
} from './types';
import type {
  PlacedBuilding,
  CampusCharacter,
  GridCell,
} from './types';

// Scene configuration
const CAMERA_SPEED = 10;
const CHARACTER_SPEED = 50; // pixels per second

// Colors for procedural rendering
const TILE_COLORS: Record<TileType, number> = {
  [TileType.Grass]: 0x4ade80,
  [TileType.Path]: 0xd1d5db,
  [TileType.Plaza]: 0xe5e7eb,
  [TileType.Water]: 0x38bdf8,
  [TileType.Parking]: 0x6b7280,
};

export interface CampusSceneEvents {
  onBuildingClick?: (buildingId: string) => void;
  onCharacterClick?: (characterId: string) => void;
  onTileClick?: (x: number, y: number) => void;
}

export class CampusScene extends Phaser.Scene {
  // Grid state
  private grid: GridCell[][] = [];
  private buildings: Map<string, PlacedBuilding> = new Map();
  private characters: Map<string, CampusCharacter> = new Map();
  
  // Phaser objects
  private tileGraphics!: Phaser.GameObjects.Graphics;
  private buildingSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private characterSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private selectionHighlight: Phaser.GameObjects.Graphics | null = null;
  
  // Camera controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  
  // Interaction
  private hoverTile: { x: number; y: number } | null = null;
  private selectedBuilding: string | null = null;
  
  // Event callbacks
  private sceneEvents: CampusSceneEvents = {};
  
  // Grid offset for centering
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  
  constructor() {
    super({ key: 'CampusScene' });
  }
  
  init(data: { events?: CampusSceneEvents }) {
    this.sceneEvents = data.events || {};
  }
  
  preload() {
    // We'll use procedural graphics, no external assets needed
  }
  
  create() {
    // Initialize grid
    this.initializeGrid();
    
    // Calculate offset to center the grid
    this.gridOffsetX = this.cameras.main.width / 2;
    this.gridOffsetY = 100;
    
    // Create graphics for tiles
    this.tileGraphics = this.add.graphics();
    
    // Create selection highlight
    this.selectionHighlight = this.add.graphics();
    this.selectionHighlight.setDepth(1000);
    
    // Draw initial grid
    this.drawGrid();
    
    // Setup camera
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Setup input
    this.setupInput();
    
    // Setup camera bounds (larger than grid for panning)
    const worldWidth = GRID_WIDTH * TILE_WIDTH * 2;
    const worldHeight = GRID_HEIGHT * TILE_HEIGHT * 2;
    this.cameras.main.setBounds(
      -worldWidth / 2,
      -100,
      worldWidth * 1.5,
      worldHeight * 1.5
    );
    
    // Enable camera drag
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && pointer.button === 1) {
        // Middle mouse drag
        this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
        this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
      }
      
      // Update hover tile
      this.updateHoverTile(pointer);
    });
    
    // Click handling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0) {
        this.handleClick();
      }
    });
    
    // Zoom with scroll wheel
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      const zoomChange = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomChange, 0.5, 2);
      this.cameras.main.setZoom(newZoom);
    });
    
    // Add some default buildings
    this.addDefaultCampus();
  }
  
  private initializeGrid() {
    this.grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      this.grid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        this.grid[y][x] = {
          x,
          y,
          type: TileType.Grass,
          isOccupied: false,
        };
      }
    }
    
    // Add some paths
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (this.grid[10] && this.grid[10][x]) {
        this.grid[10][x].type = TileType.Path;
      }
    }
    for (let y = 0; y < GRID_HEIGHT; y++) {
      if (this.grid[y] && this.grid[y][10]) {
        this.grid[y][10].type = TileType.Path;
      }
    }
    
    // Add a plaza in the center
    for (let y = 8; y <= 12; y++) {
      for (let x = 8; x <= 12; x++) {
        if (this.grid[y] && this.grid[y][x]) {
          this.grid[y][x].type = TileType.Plaza;
        }
      }
    }
  }
  
  private setupInput() {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }
  
  private drawGrid() {
    this.tileGraphics.clear();
    
    // Draw tiles from back to front for proper depth
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = this.grid[y]?.[x];
        if (!cell) continue;
        
        const screen = gridToScreen(x, y);
        const screenX = screen.x + this.gridOffsetX;
        const screenY = screen.y + this.gridOffsetY;
        
        // Draw isometric tile
        this.drawIsometricTile(screenX, screenY, TILE_COLORS[cell.type], 1);
      }
    }
  }
  
  private drawIsometricTile(x: number, y: number, color: number, alpha: number = 1) {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    
    // Diamond shape points
    const points = [
      { x: x, y: y - halfH },           // Top
      { x: x + halfW, y: y },            // Right
      { x: x, y: y + halfH },            // Bottom
      { x: x - halfW, y: y },            // Left
    ];
    
    this.tileGraphics.fillStyle(color, alpha);
    this.tileGraphics.beginPath();
    this.tileGraphics.moveTo(points[0].x, points[0].y);
    points.forEach(p => this.tileGraphics.lineTo(p.x, p.y));
    this.tileGraphics.closePath();
    this.tileGraphics.fillPath();
    
    // Draw outline
    this.tileGraphics.lineStyle(1, 0x000000, 0.2);
    this.tileGraphics.strokePath();
  }
  
  private addDefaultCampus() {
    // Add headquarters in the center
    this.addBuilding(BuildingType.Headquarters, 9, 9);
    
    // Add department buildings around it
    this.addBuilding(BuildingType.Engineering, 5, 5);
    this.addBuilding(BuildingType.Design, 13, 5);
    this.addBuilding(BuildingType.Marketing, 5, 13);
    this.addBuilding(BuildingType.CoffeeShop, 14, 13);
    
    // Add some trees
    this.addBuilding(BuildingType.Tree, 3, 3);
    this.addBuilding(BuildingType.Tree, 16, 3);
    this.addBuilding(BuildingType.Tree, 3, 16);
    this.addBuilding(BuildingType.Tree, 16, 16);
    
    // Add fountain
    this.addBuilding(BuildingType.Fountain, 9, 6);
  }
  
  addBuilding(type: BuildingType, gridX: number, gridY: number, direction: Direction = Direction.South): string {
    const def = BUILDINGS[type];
    const id = `building_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    
    // Create building data
    const building: PlacedBuilding = {
      id,
      type,
      gridX,
      gridY,
      direction,
      employeeIds: [],
    };
    
    this.buildings.set(id, building);
    
    // Mark grid cells as occupied
    for (let dy = 0; dy < def.footprint.height; dy++) {
      for (let dx = 0; dx < def.footprint.width; dx++) {
        const cell = this.grid[gridY + dy]?.[gridX + dx];
        if (cell) {
          cell.isOccupied = true;
          cell.buildingId = id;
        }
      }
    }
    
    // Create visual representation
    this.createBuildingSprite(building);
    
    return id;
  }
  
  private createBuildingSprite(building: PlacedBuilding) {
    const def = BUILDINGS[building.type];
    const screen = gridToScreen(building.gridX, building.gridY);
    const screenX = screen.x + this.gridOffsetX;
    const screenY = screen.y + this.gridOffsetY;
    
    // Create container for building
    const container = this.add.container(screenX, screenY);
    
    // Calculate building dimensions
    const width = def.footprint.width * TILE_WIDTH * 0.8;
    const height = def.footprint.height * TILE_HEIGHT * 2;
    
    // Draw building base (3D box effect)
    const graphics = this.add.graphics();
    
    // Convert hex color string to number
    const colorNum = parseInt(def.color.replace('#', ''), 16);
    const darkColor = Phaser.Display.Color.ValueToColor(colorNum).darken(20).color;
    const lightColor = Phaser.Display.Color.ValueToColor(colorNum).lighten(10).color;
    
    // Front face
    graphics.fillStyle(colorNum, 1);
    graphics.fillRect(-width / 2, -height, width, height);
    
    // Top face (lighter)
    graphics.fillStyle(lightColor, 1);
    const topPoints = [
      { x: -width / 2, y: -height },
      { x: 0, y: -height - TILE_HEIGHT / 2 },
      { x: width / 2, y: -height },
      { x: 0, y: -height + TILE_HEIGHT / 2 },
    ];
    graphics.beginPath();
    graphics.moveTo(topPoints[0].x, topPoints[0].y);
    topPoints.forEach(p => graphics.lineTo(p.x, p.y));
    graphics.closePath();
    graphics.fillPath();
    
    // Right face (darker)
    graphics.fillStyle(darkColor, 1);
    graphics.beginPath();
    graphics.moveTo(width / 2, -height);
    graphics.lineTo(width / 2 + TILE_WIDTH / 4, -height + TILE_HEIGHT / 4);
    graphics.lineTo(width / 2 + TILE_WIDTH / 4, TILE_HEIGHT / 4);
    graphics.lineTo(width / 2, 0);
    graphics.closePath();
    graphics.fillPath();
    
    // Outline
    graphics.lineStyle(2, 0x000000, 0.3);
    graphics.strokeRect(-width / 2, -height, width, height);
    
    container.add(graphics);
    
    // Add emoji label
    const emoji = this.add.text(0, -height / 2, def.emoji, {
      fontSize: `${Math.min(width, 48)}px`,
    });
    emoji.setOrigin(0.5);
    container.add(emoji);
    
    // Add name label
    const nameLabel = this.add.text(0, 10, def.name, {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 4, y: 2 },
    });
    nameLabel.setOrigin(0.5, 0);
    container.add(nameLabel);
    
    // Set depth based on grid position
    const depth = calculateDepth(building.gridX, building.gridY, DEPTH_LAYERS.BUILDING);
    container.setDepth(depth);
    
    // Make interactive
    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height, width, height + 20),
      Phaser.Geom.Rectangle.Contains
    );
    
    container.on('pointerover', () => {
      container.setScale(1.05);
    });
    
    container.on('pointerout', () => {
      container.setScale(1);
    });
    
    container.on('pointerdown', () => {
      this.selectedBuilding = building.id;
      this.sceneEvents.onBuildingClick?.(building.id);
      this.updateSelectionHighlight();
    });
    
    this.buildingSprites.set(building.id, container);
  }
  
  addCharacter(
    id: string,
    employeeId: string,
    name: string,
    emoji: string,
    gridX: number,
    gridY: number,
    assignedBuildingId?: string,
    taskName?: string
  ) {
    const character: CampusCharacter = {
      id,
      employeeId,
      name,
      emoji,
      gridX,
      gridY,
      targetX: gridX,
      targetY: gridY,
      state: CharacterState.Idle,
      assignedBuildingId,
      taskName,
    };
    
    this.characters.set(id, character);
    this.createCharacterSprite(character);
  }
  
  private createCharacterSprite(character: CampusCharacter) {
    const screen = gridToScreen(character.gridX, character.gridY);
    const screenX = screen.x + this.gridOffsetX;
    const screenY = screen.y + this.gridOffsetY;
    
    // Create container
    const container = this.add.container(screenX, screenY - TILE_HEIGHT);
    
    // Character circle
    const graphics = this.add.graphics();
    graphics.fillStyle(0x6366f1, 1);
    graphics.fillCircle(0, 0, 12);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(0, 0, 12);
    container.add(graphics);
    
    // Emoji
    const emoji = this.add.text(0, 0, character.emoji, {
      fontSize: '16px',
    });
    emoji.setOrigin(0.5);
    container.add(emoji);
    
    // Name label
    const label = this.add.text(0, 18, character.name, {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 3, y: 1 },
    });
    label.setOrigin(0.5, 0);
    container.add(label);
    
    // Task indicator (if working)
    if (character.taskName) {
      const taskLabel = this.add.text(0, -24, `📝 ${character.taskName}`, {
        fontSize: '9px',
        color: '#fbbf24',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 3, y: 1 },
      });
      taskLabel.setOrigin(0.5, 1);
      container.add(taskLabel);
    }
    
    // Set depth
    const depth = calculateDepth(character.gridX, character.gridY, DEPTH_LAYERS.CHARACTER);
    container.setDepth(depth);
    
    // Make interactive
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 15), Phaser.Geom.Circle.Contains);
    
    container.on('pointerdown', () => {
      this.sceneEvents.onCharacterClick?.(character.employeeId);
    });
    
    this.characterSprites.set(character.id, container);
  }
  
  updateCharacter(id: string, updates: Partial<CampusCharacter>) {
    const character = this.characters.get(id);
    if (!character) return;
    
    Object.assign(character, updates);
    
    // Update sprite position if grid position changed
    if (updates.gridX !== undefined || updates.gridY !== undefined) {
      const sprite = this.characterSprites.get(id);
      if (sprite) {
        const screen = gridToScreen(character.gridX, character.gridY);
        sprite.setPosition(
          screen.x + this.gridOffsetX,
          screen.y + this.gridOffsetY - TILE_HEIGHT
        );
        sprite.setDepth(calculateDepth(character.gridX, character.gridY, DEPTH_LAYERS.CHARACTER));
      }
    }
  }
  
  removeCharacter(id: string) {
    this.characters.delete(id);
    const sprite = this.characterSprites.get(id);
    if (sprite) {
      sprite.destroy();
      this.characterSprites.delete(id);
    }
  }
  
  private updateHoverTile(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const grid = screenToGrid(
      worldPoint.x - this.gridOffsetX,
      worldPoint.y - this.gridOffsetY
    );
    
    if (grid.x >= 0 && grid.x < GRID_WIDTH && grid.y >= 0 && grid.y < GRID_HEIGHT) {
      this.hoverTile = { x: grid.x, y: grid.y };
    } else {
      this.hoverTile = null;
    }
    
    this.updateSelectionHighlight();
  }
  
  private handleClick() {
    if (this.hoverTile) {
      this.sceneEvents.onTileClick?.(this.hoverTile.x, this.hoverTile.y);
    }
  }
  
  private updateSelectionHighlight() {
    if (!this.selectionHighlight) return;
    
    this.selectionHighlight.clear();
    
    // Draw hover highlight
    if (this.hoverTile) {
      const screen = gridToScreen(this.hoverTile.x, this.hoverTile.y);
      const screenX = screen.x + this.gridOffsetX;
      const screenY = screen.y + this.gridOffsetY;
      
      this.selectionHighlight.lineStyle(2, 0xffffff, 0.8);
      this.drawHighlightTile(this.selectionHighlight, screenX, screenY);
    }
    
    // Draw selected building highlight
    if (this.selectedBuilding) {
      const building = this.buildings.get(this.selectedBuilding);
      if (building) {
        const def = BUILDINGS[building.type];
        
        this.selectionHighlight.lineStyle(3, 0x6366f1, 1);
        
        for (let dy = 0; dy < def.footprint.height; dy++) {
          for (let dx = 0; dx < def.footprint.width; dx++) {
            const screen = gridToScreen(building.gridX + dx, building.gridY + dy);
            const screenX = screen.x + this.gridOffsetX;
            const screenY = screen.y + this.gridOffsetY;
            this.drawHighlightTile(this.selectionHighlight, screenX, screenY);
          }
        }
      }
    }
  }
  
  private drawHighlightTile(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    
    graphics.beginPath();
    graphics.moveTo(x, y - halfH);
    graphics.lineTo(x + halfW, y);
    graphics.lineTo(x, y + halfH);
    graphics.lineTo(x - halfW, y);
    graphics.closePath();
    graphics.strokePath();
  }
  
  update(_time: number, delta: number) {
    // Camera movement with keyboard
    if (this.cursors && this.wasd) {
      const speed = CAMERA_SPEED;
      
      if (this.cursors.left.isDown || this.wasd.A.isDown) {
        this.cameras.main.scrollX -= speed;
      }
      if (this.cursors.right.isDown || this.wasd.D.isDown) {
        this.cameras.main.scrollX += speed;
      }
      if (this.cursors.up.isDown || this.wasd.W.isDown) {
        this.cameras.main.scrollY -= speed;
      }
      if (this.cursors.down.isDown || this.wasd.S.isDown) {
        this.cameras.main.scrollY += speed;
      }
    }
    
    // Animate characters
    this.characters.forEach((character, id) => {
      if (character.state === CharacterState.Walking) {
        this.animateCharacterMovement(id, delta);
      }
    });
  }
  
  private animateCharacterMovement(id: string, delta: number) {
    const character = this.characters.get(id);
    const sprite = this.characterSprites.get(id);
    if (!character || !sprite) return;
    
    const targetScreen = gridToScreen(character.targetX, character.targetY);
    const targetX = targetScreen.x + this.gridOffsetX;
    const targetY = targetScreen.y + this.gridOffsetY - TILE_HEIGHT;
    
    const dx = targetX - sprite.x;
    const dy = targetY - sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 2) {
      // Arrived
      character.gridX = character.targetX;
      character.gridY = character.targetY;
      character.state = CharacterState.Idle;
      sprite.setPosition(targetX, targetY);
    } else {
      // Move towards target
      const speed = (CHARACTER_SPEED * delta) / 1000;
      sprite.x += (dx / dist) * speed;
      sprite.y += (dy / dist) * speed;
      
      // Update depth as character moves
      const currentGrid = screenToGrid(
        sprite.x - this.gridOffsetX,
        sprite.y - this.gridOffsetY + TILE_HEIGHT
      );
      sprite.setDepth(calculateDepth(currentGrid.x, currentGrid.y, DEPTH_LAYERS.CHARACTER));
    }
  }
  
  // Public methods for React integration
  
  getBuildings(): PlacedBuilding[] {
    return Array.from(this.buildings.values());
  }
  
  getBuilding(id: string): PlacedBuilding | undefined {
    return this.buildings.get(id);
  }
  
  getCharacters(): CampusCharacter[] {
    return Array.from(this.characters.values());
  }
  
  selectBuilding(id: string | null) {
    this.selectedBuilding = id;
    this.updateSelectionHighlight();
  }
  
  moveCharacterTo(id: string, gridX: number, gridY: number) {
    const character = this.characters.get(id);
    if (character) {
      character.targetX = gridX;
      character.targetY = gridY;
      character.state = CharacterState.Walking;
    }
  }
  
  centerOnBuilding(id: string) {
    const building = this.buildings.get(id);
    if (building) {
      const screen = gridToScreen(building.gridX, building.gridY);
      this.cameras.main.centerOn(
        screen.x + this.gridOffsetX,
        screen.y + this.gridOffsetY
      );
    }
  }
  
  clearCharacters() {
    this.characterSprites.forEach(sprite => sprite.destroy());
    this.characterSprites.clear();
    this.characters.clear();
  }
}
