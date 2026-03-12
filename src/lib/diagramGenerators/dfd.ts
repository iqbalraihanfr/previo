/* eslint-disable @typescript-eslint/no-explicit-any */

export function generateDFDMermaid(fields: any): string {
  const nodes = fields.nodes || [];
  const flows = fields.flows || [];

  if (nodes.length === 0) return "flowchart TD\n  System((System))";

  let m = "flowchart TD\n";

  nodes.forEach((n: any) => {
    const id = n.id.split("-")[0];
    const lbl = n.label || id;
    if (n.type === "entity") m += `  ${id}["${lbl}"]\n`;
    else if (n.type === "datastore") m += `  ${id}[("${lbl}")]\n`;
    else m += `  ${id}(("${lbl}"))\n`;
  });

  flows.forEach((f: any) => {
    if (!f.from || !f.to) return;
    const fromId = f.from.split("-")[0];
    const toId = f.to.split("-")[0];
    if (f.label) m += `  ${fromId} -- "${f.label}" --> ${toId}\n`;
    else m += `  ${fromId} --> ${toId}\n`;
  });

  return m;
}
