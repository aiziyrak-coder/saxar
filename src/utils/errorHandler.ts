/**
 * Centralized error handling utilities
 * Provides consistent error handling across the application
 */

export interface AppError {
  message: string;
  code?: string;
  type: 'auth' | 'network' | 'validation' | 'server' | 'unknown';
}

/**
 * Parse Firebase/Auth errors into user-friendly messages
 */
export function parseError(error: unknown): AppError {
  // Default error
  const defaultError: AppError = {
    message: "Noma'lum xatolik yuz berdi",
    type: 'unknown',
  };

  if (error instanceof Error) {
    const err = error as Error & { code?: string };
    
    // Firebase Auth errors
    const authErrors: Record<string, string> = {
      'auth/user-not-found': "Foydalanuvchi topilmadi",
      'auth/wrong-password': "Noto'g'ri parol",
      'auth/invalid-email': "Noto'g'ri email formati",
      'auth/user-disabled': "Foydalanuvchi bloklangan",
      'auth/email-already-in-use': "Bu email allaqachon ro'yxatdan o'tgan",
      'auth/weak-password': "Parol juda oddiy",
      'auth/operation-not-allowed': "Bu operatsiya ruxsat etilmagan",
      'auth/network-request-failed': "Internet aloqasi yo'q",
      'auth/too-many-requests': "Juda ko'p urinishlar. Iltimos, kuting",
      'auth/invalid-credential': "Noto'g'ri kirish ma'lumotlari",
    };

    if (err.code && authErrors[err.code]) {
      return {
        message: authErrors[err.code],
        code: err.code,
        type: 'auth',
      };
    }

    // Firestore errors
    const firestoreErrors: Record<string, string> = {
      'permission-denied': "Ruxsat yo'q",
      'not-found': "Ma'lumot topilmadi",
      'already-exists': "Bu ma'lumot allaqachon mavjud",
      'resource-exhausted': "Resurslar tugadi",
      'unauthenticated': "Avtorizatsiya talab qilinadi",
    };

    if (err.code && firestoreErrors[err.code]) {
      return {
        message: firestoreErrors[err.code],
        code: err.code,
        type: 'server',
      };
    }

    // Network errors
    if (err.message?.includes('network') || err.message?.includes('fetch')) {
      return {
        message: "Internet aloqasi yo'q. Iltimos, ulanishni tekshiring",
        code: 'network-error',
        type: 'network',
      };
    }

    // Return original message
    return {
      message: err.message,
      code: err.code,
      type: 'unknown',
    };
  }

  return defaultError;
}

/**
 * Log error to console with structured format
 */
export function logError(error: unknown, context?: string): void {
  const parsed = parseError(error);
  console.error(`[ERROR${context ? ` - ${context}` : ''}]`, {
    message: parsed.message,
    code: parsed.code,
    type: parsed.type,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Show user-friendly error toast/notification
 */
export function getErrorMessage(error: unknown): string {
  return parseError(error).message;
}
