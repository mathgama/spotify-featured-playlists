const Settings = {
  CLIENT_ID: '16e8f02bf37d4aa9abf7d881e396733e',
  REDIRECT_URI: 'http://localhost:8080/index.html',
  SSO_AUTHORIZE_ENDPOINT: 'https://accounts.spotify.com/authorize',
  FEATURED_PLAYLISTS_URL: 'https://api.spotify.com/v1/browse/featured-playlists',
  MOCK_FILTERS_URI: 'https://www.mocky.io/v2/5a25fade2e0000213aa90776'
}

sap.ui.define([], () => {
  'use strict'

  return { Settings }
})
