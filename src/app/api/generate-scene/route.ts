import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const report = await req.json();
    const apiUrls = (process.env.SEEDANCE_API_URLS || "https://api.seedance.ai/v1,https://ark.ap-southeast.bytepluses.com/api/v3,https://api.aimlapi.com/v2").split(",").filter(Boolean);
    const apiKeys = (process.env.SEEDANCE_API_KEYS || "").split(",").filter(Boolean);

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

    console.log("OPTES SEEDANCE ENGINE: PROMPT GENERATED:", prompt);

    // Advanced Multi-URL & Multi-Key Rotation Logic
    if (apiKeys.length > 0) {
      for (const url of apiUrls) {
        for (const key of apiKeys) {
          try {
            console.log(`Testing Seedance URL: ${url} with key: ${key.substring(0, 8)}...`);
            
            // Try different possible endpoints and their common payload structures
            const configurations = [
              { endpoint: "/generate", payload: { prompt, aspect_ratio: "16:9" } },
              { endpoint: "/video/generations", payload: { prompt, model: "seedance-2" } },
              { endpoint: "/chat/completions", payload: { model: "seedance-2", messages: [{ role: "user", content: prompt }] } },
              { endpoint: "/v1/video/generations", payload: { prompt } },
            ];
            
            for (const config of configurations) {
              const fullUrl = `${url.replace(/\/$/, "")}${config.endpoint}`;
              console.log(`Trying endpoint: ${fullUrl}`);
              
              const response = await fetch(fullUrl, {
                method: "POST",
                headers: { 
                  "Authorization": `Bearer ${key}`, 
                  "X-API-KEY": key, // Try alternative header
                  "Content-Type": "application/json" 
                },
                body: JSON.stringify(config.payload)
              });

              const respBody = await response.text();

              if (response.ok) {
                const result = JSON.parse(respBody);
                console.log(`SUCCESS: Seedance reached via ${fullUrl}`);
                return Response.json({ 
                  videoUrl: result.video_url || result.url || result.output || (result.choices && result.choices[0].message.content) || (result.data && result.data[0].url),
                  status: "completed",
                  promptGenerated: prompt
                });
              } else {
                console.warn(`Endpoint ${fullUrl} failed (${response.status}): ${respBody.substring(0, 100)}`);
              }
            }
          } catch (err) {
            console.error(`Network error for ${url}:`, (err as Error).message);
          }
        }
      }
    }

    // Fallback: If all attempts fail
    console.warn("All Seedance endpoints/keys failed. Using demo fallback.");
    return Response.json({ 
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4", 
      status: "demo_fallback",
      promptGenerated: prompt,
      note: "Connectivity issues with Seedance endpoints. Verify URL resolution."
    });

  } catch (error) {
    console.error("Seedance Generation Error:", error);
    return Response.json({ error: "Failed to generate scene", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
