'use client';

/**
 * Route Suggestions Component
 * 
 * Suggests travel routes between locations and calculates distances/travel times
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Route, Navigation, Clock, MapPin, X } from 'lucide-react';
import type { MapLocation, MapRoute } from '@/lib/world/mapStorage';
import { MapStorage } from '@/lib/world/mapStorage';

interface RouteSuggestionsProps {
  locations: MapLocation[];
  onRouteCreate?: (route: MapRoute) => void;
}

export default function RouteSuggestions({
  locations,
  onRouteCreate,
}: RouteSuggestionsProps) {
  const [fromLocation, setFromLocation] = useState<string | null>(null);
  const [toLocation, setToLocation] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculate suggested routes
  const suggestedRoutes = useMemo(() => {
    if (!fromLocation || !toLocation || fromLocation === toLocation) {
      return [];
    }

    const from = locations.find((l) => l.id === fromLocation);
    const to = locations.find((l) => l.id === toLocation);

    if (!from || !to) return [];

    // Direct route
    const directDistance = MapStorage.calculateDistance(from, to);
    const directRoute: MapRoute = {
      id: `route-${fromLocation}-${toLocation}`,
      fromLocationId: fromLocation,
      toLocationId: toLocation,
      distance: directDistance,
      travelTime: Math.ceil(directDistance / 50), // Assume 50 units per day
      type: 'road',
    };

    // Find existing routes
    const existingRoutes = MapStorage.findRoute(fromLocation, toLocation);
    
    // If there's an existing route, suggest it
    if (existingRoutes.length > 0) {
      const totalDistance = existingRoutes.reduce((sum, r) => sum + r.distance, 0);
      return [
        {
          ...directRoute,
          id: 'suggested-direct',
          description: 'Direct route',
        },
        {
          id: 'suggested-existing',
          fromLocationId: fromLocation,
          toLocationId: toLocation,
          distance: totalDistance,
          travelTime: existingRoutes.reduce((sum, r) => sum + (r.travelTime || 0), 0),
          type: 'road' as const,
          description: `Existing route (${existingRoutes.length} segments)`,
          waypoints: existingRoutes.map((r) => {
            const loc = locations.find((l) => l.id === r.toLocationId);
            return loc ? { x: loc.position.x, y: loc.position.y } : { x: 0, y: 0 };
          }),
        },
      ];
    }

    return [
      {
        ...directRoute,
        id: 'suggested-direct',
        description: 'Direct route',
      },
    ];
  }, [fromLocation, toLocation, locations]);

  const handleCreateRoute = (route: Omit<MapRoute, 'id'> & { id?: string; description?: string }) => {
    const newRoute: MapRoute = {
      id: route.id || `route-${Date.now()}`,
      fromLocationId: route.fromLocationId,
      toLocationId: route.toLocationId,
      distance: route.distance,
      travelTime: route.travelTime,
      type: route.type,
      waypoints: route.waypoints,
    };

    MapStorage.saveRoute(newRoute);
    onRouteCreate?.(newRoute);
    setFromLocation(null);
    setToLocation(null);
    setShowSuggestions(false);
  };

  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Route className="w-5 h-5 text-purple-400" />
          Route Suggestions
        </h3>
        {showSuggestions && (
          <button
            onClick={() => setShowSuggestions(false)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">From</label>
          <select
            value={fromLocation || ''}
            onChange={(e) => setFromLocation(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select location...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">To</label>
          <select
            value={toLocation || ''}
            onChange={(e) => setToLocation(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select location...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {fromLocation && toLocation && fromLocation !== toLocation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          {suggestedRoutes.map((route) => (
            <div
              key={route.id}
              className="p-3 bg-gray-700/50 rounded border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">
                    {(route as any).description || 'Route'}
                  </span>
                </div>
                <button
                  onClick={() => handleCreateRoute(route)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                >
                  Create Route
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {Math.round(route.distance)} units
                </div>
                {route.travelTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {route.travelTime} day{route.travelTime !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
