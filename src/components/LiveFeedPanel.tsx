"use client";

import { useEffect, useRef } from "react";

export interface FeedEntry {
  id: string;
  timestamp: string;
  channel: "witness" | "unit" | "sensor" | "911";
  content: string;
}

interface LiveFeedPanelProps {
  entries: FeedEntry[];
}

export default function LiveFeedPanel({ entries }: LiveFeedPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getBadgeColor = (channel: string) => {
    switch (channel) {
      case "witness": return "bg-zinc-700 text-zinc-100";
      case "unit": return "bg-accent-blue text-white";
      case "sensor": return "bg-accent-orange text-white";
      case "911": return "bg-accent-red text-white";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Live Data Feed</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="text-[10px] font-mono text-accent-green uppercase">Live</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-sm italic">
            Waiting for data stream...
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="group border-l-2 border-zinc-800 pl-4 py-1 hover:border-zinc-600 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-mono text-zinc-500">{entry.timestamp}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getBadgeColor(entry.channel)}`}>
                  {entry.channel}
                </span>
              </div>
              <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                {entry.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
