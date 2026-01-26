import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, GitCompare, Clock, CheckCircle, AlertCircle, Send, Plus } from 'lucide-react';

interface Comment {
  id: string;
  sceneId: string;
  text: string;
  author: string;
  timestamp: Date;
}

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  createdBy: string;
}

export default function CollaborationHub({ story }: { story: any }) {
  const [activeTab, setActiveTab] = useState<'comments' | 'changes'>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedScene, setSelectedScene] = useState<string>('');

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedScene) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      sceneId: selectedScene,
      text: newComment,
      author: 'You',
      timestamp: new Date(),
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleAddChange = () => {
    const change: ChangeRequest = {
      id: `change-${Date.now()}`,
      title: 'Plot Revision Suggestion',
      description: 'Consider adjusting the climax to increase tension.',
      status: 'pending',
      createdAt: new Date(),
      createdBy: 'You',
    };
    setChanges([...changes, change]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Collaboration
        </h3>
        <span className="text-sm text-gray-400">Beta</span>
      </div>

      <div className="flex gap-2 bg-gray-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'comments' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('changes')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'changes' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          Changes ({changes.length})
        </button>
      </div>

      {activeTab === 'comments' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm text-gray-400 block mb-2">Add Comment</label>
            <select
              value={selectedScene}
              onChange={(e) => setSelectedScene(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Scene</option>
              {story?.scenes?.map((scene: any) => (
                <option key={scene.id} value={scene.id}>{scene.title}</option>
              ))}
            </select>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share feedback..."
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 h-20"
            />
            <button
              onClick={handleAddComment}
              className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Add Comment
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-400">Comments ({comments.length})</p>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white text-sm">{comment.author}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {comment.timestamp.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{comment.text}</p>
              </motion.div>
            ))}
          </div>

          {comments.length === 0 && (
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No comments yet</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'changes' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <button
            onClick={handleAddChange}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Change
          </button>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {changes.map((change) => (
              <motion.div
                key={change.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border ${
                  change.status === 'pending'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : change.status === 'approved'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white text-sm">{change.title}</h4>
                  {change.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                  {change.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {change.status === 'rejected' && <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
                <p className="text-sm text-gray-300 mb-2">{change.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>By {change.createdBy}</span>
                  <span className="capitalize">{change.status}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {changes.length === 0 && (
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <GitCompare className="w-12 h-12 mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No change requests</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
