/**
 * @param {Number} adminLevel
 * @param {Array<String>} propertyNames
 * @param {Boolean} hideNonEditable
 * 
 * @constructor 
 *
 * @properties={typeid:24,uuid:"2DBD05FC-EE43-40BE-B4E2-D3C123D64563"}
 */
function PropertyEditor(adminLevel, propertyNames, hideNonEditable) {
	
	/**
	 * Icon used if there is no icon for a property set
	 * 
	 * @type {String}
	 */
	var genericIconMedia = "media:///component_preferences_48.png";
	
	/**
	 * The main form name for the editor
	 * 
	 * @type {String}
	 */
	var formName = "svyPropertyEditor" + adminLevel;
	
	/**
	 * The style name used
	 * 
	 * @type {String}
	 */
	this.styleName = "svyPropertyEditor";
	
	/**
	 * Object for different settings of the main form containing 
	 * the list of property sets and property details for each set
	 */
	this.mainForm = { width: 1000, height: 600, styleClass: "main", splitPaneDividerSize: 4, splitPaneStyleClass: "main", preventHorizontalScrollbarInPropertySets: true };
	
	/**
	 * Object for different settings for the form containing the list of property sets:
	 * <ul>
	 * <li>width - The width of the list form</li>
	 * <li>styleClass - The style class for the form</li>
	 * <li>offsetTop - The offset from the top (y coordinate of the first entry)</li>
	 * <li>entrySpacing - The spacing between the entries</li>
	 * <li>textStyleClass - The style class for the text of the property set</li>
	 * <li>iconStyleClass - The style class for the icon of the property set</li>
	 * <li>selectionBgStyleClass - The style class for the background label used to highlight a selected property set</li>
	 * <li>textHeight - The height of the property set text</li>
	 * <li>iconX - The x coordinate of the icons</li>
	 * <li>textHeight - The height of the property set text</li>
	 * <li>iconHeight - The height of the icon</li>
	 * <li>iconWidth - The width of the icon</li>
	 * <li>iconTextSpacing - The spacing between icon and text</li>
	 * <li>iconMediaOptions - The media options for the icon</li>
	 * </ul>
	 */
	this.propertySetsForm = { 
		width: 250, 
		styleClass: "propertySets", 
		offsetTop: 10, 
		entrySpacing: 20,
		textStyleClass: "propertySetText", 
		iconStyleClass: "propertySetIcon", 
		selectionBgStyleClass: "propertySetSelectionBackground",
		textHeight: 30, 
		iconX: 10,
		iconHeight: 30, 
		iconWidth: 30, 
		iconTextSpacing: 10,
		iconMediaOptions: SM_MEDIAOPTION.ENLARGE | SM_MEDIAOPTION.REDUCE | SM_MEDIAOPTION.KEEPASPECT,
		rowHeight: function() { return Math.max(this.iconHeight, this.textHeight); }
	};
	
	this.propertyValuesForm = {
		width: function() { return this.mainForm.width - this.propertySetsForm.width },
		styleClass: "propertyValues",
		offsetTop: 10,
		entrySpacing: 10,
		textStyleClass: "propertyValueText",
		labelStyleClass: "propertyValueLabel",
		descriptionStyleClass: "propertyValueDescription",
		headerStyleClass: "propertyValueHeader",
		headerOffset: 10
	};
	
	this.getAdminLevel = function() {
		return adminLevel;
	}	
	
	this.getHideNonEditable = function() {
		return hideNonEditable;
	}	
	
	this.getFormName = function() {
		return formName;
	}
	
	this.getPropertyNames = function() {
		return propertyNames;
	}
	
	this.getGenericIcon = function() {
		return genericIconMedia;
	}
	
	this.createForm = function() {
		/** @type {PropertyEditor} */
		var _this = this;
		
		history.removeForm(formName);
		history.removeForm(formName + "_propertySets");
		
		solutionModel.removeForm(formName);
		solutionModel.removeForm(formName + "_propertySets");
		
		var mainForm = createEditor_mainForm(_this);
		var listForm = createEditor_propertySetForm(_this);
		
		/** @type {RuntimeSplitPane} */
		var runtimeSplitPane = forms[mainForm.name].elements["content"];
		runtimeSplitPane.setLeftForm(forms[listForm.name]);
		runtimeSplitPane.dividerSize = _this.mainForm.splitPaneDividerSize;
		runtimeSplitPane.dividerLocation = _this.propertySetsForm.width + runtimeSplitPane.dividerSize;
		if (_this.mainForm.preventHorizontalScrollbarInPropertySets) {
			runtimeSplitPane.leftFormMinSize = runtimeSplitPane.dividerLocation;
		}
		
		forms[mainForm.name]["propertyEditor"] = _this;
		forms[mainForm.name]["adminLevel"] = adminLevel;
		
		createEditor_detailForm(null, _this.getFormName() + "_propertySets");		
		
		return forms[mainForm.name];
	}
	
	this.showInWindow = function() {
		/** @type {PropertyEditor} */
		var _this = this;
		
		var runtimeForm = _this.createForm();
		application.createWindow(runtimeForm.controller.getName(), JSWindow.MODAL_DIALOG).show(runtimeForm);
	}
}

