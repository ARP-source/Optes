import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const report = await req.json();
    const apiUrl = process.env.SEEDANCE_API_URL;
    const apiKey = process.env.SEEDANCE_API_KEY;

    // Construct the cinematic prompt
    const dangerZones = Array.isArray(report.dangerZones) ? report.dangerZones : [];
    const dangerZoneDesc = (dangerZones as { location: string; severity: string }[]).map((z) => `${z.location} (${z.severity} severity)`).join(", ");
    const prompt = `Cinematic aerial drone footage of an emergency scene: 
    4-story office building partial collapse. 
    Fire active at ${dangerZoneDesc}. 
    Victim groups located at ${report.victimLocations as string} marked with RED overlays. 
    Responder units positioned at ${report.responderPositions as string} marked with BLUE overlays. 
    High danger zones at ${dangerZoneDesc} marked with ORANGE heatmaps. 
    Continuous movement, smoke effects, high-visibility emergency lights.`;

    console.log("SEEDANCE 2.0 PROMPT GENERATED:", prompt);

    if (!apiUrl || !apiKey) {
      console.warn("Seedance API not configured, returning mock video.");
      // Return a mock video URL for demonstration
      // Using a slightly more technical looking placeholder if possible, or just a stable test video
      return Response.json({ 
        videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
        status: "completed",
        promptGenerated: prompt
      });
    }

    // Placeholder for actual Seedance API call
    /*
    const response = await fetch(`${apiUrl}/generate`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, resolution: "1080p", duration: 10 })
    });
    const result = await response.json();
    return Response.json(result);
    */

    return Response.json({ 
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
      status: "completed",
      promptGenerated: prompt
    });

  } catch (error) {
    console.error("Seedance Generation Error:", error);
    return Response.json({ error: "Failed to generate scene", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
