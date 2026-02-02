'use client';

/**
 * Consistency Panel Component
 * 
 * Displays real-time consistency warnings and suggestions
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  X,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  User,
  MapPin,
  Clock,
  Heart,
} from 'lucide-react';
import {
  generateConsistencyReport,
  checkCharacterConsistency,
  checkLocationContinuity,
  checkTimelineGaps,
  type ConsistencyIssue,
  type ConsistencyReport,
} from '@/lib/analysis/consistencyChecker';
import { StoryStorage } from '@/lib/storage/storyStorage';

interface ConsistencyPanelProps {
  storyId?: string;
  onIssueClick?: (issue: ConsistencyIssue) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function ConsistencyPanel({
  storyId,
  onIssueClick,
  autoRefresh = true,
  refreshInterval = 5000,
}: ConsistencyPanelProps) {
  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledgedIssues, setAcknowledgedIssues] = useState<Set<string>>(new Set());
  const [ignoredIssues, setIgnoredIssues] = useState<Set<string>>(new Set());
  const [showIgnored, setShowIgnored] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'character' | 'location' | 'timeline' | 'personality'>('all');

  // Load acknowledged/ignored issues from storage
  useEffect(() => {
    const savedAcknowledged = localStorage.getItem('odysseyos_acknowledged_issues');
    const savedIgnored = localStorage.getItem('odysseyos_ignored_issues');
    if (savedAcknowledged) {
      setAcknowledgedIssues(new Set(JSON.parse(savedAcknowledged)));
    }
    if (savedIgnored) {
      setIgnoredIssues(new Set(JSON.parse(savedIgnored)));
    }
  }, []);

  // Run consistency check
  const runCheck = useMemo(
    () => () => {
      setIsLoading(true);
      try {
        const newReport = generateConsistencyReport(storyId);
        setReport(newReport);
      } catch (error) {
        console.error('Error running consistency check:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [storyId]
  );

  // Initial check and auto-refresh
  useEffect(() => {
    runCheck();

    if (autoRefresh) {
      const interval = setInterval(runCheck, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [runCheck, autoRefresh, refreshInterval]);

  // Listen for storage changes to trigger refresh
  useEffect(() => {
    const handleStorageChange = () => {
      if (autoRefresh) {
        runCheck();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [autoRefresh, runCheck]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    if (!report) return [];

    return report.issues.filter((issue) => {
      // Filter by severity
      if (selectedFilter !== 'all' && issue.severity !== selectedFilter) {
        return false;
      }

      // Filter by type
      if (selectedType !== 'all' && issue.type !== selectedType) {
        return false;
      }

      // Filter ignored
      if (ignoredIssues.has(issue.id) && !showIgnored) {
        return false;
      }

      return true;
    });
  }, [report, selectedFilter, selectedType, ignoredIssues, showIgnored]);

  // Acknowledge issue
  const handleAcknowledge = (issueId: string) => {
    const newAcknowledged = new Set(acknowledgedIssues);
    newAcknowledged.add(issueId);
    setAcknowledgedIssues(newAcknowledged);
    localStorage.setItem('odysseyos_acknowledged_issues', JSON.stringify(Array.from(newAcknowledged)));
  };

  // Ignore issue
  const handleIgnore = (issueId: string) => {
    const newIgnored = new Set(ignoredIssues);
    newIgnored.add(issueId);
    setIgnoredIssues(newIgnored);
    localStorage.setItem('odysseyos_ignored_issues', JSON.stringify(Array.from(newIgnored)));
  };

  // Unignore issue
  const handleUnignore = (issueId: string) => {
    const newIgnored = new Set(ignoredIssues);
    newIgnored.delete(issueId);
    setIgnoredIssues(newIgnored);
    localStorage.setItem('odysseyos_ignored_issues', JSON.stringify(Array.from(newIgnored)));
  };

  // Export report
  const handleExport = () => {
    if (!report) return;

    const exportData = {
      ...report,
      issues: report.issues.map((issue) => ({
        ...issue,
        acknowledged: acknowledgedIssues.has(issue.id),
        ignored: ignoredIssues.has(issue.id),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consistency-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get icon for issue type
  const getTypeIcon = (type: ConsistencyIssue['type']) => {
    switch (type) {
      case 'character':
        return <User className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'timeline':
        return <Clock className="w-4 h-4" />;
      case 'personality':
        return <Heart className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: ConsistencyIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-900/20 border-red-500/30 text-red-200';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-200';
      case 'info':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-200';
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-300';
    }
  };

  if (!report) {
    return (
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mr-2" />
          <span className="text-gray-400">Analyzing consistency...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Consistency Checker
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {report.summary.total} issues found • {report.summary.errors} errors • {report.summary.warnings} warnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCheck}
            disabled={isLoading}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            title="Refresh analysis"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            title="Export report"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Severity:</label>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All</option>
            <option value="character">Character</option>
            <option value="location">Location</option>
            <option value="timeline">Timeline</option>
            <option value="personality">Personality</option>
          </select>
        </div>

        <button
          onClick={() => setShowIgnored(!showIgnored)}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
            showIgnored
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          {showIgnored ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showIgnored ? 'Hide' : 'Show'} Ignored
        </button>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No issues found!</p>
          <p className="text-sm text-gray-500 mt-1">Your story appears consistent.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {filteredIssues.map((issue) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)} ${
                  ignoredIssues.has(issue.id) ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(issue.type)}
                      <h4 className="font-semibold">{issue.title}</h4>
                      <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                        {issue.severity}
                      </span>
                      {acknowledgedIssues.has(issue.id) && (
                        <span className="px-2 py-0.5 bg-green-700/50 rounded text-xs text-green-300">
                          Acknowledged
                        </span>
                      )}
                      {ignoredIssues.has(issue.id) && (
                        <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                          Ignored
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-3">{issue.description}</p>

                    {/* Suggestions */}
                    {issue.suggestions.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-medium text-purple-300">Suggestions:</span>
                        </div>
                        <ul className="space-y-1">
                          {issue.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-purple-400 mt-0.5">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!acknowledgedIssues.has(issue.id) && (
                      <button
                        onClick={() => handleAcknowledge(issue.id)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Acknowledge"
                      >
                        <CheckCircle className="w-4 h-4 text-gray-400 hover:text-green-400" />
                      </button>
                    )}
                    {!ignoredIssues.has(issue.id) ? (
                      <button
                        onClick={() => handleIgnore(issue.id)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Ignore"
                      >
                        <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnignore(issue.id)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Unignore"
                      >
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                      </button>
                    )}
                    {onIssueClick && (
                      <button
                        onClick={() => onIssueClick(issue)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Go to issue"
                      >
                        <FileText className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
