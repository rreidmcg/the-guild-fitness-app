// Username validation utilities with profanity filtering

// Common profanity list (basic implementation - in production, use a more comprehensive list)
const PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'piss',
  'cock', 'dick', 'pussy', 'whore', 'slut', 'fag', 'retard', 'nigger', 'nigga',
  'chink', 'spic', 'kike', 'wetback', 'towelhead', 'terrorist', 'nazi', 'hitler',
  'rape', 'murder', 'kill', 'die', 'suicide', 'death', 'violence', 'hate',
  'drugs', 'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'alcohol', 'drunk',
  'sex', 'porn', 'xxx', 'nude', 'naked', 'boobs', 'tits', 'penis', 'vagina',
  'admin', 'moderator', 'support', 'staff', 'official', 'system', 'test', 'null',
  'undefined', 'anonymous', 'guest', 'user', 'root', 'administrator'
];

// Leetspeak and common substitutions
const LEETSPEAK_MAP: { [key: string]: string } = {
  '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', '$': 's',
  '7': 't', '+': 't', '2': 'z', 'ph': 'f', 'ck': 'k', 'xx': 'x'
};

function normalizeLeetspeak(text: string): string {
  let normalized = text.toLowerCase();
  for (const [leet, normal] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.replace(new RegExp(leet, 'g'), normal);
  }
  return normalized;
}

function containsProfanity(username: string): boolean {
  const normalized = normalizeLeetspeak(username);
  
  return PROFANITY_LIST.some(profanity => {
    // Direct match
    if (normalized.includes(profanity)) return true;
    
    // Match with numbers inserted (since spaces are no longer allowed)
    const spaced = profanity.split('').join('[\\d]*');
    const regex = new RegExp(spaced, 'i');
    return regex.test(normalized);
  });
}

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUsername(username: string): UsernameValidationResult {
  // Check if username is provided
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: "Username is required" };
  }

  // Trim whitespace
  const trimmed = username.trim();

  // Check length (minimum 2, maximum 20 characters)
  if (trimmed.length < 2) {
    return { isValid: false, error: "Username must be at least 2 characters long" };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: "Username must be 20 characters or less" };
  }

  // Check for valid characters (letters only, no spaces)
  const validCharRegex = /^[a-zA-Z]+$/;
  if (!validCharRegex.test(trimmed)) {
    return { isValid: false, error: "Username can only contain letters (no spaces or special characters)" };
  }

  // Check for profanity
  if (containsProfanity(trimmed)) {
    return { isValid: false, error: "Username contains inappropriate content" };
  }

  // Check for reserved words or patterns
  const reservedPatterns = [
    /^admin/i, /^mod/i, /^staff/i, /^support/i, /^official/i,
    /^fitquest/i, /^system/i, /^root/i, /^test/i, /^null/i,
    /^undefined/i, /^anonymous/i, /^guest/i, /^user\d*$/i
  ];

  for (const pattern of reservedPatterns) {
    if (pattern.test(trimmed)) {
      return { isValid: false, error: "Username is reserved and cannot be used" };
    }
  }

  return { isValid: true };
}

export function sanitizeUsername(username: string): string {
  if (!username) return '';
  
  // Trim whitespace only (no spaces allowed in usernames)
  return username.trim();
}