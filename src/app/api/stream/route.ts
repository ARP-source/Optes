import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DEMO_SCENARIO = "Major structural incident at the Computer History Museum (1401 N Shoreline Blvd, Mountain View). A localized floor collapse occurred in the 'Revolution' exhibit area (West Wing). Multiple hackers and attendees trapped. High-value artifacts at risk. Fire detection in the 'Mainframe' section. 3 rescue units on scene, 2 en route from MVFD.";

const SIMULATED_DATA_POOL = [
  { channel: "witness", content: "Loud crash near the Babbage Engine. Dust everywhere, the floor gave way in the Revolution wing." },
  { channel: "unit", content: "MVFD Rescue 1: Command established at Shoreline Blvd entrance. Entering the West Wing for primary search." },
  { channel: "sensor", content: "SMOKE_01 (Gallery): CRITICAL levels. Temperature rising near the 'Cray-1' exhibit. Structural integrity at 65%." },
  { channel: "911", content: "911 Dispatch: Multiple reports of attendees trapped under debris in the 'Software' theater area." },
  { channel: "unit", content: "Engine 5: Laying lines to the hydrant near the 'IBM 1401' demo room. Preparing for fire suppression." },
  { channel: "witness", content: "People are exiting towards the parking lot, but some are still inside the 'PDP-1' demo area." },
  { channel: "sensor", content: "THERMAL_MV: High heat signature detected in the basement storage below the 'Eniac' display." },
  { channel: "911", content: "911 Dispatch: Caller 650 reports 5 people pinned in the back corner of the 'Internet History' section." },
  { channel: "unit", content: "Rescue 2: ETA 2 minutes. Turning onto Shoreline. Requesting heavy rescue equipment for floor breach." },
  { channel: "sensor", content: "VIBRATION_SENSE: Significant movement detected in the 'Mainframe' wing roof structure." },
];

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let activeData: { id: string; timestamp: string; channel: string; content: string }[] = [];
      let dataIndex = 0;
      let lastReport: unknown = null;
      let lastVideo: { videoUrl?: string; taskId?: string; status?: string } | null = null;
      let pendingTaskId: string | null = null;

      const pushUpdate = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial push
      pushUpdate({ type: "status", message: "Connection established. Initializing Optes GLM 5.1..." });

      const runLoop = async () => {
        try {
          // 1. Add new simulated data
          const nextEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            ...SIMULATED_DATA_POOL[dataIndex % SIMULATED_DATA_POOL.length]
          };
          activeData = [...activeData, nextEntry];
          dataIndex++;

          // 2. Call Synthesis (GLM 5.1)
          const synthResponse = await fetch(`${new URL(req.url).origin}/api/synthesize`, {
            method: "POST",
            body: JSON.stringify({ data: [...activeData, { scenario: DEMO_SCENARIO }] }),
          });
          lastReport = await synthResponse.json();

          // 3. Call Generation (Seedance 2.0 via IMA Router)
          const genResponse = await fetch(`${new URL(req.url).origin}/api/generate-scene`, {
            method: "POST",
            body: JSON.stringify({ 
              ...lastReport as object,
              taskId: pendingTaskId 
            }),
          });
          lastVideo = await genResponse.json();
          
          if (lastVideo?.videoUrl) {
            pendingTaskId = null; // Reset if we got a video
          } else if (lastVideo?.taskId) {
            pendingTaskId = lastVideo.taskId; // Keep track of pending task
          }

          // 4. Push combined state
          pushUpdate({
            type: "update",
            feed: activeData,
            report: lastReport,
            video: lastVideo?.videoUrl || null,
            lastUpdated: new Date().toLocaleTimeString(),
          });


        } catch (err) {
          console.error("Stream Loop Error:", err);
          pushUpdate({ type: "error", message: "Internal update failure" });
        }
      };

      // Run first update immediately
      await runLoop();

      // Set interval for every 30 seconds
      const interval = setInterval(runLoop, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
