"use client";

export interface AIReport {
  victimCount: string;
  victimLocations: string;
  dangerZones: { location: string; severity: "low" | "medium" | "high" }[];
  responderPositions: string;
  recommendedActions: string[];
  confidenceScore: number;
}

interface AIReportPanelProps {
  report: AIReport | null;
}

export default function AIReportPanel({ report }: AIReportPanelProps) {
  if (!report) {
    return (
      <div className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950/50 backdrop-blur-sm p-8 items-center justify-center text-zinc-600 font-mono text-sm italic">
        Analyzing incident data...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">AI Situation Report</h2>
        <div className="text-[10px] font-mono text-zinc-500">
          GLM 5.1 | CONF: {report.confidenceScore}%
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 p-3 border border-zinc-800 rounded-sm">
            <div className="text-[10px] uppercase text-zinc-500 mb-1">Estimated Victims</div>
            <div className="text-2xl font-bold text-accent-red font-mono">{report.victimCount}</div>
          </div>
          <div className="bg-zinc-900/50 p-3 border border-zinc-800 rounded-sm">
            <div className="text-[10px] uppercase text-zinc-500 mb-1">Responder Status</div>
            <div className="text-xs font-mono text-zinc-300 leading-tight">{report.responderPositions}</div>
          </div>
        </div>

        {/* Danger Zones */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Danger Zones</h3>
          <div className="space-y-2">
            {report.dangerZones?.map((zone, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-900/30 p-2 border-l-2 border-accent-orange">
                <span className="text-xs font-mono text-zinc-300">{zone.location}</span>
                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  zone.severity === "high" ? "bg-accent-red text-white" : 
                  zone.severity === "medium" ? "bg-accent-orange text-white" : "bg-zinc-700 text-zinc-300"
                }`}>
                  {zone.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Command Recommendations</h3>
          <div className="space-y-2">
            {report.recommendedActions?.map((action, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <span className="text-accent-blue font-mono text-xs mt-0.5">[{i + 1}]</span>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed group-hover:text-white transition-colors">
                  {action}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Victim Locations */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Victim Grid Refs</h3>
          <p className="text-[11px] font-mono text-zinc-400 bg-zinc-900/20 p-2 rounded border border-zinc-800/50">
            {report.victimLocations}
          </p>
        </div>
      </div>
    </div>
  );
}
