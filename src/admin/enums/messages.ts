export enum AdminMessages {
  LOGIN_SUCCESS = 'Login successful',
  LOGIN_INVALID_CREDENTIALS = 'Invalid credentials',
  LOGIN_MISSING_AUTH_HEADER = 'Missing or invalid Authorization header',
  LOGIN_MISSING_TOKEN = 'Missing access token',
  LOGIN_INVALID_TOKEN = 'Invalid or expired access token',
  LOGIN_USER_NOT_FOUND = 'User not found or not authorized',
  ACCESS_TOKEN_REFRESHED = 'Access token refreshed',
  PROFILE_FETCHED_SUCCESS = 'Profile fetched successfully',
}