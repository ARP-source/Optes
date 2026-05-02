import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DEMO_SCENARIO = "Partial collapse of a 4-story office building downtown. Estimated 40 occupants. Fire on floors 2-3. Structural integrity compromised on north side. 3 rescue units on scene, 2 en route.";

const SIMULATED_DATA_POOL = [
  { channel: "witness", content: "Heavy smoke coming from the north stairwell. People trapped on floor 4." },
  { channel: "unit", content: "Rescue 1 on scene. Establishing command post at South entrance. Initiating primary search of Floor 1." },
  { channel: "sensor", content: "TEMP_SENSOR_02: 450°C. Gas levels rising in basement. Structural sensor S-09 reporting 15% integrity drop." },
  { channel: "911", content: "911 Dispatch: Multiple callers reporting collapse of north facade. Floor 3 floorplate suspected unstable." },
  { channel: "unit", content: "Engine 5: Water supply established. Starting fire suppression on Floor 2." },
  { channel: "witness", content: "I can see people waving from the windows on the east side. Help is needed there." },
  { channel: "sensor", content: "TEMP_SENSOR_03: 120°C. North wall vibrations detected. High risk of secondary collapse." },
  { channel: "911", content: "911 Dispatch: Caller ID 402 reporting trapped group in conference room B, Floor 4." },
  { channel: "unit", content: "Rescue 2: On route, ETA 3 minutes. Heavy traffic on Main St." },
  { channel: "sensor", content: "CO_LEVEL: CRITICAL. 400ppm detected in central HVAC shaft." },
];

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let activeData: { id: string; timestamp: string; channel: string; content: string }[] = [];
      let dataIndex = 0;
      let lastReport: unknown = null;
      let lastVideo: { videoUrl: string } | null = null;

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

          // 3. Call Generation (Seedance 2.0)
          const genResponse = await fetch(`${new URL(req.url).origin}/api/generate-scene`, {
            method: "POST",
            body: JSON.stringify(lastReport),
          });
          lastVideo = await genResponse.json();

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
