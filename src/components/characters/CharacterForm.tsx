'use client';

import { useState } from 'react';
import { X, Save, User, Crown, Shield, Heart, BookOpen, Sparkles, AlertCircle } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'mentor' | 'love-interest' | 'comic-relief' | 'other';
  age: number;
  appearance: string;
  personality: string;
  background: string;
  motivation: string;
  flaw: string;
  arcStatus: 'unstarted' | 'beginning' | 'middle' | 'complete';
}

interface CharacterFormProps {
  character: Character;
  onSave: (char: Character) => void;
  onCancel: () => void;
}

export default function CharacterForm({ character, onSave, onCancel }: CharacterFormProps) {
  const [formData, setFormData] = useState<Character>(character);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const roleIcons = {
    protagonist: Crown,
    antagonist: AlertCircle,
    supporting: User,
    mentor: BookOpen,
    'love-interest': Heart,
    'comic-relief': Sparkles,
    other: User,
  };

  const RoleIcon = roleIcons[formData.role] || User;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-600 rounded-lg">
          <RoleIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          {formData.id ? 'Edit Character' : 'New Character'}
        </h3>
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Name</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Character name..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as Character['role'] })}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        >
          <option value="">Select role...</option>
          <option value="protagonist">Protagonist</option>
          <option value="antagonist">Antagonist</option>
          <option value="supporting">Supporting Character</option>
          <option value="mentor">Mentor</option>
          <option value="love-interest">Love Interest</option>
          <option value="comic-relief">Comic Relief</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Age</label>
        <input
          type="number"
          value={formData.age || ''}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
          placeholder="Age..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Appearance</label>
        <textarea
          value={formData.appearance || ''}
          onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
          placeholder="Physical description, clothing, distinguishing features..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Personality</label>
        <textarea
          value={formData.personality || ''}
          onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
          placeholder="Traits, quirks, mannerisms, values..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Background</label>
        <textarea
          value={formData.background || ''}
          onChange={(e) => setFormData({ ...formData, background: e.target.value })}
          placeholder="History, family, upbringing, past experiences..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Motivation</label>
        <textarea
          value={formData.motivation || ''}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder="What do they want? Why do they want it?"
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Flaw</label>
        <textarea
          value={formData.flaw || ''}
          onChange={(e) => setFormData({ ...formData, flaw: e.target.value })}
          placeholder="Internal obstacle, weakness, blind spot..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Arc Status</label>
        <select
          value={formData.arcStatus}
          onChange={(e) => setFormData({ ...formData, arcStatus: e.target.value as Character['arcStatus'] })}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="unstarted">Unstarted</option>
          <option value="beginning">Beginning of Arc</option>
          <option value="middle">Mid-Arc Development</option>
          <option value="complete">Arc Complete</option>
        </select>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
