// Contest phase utilities for determining submission availability and deadlines

import { Contest } from '@/types/contests';

export interface PhaseStatus {
  isSubmissionsOpen: boolean;
  canSubmit: boolean;
  canPayForPending: boolean;
  message: string;
  deadline: string | null;
}

/**
 * Determines if submissions are currently open based on contest phase and timestamps
 * 
 * @param contest - The contest object with phase and timestamp information
 * @returns PhaseStatus object with submission availability details
 */
export function getSubmissionPhaseStatus(contest: Contest): PhaseStatus {
  const now = new Date();
  const submissionsOpenAt = contest.submissions_open_at ? new Date(contest.submissions_open_at) : null;
  const submissionsCloseAt = contest.submissions_close_at ? new Date(contest.submissions_close_at) : null;
  
  // Check phase
  const isPhaseOpen = contest.phase === 'SUBMISSIONS_OPEN';
  
  // Check timestamps
  const isAfterOpen = !submissionsOpenAt || now >= submissionsOpenAt;
  const isBeforeClose = !submissionsCloseAt || now < submissionsCloseAt;
  
  const isSubmissionsOpen = isPhaseOpen && isAfterOpen && isBeforeClose;
  
  // Determine messages
  let message = '';
  if (!isPhaseOpen) {
    message = 'Submissions are currently closed';
  } else if (!isAfterOpen) {
    message = `Submissions open on ${submissionsOpenAt?.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`;
  } else if (!isBeforeClose) {
    message = 'Submission deadline has passed';
  } else {
    message = 'Submissions are open';
  }
  
  return {
    isSubmissionsOpen,
    canSubmit: isSubmissionsOpen,
    canPayForPending: isBeforeClose, // Allow payment for pending submissions until deadline
    message,
    deadline: submissionsCloseAt?.toISOString() || null,
  };
}

/**
 * Formats a deadline for display with relative time information
 * 
 * @param deadline - ISO string of the deadline date
 * @returns Formatted deadline string
 */
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline set';
  
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Deadline passed';
  } else if (diffDays === 0) {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      return 'Deadline today (ending soon)';
    }
    return `Deadline today (${diffHours} hour${diffHours === 1 ? '' : 's'} remaining)`;
  } else if (diffDays === 1) {
    return 'Deadline tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays} days remaining`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

/**
 * Gets a short, concise deadline message for display in alerts
 * 
 * @param deadline - ISO string of the deadline date
 * @returns Short deadline message
 */
export function getDeadlineMessage(deadline: string | null): string {
  if (!deadline) return '';
  
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours <= 0) {
    return 'Deadline passed';
  } else if (diffHours <= 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} left`;
  } else if (diffDays <= 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
  } else {
    return `Deadline: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
}

/**
 * Gets a human-readable phase status message for admin display
 * Determines if the current phase matches the suggested phase based on timestamps
 * 
 * @param contest - The contest object
 * @returns Object with inSync status, message, and suggested phase
 */
export function getPhaseStatusMessage(contest: Contest): {
  inSync: boolean;
  message: string;
  suggestedPhase: string;
} {
  const now = new Date();
  const suggestedPhase = calculateSuggestedPhase(contest, now);
  const inSync = contest.phase === suggestedPhase;
  
  let message = '';
  if (inSync) {
    message = 'Contest phase is in sync with timeline';
  } else {
    message = `Timeline suggests phase should be ${suggestedPhase.replace(/_/g, ' ')}`;
  }
  
  return {
    inSync,
    message,
    suggestedPhase,
  };
}

/**
 * Calculates the suggested phase based on contest timestamps
 * 
 * @param contest - The contest object
 * @param now - Current date/time
 * @returns Suggested phase based on timeline
 */
function calculateSuggestedPhase(contest: Contest, now: Date): string {
  const submissionsOpenAt = contest.submissions_open_at ? new Date(contest.submissions_open_at) : null;
  const submissionsCloseAt = contest.submissions_close_at ? new Date(contest.submissions_close_at) : null;
  const aiFilterStartAt = contest.ai_filter_start_at ? new Date(contest.ai_filter_start_at) : null;
  const aiFilterEndAt = contest.ai_filter_end_at ? new Date(contest.ai_filter_end_at) : null;
  const peerStartAt = contest.peer_start_at ? new Date(contest.peer_start_at) : null;
  const peerEndAt = contest.peer_end_at ? new Date(contest.peer_end_at) : null;
  const publicStartAt = contest.public_start_at ? new Date(contest.public_start_at) : null;
  const publicEndAt = contest.public_end_at ? new Date(contest.public_end_at) : null;
  
  // Check phases in reverse chronological order
  if (publicEndAt && now >= publicEndAt) {
    return 'FINALIZED';
  }
  
  if (publicStartAt && now >= publicStartAt) {
    return 'PUBLIC_VOTING';
  }
  
  if (peerStartAt && now >= peerStartAt && (!peerEndAt || now < peerEndAt)) {
    return 'PEER_REVIEW';
  }
  
  if (aiFilterStartAt && now >= aiFilterStartAt && (!aiFilterEndAt || now < aiFilterEndAt)) {
    return 'AI_FILTERING';
  }
  
  if (submissionsCloseAt && now >= submissionsCloseAt) {
    return 'SUBMISSIONS_CLOSED';
  }
  
  if (submissionsOpenAt && now >= submissionsOpenAt && (!submissionsCloseAt || now < submissionsCloseAt)) {
    return 'SUBMISSIONS_OPEN';
  }
  
  // Default to SUBMISSIONS_OPEN if no timestamps are set or we're before submissions open
  return 'SUBMISSIONS_OPEN';
}
