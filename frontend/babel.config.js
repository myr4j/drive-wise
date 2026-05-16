/**
 * Expo SDK 54 — no Reanimated, no worklets plugin.
 * Animations are powered by React Native's built-in Animated API,
 * which requires no babel transforms.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