/**
 * @param {PropertyEditor} propertyEditor
 * 
 * @private 
 * 
 * @author patrick
 * @date 25.10.2012
 * 
 * @properties={typeid:24,uuid:"CA5AE77C-F074-4177-9623-7AC4611418CC"}
 */
function createEditor_mainForm(propertyEditor) {
	var formName = propertyEditor.getFormName();
	var jsForm = solutionModel.getForm(formName);
	if (!jsForm) {
		jsForm = solutionModel.newForm(formName, null, propertyEditor.styleName, false, propertyEditor.mainForm.width, propertyEditor.mainForm.height);
		jsForm.navigator = SM_DEFAULTS.NONE;
		jsForm.view = JSForm.LOCKED_RECORD_VIEW;
		jsForm.styleName = propertyEditor.styleName;
		jsForm.styleClass = propertyEditor.styleName;
	}
	
	// create "propertyEditor" variable
	jsForm.newVariable("propertyEditor", JSVariable.MEDIA);
	// create "adminLevel" variable
	jsForm.newVariable("adminLevel", JSVariable.INTEGER);
	
	var splitPane = jsForm.newTabPanel("content", 0, 0, propertyEditor.mainForm.width, propertyEditor.mainForm.height);
	splitPane.anchors = SM_ANCHOR.ALL;
	splitPane.tabOrientation = SM_ALIGNMENT.SPLIT_HORIZONTAL;
	splitPane.styleClass = propertyEditor.mainForm.splitPaneStyleClass;
	
	return jsForm;
}

/**
 * @param {PropertyEditor} propertyEditor
 * 
 * @private 
 * 
 * @author patrick
 * @date 25.10.2012
 * 
 * @properties={typeid:24,uuid:"B3DBA6B8-E194-47C2-AFFB-E354D4A7F6F5"}
 */
