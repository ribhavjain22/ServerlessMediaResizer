import { NextResponse } from "next/server";
import { compressPdfDocument, formatBytes } from "@/lib/pdf-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode") || "balanced";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file uploaded." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF uploads are supported." }, { status: 400 });
    }

    const inputBytes = new Uint8Array(await file.arrayBuffer());
    const result = await compressPdfDocument(inputBytes, { mode });

    return new NextResponse(result.bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(/\.pdf$/i, "")}-${mode}.pdf"`,
        "X-Original-Size": formatBytes(inputBytes.byteLength),
        "X-Output-Size": formatBytes(result.bytes.byteLength),
        "X-Compression-Mode": result.mode,
        "X-Compression-Notes": result.notes.join(" | ")
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF compression failed." },
      { status: 500 }
    );
  }
}
