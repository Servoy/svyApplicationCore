/**
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"E5DC11E3-7403-4711-8E94-A644CA541207",variableType:4}
 */
var editorAdminLevel = null;

/**
 * @param {Number} adminLevel
 * @param {String} style
 * 
 * @properties={typeid:24,uuid:"A2213F7D-96F4-4709-919D-B8D61597A972"}
 */
function createPropertyEditor(adminLevel) {
	
	editorAdminLevel = adminLevel;
	
	history.removeForm("svyPropertyList");
	solutionModel.removeForm("svyPropertyList");
	
	// create list of property sets
	/** @type {QBSelect<db:/svy_framework/nav_property_sets>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/nav_property_sets");
	query.result.add(query.columns.nav_property_sets_id);
	query.result.add(query.columns.name);
	query.result.add(query.columns.display_name);
	query.result.add(query.columns.icon);
	query.sort.add(query.columns.sort_order);
	
	var dataset = databaseManager.getDataSetByQuery(query, -1);
	var dataSource = dataset.createDataSource("svyPropertyList");
	
	var jsFormList = solutionModel.newForm("svyPropertyList", dataSource, "pv", false, 200, 30);
	jsFormList.navigator = SM_DEFAULTS.NONE;
	jsFormList.view = JSForm.LOCKED_RECORD_VIEW;
	
	var selectedItemVar = jsFormList.newVariable("selectedItem", JSVariable.TEXT);
	
	var listOnActionMethod = jsFormList.newMethod("function onAction(event, entityName) { if (selectedItem) { elements[selectedItem].transparent = true; }; selectedItem = event.getElementName(); forms.svyPropsMain.showDetailForm(event, entityName); }");
	
	// Add labels for entities
	var labelY = 5;
	for (var i = 1; i <= dataset.getMaxRowIndex(); i++) {
		var iconLabel = jsFormList.newLabel(null, 10, labelY, 24, 30);
		iconLabel.imageMedia = solutionModel.getMedia(dataset.getValue(i, 4).replace("media:///", ""));
		iconLabel.mediaOptions = SM_MEDIAOPTION.ENLARGE | SM_MEDIAOPTION.REDUCE | SM_MEDIAOPTION.KEEPASPECT;
		iconLabel.transparent = true;
		iconLabel.horizontalAlignment = SM_ALIGNMENT.CENTER;
		iconLabel.verticalAlignment = SM_ALIGNMENT.CENTER;
		
		var listLabel = jsFormList.newLabel(dataset.getValue(i,3) ? dataset.getValue(i,3) : dataset.getValue(i,2), 45, labelY, 145, 30);
		listLabel.transparent = true;
		listLabel.anchors = SM_ANCHOR.NORTH | SM_ANCHOR.EAST | SM_ANCHOR.WEST;
		listLabel.onAction = solutionModel.wrapMethodWithArguments(listOnActionMethod, [null, "'" + dataset.getValue(i,1) + "'"]);
		listLabel.showClick = false;
		listLabel.horizontalAlignment = SM_ALIGNMENT.LEFT;
		listLabel.verticalAlignment = SM_ALIGNMENT.CENTER;
		listLabel.name = "lbl_" + dataset.getValue(i, 2);
		
		labelY += 40;
	}
	
	jsFormList.getBodyPart().height = labelY + 5;
	
	elements.tabs.setLeftForm(forms[jsFormList.name]);
	elements.tabs.dividerLocation = 200;
}

/**
 * @properties={typeid:24,uuid:"6016D55F-0EFA-4385-8CD6-D9247182E7C5"}
 */
function showEditor() {
	createPropertyEditor(scopes.svySecurityManager.ADMIN_LEVEL.NONE);
	application.createWindow("tmp",JSWindow.MODAL_DIALOG).show(controller.getName())
}

/**
 * @param {JSEvent} event
 * @param {String} propertySetId
 *
 * @properties={typeid:24,uuid:"3013F1A3-05FF-403D-8833-663FBDBA1565"}
 */
function showDetailForm(event, propertySetId) {
	forms[event.getFormName()].elements[event.getElementName()].bgcolor = '#8080ff';
	forms[event.getFormName()].elements[event.getElementName()].transparent = false;
	
	var propertyDescription = scopes.svyProperties.getPropertySetById(propertySetId);
	if (propertyDescription.formName) {
		var propForm = solutionModel.getForm(propertyDescription.formName);
		if (propForm.extendsForm == solutionModel.getForm("AbstractProperty")) {
			/** @type {RuntimeForm<AbstractProperty>} */
			var form = forms[propertyDescription.formName];
			form.initPropertyForm();
		}
		elements.tabs.setRightForm(forms[propertyDescription.formName]);
		return;
	}	
	var formName = "svyPropertyDetail_" + propertySetId;
	if (forms[formName]) {
		elements.tabs.setRightForm(forms[formName]);
		return;
	}
	
	var styleName = "pv";
	var styleParser = new scopes.svyUtils.StyleParser(styleName);
	var textHeight = scopes.svyUtils.getTextHeight(styleParser.getFontString("label")) + 2;
	textHeight = Math.ceil(textHeight / 5) * 5;
	
	// load properties
	/** @type {QBSelect<db:/svy_framework/nav_property>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/nav_property");
	query.result.addPk();
	query.where.add(query.columns.nav_property_sets_id.eq(propertySetId.toString()));
	query.sort.add(query.columns.sort_order.asc);
	
	/** @type {JSFoundSet<db:/svy_framework/nav_property>} */
	var fs = databaseManager.getFoundSet(query);
	
	var jsForm = solutionModel.newForm(formName, null, styleName, false, 400, 10);
	jsForm.navigator = SM_DEFAULTS.NONE;
	jsForm.view = JSForm.LOCKED_RECORD_VIEW;
	
	// Calculate dimensions
	var labelWidth = 0;
	/** @type {Array<scopes.svyProperties.PropertyValue>} */
	var propDescArray;
	var record, propDesc, labelText;
	
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
	
	for (var i = 1; i <= fs.getSize(); i++) {
		record = fs.getRecord(i);
		propDescArray = record.value_description;
		propDescArray.sort(sortPropertDescArray);
		for (var j = 0; j < propDescArray.length; j++) {
			propDesc = propDescArray[j];
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
	
	var onDataChangeMethod = jsForm.newMethod("function onDataChange(oldValue, newValue, event, propertyName, propertyValue) { scopes.svyProperties.setPropertyValue(propertyName, forms.svyPropsMain.editorAdminLevel, newValue); }");
	
	for (i = 1; i <= fs.getSize(); i++) {
		record = fs.getRecord(i);
		propDescArray = record.value_description;
		
		if (propDescArray.length > 1) {
			// more than one value; create header
			var jsHeaderLabel = jsForm.newLabel(record.header_text ? record.header_text : record.property_name, formMargin, positionY + (i > 1 ? 5 : 0), jsForm.width - (2 * formMargin), textHeight);
			jsHeaderLabel.anchors = SM_ANCHOR.WEST | SM_ANCHOR.NORTH | SM_ANCHOR.EAST;
			jsHeaderLabel.transparent = true;
			positionY += textHeight + 15;
		}
		
		for (j = 0; j < propDescArray.length; j++) {
			propDesc = propDescArray[j];
			
			labelText = propDesc.label;
			if (!labelText) {
				labelText = propDesc.name;
			}
			
			var varName = propDesc.name.toLowerCase().replace(/ /g,"_");
			var jsVar = jsForm.newVariable(varName, propDesc.dataType ? propDesc.dataType : JSVariable.TEXT);
			
			// TODO: remove when properly filled with values
			if (propDesc.value && jsVar.variableType == JSVariable.TEXT) {
				jsVar.defaultValue = "\"" + utils.stringReplace(propDesc.value.toString(), "\"", "'") + "\"";
			} else if (propDesc.defaultValue && propDesc.value instanceof Boolean) {
				jsVar.defaultValue = propDesc.value ? 1 : 0;
			} else {
				jsVar.defaultValue = propDesc.value;
			}
			
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
				jsLabel.transparent = true;
			}
				
			if (propDesc.securityLevel > forms.svyPropsMain.editorAdminLevel) {
				jsComp.enabled = false;
				jsComp.editable = false;
			}			
				
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
	
	elements.tabs.setRightForm(forms[formName]);
}