function createEditor_propertySetForm(propertyEditor) {
	var formName = propertyEditor.getFormName() + "_propertySets";
	var formSettings = propertyEditor.propertySetsForm;
	var jsForm = solutionModel.getForm(formName);
	if (!jsForm) {
		jsForm = solutionModel.newForm(formName, null, propertyEditor.styleName, false, formSettings.width, 0);
		jsForm.navigator = SM_DEFAULTS.NONE;
		jsForm.view = JSForm.LOCKED_RECORD_VIEW;
		jsForm.styleName = propertyEditor.styleName;
		jsForm.styleClass = formSettings.styleClass;
	}
	
	// Create a var to hold the selected property
	var selectedVar = jsForm.newVariable("selectedPropertySetId", JSVariable.TEXT);
	
	var onActionMethod = solutionModel.getGlobalMethod("svyPropertyEditor", "onPropertySelected");
	
	/**
	 * @param {JSRecord<db:/svy_framework/nav_property_sets>} record
	 * @param {Number} index
	 */
	function createSetLabels(record, index) {
		// Create selected label
		var jsLabel = jsForm.newLabel(
			"", 
			formSettings.iconX - 5, 
			formSettings.offsetTop + ((index - 1) * formSettings.entrySpacing) + (index - 1) * formSettings.rowHeight() - 5, 
			formSettings.width - (2 * 5), 
			formSettings.rowHeight() + 10);
		jsLabel.visible = i == 1 ? true : false;
		jsLabel.styleClass = formSettings.selectionBgStyleClass;
		jsLabel.name = utils.stringReplace("lblBg_" + record.nav_property_sets_id.toString(), "-", "_");		
			
		// Create label for icon
		jsLabel = jsForm.newLabel(
			"", 
			formSettings.iconX, 
			formSettings.offsetTop + ((index - 1) * formSettings.entrySpacing) + (index - 1) * formSettings.iconHeight, 
			formSettings.iconWidth, 
			formSettings.iconHeight);
		jsLabel.styleClass = formSettings.iconStyleClass;
		if (record.icon) {
			jsLabel.imageMedia = solutionModel.getMedia(record.icon.replace("media:///", ""));
		} else {
			jsLabel.imageMedia = solutionModel.getMedia(propertyEditor.getGenericIcon().replace("media:///", ""));
		}
		jsLabel.mediaOptions = formSettings.iconMediaOptions;
		jsLabel.showClick = false;
		
		// Create label for text
		jsLabel = jsForm.newLabel(
			record.display_name ? record.display_name : record.name, 
			formSettings.iconX + formSettings.iconWidth + formSettings.iconTextSpacing, 
			formSettings.offsetTop + ((index - 1) * formSettings.entrySpacing) + (index - 1) * formSettings.iconHeight,
			formSettings.width - (2 * formSettings.iconX) - formSettings.iconWidth - formSettings.iconTextSpacing, 
			formSettings.textHeight);
		jsLabel.anchors = SM_ANCHOR.NORTH | SM_ANCHOR.EAST | SM_ANCHOR.WEST;
		jsLabel.styleClass = formSettings.textStyleClass;
		jsLabel.showClick = false;
		
		// Create label for click action
		jsLabel = jsForm.newLabel(
			"", 
			formSettings.iconX - 5, 
			formSettings.offsetTop + ((index - 1) * formSettings.entrySpacing) + (index - 1) * formSettings.rowHeight() - 5, 
			formSettings.width - (2 * 5), 
			formSettings.rowHeight() + 10);
		jsLabel.transparent = true;
		jsLabel.name = utils.stringReplace(record.nav_property_sets_id.toString(), "-", "_");
		if (i == 1) {
			selectedVar.defaultValue = "\"" + utils.stringReplace(record.nav_property_sets_id.toString(), "_", "-") + "\"";
		}
		jsLabel.onAction = onActionMethod;
		jsLabel.showClick = false;
		jsLabel.showFocus = false;		
	}
	
	var fs = loadPropertySets(propertyEditor.getPropertyNames(), propertyEditor.getHideNonEditable(), propertyEditor.getAdminLevel());
	
	if (!utils.hasRecords(fs)) {
		// TODO: what then?
		return null;
	}
	
	for (var i = 1; i <= fs.getSize(); i++) {
		/** @type {JSRecord<db:/svy_framework/nav_property_sets>} */
		var propSetRecord = fs.getRecord(i);
		createSetLabels(propSetRecord, i);
	}
	
	jsForm.getBodyPart().height = formSettings.offsetTop * 2 + i * formSettings.rowHeight() + i * formSettings.entrySpacing;
	
	return jsForm;
}

/**
 * @param {JSEvent} event
 * @param {String} [formName]
 * 
 * @private 
 *
 * @properties={typeid:24,uuid:"BEC589B3-1E83-4EF0-A151-2AC709794EFD"}
 */
