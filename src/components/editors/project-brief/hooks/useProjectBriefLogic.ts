"use client";

export function useProjectBriefLogic<T extends object>(
  fields: T,
  onChange: (f: T) => void,
) {
  const updateField = <K extends keyof T>(key: K, value: T[K]) => {
    onChange({ ...fields, [key]: value });
  };

  return {
    updateField,
  };
}
