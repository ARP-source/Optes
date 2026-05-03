import { NextRequest, NextResponse } from "next/server";

function pickVideoUrl(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;

  const candidates = [
    payload.video_url,
    payload.videoUrl,
    payload.url,
    payload.output,
    payload.result_url,
    payload.file_url,
    payload.data?.video_url,
    payload.data?.videoUrl,
    payload.data?.url,
    payload.data?.output,
    payload.result?.video_url,
    payload.result?.url,
    payload.result?.output?.url,
    Array.isArray(payload.outputs) ? payload.outputs[0]?.url : undefined,
    Array.isArray(payload.output) ? payload.output[0]?.url : undefined,
  ];

  const match = candidates.find((value) => typeof value === "string" && value.length > 0);
  return typeof match === "string" ? match : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const apiKey = process.env.IMA_ROUTER_API_KEY;
  const baseUrl = process.env.IMA_ROUTER_BASE_URL || "https://api.imarouter.com";

  if (!apiKey) {
    return NextResponse.json({ error: "IMA_ROUTER_API_KEY is not set" }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/v1/videos/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `IMA Router responded with status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const videoUrl = pickVideoUrl(data);
    const rawStatus = data.status || "unknown";
    const normalizedStatus = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "unknown";

    const completedStatuses = ["completed", "success", "succeeded", "succeed", "done", "finished", "ready"];
    const failedStatuses = ["failed", "error", "cancelled", "canceled", "rejected"];

    let status = "pending";
    if (completedStatuses.includes(normalizedStatus)) {
      status = "completed";
    } else if (failedStatuses.includes(normalizedStatus)) {
      status = "failed";
    }

    return NextResponse.json({
      status,
      videoUrl,
      rawStatus,
      taskId
    });
  } catch (error) {
    console.error("Poll video error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
