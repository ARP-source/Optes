import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    const apiKey = process.env.ZAI_API_KEY;

    if (!apiKey) {
      console.warn("ZAI_API_KEY not configured, returning mock synthesis (Demo Mode).");
      return Response.json({
        victimCount: "Estimated 40 occupants, 12 confirmed trapped",
        victimLocations: "Floor 4, North Stairwell, Basement Storage",
        dangerZones: [
          { location: "Floor 2-3 North Wing", severity: "high" },
          { location: "Main Elevator Shaft", severity: "medium" }
        ],
        responderPositions: "Rescue 1 at South Entrance, Engine 5 on Floor 2",
        recommendedActions: [
          "Secure structural integrity of North facade",
          "Deploy aerial ladder to Floor 4 East windows",
          "Evacuate adjacent buildings within 50m radius"
        ],
        confidenceScore: 94
      });
    }

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4v-plus",
        messages: [
          {
            role: "system",
            content: `You are an emergency incident command AI for Optes. 
            The current incident is located at the Computer History Museum in Mountain View (1401 N Shoreline Blvd).
            You have deep knowledge of this building's layout, including the 'Revolution' gallery, the West Wing, the 'Software' theater, and the mainframe exhibits.
            
            Given raw multi-channel incident data, extract structured situational awareness tailored to this specific location. 
            Respond only in JSON with fields: 
            - victimCount (string, e.g. "Approx. 12 confirmed, 20 estimated")
            - victimLocations (string, description of where victims are grouped within the museum wings/exhibits)
            - dangerZones (array of objects with 'location' and 'severity' which is 'low'|'medium'|'high')
            - responderPositions (string, summary of units and their museum-specific assignments)
            - recommendedActions (array of exactly 3 strings)
            - confidenceScore (number between 0 and 100)
            
            Do not include any markdown formatting or explanations outside the JSON.`
          },
          {
            role: "user",
            content: `RAW INCIDENT DATA LOG:\n${JSON.stringify(data, null, 2)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const result = await response.json();
    
    if (!result.choices || !result.choices[0]) {
      console.error("GLM API Error Response:", JSON.stringify(result, null, 2));
      throw new Error(result.error?.message || "Invalid GLM response structure");
    }

    const content = result.choices[0].message.content;
    
    // Parse the JSON from the string response
    let structuredData = JSON.parse(content);
    
    // Ensure critical array fields exist to prevent frontend crashes
    structuredData = {
      victimCount: structuredData.victimCount || "Unknown",
      victimLocations: structuredData.victimLocations || "TBD",
      dangerZones: Array.isArray(structuredData.dangerZones) ? structuredData.dangerZones : [],
      responderPositions: structuredData.responderPositions || "Awaiting deployment",
      recommendedActions: Array.isArray(structuredData.recommendedActions) ? structuredData.recommendedActions.slice(0, 3) : [],
      confidenceScore: typeof structuredData.confidenceScore === 'number' ? structuredData.confidenceScore : 0
    };
    
    return Response.json(structuredData);
  } catch (error) {
    console.error("GLM Synthesis Error:", error);
    return Response.json({ error: "Failed to synthesize data", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
