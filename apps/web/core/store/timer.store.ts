import { makeObservable, observable, action, computed } from "mobx";

export interface ITimerStore {
  activeTimer: IActiveTimer | null;
  isTimerRunning: boolean;
  activeTimerSeconds: number;
  startTimer: (issueId: string, projectId: string, workspaceSlug: string) => void;
  stopTimer: () => { elapsedSeconds: number; savedTimer: IActiveTimer | null };
  clearTimer: () => void;
  isTimerForIssue: (issueId: string) => boolean;
}

export interface IActiveTimer {
  issueId: string;
  projectId: string;
  workspaceSlug: string;
  startTime: number; // timestamp in milliseconds
  seconds: number; // elapsed seconds
}

export class TimerStore implements ITimerStore {
  activeTimer: IActiveTimer | null = null;
  timerInterval: NodeJS.Timeout | null = null;

  constructor() {
    makeObservable(this, {
      activeTimer: observable,
      isTimerRunning: computed,
      startTimer: action,
      stopTimer: action,
      updateTimer: action,
      clearTimer: action,
    });

    // Load active timer from localStorage on init
    this.loadActiveTimer();
    
    // Start interval if timer was active
    if (this.activeTimer) {
      this.startTimerInterval();
    }
  }

  get isTimerRunning(): boolean {
    return this.activeTimer !== null;
  }

  get activeTimerSeconds(): number {
    if (!this.activeTimer) return 0;
    const elapsed = Math.floor((Date.now() - this.activeTimer.startTime) / 1000);
    return this.activeTimer.seconds + elapsed;
  }

  startTimer(issueId: string, projectId: string, workspaceSlug: string) {
    // Stop any existing timer (but don't save it - caller should handle that)
    if (this.activeTimer) {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.activeTimer = null;
      this.clearActiveTimer();
    }

    this.activeTimer = {
      issueId,
      projectId,
      workspaceSlug,
      startTime: Date.now(),
      seconds: 0,
    };

    this.saveActiveTimer();
    this.startTimerInterval();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const elapsedSeconds = this.activeTimerSeconds;
    const savedTimer = this.activeTimer; // Save before clearing
    this.activeTimer = null;
    this.clearActiveTimer();

    return { elapsedSeconds, savedTimer };
  }

  updateTimer() {
    // This is called by the interval to keep the timer in sync
    // The actual seconds are calculated in activeTimerSeconds getter
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.activeTimer = null;
    this.clearActiveTimer();
  }

  private startTimerInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  private saveActiveTimer() {
    // Only access localStorage in browser environment
    if (typeof window === "undefined") return;
    
    if (this.activeTimer) {
      localStorage.setItem(
        "plane_active_timer",
        JSON.stringify({
          ...this.activeTimer,
          startTime: this.activeTimer.startTime,
        })
      );
    }
  }

  private loadActiveTimer() {
    // Only access localStorage in browser environment
    if (typeof window === "undefined") return;
    
    try {
      const saved = localStorage.getItem("plane_active_timer");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if timer is still valid (not too old, e.g., max 24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const age = Date.now() - parsed.startTime;
        
        if (age < maxAge) {
          this.activeTimer = {
            ...parsed,
            startTime: parsed.startTime,
            seconds: Math.floor(age / 1000), // Add elapsed time since save
          };
        } else {
          // Timer is too old, clear it
          this.clearActiveTimer();
        }
      }
    } catch (error) {
      console.error("Failed to load active timer:", error);
      this.clearActiveTimer();
    }
  }

  private clearActiveTimer() {
    // Only access localStorage in browser environment
    if (typeof window === "undefined") return;
    
    localStorage.removeItem("plane_active_timer");
  }

  isTimerForIssue(issueId: string): boolean {
    return this.activeTimer?.issueId === issueId;
  }
}
