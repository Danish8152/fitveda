import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { VIDEO_DIR } from "../../../lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.blob();
    if (body.size === 0) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.webm`;

    // 1. If Vercel Blob token is set, attempt Vercel Blob upload
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { url } = await put(`recordings/${filename}`, body, {
          access: "public",
          contentType: "video/webm",
          addRandomSuffix: false,
        });
        return NextResponse.json({ url });
      } catch (blobErr) {
        console.warn("[upload] Vercel Blob upload failed, falling back to local storage:", blobErr);
      }
    }

    // 2. Local fallback storage
    const recDir = path.join(VIDEO_DIR, "recordings");
    await mkdir(recDir, { recursive: true });
    const filePath = path.join(recDir, filename);
    const buffer = Buffer.from(await body.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/api/recording/file/${filename}` });
  } catch (err) {
    console.error("Recording upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
