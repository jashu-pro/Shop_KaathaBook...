/* features/staff/services/workerAuthMessages.ts */
import { WorkerAuthError } from './workerAuthService';

export interface WorkerAuthMessage {
  message: string;
  notActivated?: boolean;
  shops?: Array<{ id: string; name: string }>;
}

/**
 * Turns a sign-in or activation failure into text for the worker. Unknown
 * account and wrong PIN read the same, so the form doesn't reveal who exists.
 */
export function describeWorkerAuthError(err: unknown, kind: 'login' | 'activate'): WorkerAuthMessage {
  if (err instanceof WorkerAuthError) {
    switch (err.status) {
      case 'locked':
        return { message: 'Too many wrong tries. Please wait 15 minutes and try again.' };
      case 'suspended':
        return { message: 'Your access is paused. Please contact the shop owner.' };
      case 'rate_limited':
        return { message: 'Too many attempts from this device. Please wait a few minutes.' };
      case 'error':
        return { message: 'Something went wrong. Please try again in a moment.' };
      case 'bad_pin':
        return { message: 'Your PIN must be exactly 4 digits.' };
      case 'choose_shop':
        return { message: 'You work at more than one shop. Choose the shop to sign in to.', shops: err.shops };
      default:
        return {
          message: kind === 'login'
            ? 'Email, phone or PIN is incorrect. Please try again.'
            : 'The code is wrong or has expired. Ask your shop owner for a new code.',
        };
    }
  }

  // Local (demo) mode and network errors
  const msg = err instanceof Error ? err.message : '';
  if (msg.includes('not activated') || msg.includes('Approval Code') || msg.includes('temporary approval code')) {
    return {
      message: 'This account has no PIN yet. Activate it with the code from your shop owner.',
      notActivated: true,
    };
  }
  if (msg.includes('suspended')) {
    return { message: 'Your access is paused. Please contact the shop owner.' };
  }
  if (/fetch|network|Failed to/i.test(msg)) {
    return { message: 'Could not reach the server. Check your internet connection.' };
  }
  return {
    message: kind === 'login'
      ? 'Email, phone or PIN is incorrect. Please try again.'
      : 'The code is wrong or has expired. Ask your shop owner for a new code.',
  };
}
