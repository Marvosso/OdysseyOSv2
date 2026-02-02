/**
 * Collaboration Room Manager
 * 
 * Manages real-time collaboration rooms with WebSocket support
 * Implements Operational Transformation for conflict resolution
 */

import type { Scene, Story } from '@/types/story';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  isGuest: boolean;
  cursorPosition?: { sceneId: string; offset: number };
  lastSeen: Date;
}

export interface CollaborationOperation {
  id: string;
  type: 'insert' | 'delete' | 'format';
  sceneId: string;
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  vectorClock: number[];
}

export interface CollaborationRoom {
  id: string;
  code: string;
  story: Story;
  users: CollaborationUser[];
  operations: CollaborationOperation[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresenceUpdate {
  userId: string;
  sceneId?: string;
  cursorPosition?: number;
  isActive: boolean;
}

const STORAGE_KEY_PREFIX = 'odysseyos_room_';
const STORAGE_KEY_ROOMS = 'odysseyos_rooms';

/**
 * Generate a 6-character room code
 */
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Get all rooms from storage
 */
export function getRooms(): CollaborationRoom[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((room: any) => ({
      ...room,
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt),
      story: room.story,
      users: room.users.map((u: any) => ({
        ...u,
        lastSeen: new Date(u.lastSeen),
      })),
    }));
  } catch {
    return [];
  }
}

/**
 * Get room by code
 */
export function getRoomByCode(code: string): CollaborationRoom | null {
  const rooms = getRooms();
  return rooms.find((r) => r.code === code) || null;
}

/**
 * Create a new collaboration room
 */
