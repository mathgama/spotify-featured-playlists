sap.ui.define(
  [
    'sap/ui/Device',
    'sap/m/MessageToast',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'spotifyfeaturedplaylists/util/Constants'
  ],
  (Device, MessageToast, Controller, Filter, FilterOperator, JSONModel, Constants) => {
    'use strict'
    let INSTANCE = {}

    const { Settings } = Constants
    const getModel = (model) => INSTANCE.getView().getModel(model)
    const setModel = (value, model) => INSTANCE.getView().setModel(new JSONModel(value), model)
    const setModelProperty = (model, prop, value) => getModel(model).setProperty(prop, value)

    return Controller.extend('spotifyfeaturedplaylists.controller.App', {
      onInit: function () {
        INSTANCE = this

        INSTANCE.searchFilters = []
        INSTANCE.aTabFilters = []

        setModel({ isMobile: Device.browser.mobile, busy: false }, 'view')
        setModel(Settings.MOCK_FILTERS_URI, 'filters')

        getModel('filters').attachRequestCompleted(INSTANCE._buildDynamicFilterBar, this)

        if (!window.location.hash) {
          INSTANCE._spotifyAuth()
          return
        }
        const sSpotifyParameters = INSTANCE._getReturnedParametersFromSpotify(window.location.hash)
        getModel('user').setProperty('/spotifyParameters', sSpotifyParameters)
        INSTANCE._spotifyAPICall()
      },

      _getReturnedParametersFromSpotify: (hash) => {
        const sStringAfterHash = hash.substring(1)
        const sParamsInUrl = sStringAfterHash.split('&')
        const sParamsSplitUp = sParamsInUrl.reduce((accumulator, currentValue) => {
          const [key, value] = currentValue.split('=')
          accumulator[key] = value
          return accumulator
        }, {})

        return sParamsSplitUp
      },

      _buildDynamicFilterBar: (response) => {
        const oFilterBar = INSTANCE.byId('api_filter_bar')
        let oFilterItem, oControl

        for (const filter of response.oSource.oData.filters) {
          oFilterItem = new sap.ui.comp.filterbar.FilterGroupItem({
            groupName: 'Unique',
            name: filter.id,
            label: filter.name,
            partOfCurrentVariant: true,
            visibleInFilterBar: true
          })

          if (filter.values) {
            oControl = new sap.m.ComboBox(filter.id, { selectedKey: `{filters>/${filter.id}}` })
            for (const option of filter.values) {
              oControl.addItem(
                new sap.ui.core.Item({
                  key: option.value,
                  text: option.name
                })
              )
            }
          } else {
            const map = {
              STRING: 'text',
              INTEGER: 'Number'
            }
            let type = map[filter.validation.primitiveType] ?? map.text
            const value = `{filters>/${filter.id}}`
            const valueFormat = 'yyyy-MM-ddTHH:mm:ss'

            filter.validation.entityType === 'DATE_TIME'
              ? (oControl = new sap.m.DateTimePicker(filter.id, { value, valueFormat }))
              : (oControl = new sap.m.Input(filter.id, { type, value }))
          }

          oControl.attachChange(INSTANCE.onFBSearch, this)
          oFilterItem.setControl(oControl)
          oFilterBar.addFilterGroupItem(oFilterItem)
        }
      },

      onFBSearch: () => INSTANCE._spotifyAPICall(),

      _spotifyAPICall: async () => {
        setModelProperty('view', '/busy', true)

        const oModelFilters = getModel('filters')
        const data = {}

        if (oModelFilters.getProperty('/locale')) data['locale'] = oModelFilters.getProperty('/locale')
        if (oModelFilters.getProperty('/country')) data['country'] = oModelFilters.getProperty('/country')
        if (oModelFilters.getProperty('/limit')) data['limit'] = oModelFilters.getProperty('/limit')
        if (oModelFilters.getProperty('/timestamp')) data['timestamp'] = oModelFilters.getProperty('/timestamp')
        if (oModelFilters.getProperty('/offset')) data['offset'] = oModelFilters.getProperty('/offset')

        const searchParams = new URLSearchParams(data)

        try {
          const token = getModel('user').getProperty('/spotifyParameters').access_token
          const response = await fetch(Settings.FEATURED_PLAYLISTS_URL + '?' + searchParams, {
            headers: { Authorization: `Bearer ${token}` },
            data
          })
          const { playlists } = await response.json()
          setModel(playlists, 'playlists')

          if (!response.ok) MessageToast.show('Erro ao buscar informações para os parâmetros informados.')
        } catch (error) {
          setModel({}, 'playlists')
          MessageToast.show('Erro ao buscar informações para os parâmetros informados.')
        }
        setModelProperty('view', '/busy', false)
      },

      onSearch: (oEvent) => {
        // First reset current filters
        INSTANCE.searchFilters = []

        // add filter for search
        INSTANCE.sSearchQuery = oEvent.getSource().getValue()
        if (INSTANCE.sSearchQuery && INSTANCE.sSearchQuery.length > 0) {
          const filter = new Filter('name', FilterOperator.Contains, INSTANCE.sSearchQuery)
          INSTANCE.searchFilters.push(filter)
        }

        INSTANCE._applyListFilters()
      },

      _applyListFilters: () => {
        const oList = INSTANCE.byId('playlistList')
        const oBinding = oList.getBinding('items')

        oBinding.filter(INSTANCE.searchFilters, 'playlists')

        /*
        let filterText
        if (INSTANCE.sSearchQuery) {
         const oResourceBundle = getModel('i18n').getResourceBundle()
          filterText = oResourceBundle.getText('itemsContaining', [INSTANCE.sSearchQuery])
        }

        setViewProperty('/filterText', filterText)
        */
      },

      _spotifyAuth: () => {
        window.location = `${Settings.SSO_AUTHORIZE_ENDPOINT}?client_id=${Settings.CLIENT_ID}&redirect_uri=${Settings.REDIRECT_URI}&response_type=token`
      }
    })
  }
)
