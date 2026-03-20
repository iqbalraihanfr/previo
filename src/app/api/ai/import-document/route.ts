import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { parseModelObject } from "@/lib/ai/json";
import { getModel } from "@/lib/ai/model";
import {
  IMPORT_DOCUMENT_SYSTEM_PROMPT,
  IMPORT_DOCUMENT_USER_PROMPT,
} from "@/lib/ai/prompts";
import type { ProjectBriefFields } from "@/components/editors/ProjectBriefEditor";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: unknown;
      fileBase64?: unknown;
      mimeType?: unknown;
    };

    const text =
      typeof body.text === "string" && body.text.trim()
        ? body.text.trim()
        : undefined;
    const fileBase64 =
      typeof body.fileBase64 === "string" && body.fileBase64.trim()
        ? body.fileBase64.trim()
        : undefined;
    const mimeType =
      typeof body.mimeType === "string" && body.mimeType.trim()
        ? body.mimeType.trim()
        : "application/pdf";

    if (!text && !fileBase64) {
      return NextResponse.json(
        { error: "No content provided" },
        { status: 400 }
      );
    }

    const content = fileBase64
      ? [
          {
            type: "file" as const,
            data: fileBase64,
            mediaType: mimeType as "application/pdf",
          },
          {
            type: "text" as const,
            text: IMPORT_DOCUMENT_USER_PROMPT,
          },
        ]
      : `${IMPORT_DOCUMENT_USER_PROMPT}\n\n${text}`;

    const { text: raw } = await generateText({
      model: getModel(),
      system: IMPORT_DOCUMENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const fields = parseModelObject<ProjectBriefFields>(raw);
    return NextResponse.json({ fields });
  } catch (err) {
    console.error("[import-document]", err);
    return NextResponse.json(
      { error: "Failed to extract document. Check your API key and try again." },
      { status: 500 }
    );
  }
}
