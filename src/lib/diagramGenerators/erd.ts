/* eslint-disable @typescript-eslint/no-explicit-any */

export function generateERDMermaid(fields: any): string {
  const entities = fields.entities || [];
  const rels = fields.relationships || [];

  if (entities.length === 0) return "erDiagram\n  ENTITY {}";

  let m = "erDiagram\n";

  entities.forEach((ent: any) => {
    const name = ent.name || `Unnamed_${ent.id.substring(0, 4)}`;
    m += `  ${name} {\n`;
    (ent.attributes || []).forEach((attr: any) => {
      const type = attr.type ? attr.type.replace(/\s+/g, "_") : "string";
      const attrName = attr.name ? attr.name.replace(/\s+/g, "_") : "col";
      let pkfk = "";
      if (attr.isPrimaryKey && attr.isForeignKey) pkfk = " PK,FK";
      else if (attr.isPrimaryKey) pkfk = " PK";
      else if (attr.isForeignKey) pkfk = " FK";
      m += `    ${type} ${attrName}${pkfk}\n`;
    });
    m += `  }\n`;
  });

  rels.forEach((rel: any) => {
    if (!rel.from || !rel.to) return;
    const t = rel.type || "one-to-many";
    let relStr = "||--o{";
    if (t === "one-to-one") relStr = "||--||";
    if (t === "many-to-many") relStr = "}o--o{";
    m += `  ${rel.from} ${relStr} ${rel.to} : " "\n`;
  });

  return m;
}
