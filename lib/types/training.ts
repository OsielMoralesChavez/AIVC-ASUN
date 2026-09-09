export interface TrainingDataEntry {
  id: string;
  label: string;
  value: string;
  createdAt: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  toneDescription: string;
  styleGuidelines: string[];
  vocabularyNotes: string[];
  standardData: TrainingDataEntry[];
  sourceDocumentNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceProfileSummary {
  id: string;
  name: string;
  toneDescription: string;
  dataEntryCount: number;
  updatedAt: string;
}
