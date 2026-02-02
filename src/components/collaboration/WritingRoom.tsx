'use client';

/**
 * Writing Room Component
 * 
 * Real-time collaborative writing interface with live cursors, chat, and version history
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  History,
  Download,
  Copy,
  Check,
  X,
  Send,
  User,
  GitBranch,
  RotateCcw,
  Share2,
  Settings,
} from 'lucide-react';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomById,
  updatePresence,
  applyOperation,
  getVersionHistory,
  rollbackToVersion,
  CollaborationWebSocket,
  type CollaborationRoom,
  type CollaborationUser,
  type CollaborationOperation,
  type PresenceUpdate,
} from '@/lib/collaboration/roomManager';
import { StoryStorage } from '@/lib/storage/storyStorage';
import type { Story, Scene } from '@/types/story';
import { computeWordCount } from '@/utils/wordCount';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  message: string;
  timestamp: Date;
}

interface WritingRoomProps {
  story: Story;
  userId: string;
  userName: string;
  onClose: () => void;
  onStoryUpdate?: (story: Story) => void;
}

export default function WritingRoom({
  story,
  userId,
  userName,
  onClose,
  onStoryUpdate,
}: WritingRoomProps) {
  const [room, setRoom] = useState<CollaborationRoom | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(story.scenes[0] || null);
  const [sceneContent, setSceneContent] = useState('');
  const [otherUsers, setOtherUsers] = useState<CollaborationUser[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Map<string, { userId: string; position: number; color: string }>>(new Map());
  const [versionHistory, setVersionHistory] = useState<CollaborationRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<CollaborationWebSocket | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize room
  useEffect(() => {
    const initializeRoom = async () => {
      // Try to find existing room for this story
      const existingRoom = getRoomById(`story-${story.id}`);
      
      if (existingRoom) {
        setRoom(existingRoom);
        setRoomCode(existingRoom.code);
        connectToRoom(existingRoom);
      } else {
        // Create new room
        const newRoom = createRoom(story, userId, userName);
        setRoom(newRoom);
        setRoomCode(newRoom.code);
        connectToRoom(newRoom);
      }
    };

    initializeRoom();

    return () => {
      if (room && wsRef.current) {
        leaveRoom(room.id, userId);
        wsRef.current.disconnect();
      }
    };
  }, []);

  // Connect to room via WebSocket
  const connectToRoom = (roomData: CollaborationRoom) => {
    if (!roomData) return;

    const ws = new CollaborationWebSocket(roomData.id, userId);
    wsRef.current = ws;

    // Listen for room updates
    ws.on('room:update', (updatedRoom: CollaborationRoom) => {
      setRoom(updatedRoom);
      setOtherUsers(updatedRoom.users.filter((u) => u.id !== userId));
      
      // Update selected scene if it exists
      const scene = updatedRoom.story.scenes.find((s) => s.id === selectedScene?.id);
      if (scene) {
        setSelectedScene(scene);
        setSceneContent(scene.content);
      }

      // Update cursor positions
      const cursors = new Map();
      updatedRoom.users.forEach((user) => {
        if (user.id !== userId && user.cursorPosition) {
          if (user.cursorPosition.sceneId === selectedScene?.id) {
            cursors.set(user.id, {
              userId: user.id,
              position: user.cursorPosition.offset,
              color: user.color,
            });
          }
        }
      });
      setCursorPositions(cursors);
    });

    // Listen for operations
    ws.on('operation:applied', (operation: CollaborationOperation) => {
      if (operation.sceneId === selectedScene?.id) {
        // Scene was updated, refresh content
        const updatedRoom = getRoomById(roomData.id);
        if (updatedRoom) {
          const scene = updatedRoom.story.scenes.find((s) => s.id === selectedScene.id);
          if (scene) {
            setSceneContent(scene.content);
          }
        }
      }
    });

    // Listen for chat messages
    ws.on('chat:message', (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    setIsConnected(true);
  };

  // Join room by code
  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;

    setIsJoining(true);
    const joinedRoom = joinRoom(roomCode.toUpperCase(), userId, userName);
    
    if (joinedRoom) {
      setRoom(joinedRoom);
      connectToRoom(joinedRoom);
      setStory(joinedRoom.story);
      if (joinedRoom.story.scenes.length > 0) {
        setSelectedScene(joinedRoom.story.scenes[0]);
        setSceneContent(joinedRoom.story.scenes[0].content);
      }
    } else {
      alert('Room not found. Please check the code.');
    }
    
    setIsJoining(false);
  };

  // Handle scene content change
  const handleContentChange = (newContent: string) => {
    if (!selectedScene || !room) return;

    setSceneContent(newContent);

    // Calculate operation (simplified - in production, track actual changes)
    const oldContent = selectedScene.content;
    if (newContent.length > oldContent.length) {
      // Insert operation
      const insertPos = oldContent.length;
      const insertedText = newContent.substring(insertPos);
      
      const operation: CollaborationOperation = {
        id: `op-${Date.now()}`,
        type: 'insert',
        sceneId: selectedScene.id,
        position: insertPos,
        content: insertedText,
        userId,
        timestamp: Date.now(),
        vectorClock: [room.version],
      };

      if (wsRef.current) {
        wsRef.current.send('operation', operation);
      }
    } else if (newContent.length < oldContent.length) {
      // Delete operation
      const deletePos = newContent.length;
      const deletedLength = oldContent.length - newContent.length;
      
      const operation: CollaborationOperation = {
        id: `op-${Date.now()}`,
        type: 'delete',
        sceneId: selectedScene.id,
        position: deletePos,
        length: deletedLength,
        userId,
        timestamp: Date.now(),
        vectorClock: [room.version],
      };

      if (wsRef.current) {
        wsRef.current.send('operation', operation);
      }
    }

    // Update presence (cursor position)
    if (contentRef.current) {
      const cursorPos = contentRef.current.selectionStart;
      const presence: PresenceUpdate = {
        userId,
        sceneId: selectedScene.id,
        cursorPosition: cursorPos,
        isActive: true,
      };
      updatePresence(room.id, userId, presence);
      
      if (wsRef.current) {
        wsRef.current.send('presence', presence);
      }
    }
  };

  // Send chat message
  const handleSendMessage = () => {
    if (!chatInput.trim() || !room) return;

    const user = room.users.find((u) => u.id === userId);
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId,
      userName: user?.name || userName,
      userColor: user?.color || '#8B5CF6',
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, message]);
    setChatInput('');

    if (wsRef.current) {
      wsRef.current.send('chat:message', message);
    }
  };

  // Copy room code
  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Load version history
  const handleLoadHistory = () => {
    if (room) {
      const history = getVersionHistory(room.id, 10);
      setVersionHistory(history);
      setShowHistory(true);
    }
  };

  // Rollback to version
  const handleRollback = (version: number) => {
    if (room && confirm('Are you sure you want to rollback to this version?')) {
      const rolledBack = rollbackToVersion(room.id, version);
      if (rolledBack) {
        setRoom(rolledBack);
        setStory(rolledBack.story);
        if (rolledBack.story.scenes.length > 0) {
          setSelectedScene(rolledBack.story.scenes[0]);
          setSceneContent(rolledBack.story.scenes[0].content);
        }
        setShowHistory(false);
      }
    }
  };

  // Export story
  const handleExport = () => {
    if (!room) return;

    const exportData = {
      story: room.story,
      roomCode: room.code,
      version: room.version,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room.story.title.replace(/\s+/g, '_')}_collaborative_${room.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save story to storage
  const setStory = (newStory: Story) => {
    StoryStorage.saveStory(newStory);
    StoryStorage.saveScenes(newStory.scenes);
    onStoryUpdate?.(newStory);
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!room) {
    return (
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Join Writing Room
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              disabled={isJoining || !roomCode.trim()}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = room.users.find((u) => u.id === userId);

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Room:</span>
              <code className="px-2 py-1 bg-gray-700 text-purple-400 rounded font-mono text-sm">
                {room.code}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Copy room code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {room.users.length} {room.users.length === 1 ? 'writer' : 'writers'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadHistory}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Version History"
            >
              <History className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Export Story"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scene Selector */}
        {room.story.scenes.length > 0 && (
          <div className="flex items-center gap-2 p-2 border-b border-gray-700 bg-gray-800/30 overflow-x-auto">
            {room.story.scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => {
                  setSelectedScene(scene);
                  setSceneContent(scene.content);
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedScene?.id === scene.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {scene.title}
              </button>
            ))}
          </div>
        )}

        {/* Writing Area */}
        <div className="flex-1 relative">
          {selectedScene ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <input
                  type="text"
                  value={selectedScene.title}
                  onChange={(e) => {
                    const updated = { ...selectedScene, title: e.target.value };
                    setSelectedScene(updated);
                    const updatedStory = {
                      ...room.story,
                      scenes: room.story.scenes.map((s) =>
                        s.id === selectedScene.id ? updated : s
                      ),
                    };
                    setRoom({ ...room, story: updatedStory });
                    setStory(updatedStory);
                  }}
                  className="text-xl font-bold bg-transparent border-none outline-none text-white w-full"
                  placeholder="Scene Title"
                />
              </div>
              <div className="flex-1 relative p-4">
                <textarea
                  ref={contentRef}
                  value={sceneContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onSelect={(e) => {
                    if (contentRef.current && room) {
                      const cursorPos = contentRef.current.selectionStart;
                      const presence: PresenceUpdate = {
                        userId,
                        sceneId: selectedScene.id,
                        cursorPosition: cursorPos,
                        isActive: true,
                      };
                      updatePresence(room.id, userId, presence);
                      if (wsRef.current) {
                        wsRef.current.send('presence', presence);
                      }
                    }
                  }}
                  className="w-full h-full bg-gray-800 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                  placeholder="Start writing together..."
                />
                {/* Cursor indicators */}
                {Array.from(cursorPositions.values()).map((cursor) => {
                  const user = room.users.find((u) => u.id === cursor.userId);
                  if (!user) return null;
                  
                  // Calculate cursor position (simplified)
                  const lines = sceneContent.substring(0, cursor.position).split('\n');
                  const line = lines.length - 1;
                  const col = lines[lines.length - 1].length;
                  
                  return (
                    <div
                      key={cursor.userId}
                      className="absolute pointer-events-none"
                      style={{
                        top: `${line * 1.5 + 1}rem`,
                        left: `${col * 0.6 + 1}rem`,
                      }}
                    >
                      <div
                        className="w-0.5 h-5"
                        style={{ backgroundColor: cursor.color }}
                      />
                      <div
                        className="px-2 py-0.5 rounded text-xs text-white mt-1"
                        style={{ backgroundColor: cursor.color }}
                      >
                        {user.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                {computeWordCount(sceneContent).toLocaleString()} words
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No scenes yet. Create a scene to start writing.
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l border-gray-700 bg-gray-800/50 flex flex-col">
        {/* Users List */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Writers ({room.users.length})
          </h3>
          <div className="space-y-2">
            {room.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-sm text-gray-300 flex-1">{user.name}</span>
                {user.id === userId && (
                  <span className="text-xs text-gray-500">(You)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </h3>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              {showChat ? <X className="w-4 h-4 text-gray-400" /> : <MessageSquare className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          {showChat && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: msg.userColor }}
                      />
                      <span className="text-xs font-semibold text-gray-300">{msg.userName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 ml-4">{msg.message}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Version History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Version History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {versionHistory.map((version, index) => (
                  <div
                    key={version.version}
                    className="p-3 bg-gray-700/50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white font-medium">Version {version.version}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(version.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRollback(version.version)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Rollback
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
