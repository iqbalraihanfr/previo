"use client";

export function useProjectBriefLogic(fields: any, onChange: (f: any) => void) {
  const updateField = (key: string, value: any) => {
    onChange({ ...fields, [key]: value });
  };

  return {
    updateField,
  };
}
