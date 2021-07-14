sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel"
], function(Device, Controller, Fragment, Filter, FilterOperator, JSONModel) {
	"use strict";

	return Controller.extend("ifood.controller.App", {

		onInit: function() {
			this.aSearchFilters = [];
			this.aTabFilters = [];

			this.getView().setModel(new JSONModel({
				isMobile: Device.browser.mobile,
				filterText: undefined
			}), "view");

			this.getView().setModel(new JSONModel(
				"http://www.mocky.io/v2/5a25fade2e0000213aa90776"
			), "filters");

			this.getView().getModel("filters").attachRequestCompleted(this._buildDynamicFilterBar, this);
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
					visibleInFilterBar: true
				});

				if(filter.values) {
					oControl = new sap.m.ComboBox(filter.id);

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
						oControl = new sap.m.DateTimePicker(filter.id);
					else
						oControl = new sap.m.Input(filter.id, {
							type: sInputType
						});
				}

				oFilterItem.setControl(oControl);
				oFilterBar.addFilterGroupItem(oFilterItem);
			}
		},

		/**
		 * Adds a new todo item to the bottom of the list.
		 
		addTodo: function() {
			var oModel = this.getView().getModel();
			var aTodos = oModel.getProperty("/todos").map(function (oTodo) { return Object.assign({}, oTodo); });

			aTodos.push({
				title: oModel.getProperty("/newTodo"),
				completed: false
			});

			oModel.setProperty("/todos", aTodos);
			oModel.setProperty("/newTodo", "");
		},
		*/

		/**
		 * Removes all completed items from the todo list.
		 
		clearCompleted: function() {
			var oModel = this.getView().getModel();
			var aTodos = oModel.getProperty("/todos").map(function (oTodo) { return Object.assign({}, oTodo); });

			var i = aTodos.length;
			while (i--) {
				var oTodo = aTodos[i];
				if (oTodo.completed) {
					aTodos.splice(i, 1);
				}
			}

			oModel.setProperty("/todos", aTodos);
		},
		*/

		/**
		 * Updates the number of items not yet completed
		 
		updateItemsLeftCount: function() {
			var oModel = this.getView().getModel();
			var aTodos = oModel.getProperty("/todos") || [];

			var iItemsLeft = aTodos.filter(function(oTodo) {
				return oTodo.completed !== true;
			}).length;

			oModel.setProperty("/itemsLeftCount", iItemsLeft);
		},
		*/

		onFBSearch: function(oEvent) {

			$.ajax({
				url: "https://api.spotify.com/v1/browse/featured-playlists",
				method: "GET",
				headers: {
					"Authorization": "Bearer {$code}"
				},
				data: {
					"country": "SE",
					"limit": "2"
				},
				success: function(sResult) {
					debugger;			
				}
			
			});
		},

		/**
		 * Trigger search for specific items. The removal of items is disable as long as the search is used.
		 * @param {sap.ui.base.Event} oEvent Input changed event
		 */
		onSearch: function(oEvent) {
			// First reset current filters
			this.aSearchFilters = [];

			// add filter for search
			this.sSearchQuery = oEvent.getSource().getValue();
			if (this.sSearchQuery && this.sSearchQuery.length > 0) {
				var filter = new Filter("title", FilterOperator.Contains, this.sSearchQuery);
				this.aSearchFilters.push(filter);
			}

			this._applyListFilters();
		},

		/*
		onFilter: function(oEvent) {
			// First reset current filters
			this.aTabFilters = [];

			// add filter for search
			this.sFilterKey = oEvent.getParameter("item").getKey();

			// eslint-disable-line default-case
			switch (this.sFilterKey) {
				case "active":
					this.aTabFilters.push(new Filter("completed", FilterOperator.EQ, false));
					break;
				case "completed":
					this.aTabFilters.push(new Filter("completed", FilterOperator.EQ, true));
					break;
				case "all":
				default:
					// Don't use any filter
			}

			this._applyListFilters();
		},
		*/

		_applyListFilters: function() {
			var oList = this.byId("playlistList");
			var oBinding = oList.getBinding("items");

			//oBinding.filter(this.aSearchFilters.concat(this.aTabFilters), "todos");
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

		onValueHelpRequest: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue(),
				oView = this.getView();

			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "ifood.view.ValueHelpDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}
			this._pValueHelpDialog.then(function(oDialog) {
				// Create a filter for the binding
				oDialog.getBinding("items").filter([new Filter("name", FilterOperator.Contains, sInputValue)]);
				// Open ValueHelpDialog filtered by the input's value
				oDialog.open(sInputValue);
			});
		},

		onValueHelpSearch: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var oFilter = new Filter("name", FilterOperator.Contains, sValue);

      oEvent.getSource().getBinding("items").filter([oFilter]);
    },

    onValueHelpClose: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      oEvent.getSource().getBinding("items").filter([]);

      if (!oSelectedItem) {
        return;
      }

      this.byId("localeInput").setValue(oSelectedItem.getTitle());
    },

	});

});