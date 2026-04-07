/**
 * Shared validation utilities for MoneyMate frontend.
 * Matches backend Zod/regex validation to catch errors client-side
 * before sending to the API.
 */

// Regex matching the backend's email validation pattern:
// - Must not start with a dot
// - Must not have consecutive dots
// - Must have @ followed by domain with at least one dot
// - TLD must be 2+ letters
const EMAIL_REGEX =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

/**
 * Validate email format matching backend rules.
 * Returns error message string or null if valid.
 */
export function validateEmail(email) {
  const trimmed = (email || "").trim();
  if (!trimmed) {
    return "Email wajib diisi.";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Format email tidak valid. Contoh: nama@email.com";
  }
  return null;
}

/**
 * Validate password.
 * Returns error message string or null if valid.
 */
export function validatePassword(password) {
  if (!password) {
    return "Password wajib diisi.";
  }
  if (password.length < 6) {
    return "Password minimal 6 karakter.";
  }
  return null;
}

/**
 * Validate name.
 * Returns error message string or null if valid.
 */
export function validateName(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "Nama wajib diisi.";
  }
  if (trimmed.length < 2) {
    return "Nama minimal 2 karakter.";
  }
  return null;
}

/**
 * Parse backend error messages into user-friendly text.
 * Handles JSON array validation errors from Zod.
 */
export function parseApiError(err, fallback = "Terjadi kesalahan. Coba lagi.") {
  let msg = err.response?.data?.message || err.message || fallback;

  // Handle Zod validation errors that come as JSON string arrays
  if (typeof msg === "string" && msg.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(msg);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Map Zod error codes to user-friendly messages
        const messages = parsed.map((e) => {
          if (e.code === "invalid_format" && e.format === "email") {
            return "Format email tidak valid. Contoh: nama@email.com";
          }
          if (e.code === "too_small") {
            return e.message || `Minimal ${e.minimum} karakter.`;
          }
          return e.message || fallback;
        });
        // Return unique messages joined
        return [...new Set(messages)].join(" ");
      }
    } catch {
      // Not valid JSON, return as-is
    }
  }

  return msg;
}
