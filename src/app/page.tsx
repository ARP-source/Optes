"use client";

import { useEffect, useState } from "react";
import LiveFeedPanel, { FeedEntry } from "@/components/LiveFeedPanel";
import VideoPanel from "@/components/VideoPanel";
import AIReportPanel, { AIReport } from "@/components/AIReportPanel";

export default function Dashboard() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [report, setReport] = useState<AIReport | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("Connecting to Command Center...");

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "status") {
        setStatus(data.message);
      } else if (data.type === "update") {
        setIsGenerating(true);
        setFeed(data.feed);
        setReport(data.report);
        setVideoUrl(data.video);
        setLastUpdated(data.lastUpdated);
        
        // Simulate a generation delay for UI feel
        setTimeout(() => setIsGenerating(false), 2000);
      } else if (data.type === "error") {
        setStatus("Error: " + data.message);
      }
    };

    eventSource.onerror = () => {
      setStatus("Connection Lost. Retrying...");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-accent-blue/30">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-red rounded-sm flex items-center justify-center font-bold text-xs">OP</div>
            <h1 className="text-lg font-bold tracking-tighter uppercase">Optes</h1>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Incident ID:</span>
            <span className="text-[10px] font-mono text-accent-orange font-bold">DT-COLLAPSE-094</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-zinc-500 uppercase">System Status</span>
            <span className="text-[10px] font-mono text-accent-green uppercase font-bold tracking-tight">{status}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Feed */}
        <aside className="w-80 flex-shrink-0">
          <LiveFeedPanel entries={feed} />
        </aside>

        {/* Center Panel: Video */}
        <section className="flex-1 min-w-0 border-r border-zinc-800">
          <VideoPanel 
            videoUrl={videoUrl} 
            isGenerating={isGenerating} 
            lastUpdated={lastUpdated} 
          />
        </section>

        {/* Right Panel: AI Report */}
        <aside className="w-96 flex-shrink-0">
          <AIReportPanel report={report} />
        </aside>
      </main>

      {/* Footer Bar */}
      <footer className="h-8 border-t border-zinc-800 bg-black/50 backdrop-blur-sm flex items-center justify-between px-4 z-20">
        <div className="flex gap-4 items-center">
          <span className="text-[9px] font-mono text-zinc-600 uppercase">Optes Unified Interface v2.4.0</span>
          <span className="text-[9px] font-mono text-zinc-600 uppercase">|</span>
          <span className="text-[9px] font-mono text-accent-blue uppercase">Butterbase Realtime: Active</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-[9px] font-mono text-zinc-600">SECURE CHANNEL // AES-256</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
            <span className="text-[9px] font-mono text-zinc-400">ENCRYPTED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
