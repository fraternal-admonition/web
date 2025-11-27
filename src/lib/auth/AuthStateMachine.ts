/**
 * AuthStateMachine - Manage authentication state transitions
 * 
 * Ensures predictable state transitions and prevents invalid states.
 * Implements a finite state machine for authentication flow.
 * 
 * States:
 * - INITIALIZING: Loading initial auth state
 * - AUTHENTICATED: User is signed in
 * - UNAUTHENTICATED: User is signed out
 * - ERROR: Authentication error occurred
 * - EXPIRED: Session has expired
 * - SIGNING_OUT: Sign out in progress
 */

import { logger } from "./logger";

export enum AuthState {
  INITIALIZING = "INITIALIZING",
  AUTHENTICATED = "AUTHENTICATED",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  ERROR = "ERROR",
  EXPIRED = "EXPIRED",
  SIGNING_OUT = "SIGNING_OUT",
}

type StateChangeListener = (state: AuthState, data?: any) => void;

/**
 * Valid state transitions
 * Maps current state to allowed next states
 */
const VALID_TRANSITIONS: Record<AuthState, AuthState[]> = {
  [AuthState.INITIALIZING]: [
    AuthState.AUTHENTICATED,
    AuthState.UNAUTHENTICATED,
    AuthState.ERROR,
  ],
  [AuthState.AUTHENTICATED]: [
    AuthState.EXPIRED,
    AuthState.SIGNING_OUT,
    AuthState.ERROR,
  ],
  [AuthState.UNAUTHENTICATED]: [
    AuthState.AUTHENTICATED,
    AuthState.ERROR,
    AuthState.INITIALIZING,
  ],
  [AuthState.ERROR]: [
    AuthState.INITIALIZING,
    AuthState.UNAUTHENTICATED,
  ],
  [AuthState.EXPIRED]: [
    AuthState.UNAUTHENTICATED,
    AuthState.AUTHENTICATED,
  ],
  [AuthState.SIGNING_OUT]: [
    AuthState.UNAUTHENTICATED,
  ],
};

export class AuthStateMachine {
  private currentState: AuthState;
  private listeners: Set<StateChangeListener>;
  private stateHistory: Array<{ state: AuthState; timestamp: Date; data?: any }>;
  private maxHistorySize: number;

  constructor(initialState: AuthState = AuthState.INITIALIZING) {
    this.currentState = initialState;
    this.listeners = new Set();
    this.stateHistory = [];
    this.maxHistorySize = 10;

    // Record initial state
    this.recordState(initialState);

    logger.debug("AuthStateMachine initialized", { initialState });
  }

  /**
   * Transition to a new state
   */
  transition(newState: AuthState, data?: any): boolean {
    // Check if transition is valid
    if (!this.canTransition(this.currentState, newState)) {
      logger.warn("Invalid state transition attempted", {
        from: this.currentState,
        to: newState,
        data,
      });
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // Record state change
    this.recordState(newState, data);

    logger.info("State transition", {
      from: previousState,
      to: newState,
      data,
    });

    // Notify listeners
    this.notifyListeners(newState, data);

    return true;
  }

  /**
   * Check if a transition is valid
   */
  canTransition(from: AuthState, to: AuthState): boolean {
    // Allow staying in the same state
    if (from === to) {
      return true;
    }

    const allowedTransitions = VALID_TRANSITIONS[from];
    return allowedTransitions.includes(to);
  }

  /**
   * Get current state
   */
  getState(): AuthState {
    return this.currentState;
  }

  /**
   * Check if in a specific state
   */
  is(state: AuthState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.currentState === AuthState.AUTHENTICATED;
  }

  /**
   * Check if unauthenticated
   */
  isUnauthenticated(): boolean {
    return this.currentState === AuthState.UNAUTHENTICATED;
  }

  /**
   * Check if initializing
   */
  isInitializing(): boolean {
    return this.currentState === AuthState.INITIALIZING;
  }

  /**
   * Check if in error state
   */
  isError(): boolean {
    return this.currentState === AuthState.ERROR;
  }

  /**
   * Check if expired
   */
  isExpired(): boolean {
    return this.currentState === AuthState.EXPIRED;
  }

  /**
   * Check if signing out
   */
  isSigningOut(): boolean {
    return this.currentState === AuthState.SIGNING_OUT;
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: StateChangeListener): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get state history
   */
  getHistory(): Array<{ state: AuthState; timestamp: Date; data?: any }> {
    return [...this.stateHistory];
  }

  /**
   * Get previous state
   */
  getPreviousState(): AuthState | null {
    if (this.stateHistory.length < 2) {
      return null;
    }

    return this.stateHistory[this.stateHistory.length - 2].state;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    logger.info("Resetting state machine");

    this.currentState = AuthState.INITIALIZING;
    this.stateHistory = [];
    this.recordState(AuthState.INITIALIZING);

    // Notify listeners
    this.notifyListeners(AuthState.INITIALIZING);
  }

  /**
   * Get state machine statistics
   */
  getStats(): {
    currentState: AuthState;
    previousState: AuthState | null;
    transitionCount: number;
    listenerCount: number;
  } {
    return {
      currentState: this.currentState,
      previousState: this.getPreviousState(),
      transitionCount: this.stateHistory.length - 1,
      listenerCount: this.listeners.size,
    };
  }

  /**
   * Record state in history
   */
  private recordState(state: AuthState, data?: any): void {
    this.stateHistory.push({
      state,
      timestamp: new Date(),
      data,
    });

    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(state: AuthState, data?: any): void {
    this.listeners.forEach((listener) => {
      try {
        listener(state, data);
      } catch (error) {
        logger.error("State change listener error", error, { state, data });
      }
    });
  }

  /**
   * Get all valid transitions from current state
   */
  getValidTransitions(): AuthState[] {
    return VALID_TRANSITIONS[this.currentState];
  }

  /**
   * Validate state machine configuration
   */
  static validateTransitions(): boolean {
    // Check that all states have defined transitions
    for (const state of Object.values(AuthState)) {
      if (!VALID_TRANSITIONS[state]) {
        logger.error("Missing transitions for state", { state });
        return false;
      }
    }

    logger.debug("State machine transitions validated");
    return true;
  }
}

// Validate transitions on module load
AuthStateMachine.validateTransitions();
