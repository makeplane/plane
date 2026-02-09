export type TUploadTarget = "library" | "work-item";

export type TMetaFormState = {
  category: string | null;
  sport: string | null;
  program: string | null;
  level: string | null;
  season: string | null;
  startDate: string | null;
  startTime: string | null;
  tags: string[];
};

export type TMetaFieldChange = <K extends keyof TMetaFormState>(field: K, value: TMetaFormState[K]) => void;
