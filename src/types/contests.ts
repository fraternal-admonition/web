// Contest types for the Letters to Goliath contest system

export type ContestPhase = 
  | 'SUBMISSIONS_OPEN'
  | 'SUBMISSIONS_CLOSED'
  | 'AI_FILTERING'
  | 'PEER_REVIEW'
  | 'PUBLIC_VOTING'
  | 'FINALIZED';

export interface Contest {
  id: string;
  title: string;
  slug: string | null;
  phase: ContestPhase;
  submissions_open_at: string | null;
  submissions_close_at: string | null;
  ai_filter_start_at: string | null;
  ai_filter_end_at: string | null;
  peer_start_at: string | null;
  peer_end_at: string | null;
  public_start_at: string | null;
  public_end_at: string | null;
  max_entries: number | null;
  peer_review_per_submission: number;
  scoring_weights: {
    peer: number;
    public: number;
  };
  voting_rules: {
    vote_per_submission_cap: number;
    public_vote_requires_payment: boolean;
  };
  word_limits: Record<string, number>;
  teaser_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Illustration {
  id: string;
  contest_id: string;
  title: string | null;
  description: string | null;
  asset_id: string | null;
  is_active: boolean;
  created_at: string;
  asset?: {
    path: string;
    alt: string | null;
  };
}

export interface ContestFormData {
  title: string;
  slug?: string;
  submissions_open_at?: string;
  submissions_close_at?: string;
  ai_filter_start_at?: string;
  ai_filter_end_at?: string;
  peer_start_at?: string;
  peer_end_at?: string;
  public_start_at?: string;
  public_end_at?: string;
  max_entries?: number;
  phase?: ContestPhase;
}

export interface IllustrationFormData {
  contest_id: string;
  title: string;
  description?: string;
  asset_id?: string;
  is_active: boolean;
}

// Extended contest type with submission count for list views
export interface ContestWithStats extends Contest {
  submission_count?: number;
}
