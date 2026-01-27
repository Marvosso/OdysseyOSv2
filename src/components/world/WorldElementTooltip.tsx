'use client';

/**
 * World Element Tooltip Component
 * 
 * Shows a tooltip with linked world elements on hover
 */

import { useState } from 'react';
import { Globe, MapPin, Users, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { WorldElement } from '@/types/world';

interface WorldElementTooltipProps {
  elements: WorldElement[];
  children: React.ReactNode;
  className?: string;
}

export default function WorldElementTooltip({ elements, children, className = '' }: WorldElementTooltipProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);

  if (elements.length === 0) {
    return <>{children}</>;
  }

  const getElementIcon = (type: WorldElement['type']) => {
    switch (type) {
      case 'location':
        return <MapPin className="w-3 h-3" />;
      case 'culture':
        return <Users className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const handleNavigateToWorld = () => {
    router.push('/dashboard/world');
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
          <div className="text-xs font-semibold text-gray-400 mb-2">Linked World Elements</div>
          <div className="space-y-1">
            {elements.map((element) => (
              <button
                key={element.id}
                onClick={handleNavigateToWorld}
                className="w-full text-left text-xs px-2 py-1 bg-gray-700/50 hover:bg-gray-700 rounded flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                {getElementIcon(element.type)}
                <span className="flex-1 truncate">{element.name}</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
