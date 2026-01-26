import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Send, FileText, Clock } from 'lucide-react';

export default function PublishingHub(_story: any) {
  const [activeTab, setActiveTab] = useState<'drafts' | 'published' | 'submissions'>('drafts');
  const [drafts, setDrafts] = useState([
    {
      id: '1',
      title: 'Chapter 1 - The Beginning',
      wordCount: 2500,
      lastEdited: new Date(),
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    outlet: '',
    guidelines: '',
    deadline: '',
  });

  const handlePublishDraft = (draftId: string) => {
    setDrafts(prev => prev.filter((d: any) => d.id !== draftId));
  };

  const handleSubmitStory = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionForm({ outlet: '', guidelines: '', deadline: '' });
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-gray-800/50 rounded-lg p-1">
        {['drafts', 'published', 'submissions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'drafts' && (
        <div className="space-y-2">
          {drafts.map((draft: any) => (
            <motion.div
              key={draft.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <h4 className="font-medium text-white text-sm">{draft.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{draft.wordCount} words</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{draft.lastEdited.toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePublishDraft(draft.id)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full"
                >
                  Publish
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'published' && (
        <div className="p-6 bg-gray-800/50 rounded-lg text-center">
          <Globe className="w-12 h-12 mx-auto text-purple-400 mb-2" />
          <h4 className="font-medium text-white mb-1">No published works yet</h4>
          <p className="text-sm text-gray-400">Publish your draft to share it with readers</p>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <h4 className="font-medium text-white mb-3">New Submission</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Magazine/Journal name..."
                value={submissionForm.outlet}
                onChange={(e) => setSubmissionForm({ ...submissionForm, outlet: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Submission guidelines..."
                value={submissionForm.guidelines}
                onChange={(e) => setSubmissionForm({ ...submissionForm, guidelines: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 h-20"
              />
              <input
                type="text"
                placeholder="Deadline..."
                value={submissionForm.deadline}
                onChange={(e) => setSubmissionForm({ ...submissionForm, deadline: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSubmitStory}
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
