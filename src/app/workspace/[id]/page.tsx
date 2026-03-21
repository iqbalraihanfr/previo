import { WorkspaceScreen } from "@/features/workspace/WorkspaceScreen";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WorkspaceScreen projectId={id} />;
}
