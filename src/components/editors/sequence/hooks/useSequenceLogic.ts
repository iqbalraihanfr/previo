"use client";

export interface Participant {
  name: string;
  type: "actor" | "component" | "service" | "database" | "external";
  order: number;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: "request" | "response" | "self";
  group: "none" | "alt" | "opt" | "loop";
  group_label?: string;
}

export interface SequenceFields {
  related_use_case?: string;
  participants?: Participant[];
  messages?: Message[];
}

export function useSequenceLogic(fields: SequenceFields, onChange: (f: SequenceFields) => void) {
  const participants = Array.isArray(fields.participants) ? fields.participants : [];
  const messages = Array.isArray(fields.messages) ? fields.messages : [];

  const updateParticipants = (newP: Participant[]) => onChange({ ...fields, participants: newP });
  const updateMessages = (newM: Message[]) => onChange({ ...fields, messages: newM });

  const addParticipant = () => {
    updateParticipants([
      ...participants,
      { name: "", type: "component", order: participants.length },
    ]);
  };

  const updateParticipant = (index: number, updates: Partial<Participant>) => {
    const arr = [...participants];
    arr[index] = { ...arr[index], ...updates };
    updateParticipants(arr);
  };

  const removeParticipant = (index: number) => {
    updateParticipants(participants.filter((_, i) => i !== index));
  };

  const addMessage = () => {
    updateMessages([
      ...messages,
      {
        id: window.crypto.randomUUID(),
        from: "",
        to: "",
        content: "",
        type: "request",
        group: "none",
        group_label: "",
      },
    ]);
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    updateMessages(messages.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMessage = (id: string) => {
    updateMessages(messages.filter((m) => m.id !== id));
  };

  return {
    participants,
    messages,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addMessage,
    updateMessage,
    removeMessage,
  };
}
