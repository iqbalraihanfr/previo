import { useCallback } from "react";
import { db, type Attachment } from "@/lib/db";

export function useAttachments(
  nodeId: string,
  attachments: Attachment[],
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>,
) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newAtts: Attachment[] = [];
      const now = new Date().toISOString();

      for (const file of acceptedFiles) {
        const attId = crypto.randomUUID();
        const attachment: Attachment = {
          id: attId,
          node_id: nodeId,
          filename: file.name,
          mime_type: file.type,
          size: file.size,
          data: file,
          created_at: now,
        };
        await db.attachments.add(attachment);
        newAtts.push(attachment);
      }

      setAttachments((prev) => [...prev, ...newAtts]);
    },
    [nodeId, setAttachments],
  );

  const deleteAttachment = useCallback(
    async (attId: string) => {
      await db.attachments.delete(attId);
      setAttachments((prev) =>
        prev.filter((attachment) => attachment.id !== attId),
      );
    },
    [setAttachments],
  );

  return { onDrop, deleteAttachment };
}
