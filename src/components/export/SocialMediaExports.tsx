'use client';

/**
 * Social Media Exports Component
 * 
 * One-click exports for Twitter, Instagram, and TikTok
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Twitter,
  Instagram,
  Music,
  Copy,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import type { Story } from '@/types/story';
import {
  generateTwitterThread,
  generateInstagramCarousel,
  generateTikTokScript,
} from '@/lib/export/socialMediaExports';

interface SocialMediaExportsProps {
  story: Story;
}

export default function SocialMediaExports({ story }: SocialMediaExportsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const twitterThread = generateTwitterThread(story);
  const instagramCarousel = generateInstagramCarousel(story);
  const tiktokScript = generateTikTokScript(story);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Social Media Exports</h3>

      {/* Twitter Thread */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-blue-400" />
            <h4 className="text-white font-semibold">Twitter Thread</h4>
            <span className="text-xs text-gray-400">
              {twitterThread.totalTweets} tweets
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(twitterThread.tweets.join('\n\n'), 'twitter')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied === 'twitter' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDownload(
                twitterThread.tweets.join('\n\n'),
                `${story.title}-twitter-thread.txt`
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {twitterThread.tweets.slice(0, 3).map((tweet, index) => (
            <div key={index} className="p-2 bg-gray-700/50 rounded text-sm text-gray-300">
              {tweet.substring(0, 100)}...
            </div>
          ))}
          {twitterThread.tweets.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{twitterThread.tweets.length - 3} more tweets
            </div>
          )}
        </div>
      </div>

      {/* Instagram Carousel */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-400" />
            <h4 className="text-white font-semibold">Instagram Carousel</h4>
            <span className="text-xs text-gray-400">
              {instagramCarousel.totalSlides} slides
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(
                instagramCarousel.slides.map(s => `${s.title}\n\n${s.content}\n\n${s.hashtags.join(' ')}`).join('\n\n---\n\n'),
                'instagram'
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied === 'instagram' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDownload(
                JSON.stringify(instagramCarousel, null, 2),
                `${story.title}-instagram-carousel.json`
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {instagramCarousel.slides.slice(0, 3).map((slide, index) => (
            <div key={index} className="p-2 bg-gray-700/50 rounded">
              <div className="text-sm text-white font-medium">{slide.title}</div>
              <div className="text-xs text-gray-400 mt-1">
                {slide.content.substring(0, 80)}...
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TikTok Script */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" />
            <h4 className="text-white font-semibold">TikTok Script</h4>
            <span className="text-xs text-gray-400">
              {tiktokScript.totalDuration}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(
                tiktokScript.scenes.map(s => 
                  `${s.time}\n${s.action}\n${s.dialogue ? `"${s.dialogue}"` : ''}\nHook: ${s.hook}`
                ).join('\n\n---\n\n') + `\n\nHashtags: ${tiktokScript.hashtags.join(' ')}`,
                'tiktok'
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied === 'tiktok' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDownload(
                JSON.stringify(tiktokScript, null, 2),
                `${story.title}-tiktok-script.json`
              )}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tiktokScript.scenes.slice(0, 3).map((scene, index) => (
            <div key={index} className="p-2 bg-gray-700/50 rounded text-sm text-gray-300">
              <div className="font-medium text-white">{scene.time}</div>
              <div className="text-xs mt-1">{scene.hook}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