function createEditor_detailForm(event, formName) {
	var originatingFormName;
	if (event) {
		originatingFormName = event.getFormName();
	} else if (formName) {
		originatingFormName = formName;
	} else {
		return;
	}
	var mainForm = forms[utils.stringReplace(originatingFormName, "_propertySets", "")];
	var propertySetId = forms[originatingFormName]["selectedPropertySetId"];
	
	/** @type {PropertyEditor} */
	var propertyEditor = mainForm["propertyEditor"];	
	
	var propertyDescription = scopes.svyProperties.getPropertySetById(propertySetId);
	if (propertyDescription.formName) {
		var propForm = solutionModel.getForm(propertyDescription.formName);
		if (propForm.extendsForm == solutionModel.getForm("AbstractProperty")) {
			/** @type {RuntimeForm<AbstractPropertyDef>} */
			var form = forms[propertyDescription.formName];
			form.initPropertyForm();
		}
		mainForm.elements["content"].setRightForm(forms[propertyDescription.formName]);
		return;
	}	
	var valuesFormName = mainForm.controller.getName() + "_propertyValues_" + utils.stringReplace(propertySetId, "-", "_");
	if (forms[valuesFormName]) {
		var currValues = scopes.svyProperties.getRuntimeProperties(propertyEditor.getAdminLevel(), propertyNames);
		for (var cv = 0; cv < currValues.length; cv++) {
			var valueVarName = propertyValues[cv].propertyValueName.toLowerCase().replace(/ /g,"_");
			forms[valuesFormName][valueVarName] = propertyValues[cv].value;
		}
		mainForm.elements["content"].setRightForm(forms[valuesFormName]);
		return;
	}
	
	var styleName = propertyEditor.styleName;
	var styleParser = new scopes.svyUtils.StyleParser(styleName);
	
	var textHeight = scopes.svyUtils.getTextHeight(styleParser.getFontString("label.propertyValueLabel")) + 2;
	textHeight = Math.ceil(textHeight / 5) * 5;
	
	var headerTextHeight = scopes.svyUtils.getTextHeight(styleParser.getFontString("label.propertyValueHeader")) + 2;
	headerTextHeight = Math.ceil(headerTextHeight / 5) * 5;
	
	// load properties
	/** @type {QBSelect<db:/svy_framework/nav_property>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/nav_property");
	query.result.addPk();
	query.where.add(query.columns.nav_property_sets_id.eq(propertySetId));
	if (propertyEditor.getHideNonEditable()) {
		query.where.add(query.columns.admin_level.le(mainForm["adminLevel"]));
	}
	if (propertyEditor.getPropertyNames()) {
		query.where.add(query.columns.property_name.isin(propertyEditor.getPropertyNames()));
	}
	query.sort.add(query.columns.sort_order.asc);
	
	/** @type {JSFoundSet<db:/svy_framework/nav_property>} */
	var fs = databaseManager.getFoundSet(query);
	
	var jsForm = solutionModel.newForm(valuesFormName, null, styleName, false, 400, 10);
	jsForm.navigator = SM_DEFAULTS.NONE;
	jsForm.view = JSForm.LOCKED_RECORD_VIEW;
	
	// Calculate dimensions
	var labelWidth = 0;
	/** @type {Array<scopes.svyProperties.PropertyValue>} */
	var propDescArray;
	var record, labelText;
	
	/** @type {scopes.svyProperties.PropertyValue} */
	var propDesc;
	
	/**
	 * @param {scopes.svyProperties.PropertyValue} v1
	 * @param {scopes.svyProperties.PropertyValue} v2
	 * @return {Object}
	 */
	function sortPropertDescArray(v1, v2) {
		if (v1.sortOrder > v2.sortOrder) {
			return 1;
		} else if (v1.sortOrder < v2.sortOrder) {
			return -1;
		} else {
			return 0;
		}
	}
	
	/** @type {Array<String>} */
	var propertyNames = new Array();
	
	for (var i = 1; i <= fs.getSize(); i++) {
		record = fs.getRecord(i);
		propDescArray = record.value_description;
		propDescArray.sort(sortPropertDescArray);
		for (var j = 0; j < propDescArray.length; j++) {
			propDesc = propDescArray[j];
			propertyNames.push(propDesc.name);
			if (propDesc.displayType == JSField.CHECKS) {
				continue;
			}
			labelText = propDesc.label;
			if (!labelText) {
				labelText = propDesc.name;
			}
			var textWidth = scopes.svyUtils.getTextWidth(styleParser.getFontString("label"), labelText);
			if (textWidth > labelWidth) {
				labelWidth = textWidth;
			}
		}
	}
	
	labelWidth = Math.ceil(labelWidth / 5) * 5;
	
	var propertyValues = scopes.svyProperties.getRuntimeProperties(propertyEditor.getAdminLevel(), propertyNames);
	
	// Create items
	var fieldOffset = 10;
	var formMargin = 10;
	
	if (labelWidth < ((jsForm.width - 2 * formMargin) * 0.3)) {
		labelWidth = (jsForm.width - 2 * formMargin) * 0.3;
		labelWidth = Math.ceil(labelWidth / 5) * 5;
	}	
	
	var fieldPositionX = formMargin + labelWidth + fieldOffset;
	var fieldWidth = jsForm.width - fieldPositionX - formMargin;
	var positionY = 15;
	
	var onDataChangeMethod = jsForm.newMethod("function onDataChange(oldValue, newValue, event, propertyName, propertyValue) { scopes.svyProperties.setPropertyValue(propertyName, newValue, forms." + mainForm.controller.getName() + ".adminLevel); }");
	
	for (i = 1; i <= fs.getSize(); i++) {
		record = fs.getRecord(i);
		propDescArray = record.value_description;
		
		if (propDescArray.length > 1) {
			// more than one value; create header
			var jsHeaderLabel = jsForm.newLabel(record.header_text ? record.header_text : record.property_name, formMargin, positionY + (i > 1 ? 5 : 0), jsForm.width - (2 * formMargin), textHeight);
			jsHeaderLabel.anchors = SM_ANCHOR.WEST | SM_ANCHOR.NORTH | SM_ANCHOR.EAST;
			jsHeaderLabel.styleClass = propertyEditor.propertyValuesForm.headerStyleClass;
			positionY += headerTextHeight + propertyEditor.propertyValuesForm.headerOffset;
		}
		
		for (j = 0; j < propDescArray.length; j++) {
			propDesc = propDescArray[j];
			
			labelText = propDesc.label;
			if (!labelText) {
				labelText = propDesc.name;
			}
			
			var varName = propDesc.name.toLowerCase().replace(/ /g,"_");
			var jsVar = jsForm.newVariable(varName, propDesc.dataType ? propDesc.dataType : JSVariable.TEXT);
			
			var jsComp;
			if (propDesc.displayType == JSField.CHECKS) {
				// no label
				jsComp = jsForm.newCheck(jsVar, formMargin, positionY, jsForm.width - (2 * formMargin), textHeight);
				jsComp.titleText = labelText;
			} else {
				var jsLabel = jsForm.newLabel(labelText, formMargin, positionY, labelWidth, textHeight);
				
				switch (propDesc.displayType) {
					case JSField.CALENDAR:
						jsComp = jsForm.newCalendar(jsVar, fieldPositionX, positionY, fieldWidth, textHeight);
						break;
					case JSField.COMBOBOX:
						jsComp = jsForm.newComboBox(jsVar, fieldPositionX, positionY, fieldWidth, textHeight);
						jsComp.editable = false;
						break;
					case JSField.PASSWORD:
						jsComp = jsForm.newPassword(jsVar, fieldPositionX, positionY, fieldWidth, textHeight);
						break;
					case JSField.RADIOS:
						jsComp = jsForm.newRadios(jsVar, fieldPositionX, positionY, fieldWidth, textHeight);
						break;
					case JSField.RTF_AREA:
						jsComp = jsForm.newRtfArea(jsVar, fieldPositionX, positionY, fieldWidth, textHeight);
						break;
					case JSField.TEXT_AREA:
						jsComp = jsForm.newTextArea(jsVar, fieldPositionX, positionY, fieldWidth, textHeight * 2.5);
						positionY += textHeight * 2.5 - textHeight;
						break;
					case JSField.TYPE_AHEAD:
						jsComp = jsForm.newTypeAhead(jsVar, fieldPositionX, positionY, fieldWidth, textHeight);
						break;
					default:
						jsComp = jsForm.newTextField(jsVar, fieldPositionX, positionY, fieldWidth, textHeight);
						break;
				}
				
				if (propDesc.valueListName) {
					jsComp.valuelist = solutionModel.getValueList(propDesc.valueListName);
				}
				if (propDesc.valueListValues) {
					jsComp.valuelist = solutionModel.newValueList("valuelist_" + varName, JSValueList.CUSTOM_VALUES);
					jsComp.valuelist.customValues = propDesc.valueListValues.join("\n");
				}
				
				if (propDesc.dataType == JSVariable.INTEGER) {
					jsComp.format = "#,###|####";
				} else if (propDesc.dataType == JSVariable.NUMBER) {
					jsComp.format = "#,###.#|####.#";
				}
				
				jsLabel.labelFor = varName;
			}
				
			if (propDesc.securityLevel > mainForm["adminLevel"]) {
				jsComp.enabled = false;
				jsComp.editable = false;
			}
				
			jsComp.styleClass = propertyEditor.propertyValuesForm.textStyleClass;
			jsComp.anchors = SM_ANCHOR.NORTH | SM_ANCHOR.WEST | SM_ANCHOR.EAST;
			jsComp.name = varName;
			jsComp.scrollbars = SM_SCROLLBAR.HORIZONTAL_SCROLLBAR_NEVER;		
			
			jsComp.onDataChange = solutionModel.wrapMethodWithArguments(onDataChangeMethod, [null, null, null, "'" + propDesc.name + "'", null]);
			
			positionY += textHeight + 5;
		}
		
		if (propDescArray.length > 1) {
			// add some offset
			positionY += 10;
		}
		
		jsForm.getBodyPart().height = positionY + 10;
	}
	
	for (var pv = 0; pv < propertyValues.length; pv++) {
		varName = propertyValues[pv].propertyValueName.toLowerCase().replace(/ /g,"_");
		forms[valuesFormName][varName] = propertyValues[pv].value;
	}
	
	mainForm.elements["content"].setRightForm(forms[valuesFormName]);
}

