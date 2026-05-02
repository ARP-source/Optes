"use client";

interface VideoPanelProps {
  videoUrl: string | null;
  isGenerating: boolean;
  lastUpdated: string | null;
}

export default function VideoPanel({ videoUrl, isGenerating, lastUpdated }: VideoPanelProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-950/20">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Scene Reconstruction</h2>
        {lastUpdated && (
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            Updated: {lastUpdated}
          </span>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
        <div className="relative w-full aspect-video bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden shadow-2xl shadow-black">
          {isGenerating && (
            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-accent-blue uppercase tracking-tighter animate-pulse">
                IMA Router: Generating Scene...
              </span>
            </div>
          )}

          {videoUrl ? (
            <video 
              key={videoUrl}
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-zinc-800">
              <span className="text-zinc-700 font-mono text-sm uppercase">No Video Feed</span>
            </div>
          )}

          {/* HUD Overlay Elements */}
          <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
            <div className="text-[10px] font-mono text-accent-green bg-black/40 px-1">REC ● AERIAL_01</div>
            <div className="text-[8px] font-mono text-zinc-400 bg-black/40 px-1">LAT: 34.0522 N | LON: 118.2437 W</div>
          </div>
        </div>

        <div className="w-full max-w-md grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-red rounded-sm" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Victims</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-blue rounded-sm" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Responders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-orange rounded-sm" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Danger Zones</span>
          </div>
        </div>
      </div>
    </div>
  );
}
