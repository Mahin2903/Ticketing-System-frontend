// src/Utilities/auth.utils.js

/**
 * Validates whether an email belongs to an authorized JUST domain:
 * - Faculty / Staff / Official: xxx@just.edu.bd
 * - Students: xxxx@student.just.edu.bd
 *
 * @param {string} email
 * @returns {boolean}
 */
export const isValidJustEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@(student\.)?just\.edu\.bd$/i.test(email.trim());
};

export const ALLOWED_EMAIL_MESSAGE =
  "Only @just.edu.bd and @student.just.edu.bd email addresses are allowed.";
