const crypto = require('crypto');
const { z } = require('zod');

/**
 * Generates a unique v4 UUID without hyphens (32 lowercase hex characters).
 * @returns {string} 32-character hex UUID
 */
const generateUuid = () => {
  return crypto.randomUUID().replace(/-/g, '');
};

/**
 * Strips hyphens from any valid UUID or returns value as is.
 * @param {string} id
 * @returns {string}
 */
const stripHyphens = (id) => {
  return typeof id === 'string' ? id.replace(/-/g, '') : id;
};

// Regex matching 32-character unhyphenated UUID or standard 36-character hyphenated UUID
const UUID_REGEX = /^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Zod schema validator that accepts UUIDs (both unhyphenated and hyphenated)
 * and normalizes them to unhyphenated 32-character UUIDs.
 */
const uuidSchema = (message = 'Invalid UUID format') =>
  z.string({ required_error: message })
    .regex(UUID_REGEX, message)
    .transform(val => val.replace(/-/g, ''));

/**
 * Optional UUID schema
 */
const optionalUuidSchema = (message = 'Invalid UUID format') =>
  z.string()
    .regex(UUID_REGEX, message)
    .transform(val => val.replace(/-/g, ''))
    .optional()
    .nullable();

module.exports = {
  generateUuid,
  stripHyphens,
  UUID_REGEX,
  uuidSchema,
  optionalUuidSchema
};
