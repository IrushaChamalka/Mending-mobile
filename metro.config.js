// Expo's default Metro config plus Sentry: Debug IDs in bundles and source maps, so production
// stack traces can be symbolicated.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
