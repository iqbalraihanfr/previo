import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { isPlainObject, parseModelStringArray } from "@/lib/ai/json";
import { getModel } from "@/lib/ai/model";
import {
  ASSIST_SYSTEM_PROMPT,
  buildAssistPrompt,
  type AssistContext,
  isAssistSection,
} from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      section?: unknown;
      context?: unknown;
    };

    if (typeof body.section !== "string" || !isAssistSection(body.section)) {
      return NextResponse.json(
        { error: `Unknown section: ${String(body.section ?? "")}` },
        { status: 400 }
      );
    }

    const context: AssistContext = isPlainObject(body.context) ? body.context : {};

    const { text: raw } = await generateText({
      model: getModel(),
      system: ASSIST_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildAssistPrompt(body.section, context),
        },
      ],
    });

    const suggestions = parseModelStringArray(raw);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[assist]", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions. Check your API key." },
      { status: 500 }
    );
  }
}
