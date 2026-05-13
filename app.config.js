const { expo } = require('./app.json');

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  process.env.MAPS_API_KEY?.trim() ||
  '';

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      config: {
        ...(expo.android?.config ?? {}),
        ...(googleMapsApiKey
          ? {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            }
          : {}),
      },
    },
    extra: {
      ...(expo.extra ?? {}),
      googleMapsConfigured: Boolean(googleMapsApiKey),
    },
  },
};
