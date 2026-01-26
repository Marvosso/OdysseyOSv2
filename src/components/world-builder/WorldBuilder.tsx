import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MapPin, Crown, Clock, Save, X } from 'lucide-react';

interface WorldElement {
  id: string;
  name: string;
  type: 'location' | 'culture' | 'rule' | 'event';
  description: string;
  details: string[];
  imageUrl?: string;
}

let worldCounter = 0;

export default function WorldBuilder({ story, onUpdate }: { story: any; onUpdate: (world: WorldElement[]) => void }) {
  const [elements, setElements] = useState<WorldElement[]>(
    story?.worldElements || []
  );
  const [selectedElement, setSelectedElement] = useState<WorldElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<WorldElement>>({});

  const handleAddElement = (type: WorldElement['type']) => {
    const newId = `world-${worldCounter++}`;
    const newElement: WorldElement = {
      id: newId,
      name: '',
      type,
      description: '',
      details: [],
    };
    setSelectedElement(newElement);
    setEditForm(newElement);
    setIsEditing(true);
  };

  const handleSaveElement = () => {
    if (!editForm.name?.trim()) return;

    const newElement: WorldElement = {
      id: editForm.id || `world-${worldCounter++}`,
      name: editForm.name || '',
      type: editForm.type || 'location',
      description: editForm.description || '',
      details: editForm.details || [],
      imageUrl: editForm.imageUrl,
    };

    const updated = elements.some(e => e.id === newElement.id)
      ? elements.map(e => e.id === newElement.id ? newElement : e)
      : [...elements, newElement];

    setElements(updated);
    onUpdate(updated);
    setIsEditing(false);
    setSelectedElement(null);
    setEditForm({});
  };

  const handleDeleteElement = (id: string) => {
    const updated = elements.filter(e => e.id !== id);
    setElements(updated);
    onUpdate(updated);
    if (selectedElement?.id === id) {
      setSelectedElement(null);
      setIsEditing(false);
    }
  };

  const handleAddDetail = () => {
    if (!editForm.details) setEditForm({ ...editForm, details: [''] });
    else setEditForm({ ...editForm, details: [...editForm.details, ''] });
  };

  const handleUpdateDetail = (index: number, value: string) => {
    const newDetails = [...(editForm.details || [])];
    newDetails[index] = value;
    setEditForm({ ...editForm, details: newDetails });
  };

  const icons = {
    location: MapPin,
    culture: Globe,
    rule: Crown,
    event: Clock,
  };

  const typeColors = {
    location: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    culture: 'bg-green-500/20 text-green-300 border-green-500/30',
    rule: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    event: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  if (isEditing && editForm) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800/50 rounded-lg p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Edit World Element</h3>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">Name</label>
          <input
            type="text"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Element name..."
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">Description</label>
          <textarea
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
            placeholder="Describe this element..."
          />
        </div>

        {editForm.details && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Details</label>
              <button
                onClick={handleAddDetail}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                + Add Detail
              </button>
            </div>
            {editForm.details.map((detail) => (
              <input
                key={detail}
                type="text"
                value={detail}
                onChange={(e) => handleUpdateDetail(editForm.details?.indexOf(detail) ?? 0, e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                placeholder="Detail..."
              />
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSaveElement}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Element
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          World Building
        </h3>
        <span className="text-sm text-gray-400">{elements.length} elements</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['location', 'culture', 'rule', 'event'] as const).map((type) => {
          const Icon = icons[type];
          return (
            <button
              key={type}
              onClick={() => handleAddElement(type)}
              className="flex items-center gap-2 p-3 bg-gray-800/50 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 capitalize">{type}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {elements.map((element) => {
            const Icon = icons[element.type];
            return (
              <motion.div
                key={element.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => setSelectedElement(element)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedElement?.id === element.id
                    ? typeColors[element.type]
                    : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white text-sm">{element.name}</h4>
                      {element.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{element.description}</p>
                      )}
                      {element.details && element.details.length > 0 && (
                        <span className="text-xs text-gray-500 mt-1">{element.details.length} details</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteElement(element.id);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedElement && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg ${typeColors[selectedElement.type]}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-white">{selectedElement.name}</h4>
              <button
                onClick={() => setSelectedElement(null)}
                className="p-1 hover:bg-black/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedElement.description && (
              <p className="text-sm text-gray-300 mb-3">{selectedElement.description}</p>
            )}
            {selectedElement.details && selectedElement.details.length > 0 && (
              <ul className="space-y-1">
                {selectedElement.details.map((detail) => (
                  <li key={detail} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-xs mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {elements.length === 0 && (
        <div className="p-6 bg-gray-800/50 rounded-lg text-center">
          <Globe className="w-12 h-12 mx-auto text-gray-600 mb-2" />
          <p className="text-gray-400 text-sm">Start building your world</p>
        </div>
      )}
    </div>
  );
}
