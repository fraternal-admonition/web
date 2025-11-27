// Submission and Payment types for Letters to Goliath contest

export type SubmissionStatus = 
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'SUBMITTED'
  | 'DISQUALIFIED';

export type PaymentPurpose = 
  | 'ENTRY_FEE'
  | 'VOTE_BUNDLE'
  | 'CERTIFICATION_FEE'
  | 'DONATION'
  | 'OTHER';

export type PaymentStatus = 
  | 'CREATED'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface Submission {
  id: string;
  contest_id: string;
  user_id: string;
  submission_code: string;
  title: string;
  body_text: string;
  illustration_id: string | null;
  image_note_100: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  score_peer: number | null;
  score_public: number | null;
  score_final: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionWithDetails extends Submission {
  illustration?: {
    id: string;
    title: string | null;
    description: string | null;
    asset?: {
      path: string;
      alt: string | null;
    };
  };
  contest?: {
    id: string;
    title: string;
    submissions_close_at: string | null;
    phase: string;
  };
  payment?: Payment;
}

export interface Payment {
  id: string;
  user_id: string;
  submission_id: string | null;
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  external_ref: string | null;
  provider: string;
  created_at: string;
}

export interface SubmissionFormData {
  title: string;
  body: string;
  illustration_id: string;
  note: string;
}

export interface CreateSubmissionRequest {
  contest_id: string;
  title: string;
  body: string;
  illustration_id: string;
  note?: string;
}

export interface CreateSubmissionResponse {
  submission_id: string;
  submission_code: string;
}

export interface CreateCheckoutSessionRequest {
  submission_id: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}
