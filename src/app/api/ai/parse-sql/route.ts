import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { parseModelObject } from "@/lib/ai/json";
import { getModel } from "@/lib/ai/model";
import { PARSE_SQL_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { ERDFields } from "@/components/editors/erd/hooks/useERDLogic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sql?: unknown };
    const sql =
      typeof body.sql === "string" && body.sql.trim() ? body.sql.trim() : "";

    if (!sql) {
      return NextResponse.json(
        { error: "No SQL provided" },
        { status: 400 }
      );
    }

    const { text: raw } = await generateText({
      model: getModel(),
      system: PARSE_SQL_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parse this SQL schema into ERD format:\n\n${sql}`,
        },
      ],
    });

    const fields = parseModelObject<ERDFields>(raw);
    return NextResponse.json({ fields });
  } catch (err) {
    console.error("[parse-sql]", err);
    return NextResponse.json(
      { error: "Failed to parse SQL. Check your API key and try again." },
      { status: 500 }
    );
  }
}
