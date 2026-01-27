import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MapPin, Crown, Clock, Save, X, Link2, ExternalLink, FileText, Users, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { WorldElement } from '@/types/world';
import { getLinkableItems, linkWorldElement, unlinkWorldElement, getLinkedScenes, getLinkedCharacters, isLinked } from '@/lib/world/worldLinker';
import type { LinkableItem } from '@/lib/world/worldLinker';
import type { Scene, Character } from '@/types/story';

let worldCounter = 0;

export default function WorldBuilder({ story, onUpdate }: { story: any; onUpdate: (world: WorldElement[]) => void }) {
  const router = useRouter();
  const [elements, setElements] = useState<WorldElement[]>(
    (story?.worldElements || []).map((el: any) => ({
      ...el,
      relatedScenes: el.relatedScenes || [],
      relatedCharacters: el.relatedCharacters || [],
      connections: el.connections || [],
      rules: el.rules || [],
      consistencyNotes: el.consistencyNotes || [],
    }))
  );
  const [selectedElement, setSelectedElement] = useState<WorldElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<WorldElement>>({});
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkableItems, setLinkableItems] = useState<{ scenes: LinkableItem[]; characters: LinkableItem[] }>({
    scenes: [],
    characters: [],
  });

  // Load linkable items
  useEffect(() => {
    const items = getLinkableItems();
    setLinkableItems(items);
  }, []);

  const handleAddElement = (type: WorldElement['type']) => {
    const newId = `world-${worldCounter++}`;
    const newElement: WorldElement = {
      id: newId,
      name: '',
      type,
      description: '',
      rules: [],
      connections: [],
      relatedScenes: [],
      relatedCharacters: [],
      consistencyNotes: [],
    };
    setSelectedElement(newElement);
    setEditForm(newElement);
    setIsEditing(true);
  };

  const handleToggleLink = (itemId: string, itemType: 'scene' | 'character') => {
    if (!editForm.id) return;

    const currentElement = elements.find(e => e.id === editForm.id) || editForm as WorldElement;
    const isCurrentlyLinked = isLinked(currentElement, itemId, itemType);
    const updatedElement = isCurrentlyLinked
      ? unlinkWorldElement(currentElement, itemId, itemType)
      : linkWorldElement(currentElement, [itemId], itemType);

    // Update edit form
    setEditForm({
      ...editForm,
      relatedScenes: updatedElement.relatedScenes,
      relatedCharacters: updatedElement.relatedCharacters,
    });

    // Update elements list
    const updated = elements.map(e => e.id === updatedElement.id ? updatedElement : e);
    setElements(updated);
    onUpdate(updated);
  };

  const handleNavigateToItem = (itemId: string, itemType: 'scene' | 'character') => {
    if (itemType === 'scene') {
      router.push('/dashboard');
      // TODO: Scroll to scene or highlight it
    } else {
      router.push('/dashboard/characters');
    }
  };

  const handleSaveElement = () => {
    if (!editForm.name?.trim()) return;

    const newElement: WorldElement = {
      id: editForm.id || `world-${worldCounter++}`,
      name: editForm.name || '',
      type: editForm.type || 'location',
      description: editForm.description || '',
      rules: editForm.rules || [],
      connections: editForm.connections || [],
      relatedScenes: editForm.relatedScenes || [],
      relatedCharacters: editForm.relatedCharacters || [],
      consistencyNotes: editForm.consistencyNotes || [],
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

  const handleAddRule = () => {
    if (!editForm.rules) setEditForm({ ...editForm, rules: [''] });
    else setEditForm({ ...editForm, rules: [...(editForm.rules || []), ''] });
  };

  const handleUpdateRule = (index: number, value: string) => {
    const newRules = [...(editForm.rules || [])];
    newRules[index] = value;
    setEditForm({ ...editForm, rules: newRules });
  };

  const icons: Record<WorldElement['type'], typeof MapPin> = {
    location: MapPin,
    culture: Globe,
    'magic-system': Crown,
    technology: Clock,
    politics: Crown,
    economy: Globe,
    religion: Clock,
  };

  const typeColors: Record<WorldElement['type'], string> = {
    location: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    culture: 'bg-green-500/20 text-green-300 border-green-500/30',
    'magic-system': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    technology: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    politics: 'bg-red-500/20 text-red-300 border-red-500/30',
    economy: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    religion: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
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

        {editForm.rules && editForm.rules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Rules</label>
              <button
                onClick={handleAddRule}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                + Add Rule
              </button>
            </div>
            {editForm.rules.map((rule, index) => (
              <input
                key={index}
                type="text"
                value={rule}
                onChange={(e) => handleUpdateRule(index, e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                placeholder="Rule..."
              />
            ))}
          </div>
        )}

        {/* Linking Section */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Links
            </label>
            <button
              onClick={() => setShowLinkPanel(!showLinkPanel)}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              {showLinkPanel ? 'Hide' : 'Show'} Link Manager
            </button>
          </div>

          {/* Quick Link Display */}
          {editForm.id && (
            <div className="space-y-2">
              {(editForm.relatedScenes && editForm.relatedScenes.length > 0) && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Linked Scenes</div>
                  <div className="flex flex-wrap gap-1">
                    {getLinkedScenes(editForm as WorldElement).map((scene: Scene) => (
                      <button
                        key={scene.id}
                        onClick={() => handleNavigateToItem(scene.id, 'scene')}
                        className="text-xs px-2 py-1 bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded hover:bg-blue-900/50 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        {scene.title || 'Untitled Scene'}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(editForm.relatedCharacters && editForm.relatedCharacters.length > 0) && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Linked Characters</div>
                  <div className="flex flex-wrap gap-1">
                    {getLinkedCharacters(editForm as WorldElement).map((character: Character) => (
                      <button
                        key={character.id}
                        onClick={() => handleNavigateToItem(character.id, 'character')}
                        className="text-xs px-2 py-1 bg-green-900/30 border border-green-700/50 text-green-300 rounded hover:bg-green-900/50 flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        {character.name}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Link Manager Panel */}
          {showLinkPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 max-h-64 overflow-y-auto"
            >
              {/* Link to Scenes */}
              {linkableItems.scenes.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Scenes
                  </div>
                  <div className="space-y-1">
                    {linkableItems.scenes.map(scene => {
                      const currentElement = editForm.id ? (elements.find(e => e.id === editForm.id) || editForm as WorldElement) : null;
                      const linked = currentElement ? isLinked(currentElement, scene.id, 'scene') : false;
                      return (
                        <label
                          key={scene.id}
                          className="flex items-center gap-2 p-2 bg-gray-700/50 rounded hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={linked}
                            onChange={() => handleToggleLink(scene.id, 'scene')}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-300 flex-1">{scene.name}</span>
                          {linked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToItem(scene.id, 'scene');
                              }}
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Link to Characters */}
              {linkableItems.characters.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Characters
                  </div>
                  <div className="space-y-1">
                    {linkableItems.characters.map(character => {
                      const currentElement = editForm.id ? (elements.find(e => e.id === editForm.id) || editForm as WorldElement) : null;
                      const linked = currentElement ? isLinked(currentElement, character.id, 'character') : false;
                      return (
                        <label
                          key={character.id}
                          className="flex items-center gap-2 p-2 bg-gray-700/50 rounded hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={linked}
                            onChange={() => handleToggleLink(character.id, 'character')}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-300 flex-1">{character.name}</span>
                          {linked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToItem(character.id, 'character');
                              }}
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {linkableItems.scenes.length === 0 && linkableItems.characters.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-4">
                  No scenes or characters available to link
                </div>
              )}
            </motion.div>
          )}
        </div>

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
        {(['location', 'culture', 'magic-system', 'technology', 'politics', 'economy', 'religion'] as WorldElement['type'][]).map((type) => {
          const Icon = icons[type];
          return (
            <button
              key={type}
              onClick={() => handleAddElement(type)}
              className="flex items-center gap-2 p-3 bg-gray-800/50 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 capitalize">{type.replace('-', ' ')}</span>
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
                      {element.rules && element.rules.length > 0 && (
                        <span className="text-xs text-gray-500 mt-1">{element.rules.length} rules</span>
                      )}
                      {(element.relatedScenes?.length > 0 || element.relatedCharacters?.length > 0) && (
                        <div className="flex items-center gap-2 mt-1">
                          {element.relatedScenes?.length > 0 && (
                            <span className="text-xs text-blue-400 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {element.relatedScenes.length}
                            </span>
                          )}
                          {element.relatedCharacters?.length > 0 && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {element.relatedCharacters.length}
                            </span>
                          )}
                        </div>
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
            {selectedElement.rules && selectedElement.rules.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-semibold text-gray-400 mb-2">Rules</h5>
                <ul className="space-y-1">
                  {selectedElement.rules.map((rule, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Linked Items Display */}
            {(selectedElement.relatedScenes?.length > 0 || selectedElement.relatedCharacters?.length > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-700/50">
                <h5 className="text-xs font-semibold text-gray-400 mb-2">Linked Items</h5>
                <div className="space-y-2">
                  {selectedElement.relatedScenes?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Scenes ({selectedElement.relatedScenes.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getLinkedScenes(selectedElement).map(scene => (
                          <button
                            key={scene.id}
                            onClick={() => handleNavigateToItem(scene.id, 'scene')}
                            className="text-xs px-2 py-1 bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded hover:bg-blue-900/50 flex items-center gap-1 transition-colors"
                          >
                            {scene.title || 'Untitled Scene'}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedElement.relatedCharacters?.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Characters ({selectedElement.relatedCharacters.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getLinkedCharacters(selectedElement).map(character => (
                          <button
                            key={character.id}
                            onClick={() => handleNavigateToItem(character.id, 'character')}
                            className="text-xs px-2 py-1 bg-green-900/30 border border-green-700/50 text-green-300 rounded hover:bg-green-900/50 flex items-center gap-1 transition-colors"
                          >
                            {character.name}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
