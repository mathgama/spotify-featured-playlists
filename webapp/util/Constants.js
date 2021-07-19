const Settings = {
  SSO_AUTHORIZE_ENDPOINT: 'https://accounts.spotify.com/authorize',
  CLIENT_ID: 'https://accounts.spotify.com/authorize',
  REDIRECT_URI: 'http://spotify-featured-playlists.cfapps.us10.hana.ondemand.com/webapp/',
  FEATURED_PLAYLISTS_URL: 'https://api.spotify.com/v1/browse/featured-playlists',
  MOCK_FILTERS_URI: 'https://www.mocky.io/v2/5a25fade2e0000213aa90776'
}

sap.ui.define([], () => {
  'use strict'

  return { Settings }
})
