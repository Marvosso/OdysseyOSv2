/**
 * Test Setup
 * 
 * Global test configuration and mocks
 */

import { setupLocalStorageMock, clearAllMocks } from './helpers/testUtils';

// Setup localStorage mock
setupLocalStorageMock();

// Mock TextEncoder/TextDecoder if not available
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock File and Blob if not available
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(
      public parts: any[],
      public name: string,
      public options?: any
    ) {}
    get size() {
      return this.parts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + new TextEncoder().encode(part).length;
        }
        return acc + part.length || 0;
      }, 0);
    }
    get type() {
      return this.options?.type || 'text/plain';
    }
    async arrayBuffer(): Promise<ArrayBuffer> {
      const encoder = new TextEncoder();
      const text = this.parts.join('');
      return encoder.encode(text).buffer;
    }
    async text(): Promise<string> {
      return this.parts.join('');
    }
  } as any;
}

if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(public parts: any[], public options?: any) {}
    get size() {
      return this.parts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + new TextEncoder().encode(part).length;
        }
        return acc + part.length || 0;
      }, 0);
    }
    get type() {
      return this.options?.type || 'text/plain';
    }
    async arrayBuffer(): Promise<ArrayBuffer> {
      const encoder = new TextEncoder();
      const text = this.parts.join('');
      return encoder.encode(text).buffer;
    }
    async text(): Promise<string> {
      return this.parts.join('');
    }
  } as any;
}

// Cleanup after each test
afterEach(() => {
  clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000); // 10 seconds
