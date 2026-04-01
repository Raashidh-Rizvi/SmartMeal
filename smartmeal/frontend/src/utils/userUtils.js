/**
 * User ID management utility
 * 
 * Currently the system uses a hardcoded user_id "1" throughout.
 * This utility ensures consistent user ID usage across the application.
 * 
 * TODO: When proper multi-user authentication is implemented, this should be
 * updated to retrieve the actual user ID from AuthContext or JWT token.
 */

/**
 * Get the current user ID
 * @param {Object} user - User object from AuthContext (optional)
 * @returns {string} The user ID to use for API calls
 */
export const getUserId = (user) => {
  // If user object provided and has an id, use it
  if (user && (user.id || user._id || user.uid)) {
    return user.id || user._id || user.uid;
  }
  
  // Otherwise use the default/fallback user ID
  // This is set to "1" to match the backend default
  return "1";
};

/**
 * Check if a user ID is the default/demo user
 * @param {string} userId - The user ID to check
 * @returns {boolean} True if this is the demo user ID
 */
export const isDefaultUser = (userId) => {
  return userId === "1";
};

export default {
  getUserId,
  isDefaultUser,
};
