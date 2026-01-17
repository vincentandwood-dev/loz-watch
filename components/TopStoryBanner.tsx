'use client';

import { TopStory } from '@/lib/local-intelligence';

interface TopStoryBannerProps {
  story: TopStory | null;
}

export default function TopStoryBanner({ story }: TopStoryBannerProps) {
  if (!story) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="absolute top-12 left-0 right-0 z-25 bg-blue-50/95 backdrop-blur-md border-b border-blue-100 transition-all duration-200">
      <div className="pl-20 pr-4 py-2 md:pl-20 md:pr-6 md:py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Lake Area Update</span>
              <span className="text-xs text-blue-500">·</span>
              <span className="text-xs text-blue-600">{formatTimestamp(story.timestamp)}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{story.headline}</h3>
            <p className="text-xs text-gray-700 leading-relaxed">{story.summary}</p>
            <div className="mt-1.5">
              <span className="text-xs text-blue-600">
                Source: {story.source}
                {story.sourceUrl && (
                  <a
                    href={story.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 underline hover:text-blue-700"
                  >
                    (read more)
                  </a>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

