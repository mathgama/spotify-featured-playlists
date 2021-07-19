sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel"
], function(Device, Controller, Filter, FilterOperator, JSONModel) {
	"use strict";

	return Controller.extend("spotifyfeaturedplaylists.controller.App", {

		onInit: function() {
			this.aSearchFilters = [];
			this.aTabFilters = [];

			this.getView().setModel(new JSONModel({
				isMobile: Device.browser.mobile,
				filterText: undefined,
				busy: false
			}), "view");

			this.getView().setModel(new JSONModel(
				"https://www.mocky.io/v2/5a25fade2e0000213aa90776"
			), "filters");

			this.getView().getModel("filters").attachRequestCompleted(this._buildDynamicFilterBar, this);

			if(!window.location.hash) {
				this._spotifyAuth();
			} else {
				const sSpotifyParameters = this._getReturnedParametersFromSpotify(window.location.hash);
				this.getView().getModel("user").setProperty("/spotifyParameters", sSpotifyParameters);
				this._spotifyAPICall();
			}
		},

		_getReturnedParametersFromSpotify: function(hash) {
			const sStringAfterHash = hash.substring(1);
			const sParamsInUrl = sStringAfterHash.split("&");
			const sParamsSplitUp = sParamsInUrl.reduce((accumulator, currentValue) => {
				const [key, value] = currentValue.split("=");
				accumulator[key] = value;
				return accumulator;
			}, {});

			return sParamsSplitUp;
		},

		_buildDynamicFilterBar: function(response) {
			var oFilterBar = this.byId("api_filter_bar");
			var oFilterItem, oControl;
			
			for(const filter of response.oSource.oData.filters) {
				oFilterItem = new sap.ui.comp.filterbar.FilterGroupItem({
					groupName: "Unique",
					name: filter.id,
					label: filter.name,
					partOfCurrentVariant: true,
					visibleInFilterBar: true,
				});

				if(filter.values) {
					oControl = new sap.m.ComboBox(filter.id, {
						selectedKey: `{filters>/${filter.id}}`
					});

					for(const option of filter.values) {
						oControl.addItem( new sap.ui.core.Item({
							key: option.value,
							text: option.name
						}) );
					}
				} else {
					var sInputType;

					switch(filter.validation.primitiveType) {
						case "STRING": 
							sInputType = "Text";
							break;
						case "INTEGER":
							sInputType = "Number";
							break;
						default:
							sInputType = "Text";
					}

					if(filter.validation.entityType == "DATE_TIME")
						oControl = new sap.m.DateTimePicker(filter.id, {
							value: `{filters>/${filter.id}}`,
							valueFormat: "yyyy-MM-ddTHH:mm:ss"
						});
					else
						oControl = new sap.m.Input(filter.id, {
							type: sInputType,
							value: `{filters>/${filter.id}}`
						});
				}

				oControl.attachChange(this.onFBSearch, this);
				oFilterItem.setControl(oControl);
				oFilterBar.addFilterGroupItem(oFilterItem);
			}
		},

		onFBSearch: function(oEvent) {
			this._spotifyAPICall();
		},

		_spotifyAPICall: function() {
			this.getView().getModel("view").setProperty("/busy", true);

			const oModelFilters = this.getView().getModel("filters");
			const oFilterParams = {};

			// [TODO] Melhorar forma de fazer isso
			if(oModelFilters.getProperty("/locale"))
				oFilterParams["locale"] = oModelFilters.getProperty("/locale");

			if(oModelFilters.getProperty("/country"))
				oFilterParams["country"] = oModelFilters.getProperty("/country");

			if(oModelFilters.getProperty("/limit"))
				oFilterParams["limit"] = oModelFilters.getProperty("/limit");

			if(oModelFilters.getProperty("/timestamp"))
				oFilterParams["timestamp"] = oModelFilters.getProperty("/timestamp");

			if(oModelFilters.getProperty("/offset"))
				oFilterParams["offset"] = oModelFilters.getProperty("/offset");

			$.ajax({
				url: "https://api.spotify.com/v1/browse/featured-playlists",
				method: "GET",
				headers: {
					"Authorization": `Bearer ${this.getView().getModel("user").getProperty("/spotifyParameters").access_token}`
				},
				data: oFilterParams,
				success: function(sResult) {
					this.getView().setModel(new JSONModel(sResult.playlists), "playlists");
					this.getView().getModel("view").setProperty("/busy", false);
				}.bind(this),
				statusCode: {
					401: function() {
						alert( "Erro ao se autenticar no Spotify." );
						const redirectUri = "https://spotify-featured-playlists.cfapps.us10.hana.ondemand.com/webapp/";
						window.location = redirectUri;
					}
				}
			});
		},

		onSearch: function(oEvent) {
			// First reset current filters
			this.aSearchFilters = [];

			// add filter for search
			this.sSearchQuery = oEvent.getSource().getValue();
			if (this.sSearchQuery && this.sSearchQuery.length > 0) {
				var filter = new Filter("name", FilterOperator.Contains, this.sSearchQuery);
				this.aSearchFilters.push(filter);
			}

			this._applyListFilters();
		},

		_applyListFilters: function() {
			var oList = this.byId("playlistList");
			var oBinding = oList.getBinding("items");

			oBinding.filter(this.aSearchFilters, "playlists");

			var sI18nKey;
			if (this.sSearchQuery) {
				sI18nKey = "itemsContaining";
			}

			var sFilterText;
			if (sI18nKey) {
				var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
				sFilterText = oResourceBundle.getText(sI18nKey, [this.sSearchQuery]);
			}

			this.getView().getModel("view").setProperty("/filterText", sFilterText);
		},

		_spotifyAuth: function(oEvent) {
			const endpointUrl = "https://accounts.spotify.com/authorize";
			const clientId = "16e8f02bf37d4aa9abf7d881e396733e";
			const redirectUri = "http://spotify-featured-playlists.cfapps.us10.hana.ondemand.com/webapp/";
			
			window.location = `${endpointUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token`;
		}

	});

});