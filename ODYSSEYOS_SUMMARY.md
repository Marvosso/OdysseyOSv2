# OdysseyOS - Story Writing Platform Summary

## Overview
OdysseyOS is a comprehensive web-based story writing and management platform built with Next.js 16, TypeScript, and React. It provides writers with tools to import, organize, write, and manage their stories with integrated character tracking, world-building, and AI assistance.

## Core Features

### 1. **Story Import & Management**
- Import stories from multiple formats: `.txt`, `.md`, `.pdf`, `.docx`
- Automatic chapter and scene detection with confidence scoring
- Character name detection from imported text
- Word count tracking and statistics
- Preview before saving with validation warnings

### 2. **Story Writing (Stories Tab)**
- Scene-by-scene writing interface
- Real-time word count tracking
- Scene status management (Draft, Revised, Final)
- POV character and location tracking per scene
- Narration support with voice selection
- Link scenes to world elements
- Drag-and-drop scene reordering

### 3. **Character Management**
- Character profile builder with detailed attributes
- Automatic character detection from imported stories
- Character roles: Protagonist, Antagonist, Supporting, Mentor, etc.
- Character relationships tracking
- Goals, flaws, and arc status tracking
- Search and filter capabilities

### 4. **World Building**
- Create and manage world elements (locations, objects, concepts)
- Link world elements to scenes
- Organize world elements by categories
- Rich descriptions and metadata

### 5. **AI Tools**
- AI-powered story structure detection
- Character and scene analysis
- Writing assistance and suggestions

### 6. **Outline Builder**
- Create and manage story outlines
- Chapter and scene planning
- Story structure visualization

### 7. **Export & Publishing**
- Export stories in various formats
- Publishing tools and workflows
- Story statistics and analytics

### 8. **Feature Tour**
- Interactive tour of all features
- Tooltips and detailed explanations
- Modal-based feature descriptions

## Technical Stack

- **Framework**: Next.js 16.1.5 (App Router)
- **Language**: TypeScript
- **UI**: React with Framer Motion for animations
- **Storage**: localStorage (StoryStorage) with Supabase integration
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Key Technical Components

### Import Pipeline
- Multi-stage deterministic import pipeline
- File type detection and text extraction
- PDF extraction using `pdfjs-dist`
- DOCX extraction using `mammoth`
- Text normalization and sanitization
- Chapter/scene detection with pattern matching
- Character detection with context-based heuristics
- Confidence scoring for all detections

### Storage System
- `StoryStorage` class for localStorage management
- Unified storage for stories, scenes, characters, outlines
- Automatic cross-tab synchronization via storage events
- Data persistence and retrieval

### Character Detection
- Context-based detection (dialogue, action, sentence-start)
- Filters common words vs. actual character names
- Checks for lowercase appearances (common words)
- Confidence scoring based on occurrences and context
- Minimum length and occurrence thresholds

## Recent Improvements

1. **Import Feature Enhancements**
   - Added PDF and DOCX support
   - Improved chapter detection with fallback patterns
   - Enhanced character detection accuracy
   - Better text sanitization for corrupted files

2. **Integration Fixes**
   - Fixed save story functionality
   - Unified character storage across tabs
   - Auto-refresh when data changes
   - Seamless transition from import to writing

3. **UI/UX Improvements**
   - Reordered navigation tabs logically
   - Import tab moved to second position
   - Feature Tour as first tab
   - Better error handling and user feedback

## Navigation Structure

1. Feature Tour
2. Import
3. Stories
4. Characters
5. Outline
6. World
7. AI Tools
8. Beats
9. Export
10. Publish

## Data Models

- **Story**: Contains scenes, characters, metadata
- **Scene**: Content, title, position, status, POV, location, word count
- **Character**: Name, description, goals, flaws, relationships
- **Chapter**: Title, scenes array
- **WorldElement**: Name, description, category, linked scenes

## Key Files

- `src/lib/import/importPipeline.ts` - Main import logic
- `src/lib/storage/storyStorage.ts` - Storage management
- `src/components/stories/StoryCanvas.tsx` - Main writing interface
- `src/components/characters/CharacterHub.tsx` - Character management
- `src/app/dashboard/import/page.tsx` - Import page
- `src/app/dashboard/layout.tsx` - Main navigation layout

## Current Status

The app is fully functional with:
- Working import for TXT, MD, PDF, DOCX files
- Character and chapter detection
- Story writing and editing
- Character management
- World building
- Cross-tab data synchronization
- TypeScript type safety throughout

## Known Considerations

- Uses localStorage for data persistence (can be extended to Supabase)
- Character detection uses heuristics (not AI-based)
- Some features may require Supabase configuration for full functionality
- Build may show Supabase warnings if env vars not configured (expected)