/**
 * Loads all property sets<p>
 * 
 * If propertyNames are given, the foundset is limited to the sets that have properties with the given names<br>
 * If hideNonEditable is <code>true</code> and the adminLevel is given, the foundset is limited to the properties that can be edited with the given adminLevel
 * 
 * @param {Array<String>} [propertyNames]	- optional names of properties that could limit the property sets returned
 * @param {Boolean} [hideNonEditable]		- if <code>true</code> only property sets that have at least one editable property are returned
 * @param {Number} [adminLevel]				- required if <code>hideNonEditable</code> is true
 * 
 * @return {JSFoundSet<db:/svy_framework/nav_property_sets>}
 * 
 * @private 
 * 
 * @author patrick
 * @date 25.10.2012
 *
 * @properties={typeid:24,uuid:"41A63F48-F22A-41C6-9F7D-57DA6A3FB7D4"}
 */
function loadPropertySets(propertyNames, hideNonEditable, adminLevel) {
	/** @type {QBSelect<db:/svy_framework/nav_property_sets>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/nav_property_sets");
	query.result.addPk();
	
	if ((propertyNames && propertyNames.length > 0) || (hideNonEditable && adminLevel >= 0)) {
		/** @type {QBJoin<db:/svy_framework/nav_property>} */
		var joinProperties = query.joins.add("db:/" + globals.nav_db_framework + "/nav_property", JSRelation.INNER_JOIN);
		joinProperties.on.add(query.columns.nav_property_sets_id.eq(joinProperties.columns.nav_property_sets_id));
		if (propertyNames && propertyNames.length > 0) {
			query.where.add(joinProperties.columns.property_name.isin(propertyNames));
		}
		if (hideNonEditable && adminLevel >= 0) {
			query.where.add(joinProperties.columns.admin_level.le(adminLevel));
		}
	}
	
	query.sort.add(query.columns.sort_order.asc);
	
	/** @type {JSFoundSet<db:/svy_framework/nav_property_sets>} */
	var fs = databaseManager.getFoundSet(query);
	return fs;
	
}

/**
 * @param {JSEvent} event
 * @param {Object} propertyEditor
 * 
 * @private 
 *
 * @properties={typeid:24,uuid:"05AA1ADD-98EA-4346-93D0-7300732327E6"}
 */
function onPropertySelected(event, propertyEditor) {
	var form = forms[event.getFormName()];
	var oldId = form["selectedPropertySetId"];
	var newId = utils.stringReplace(event.getElementName(), "_", "-");
	
	if (oldId == newId) {
		return;
	}
	
	form["selectedPropertySetId"] = newId;
	
	// Toggle highlighting
	form.elements["lblBg_" + utils.stringReplace(oldId, "-", "_")].visible = false;
	form.elements["lblBg_" + utils.stringReplace(newId, "-", "_")].visible = true;
	
	createEditor_detailForm(event);
}