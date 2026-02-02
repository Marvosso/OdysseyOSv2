'use client';

/**
 * World Map Component
 * 
 * SVG-based interactive map showing:
 * - Locations from World tab
 * - Scene-linked locations
 * - Character movement
 * - Timeline slider for story progression
 * - Battle/event markers
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Users,
  Swords,
  Calendar,
  Plus,
  X,
  Link2,
  Route,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
} from 'lucide-react';
import RouteSuggestions from './RouteSuggestions';
import type { Story, Scene, Character } from '@/types/story';
import type { WorldElement } from '@/types/world';
import {
  MapStorage,
  type MapLocation,
  type CharacterPosition,
  type MapRoute,
  type MapEvent,
} from '@/lib/world/mapStorage';
import { getAllWorldElements } from '@/lib/world/worldLinkHelper';

interface WorldMapProps {
  story: Story;
  onLocationClick?: (locationId: string) => void;
  onSceneClick?: (sceneId: string) => void;
}

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export default function WorldMap({ story, onLocationClick, onSceneClick }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<ReturnType<typeof MapStorage.loadMapData>>(() =>
    MapStorage.loadMapData()
  );
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
  const [zoom, setZoom] = useState(1);
  const [timelinePosition, setTimelinePosition] = useState(1); // 0-1, represents story progress
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationPos, setNewLocationPos] = useState<{ x: number; y: number } | null>(null);
  const [isPlacingLocation, setIsPlacingLocation] = useState(false);

  const worldElements = useMemo(() => getAllWorldElements(), []);

  // Auto-detect and place locations
  useEffect(() => {
    const autoLocations = MapStorage.autoDetectLocations(story.scenes, worldElements);
    if (autoLocations.length > 0) {
      const currentData = MapStorage.loadMapData();
      const newLocations = [...currentData.locations];
      
      autoLocations.forEach((autoLoc) => {
        if (!newLocations.find((l) => l.elementId === autoLoc.elementId)) {
          newLocations.push(autoLoc);
          MapStorage.saveLocation(autoLoc);
        }
      });
      
      setMapData((prev) => ({
        ...prev,
        locations: newLocations,
      }));
    }
  }, [story.scenes, worldElements]);

  // Update character positions from scenes
  useEffect(() => {
    const positions: CharacterPosition[] = [];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    story.scenes.forEach((scene, index) => {
      if (scene.location) {
        const location = mapData.locations.find(
          (l) => l.name.toLowerCase() === scene.location?.toLowerCase()
        );

        if (location) {
          // Get characters in this scene
          const sceneText = scene.content.toLowerCase();
          story.characters.forEach((char, charIndex) => {
            if (sceneText.includes(char.name.toLowerCase())) {
              positions.push({
                characterId: char.id,
                characterName: char.name,
                locationId: location.id,
                sceneId: scene.id,
                timestamp: index / story.scenes.length,
                color: colors[charIndex % colors.length],
              });
            }
          });
        }
      }
    });

    positions.forEach((pos) => MapStorage.saveCharacterPosition(pos));
    setMapData((prev) => ({
      ...prev,
      characterPositions: positions,
    }));
  }, [story, mapData.locations]);

  // Get visible elements at current timeline position
  const visibleElements = useMemo(() => {
    const currentTimestamp = timelinePosition;
    const maxTimestamp = currentTimestamp;

    return {
      locations: mapData.locations,
      routes: mapData.routes,
      characterPositions: mapData.characterPositions.filter((p) => p.timestamp <= maxTimestamp),
      events: mapData.events.filter((e) => e.timestamp <= maxTimestamp),
    };
  }, [mapData, timelinePosition]);

  // Handle SVG pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - viewBox.x,
        y: e.clientY - viewBox.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setViewBox({
        ...viewBox,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    setZoom(newZoom);
    setViewBox({
      ...viewBox,
      width: MAP_WIDTH / newZoom,
      height: MAP_HEIGHT / newZoom,
    });
  };

  // Handle location placement
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPlacingLocation) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / zoom + viewBox.x;
        const y = (e.clientY - rect.top) / zoom + viewBox.y;
        setNewLocationPos({ x, y });
        setShowAddLocation(true);
      }
    }
  };

  // Add new location
  const handleAddLocation = (name: string, elementId?: string) => {
    if (newLocationPos) {
      const location: MapLocation = {
        id: `map-loc-${Date.now()}`,
        elementId: elementId || '',
        name,
        position: newLocationPos,
        type: 'location',
        linkedScenes: [],
      };

      MapStorage.saveLocation(location);
      setMapData((prev) => ({
        ...prev,
        locations: [...prev.locations, location],
      }));
      setShowAddLocation(false);
      setNewLocationPos(null);
      setIsPlacingLocation(false);
    }
  };

  // Calculate route distance
  const calculateRouteDistance = (route: MapRoute): number => {
    const from = mapData.locations.find((l) => l.id === route.fromLocationId);
    const to = mapData.locations.find((l) => l.id === route.toLocationId);
    
    if (from && to) {
      return MapStorage.calculateDistance(from, to);
    }
    return route.distance;
  };

  return (
    <div className="space-y-4">
      {/* Route Suggestions */}
      <RouteSuggestions
        locations={mapData.locations}
        onRouteCreate={(route) => {
          MapStorage.saveRoute(route);
          setMapData((prev) => ({
            ...prev,
            routes: [...prev.routes, route],
          }));
        }}
      />

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlacingLocation(!isPlacingLocation)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              isPlacingLocation
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Place Location
          </button>
          <button
            onClick={() => handleZoom(ZOOM_STEP)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-ZOOM_STEP)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setViewBox({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
              setZoom(1);
            }}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={timelinePosition}
            onChange={(e) => setTimelinePosition(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-400 w-20 text-right">
            {Math.round(timelinePosition * 100)}%
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="600px"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleMapClick}
          className="cursor-move"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6b 100%)' }}
        >
          {/* Routes */}
          {visibleElements.routes.map((route) => {
            const from = visibleElements.locations.find((l) => l.id === route.fromLocationId);
            const to = visibleElements.locations.find((l) => l.id === route.toLocationId);
            
            if (!from || !to) return null;

            return (
              <line
                key={route.id}
                x1={from.position.x}
                y1={from.position.y}
                x2={to.position.x}
                y2={to.position.y}
                stroke="#6B7280"
                strokeWidth="2"
                strokeDasharray={route.type === 'path' ? '5,5' : '0'}
                opacity={selectedRoute === route.id ? 1 : 0.5}
                className="cursor-pointer"
                onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
              />
            );
          })}

          {/* Locations */}
          {visibleElements.locations.map((location) => {
            const isSelected = selectedLocation === location.id;
            const linkedScenes = location.linkedScenes.length;
            const hasEvents = visibleElements.events.some((e) => e.locationId === location.id);

            return (
              <g key={location.id}>
                {/* Location Pin */}
                <circle
                  cx={location.position.x}
                  cy={location.position.y}
                  r={isSelected ? 12 : 8}
                  fill={hasEvents ? '#EF4444' : '#3B82F6'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedLocation(isSelected ? null : location.id);
                    onLocationClick?.(location.id);
                  }}
                />
                {/* Location Label */}
                <text
                  x={location.position.x}
                  y={location.position.y - 15}
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {location.name}
                </text>
                {/* Scene count badge */}
                {linkedScenes > 0 && (
                  <>
                    <circle
                      cx={location.position.x + 10}
                      cy={location.position.y - 10}
                      r="8"
                      fill="#8B5CF6"
                      className="pointer-events-none"
                    />
                    <text
                      x={location.position.x + 10}
                      y={location.position.y - 7}
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {linkedScenes}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Character Positions */}
          {visibleElements.characterPositions.map((position, index) => {
            const location = visibleElements.locations.find((l) => l.id === position.locationId);
            if (!location) return null;

            return (
              <g key={`${position.characterId}-${position.sceneId}`}>
                <circle
                  cx={location.position.x + (index % 3) * 8 - 8}
                  cy={location.position.y + Math.floor(index / 3) * 8 - 8}
                  r="5"
                  fill={position.color || '#10B981'}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  className="pointer-events-none"
                />
                <text
                  x={location.position.x + (index % 3) * 8 - 8}
                  y={location.position.y + Math.floor(index / 3) * 8 - 20}
                  fill="#FFFFFF"
                  fontSize="10"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {position.characterName.charAt(0)}
                </text>
              </g>
            );
          })}

          {/* Event Markers */}
          {visibleElements.events.map((event) => {
            const location = visibleElements.locations.find((l) => l.id === event.locationId);
            if (!location) return null;

            const iconMap = {
              battle: '⚔️',
              meeting: '👥',
              discovery: '🔍',
              death: '💀',
              other: '📍',
            };

            return (
              <g key={event.id}>
                <circle
                  cx={location.position.x}
                  cy={location.position.y + 20}
                  r="10"
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => onSceneClick?.(event.sceneId)}
                />
                <text
                  x={location.position.x}
                  y={location.position.y + 25}
                  fontSize="12"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {iconMap[event.type]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Location Details Panel */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-80 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl"
            >
              {(() => {
                const location = mapData.locations.find((l) => l.id === selectedLocation);
                if (!location) return null;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">{location.name}</h3>
                      <button
                        onClick={() => setSelectedLocation(null)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    {location.description && (
                      <p className="text-sm text-gray-300">{location.description}</p>
                    )}
                    <div className="text-sm text-gray-400">
                      <div>Type: {location.type}</div>
                      <div>Linked Scenes: {location.linkedScenes.length}</div>
                      <div>
                        Position: ({Math.round(location.position.x)}, {Math.round(location.position.y)})
                      </div>
                    </div>
                    {location.linkedScenes.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Linked Scenes:</div>
                        <div className="space-y-1">
                          {location.linkedScenes.map((sceneId) => {
                            const scene = story.scenes.find((s) => s.id === sceneId);
                            return (
                              <button
                                key={sceneId}
                                onClick={() => onSceneClick?.(sceneId)}
                                className="block w-full text-left px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
                              >
                                {scene?.title || `Scene ${sceneId.slice(0, 8)}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Location Dialog */}
        <AnimatePresence>
          {showAddLocation && newLocationPos && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => {
                setShowAddLocation(false);
                setNewLocationPos(null);
                setIsPlacingLocation(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-80"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-white font-semibold mb-3">Add Location</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Location Name</label>
                    <input
                      type="text"
                      id="location-name"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter location name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            handleAddLocation(input.value.trim());
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const input = document.getElementById('location-name') as HTMLInputElement;
                        if (input?.value.trim()) {
                          handleAddLocation(input.value.trim());
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddLocation(false);
                        setNewLocationPos(null);
                        setIsPlacingLocation(false);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
