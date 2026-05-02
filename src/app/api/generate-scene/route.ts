import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { taskId: existingTaskId, ...report } = await req.json();
    const apiKey = process.env.IMA_ROUTER_API_KEY;
    const baseUrl = (process.env.IMA_ROUTER_BASE_URL || "https://api.imarouter.com").replace(/\/$/, "");

    // Construct the cinematic prompt
    const dangerZones = Array.isArray(report.dangerZones) ? report.dangerZones : [];
    const dangerZoneDesc = (dangerZones as { location: string; severity: string }[]).map((z) => `${z.location} (${z.severity} severity)`).join(", ");
    const prompt = `Cinematic aerial drone footage of an emergency scene at the Computer History Museum, Mountain View (1401 N Shoreline Blvd). 
    The distinctive white, modern architecture of the museum is visible. 
    Incident focus: ${dangerZoneDesc}. 
    Victim groups at ${report.victimLocations as string} marked with RED overlays. 
    MVFD responder units at ${report.responderPositions as string} marked with BLUE overlays. 
    High danger zones at ${dangerZoneDesc} marked with ORANGE heatmaps. 
    Smoke rising from the West Wing/Revolution gallery area. Drone is orbiting the building from Shoreline Blvd side.`;

    console.log("OPTES IMA ROUTER: PROMPT GENERATED:", prompt);

    if (!apiKey) {
      console.warn("IMA_ROUTER_API_KEY not configured. Using demo fallback.");
      return Response.json({ 
        videoUrl: "https://vjs.zencdn.net/v/oceans.mp4", // This is what the user saw, but I'll replace it below in the quota section as well
        status: "demo_fallback",
        promptGenerated: prompt
      });
    }

    let taskId = existingTaskId;

    if (!taskId) {
      // 1. Create Video Task
      console.log("IMA Router: Creating video task...");
      const createResponse = await fetch(`${baseUrl}/v1/videos`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "seedance-2.0",
          prompt: prompt,
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.warn(`IMA Router Creation Failed (${createResponse.status}): ${errorText}`);
        
        // Robust fallback for Quota or other API issues
        if (errorText.includes("insufficient_user_quota") || createResponse.status === 403 || createResponse.status === 402) {
          console.log("IMA Router: Quota exhausted or access denied. Falling back to demo video.");
          return Response.json({ 
            // Using a more thematic drone video for the fallback
            videoUrl: "https://videos.pexels.com/video-files/5266857/5266857-uhd_2560_1440_30fps.mp4", 
            status: "demo_fallback",
            promptGenerated: prompt,
            note: "API Quota exhausted. Using pre-rendered asset."
          });
        }
        
        throw new Error(`IMA Router Creation Failed (${createResponse.status}): ${errorText}`);
      }

      const taskData = await createResponse.json();
      taskId = taskData.id || taskData.job_id || taskData.task_id || taskData.data?.id;

      if (!taskId) {
        throw new Error("IMA Router did not return a task ID");
      }
      console.log(`IMA Router: Task created with ID: ${taskId}.`);
    } else {
      console.log(`IMA Router: Polling existing task ID: ${taskId}`);
    }

    // 2. Poll for Status (Wait up to 25 seconds in this request)
    const maxPollAttempts = 8;
    const pollInterval = 3000; // 3 seconds

    for (let i = 0; i < maxPollAttempts; i++) {
      console.log(`IMA Router: Polling attempt ${i + 1}/${maxPollAttempts} for task ${taskId}...`);
      const statusResponse = await fetch(`${baseUrl}/v1/videos/${taskId}`, {
        headers: { 
          "Authorization": `Bearer ${apiKey}`
        }
      });


      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const videoUrl = statusData.video_url || statusData.url || statusData.data?.video_url || statusData.output;
        const status = statusData.status || statusData.data?.status || statusData.state;

        if (videoUrl && (status === "completed" || status === "success" || status === "succeeded")) {
          console.log("IMA Router: Video generation completed!");
          return Response.json({ 
            videoUrl,
            status: "completed",
            promptGenerated: prompt,
            taskId
          });
        } else if (status === "failed" || status === "error") {
          throw new Error(`IMA Router Task Failed: ${statusData.error || statusData.message || "Unknown error"}`);
        }
        
        console.log(`IMA Router: Status is ${status || "pending"}...`);
      }

      if (i < maxPollAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // If we reach here, polling timed out but task might still be running
    console.warn("IMA Router: Polling timed out. Returning last known status/task ID.");
    return Response.json({ 
      status: "processing",
      taskId,
      promptGenerated: prompt,
      note: "Video is still generating. Check back in the next stream update."
    });


  } catch (error) {
    console.error("IMA Router Integration Error:", error);
    return Response.json({ error: "Failed to generate scene", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

