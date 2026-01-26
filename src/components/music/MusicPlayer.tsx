import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart } from 'lucide-react';
import { getMusicForEmotion } from '@/lib/data/musicLibrary';

export default function MusicPlayer({ story }: { story: any }) {
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [playlist, setPlaylist] = useState<any[]>([]);

  const handlePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const handleLikeTrack = (trackId: string) => {
    const newLiked = new Set(likedTracks);
    if (newLiked.has(trackId)) {
      newLiked.delete(trackId);
    } else {
      newLiked.add(trackId);
    }
    setLikedTracks(newLiked);
  };

  const handleNextTrack = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t: any) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentTrack(playlist[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t: any) => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentTrack(playlist[prevIndex]);
  };

  const generatePlaylist = () => {
    const currentEmotion = story?.scenes?.find((s: any) => s.id === story?.activeSceneId)?.emotion || 'neutral';
    const tracks = getMusicForEmotion(currentEmotion);
    setPlaylist(tracks);
    if (tracks.length > 0) {
      setCurrentTrack(tracks[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-pink-400" />
          Music
        </h3>
        <button
          onClick={generatePlaylist}
          className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full text-sm"
        >
          Generate Playlist
        </button>
      </div>

      {currentTrack && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-lg p-4 border border-pink-500/20"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-bold text-white">{currentTrack.title}</h4>
              <p className="text-sm text-gray-400">{currentTrack.artist}</p>
            </div>
            <button
              onClick={() => handleLikeTrack(currentTrack.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                likedTracks.has(currentTrack.id)
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'bg-gray-800/50 text-gray-400 hover:text-pink-400'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${likedTracks.has(currentTrack.id) ? 'fill-current' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handlePrevTrack}
              className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-3 bg-pink-600 hover:bg-pink-700 rounded-full text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={handleNextTrack}
              className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-400" />
            )}
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </motion.div>
      )}

      {playlist.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Up Next ({playlist.length})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {playlist.slice(0, 5).map((track) => (
              <button
                key={track.id}
                onClick={() => setCurrentTrack(track)}
                className={`w-full p-2 rounded-lg text-left transition-colors ${
                  currentTrack?.id === track.id
                    ? 'bg-pink-500/20 border border-pink-500/30'
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
              >
                <p className="text-sm text-white">{track.title}</p>
                <p className="text-xs text-gray-500">{track.artist}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!currentTrack && (
        <div className="p-6 bg-gray-800/50 rounded-lg text-center">
          <Music className="w-12 h-12 mx-auto text-gray-600 mb-2" />
          <p className="text-gray-400 text-sm">Generate a playlist based on your story's mood</p>
        </div>
      )}
    </div>
  );
}
