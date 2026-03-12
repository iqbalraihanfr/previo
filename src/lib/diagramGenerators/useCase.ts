/* eslint-disable @typescript-eslint/no-explicit-any */

export function generateUseCaseMermaid(fields: any): string {
  const actors = fields.actors || [];
  const useCases = fields.useCases || [];

  if (actors.length === 0 && useCases.length === 0)
    return "flowchart TD\n  Start(Start)";

  let m = "flowchart LR\n";

  // actors are left-side nodes
  actors.forEach((a: string, i: number) => {
    m += `  actor_${i}(["${a}"])\n`;
  });

  // use cases
  useCases.forEach((uc: any, i: number) => {
    const ucId = `uc_${i}`;
    m += `  ${ucId}(("${uc.name}"))\n`;

    // link primary actor
    if (uc.primary_actor) {
      const idx = actors.indexOf(uc.primary_actor);
      if (idx !== -1) {
        m += `  actor_${idx} --> ${ucId}\n`;
      }
    }
  });

  return m;
}