export function createRoom(story: Story, userId: string, userName: string): CollaborationRoom {
  const code = generateRoomCode();
  const user: CollaborationUser = {
    id: userId,
    name: userName,
    color: generateUserColor(),
    isGuest: true,
    lastSeen: new Date(),
  };

  const room: CollaborationRoom = {
    id: `room-${Date.now()}`,
    code,
    story,
    users: [user],
    operations: [],
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const rooms = getRooms();
  rooms.push(room);
  localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${room.id}`, JSON.stringify(room));

  return room;
}

/**
 * Join a room by code
 */
export function joinRoom(code: string, userId: string, userName: string): CollaborationRoom | null {
  const room = getRoomByCode(code);
  if (!room) return null;

  // Check if user already in room
  const existingUser = room.users.find((u) => u.id === userId);
  if (!existingUser) {
    const newUser: CollaborationUser = {
      id: userId,
      name: userName,
      color: generateUserColor(),
      isGuest: true,
      lastSeen: new Date(),
    };
    room.users.push(newUser);
    room.updatedAt = new Date();
    saveRoom(room);
  } else {
    existingUser.lastSeen = new Date();
    saveRoom(room);
  }

  return room;
}

/**
 * Leave a room
 */
export function leaveRoom(roomId: string, userId: string): void {
  const room = getRoomById(roomId);
  if (!room) return;

  room.users = room.users.filter((u) => u.id !== userId);
  room.updatedAt = new Date();
  saveRoom(room);
}

/**
 * Get room by ID
 */
export function getRoomById(roomId: string): CollaborationRoom | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${roomId}`);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      users: parsed.users.map((u: any) => ({
        ...u,
        lastSeen: new Date(u.lastSeen),
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Save room to storage
 */
function saveRoom(room: CollaborationRoom): void {
  const rooms = getRooms();
  const index = rooms.findIndex((r) => r.id === room.id);
  if (index >= 0) {
    rooms[index] = room;
  } else {
    rooms.push(room);
  }
  localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${room.id}`, JSON.stringify(room));
}

/**
 * Generate a color for a user
 */
function generateUserColor(): string {
  const colors = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Apply an operation to a scene using Operational Transformation
 */
export function applyOperation(
  room: CollaborationRoom,
  operation: CollaborationOperation
): { room: CollaborationRoom; transformed: CollaborationOperation } {
  const scene = room.story.scenes.find((s) => s.id === operation.sceneId);
  if (!scene) {
    return { room, transformed: operation };
  }

  // Transform operation against concurrent operations
  let transformedOp = operation;
  const concurrentOps = room.operations.filter(
    (op) =>
      op.sceneId === operation.sceneId &&
      op.timestamp < operation.timestamp &&
      op.userId !== operation.userId
  );

  for (const concurrentOp of concurrentOps) {
    transformedOp = transformOperation(transformedOp, concurrentOp);
  }

  // Apply transformed operation
  if (transformedOp.type === 'insert' && transformedOp.content) {
    const before = scene.content.substring(0, transformedOp.position);
    const after = scene.content.substring(transformedOp.position);
    scene.content = before + transformedOp.content + after;
  } else if (transformedOp.type === 'delete' && transformedOp.length) {
    const before = scene.content.substring(0, transformedOp.position);
    const after = scene.content.substring(transformedOp.position + transformedOp.length);
    scene.content = before + after;
  }

  // Add operation to history
  room.operations.push(transformedOp);
  room.version++;
  room.updatedAt = new Date();

  saveRoom(room);

  return { room, transformed: transformedOp };
}

/**
 * Transform operation against another operation (OT algorithm)
 */
function transformOperation(
  op1: CollaborationOperation,
  op2: CollaborationOperation
): CollaborationOperation {
  // Simple OT: if op2 happens before op1's position, adjust op1's position
  if (op2.type === 'insert' && op2.position <= op1.position) {
    return {
      ...op1,
      position: op1.position + (op2.content?.length || 0),
    };
  } else if (op2.type === 'delete' && op2.position < op1.position) {
    const deleteEnd = op2.position + (op2.length || 0);
    if (deleteEnd <= op1.position) {
      return {
        ...op1,
        position: op1.position - (op2.length || 0),
      };
    } else if (op2.position < op1.position) {
      // Overlapping delete
      return {
        ...op1,
        position: op2.position,
      };
    }
  }

  return op1;
}

/**
 * Update user presence
 */
export function updatePresence(
  roomId: string,
  userId: string,
  presence: PresenceUpdate
): CollaborationRoom | null {
  const room = getRoomById(roomId);
  if (!room) return null;

  const user = room.users.find((u) => u.id === userId);
  if (user) {
    if (presence.sceneId && presence.cursorPosition !== undefined) {
      user.cursorPosition = {
        sceneId: presence.sceneId,
        offset: presence.cursorPosition,
      };
    }
    user.lastSeen = new Date();
    room.updatedAt = new Date();
    saveRoom(room);
  }

  return room;
}

/**
 * Get version history
 */
export function getVersionHistory(roomId: string, limit: number = 10): CollaborationRoom[] {
  // In a real implementation, you'd store snapshots
  // For now, we'll return the current room
  const room = getRoomById(roomId);
  return room ? [room] : [];
}

/**
 * Rollback to a specific version
 */
export function rollbackToVersion(roomId: string, version: number): CollaborationRoom | null {
  // In a real implementation, you'd restore from a snapshot
  // For now, this is a placeholder
  const room = getRoomById(roomId);
  if (!room) return null;

  // Remove operations after the target version
  room.operations = room.operations.filter((op) => op.vectorClock[0] <= version);
  room.version = version;
  room.updatedAt = new Date();
  saveRoom(room);

  return room;
}

/**
 * WebSocket connection manager (client-side simulation)
 * In production, this would connect to a WebSocket server
 */
export class CollaborationWebSocket {
  private roomId: string;
  private userId: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor(roomId: string, userId: string, wsUrl?: string) {
    this.roomId = roomId;
    this.userId = userId;

    // In a real implementation, connect to WebSocket server
    // For now, we'll simulate with localStorage events
    if (typeof window !== 'undefined') {
      this.setupLocalStorageSync();
    }
  }

  /**
   * Setup localStorage-based sync (simulation)
   * In production, replace with actual WebSocket
   */
  private setupLocalStorageSync(): void {
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith(STORAGE_KEY_PREFIX)) {
        const room = getRoomById(this.roomId);
        if (room) {
          this.emit('room:update', room);
        }
      }
    });

    // Poll for updates (simulation)
    setInterval(() => {
      const room = getRoomById(this.roomId);
      if (room) {
        this.emit('room:update', room);
      }
    }, 1000);
  }

  /**
   * Connect to WebSocket server
   */
  connect(wsUrl: string): void {
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connect', {});
        this.send('join', { roomId: this.roomId, userId: this.userId });
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      };

      this.ws.onerror = (error) => {
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        this.emit('disconnect', {});
        this.attemptReconnect(wsUrl);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(wsUrl: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(wsUrl);
      }, 1000 * this.reconnectAttempts);
    }
  }

  /**
   * Send message
   */
  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      // Fallback to localStorage sync
      const room = getRoomById(this.roomId);
      if (room && type === 'operation') {
        const result = applyOperation(room, payload);
        this.emit('operation:applied', result.transformed);
      }
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
