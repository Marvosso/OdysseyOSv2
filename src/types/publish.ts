export interface SubmissionTarget {
  id: string;
  name: string;
  type: 'magazine' | 'anthology' | 'publisher' | 'contest' | 'agent';
  website: string;
  requirements: {
    wordCountMin: number;
    wordCountMax: number;
    genres: string[];
    format: string;
    readingPeriod?: string;
    responseTime: string;
  };
  guidelines: string[];
}

export interface SubmissionPackage {
  storyId: string;
  coverLetter: string;
  synopsis: string;
  bio: string;
  manuscript: string;
  format: 'pdf' | 'docx' | 'rtf';
  history: SubmissionHistory[];
}

export interface SubmissionHistory {
  id: string;
  targetId: string;
  submittedAt: Date;
  status: 'submitted' | 'rejected' | 'accepted' | 'withdrawn';
  response?: {
    date: Date;
    feedback?: string;
  };
}
