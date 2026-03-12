/* eslint-disable @typescript-eslint/no-explicit-any */

export function generateFlowchartMermaid(fields: any): string {
  // Support new multi-flow format and legacy flat format
  const flows = fields.flows || [];
  const legacySteps = fields.steps || [];
  const legacyConns = fields.connections || [];

  if (flows.length === 0 && legacySteps.length === 0)
    return "flowchart TD\n  Start(Start)";

  let m = "flowchart TD\n";

  const renderStepsAndConns = (steps: any[], conns: any[]) => {
    steps.forEach((s: any) => {
      const id = s.id.split("-")[0];
      const lbl = s.label || id;
      if (s.type === "decision") m += `  ${id}{"${lbl}"}\n`;
      else if (s.type === "start" || s.type === "end")
        m += `  ${id}(["${lbl}"])\n`;
      else m += `  ${id}["${lbl}"]\n`;
    });
    conns.forEach((c: any) => {
      if (!c.from || !c.to) return;
      const fromId = c.from.split("-")[0];
      const toId = c.to.split("-")[0];
      if (c.label) m += `  ${fromId} -- "${c.label}" --> ${toId}\n`;
      else m += `  ${fromId} --> ${toId}\n`;
    });
  };

  if (flows.length > 0) {
    flows.forEach((flow: any, idx: number) => {
      if (flows.length > 1)
        m += `  subgraph ${flow.name || `Flow_${idx + 1}`}\n`;
      renderStepsAndConns(flow.steps || [], flow.connections || []);
      if (flows.length > 1) m += `  end\n`;
    });
  } else {
    renderStepsAndConns(legacySteps, legacyConns);
  }

  return m;
}
