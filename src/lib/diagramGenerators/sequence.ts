/* eslint-disable @typescript-eslint/no-explicit-any */

export function generateSequenceMermaid(fields: any): string {
  const participants = fields.participants || [];
  const msgs = fields.messages || [];

  if (participants.length === 0) return "sequenceDiagram\n  participant System";

  let m = "sequenceDiagram\n";
  participants.forEach((p: any) => {
    const name = typeof p === "string" ? p : p?.name || "Unknown";
    const type = typeof p === "string" ? "component" : p?.type || "component";
    const safeName = name.replace(/\s+/g, "_");
    if (type === "actor") m += `  actor ${safeName} as ${name}\n`;
    else m += `  participant ${safeName} as ${name}\n`;
  });

  // Group tracking for alt/opt/loop
  let currentGroup: string | null = null;
  msgs.forEach((msg: any) => {
    if (!msg.from || !msg.to) return;
    const f = msg.from.replace(/\s+/g, "_");
    const t = msg.to.replace(/\s+/g, "_");
    const group = msg.group || "none";

    // Handle group transitions
    if (group !== "none" && group !== currentGroup) {
      if (currentGroup) m += `  end\n`;
      m += `  ${group} ${msg.group_label || group}\n`;
      currentGroup = group;
    } else if (group === "none" && currentGroup) {
      m += `  end\n`;
      currentGroup = null;
    }

    const msgType = msg.type || "request";
    if (msgType === "response") {
      m += `  ${f}-->>-${t}: ${msg.content || "return"}\n`;
    } else if (msgType === "self") {
      m += `  ${f}->>+${f}: ${msg.content || "self call"}\n`;
    } else {
      m += `  ${f}->>+${t}: ${msg.content || "call"}\n`;
    }
  });
  if (currentGroup) m += `  end\n`;

  return m;
}
