import { NextRequest, NextResponse } from "next/server";
import { stat, open } from "fs/promises";
import path from "path";
import { VIDEO_DIR } from "../../../../lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(VIDEO_DIR, "recordings", filename);

  try {
    const fileStat = await stat(filePath);
    const fileHandle = await open(filePath, "r");
    const stream = fileHandle.createReadStream();

    let cancelled = false;
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: string | Buffer) => {
          if (!cancelled) controller.enqueue(chunk);
        });
        stream.on("end", () => {
          if (!cancelled) controller.close();
          fileHandle.close();
        });
        stream.on("error", (err) => {
          if (!cancelled) controller.error(err);
          fileHandle.close();
        });
      },
      cancel() {
        cancelled = true;
        stream.destroy();
        fileHandle.close();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "video/webm",
        "Content-Length": fileStat.size.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }
}
