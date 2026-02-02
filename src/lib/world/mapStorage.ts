/**
 * Map Storage
 * 
 * Manages world map data, locations, routes, and character positions
 */

import type { WorldElement } from '@/types/world';
import type { Scene, Character } from '@/types/story';

const STORAGE_KEYS = {
  MAP_DATA: 'odysseyos_map_data',
  LOCATION_POSITIONS: 'odysseyos_location_positions',
  CHARACTER_POSITIONS: 'odysseyos_character_positions',
  ROUTES: 'odysseyos_routes',
  EVENTS: 'odysseyos_map_events',
};

export interface MapLocation {
  id: string;
  elementId: string;
  name: string;
  position: { x: number; y: number };
  type: 'location' | 'city' | 'landmark' | 'region';
  linkedScenes: string[];
  description?: string;
}

export interface CharacterPosition {
  characterId: string;
  characterName: string;
  locationId: string;
  sceneId: string;
  timestamp: number; // Scene position in story
  color?: string;
}

export interface MapRoute {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  distance: number; // In map units
  travelTime?: number; // In days/hours
  type: 'road' | 'path' | 'sea' | 'air';
  waypoints?: Array<{ x: number; y: number }>;
}

export interface MapEvent {
  id: string;
  type: 'battle' | 'meeting' | 'discovery' | 'death' | 'other';
  locationId: string;
  sceneId: string;
  timestamp: number;
  title: string;
  description?: string;
  participants?: string[]; // Character IDs
}

export interface MapData {
  locations: MapLocation[];
  routes: MapRoute[];
  events: MapEvent[];
  characterPositions: CharacterPosition[];
  lastUpdated: Date;
}

export class MapStorage {
  /**
   * Save map data
   */
  static saveMapData(data: MapData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MAP_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving map data:', error);
    }
  }

  /**
   * Load map data
   */
  static loadMapData(): MapData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MAP_DATA);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    }

    return {
      locations: [],
      routes: [],
      events: [],
      characterPositions: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Add or update location
   */
  static saveLocation(location: MapLocation): void {
    const data = this.loadMapData();
    const index = data.locations.findIndex((l) => l.id === location.id);
    
    if (index >= 0) {
      data.locations[index] = location;
    } else {
      data.locations.push(location);
    }
    
    data.lastUpdated = new Date();
    this.saveMapData(data);
  }

  /**
   * Remove location
   */
  static removeLocation(locationId: string): void {
    const data = this.loadMapData();
    data.locations = data.locations.filter((l) => l.id !== locationId);
    data.routes = data.routes.filter(
      (r) => r.fromLocationId !== locationId && r.toLocationId !== locationId
    );
    data.events = data.events.filter((e) => e.locationId !== locationId);
    data.lastUpdated = new Date();
    this.saveMapData(data);
  }

  /**
   * Add or update route
   */
  static saveRoute(route: MapRoute): void {
    const data = this.loadMapData();
    const index = data.routes.findIndex((r) => r.id === route.id);
    
    if (index >= 0) {
      data.routes[index] = route;
    } else {
      data.routes.push(route);
    }
    
    data.lastUpdated = new Date();
    this.saveMapData(data);
  }

  /**
   * Add or update character position
   */
  static saveCharacterPosition(position: CharacterPosition): void {
    const data = this.loadMapData();
    const index = data.characterPositions.findIndex(
      (p) => p.characterId === position.characterId && p.sceneId === position.sceneId
    );
    
    if (index >= 0) {
      data.characterPositions[index] = position;
    } else {
      data.characterPositions.push(position);
    }
    
    data.lastUpdated = new Date();
    this.saveMapData(data);
  }

  /**
   * Add or update event
   */
  static saveEvent(event: MapEvent): void {
    const data = this.loadMapData();
    const index = data.events.findIndex((e) => e.id === event.id);
    
    if (index >= 0) {
      data.events[index] = event;
    } else {
      data.events.push(event);
    }
    
    data.lastUpdated = new Date();
    this.saveMapData(data);
  }

  /**
   * Get character positions at a specific timestamp
   */
  static getCharacterPositionsAt(timestamp: number): CharacterPosition[] {
    const data = this.loadMapData();
    return data.characterPositions.filter((p) => p.timestamp <= timestamp);
  }

  /**
   * Get events at a specific timestamp
   */
  static getEventsAt(timestamp: number): MapEvent[] {
    const data = this.loadMapData();
    return data.events.filter((e) => e.timestamp <= timestamp);
  }

  /**
   * Calculate distance between two locations
   */
  static calculateDistance(location1: MapLocation, location2: MapLocation): number {
    const dx = location2.position.x - location1.position.x;
    const dy = location2.position.y - location1.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Find shortest route between two locations
   */
  static findRoute(fromLocationId: string, toLocationId: string): MapRoute[] {
    const data = this.loadMapData();
    const visited = new Set<string>();
    const queue: Array<{ locationId: string; path: MapRoute[] }> = [
      { locationId: fromLocationId, path: [] },
    ];

    while (queue.length > 0) {
      const { locationId, path } = queue.shift()!;

      if (locationId === toLocationId) {
        return path;
      }

      if (visited.has(locationId)) continue;
      visited.add(locationId);

      // Find all routes from this location
      const routes = data.routes.filter((r) => r.fromLocationId === locationId);
      
      for (const route of routes) {
        if (!visited.has(route.toLocationId)) {
          queue.push({
            locationId: route.toLocationId,
            path: [...path, route],
          });
        }
      }
    }

    return [];
  }

  /**
   * Auto-detect locations from scenes
   */
  static autoDetectLocations(
    scenes: Scene[],
    worldElements: WorldElement[]
  ): MapLocation[] {
    const locations: MapLocation[] = [];
    const locationElements = worldElements.filter((e) => e.type === 'location');

    scenes.forEach((scene) => {
      if (scene.location) {
        const element = locationElements.find(
          (e) => e.name.toLowerCase() === scene.location?.toLowerCase()
        );

        if (element) {
          const existing = locations.find((l) => l.elementId === element.id);
          if (existing) {
            if (!existing.linkedScenes.includes(scene.id)) {
              existing.linkedScenes.push(scene.id);
            }
          } else {
            // Auto-place at random position (user can adjust)
            locations.push({
              id: `map-loc-${element.id}`,
              elementId: element.id,
              name: element.name,
              position: {
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100,
              },
              type: 'location',
              linkedScenes: [scene.id],
              description: element.description,
            });
          }
        }
      }
    });

    return locations;
  }
}
