/**
 * @type {Array<RuntimeProperty>}
 * 
 * @private 
 *
 * @properties={typeid:35,uuid:"3047E651-2B75-436C-8DD9-6056800556AC",variableType:-4}
 */
var runtimeProperties = loadRuntimeProperties();

/**
 * @type {String}
 * 
 * @private 
 *
 * @properties={typeid:35,uuid:"C16E9163-768A-41CD-900B-6B0ADCCF514F"}
 */
var PROPERTY_CHANGED_EVENT_ACTION = "propertyChanged";

/**
 * The solution/application context for which properties are handled
 * 
 * @type {scopes.svySecurityManager.Application}
 * 
 * @private 
 *
 * @properties={typeid:35,uuid:"04A0B1A5-6B37-462E-93F7-C968381ECA60",variableType:-4}
 */
var APPLICATION_CONTEXT = scopes.svySecurityManager.getApplication();

/**
 * @private 
 * 
 * @return {Array<RuntimeProperty>}
 * 
 * @properties={typeid:24,uuid:"5F654912-306D-4609-81E5-D2230818627C"}
 */
function getLoadedProperties() {
	if (!runtimeProperties) {
		runtimeProperties = loadRuntimeProperties();
	}
	return runtimeProperties;
}

/**
 * Creates a new Property
 * 
 * @param {String} name								- the name of this property
 * @param {String|UUID|PropertySet} propertySet		- the propertySet given as name, ID or PropertySet object
 * @param {String|UUID} [applicationId]				- an optional applicationId of the application that this property is exclusively for
 * @param {Number} [sortOrder]						- the sortOrder of this property in the set
 * @param {Number} [adminLevel]						- the minimum admin level required to edit this property
 * @param {String} [header]							- the header text that is placed above the property values
 * 
 * @return {Property}
 * 
 * @throws {scopes.modUtils$data.ValueNotUniqueException} the name of the property has to be unique
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
 *
 * @properties={typeid:24,uuid:"ADD262C0-596E-4356-875E-6DE4303070D1"}
 */
function createProperty(name, propertySet, applicationId, sortOrder, adminLevel, header) {
	if (!name || !propertySet) {
		throw scopes.modUtils$exceptions.IllegalArgumentException("Wrong arguments provided for createProperty");
	}
	
	/** @type {JSFoundSet<db:/svy_framework/svy_properties>} */
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/svy_properties");
	
	/** @type {PropertySet} */
	var propertySetObject;
	/** @type {String} */
	var propertySetId;
	
	if (propertySet instanceof String) {
		// the name of the property set
		propertySetObject = getPropertySet(propertySet);
		if (!propertySetObject) {
			throw scopes.modUtils$exceptions.IllegalArgumentException("Wrong arguments provided for createProperty");
		}
		propertySetId = propertySetObject.propertySetId;
	} else if (propertySet instanceof UUID) {
		propertySetId = propertySet.toString();
		propertySetObject = getPropertySetById(propertySetId);
		if (!propertySetObject) {
			throw scopes.modUtils$exceptions.IllegalArgumentException("Wrong arguments provided for createProperty");
		}
	} else if (propertySet instanceof PropertySet) {
		/** @type {PropertySet} */
		var tmpObject = propertySet;		
		propertySetId = tmpObject.propertySetId;
		propertySetObject = propertySet;
	} else {
		throw scopes.modUtils$exceptions.IllegalArgumentException("Wrong arguments provided for createProperty");
	}
	
	if (!scopes.modUtils.isValueUnique(fs, "property_name", name, ["svy_property_sets_id"], [propertySetId]))	{
		throw new scopes.modUtils$data.ValueNotUniqueException(null, fs, "property_name", name);
	}
	var propertyRecord = fs.getRecord(fs.newRecord());
	propertyRecord.property_name = name;
	propertyRecord.svy_property_sets_id = propertySetId;
	if (applicationId || propertySetObject.applicationId) {
		// either application specific itself or by its set
		propertyRecord.application_id = applicationId ? applicationId : propertySetObject.applicationId;
	}
	if (sortOrder) {
		propertyRecord.sort_order = sortOrder;
	}
	if (adminLevel >= 0 && scopes.modUtils.objectHasValue(scopes.svySecurityManager.ADMIN_LEVEL, adminLevel)) {
		propertyRecord.admin_level = adminLevel;
	}
	if (header) {
		propertyRecord.header_text = header;
	}
	databaseManager.saveData(propertyRecord);
	return new Property(propertyRecord);
}

/**
 * Creates a new PropertySet
 * 
 * @param {String} name						- the name of this property set
 * @param {String|UUID} [applicationId]		- an optional applicationId of the application that this property is exclusively for
 * @param {String} [displayName] 			- the name that is shown (usually i18n)
 * @param {String} [description]			- the description of this property set (usually i18n)
 * @param {String} [icon]					- the icon of this property set as a String URL or byte[]
 * @param {RuntimeForm|String} [formName]	- the (name of the) form used to present this property set
 * @param {Number} [sortOrder] 				- the index on which this set is shown in a property editor
 * 
 * @return {PropertySet}
 * 
 * @throws {scopes.modUtils$data.ValueNotUniqueException} the name of the property set has to be unique
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException} 
 *
 * @properties={typeid:24,uuid:"DF2A8A29-EBBA-41C3-9652-2B2184F12421"}
 */
function createPropertySet(name, applicationId, displayName, description, icon, formName, sortOrder) {
	if (!name) {
		throw scopes.modUtils$exceptions.IllegalArgumentException("No name provided for createPropertySet");
	}
	/** @type {JSFoundSet<db:/svy_framework/svy_property_sets>} */
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/svy_property_sets");		
	if (!scopes.modUtils.isValueUnique(fs, "name", name))	{
		throw new scopes.modUtils$data.ValueNotUniqueException(null, fs, "property_name", name);
	}
	var record = fs.getRecord(fs.newRecord());
	record.name = name;
	if (applicationId) {
		record.application_id = applicationId;
	}
	if (displayName) {
		record.display_name = displayName;
	}
	if (description) {
		record.description = description;
	}
	if (icon) {
		record.icon = icon;
	}
	if (formName) {
		if (formName instanceof RuntimeForm) {
			/** @type {RuntimeForm} */
			var runtimeForm = formName;
			record.form_name = runtimeForm.controller.getName();
		} else {
			record.form_name = formName;
		}
	}
	if (sortOrder) {
		record.sort_order = sortOrder;
	}
	databaseManager.saveData(record);
	return new PropertySet(record);
}

/**
 * Returns the Property with the given name
 * 
 * @param {String} name
 * 
 * @return {Property} propertyDescription
 *
 * @properties={typeid:24,uuid:"006BEBB6-6D13-4DD9-AEDA-DA0A49FC7F64"}
 */
function getProperty(name) {
	/** @type {QBSelect<db:/svy_framework/svy_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_properties");
	query.result.addPk();
	query.where.add(query.columns.property_name.lower.eq(name.toLowerCase()));
	/** @type {JSFoundSet<db:/svy_framework/svy_properties>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		return new Property(fs.getRecord(1));
	} else {
		return null;
	}
}

/**
 * Returns the PropertyDescription with the given ID
 *  
 * @param {String|UUID} id
 * 
 * @return {Property} propertyDescription
 *
 * @properties={typeid:24,uuid:"601AF58C-96B5-4A67-909B-72FA1B58AE53"}
 */
function getPropertyById(id) {
	/** @type {QBSelect<db:/svy_framework/svy_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_properties");
	query.result.addPk();
	query.where.add(query.columns.svy_properties_id.eq(id.toString()));
	/** @type {JSFoundSet<db:/svy_framework/svy_properties>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		return new Property(fs.getRecord(1));
	} else {
		return null;
	}
}

/**
 * Returns the PropertySet with the given name or null if not found
 * 
 * @param {String} name
 * 
 * @return {PropertySet}
 *
 * @properties={typeid:24,uuid:"8637E948-2FA9-4FBD-9E41-13B2C4B86311"}
 */
function getPropertySet(name) {
	/** @type {QBSelect<db:/svy_framework/svy_property_sets>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_property_sets");
	query.result.addPk();
	query.where.add(query.columns.name.lower.eq(name.toLowerCase()));
	/** @type {JSFoundSet<db:/svy_framework/svy_property_sets>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		return new PropertySet(fs.getRecord(1));
	} else {
		return null;
	}
}

/**
 * Returns the PropertySet with the given ID or null if not found
 * 
 * @param {String|UUID} propertySetId
 * 
 * @return {PropertySet}
 *
 * @properties={typeid:24,uuid:"E6C00C43-1861-454C-B7D5-5074E00DEC7C"}
 */
function getPropertySetById(propertySetId) {
	/** @type {QBSelect<db:/svy_framework/svy_property_sets>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_property_sets");
	query.result.addPk();
	query.where.add(query.columns.svy_property_sets_id.eq(propertySetId.toString()));
	/** @type {JSFoundSet<db:/svy_framework/svy_property_sets>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		return new PropertySet(fs.getRecord(1));
	} else {
		return null;
	}
}

/**
 * @param {String} propertyName
 * 
 * @return {RuntimeProperty} property
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"D40C8A42-7A29-41E6-A324-0FC99CBE5C0B"}
 */
function getRuntimeProperty(propertyName) {
	/** @type {Array<RuntimeProperty>} */
	var props = getLoadedProperties();
	
	/**
	 * @param {RuntimeProperty} x
	 * @return {boolean} match
	 */
	function propFilter(x) {
		if (x.propertyName == propertyName) {
			return true;
		} else if (x.propertyValueName == propertyName) {
			return true;
		}
		return false;
	}
	
	var mappedArray = props.filter(propFilter);
	if (mappedArray.length > 0) {
		return mappedArray[0];
	} else {
		return null;
	}
}

/**
 * Returns all runtime properties as an array<p>
 * 
 * If the adminLevel is provided, the values in the properties returned apply to the given level<p>
 * 
 * If an ownerId is given and data is not filtered on ownerId, the properties returned apply to the given owner
 * 
 * @param {Number} [adminLevel]
 * @param {Array<String>} [propertyNames]
 * @param {String|UUID} [ownerId]
 * 
 * @return {Array<RuntimeProperty>} properties
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"2DD6C79F-0E99-4F9B-A534-53EBECC5096E"}
 */
function getRuntimeProperties(adminLevel, propertyNames, ownerId) {
	/** @type {Array<RuntimeProperty>} */
	var result = loadRuntimeProperties(adminLevel, ownerId);
	if (!propertyNames) {
		return result;
	}
	
	function resultFilter(x) {
		if (propertyNames.indexOf(x.propertyName) > -1) {
			return true;
		} else if (propertyNames.indexOf(x.propertyValueName) > -1) {
			return true;
		} else {
			return false;
		}
	}
	
	return result.filter(resultFilter);
}

/**
 * Returns the runtime value of the given property or null if not found<br><br>
 * 
 * This function should only be called if the property is known to have only one value; otherwise use {@link #getPropertyValues()}
 * 
 * @param {String} propertyName
 * 
 * @return {Object} propertyValue
 * 
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
 * 
 * @author patrick
 * @since 06.09.2012
 *
 * @properties={typeid:24,uuid:"0267E8D6-0610-4B68-85B6-540E2D07CB8E"}
 */
function getPropertyValue(propertyName) {
	if (!propertyName) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("No property name given");
	}
	var values = getPropertyValues(propertyName);
	if (values && values.length > 0) {
		return values[0];
	} else {
		return null;
	}
}

/**
 * Returns the runtime value of the given property as a Boolean
 * 
 * @param {String} propertyName
 * 
 * @return {Boolean} result
 * 
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
 *
 * @properties={typeid:24,uuid:"333863A8-8BF8-486D-8A91-9241A6B9E596"}
 */
function getPropertyValueAsBoolean(propertyName) {
	var value = getPropertyValue(propertyName);
	if (value) {
		if (value instanceof String) {
			/** @type {String} */
			var stringValue = value;
			stringValue = stringValue.toLowerCase();
			if (stringValue.substr(1) == "t") {
				return true;
			} else if (stringValue.substr(1) == "y") {
				return true;
			} else if (stringValue.substr(1) == "1") {
				return true;
			} else {
				return false;
			}
		} else if (value instanceof Number) {
			if (value > 0) {
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	} else {
		return false;
	}
}

/**
 * Returns all runtime property values for the given property
 * 
 * @param {String|Array<String>} propertyName
 * 
 * @return {Array} values
 * 
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
 *
 * @properties={typeid:24,uuid:"7D050615-B328-4430-B63B-C610D09A91DB"}
 */
function getPropertyValues(propertyName) {
	if (!propertyName) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("No property name given");
	}
	var givenPropertyNames;
	if (propertyName instanceof String) {
		givenPropertyNames = [propertyName];
	} else if (propertyName instanceof Array) {
		givenPropertyNames = propertyName;
	} else {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("propertyName parameter has to be either String or String[]");
	}
	
	/** @type {Array<RuntimeProperty>} */
	var props = getLoadedProperties();	
	
	/**
	 * @param {RuntimeProperty} x
	 * @return {boolean} match
	 */
	function propFilter(x) {
		if (givenPropertyNames.indexOf(x.propertyName) != -1) {
			return true;
		} else if (givenPropertyNames.indexOf(x.propertyValueName) != -1) {
			return true;
		}
		return false;
	}
	
	var mappedArray = props.filter(propFilter);
	
	/**
	 * @param {RuntimeProperty} v1
	 * @param {RuntimeProperty} v2
	 * @return {Number}
	 */
	function sortProps(v1, v2) {
		if (v1.sort > v2.sort) {
			return 1;
		} else if (v1.sort < v2.sort) {
			return -1;
		} else {
			return 0;
		}
	}
	
	mappedArray.sort(sortProps);
	
	if (mappedArray.length > 0) {
		var result = new Array();
		for (var i = 0; i < mappedArray.length; i++) {
			result.push(mappedArray[i].value);
		}
		return result;
	} else {
		return null;
	}
}

/**
 * A single runtime property
 * 
 * @param {String} name						- the name of the property
 * @param {Object} value					- the value
 * @param {String|UUID} [propertyOwner]		- the ID of the owner of this property; if not given, the userId is used
 * @param {String} [valueName]				- the name of the property value; if not given, the property name is used
 * @param {Number} [securityLevel]			- the security level required to edit this property; if not given, scopes.svySecurityManager.ADMIN_LEVEL.NONE is used
 * @param {Number} [sortOrder]				- the sort order for this value
 * @param {UUID} [navPropertyId]			- the ID of the svy_properties record; null for user properties
 * @param {UUID} [navPropertyValueId]		- the ID of the svy_property_values record; null for user properties stored in the client.properties
 * @param {Date} [modificationDate]			- the last modification date of this property value
 * 
 * @constructor 
 * 
 * @author patrick
 * @since 2012-10-15
 *
 * @properties={typeid:24,uuid:"5F5AB7B6-17D1-47FB-A4F8-0161B6667EAA"}
 */
function RuntimeProperty(name, value, propertyOwner, valueName, securityLevel, sortOrder, navPropertyId, navPropertyValueId, modificationDate) {
	
	/**
	 * The name of this property
	 * 
	 * @final
	 * 
	 * @type {String}
	 */
	this.propertyName = name;
	
	/**
	 * The name of this property value
	 * 
	 * @final
	 * 
	 * @type {String}
	 */
	this.propertyValueName = valueName ? valueName : name;
	
	/**
	 * The ID of this property
	 * 
	 * @final
	 * 
	 * @type {UUID}
	 */
	this.propertyId = navPropertyId;
	
	/**
	 * The ID of the property value
	 * 
	 * @final
	 * 
	 * @type {UUID}
	 */
	this.propertyValueId = navPropertyValueId;
	
	/**
	 * The value of this property
	 * 
	 * @type {Object}
	 */
	this.value = value;
	
	/**
	 * Internal var holding the value
	 */
	var $value = value;
	
	/**
	 * The modification date of this property
	 * 
	 * @type {Date}
	 */
	this.lastModified = modificationDate;
	
	/**
	 * The sort of this property
	 * 
	 * @final
	 * 
	 * @type {Number}
	 */
	this.sort = sortOrder ? sortOrder : 1;
	
	/**
	 * The admin level of this property setting<p>
	 * 
	 * The admin level determines if this setting is a user's, organization's, owner's or global
	 * 
	 * @type {Number}
	 * 
	 * @final
	 * 
	 * @see scopes.svySecurityManager.ADMIN_LEVEL for possible levels
	 */
	this.adminLevel = securityLevel ? securityLevel : scopes.svySecurityManager.ADMIN_LEVEL.NONE;
	
	/**
	 * The id of the owner, organization or user to which this property belongs
	 * 
	 * @type {String}
	 */
	this.propertyOwnerId = propertyOwner ? propertyOwner : globals.svy_sec_lgn_user_id;
	
	/**
	 * If true, this property was loaded from file
	 * 
	 * @type {Boolean}
	 */
	this.loadedFromFile = navPropertyValueId ? false : true;
	
	Object.defineProperty(this, "value", {
		get: function() {
			if ($value === true) {
				return 1;
			} else if ($value === false) {
				return 0;
			} else {
				return $value;
			}
		},
		set: function(x) {
			if (!this.propertyValueId && !getPropertyValue("save_user_properties_in_db")) {
				$value = x;
				application.setUserProperty(this.propertyName, x);
			} else {
				/** @type {JSFoundSet<db:/svy_framework/svy_property_values>} */
				var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/svy_property_values");
				fs.loadRecords(this.propertyValueId);
				var newValueArray = new Array();
				if (utils.hasRecords(fs)) {
					var record = fs.getRecord(1);
					/** @type {Array<{name: String, value: Object}>} */
					var values = record.property_value;
					if (values && values.length > 0) {
						for (var i = 0; i < values.length; i++) {
							newValueArray[i] = values[i];						
							if (values[i].name == this.propertyValueName) {
								newValueArray[i].value = x;
							}
						}
						record.property_value = newValueArray;
						databaseManager.saveData(record);
						$value = x;
					}
				}
			}
		}
	});
	
	Object.seal(this);
	
}

/**
 * Creates a RuntimeProperty from the given svy_properties_values record and propertyValue
 * 
 * @param {JSRecord<db:/svy_framework/svy_property_values>} propertyValueRecord
 * @param {{name: String, value: Object, sort: Number}} propertyValue
 * 
 * @return {RuntimeProperty}
 * 
 * @private 
 *
 * @properties={typeid:24,uuid:"F51CC4D5-D5F1-4397-A8FA-60CC1F814B4E"}
 */
function createRuntimeProperty(propertyValueRecord, propertyValue) {
	var name = propertyValueRecord.property_name;
	var value = propertyValue.value;
	var propertyOwner = propertyValueRecord.owner_id;
	var valueName = propertyValue.name;
	var securityLevel = propertyValueRecord.security_level;
	var sortOrder = propertyValue.sort;
	var navPropertyId = propertyValueRecord.svy_properties_id;
	var navPropertyValueId = propertyValueRecord.svy_property_values_id;
	var modificationDate = propertyValueRecord.modification_date;
	return new RuntimeProperty(name, value, propertyOwner, valueName, securityLevel, sortOrder, navPropertyId, navPropertyValueId, modificationDate);
}

/**
 * Description of a single property
 * 
 * @param {JSRecord<db:/svy_framework/svy_properties>} propertyRecord
 * 
 * @constructor 
 * @private 
 * 
 * @author patrick
 * 
 * 
 * @properties={typeid:24,uuid:"0084C159-E8D0-4DA8-BEC1-48E70A8EDF6E"}
 */
function Property(propertyRecord) {
	
	/**
	 * @type {JSRecord<db:/svy_framework/svy_properties>}
	 */
	var record = propertyRecord;
	
	/**
	 * The name of this Property
	 * 
	 * @type {String}
	 * 
	 * @throws {scopes.modUtils$data.ValueNotUniqueException}
	 */
	this.name = record.property_name;
	
	/**
	 * An optional header text that will be set above the values
	 * 
	 * @type {String}
	 */
	this.header = record.header_text;
	
	/**
	 * Array with all PropertyValue objects of this Property
	 * 
	 * @type {Array<PropertyValue>}
	 */
	this.valueDescriptions = record.value_description ? record.value_description : new Array();
	
	/**
	 * The required security level to be able to edit<br><br>
	 * 
	 * @see scopes.svySecurityManager.ADMIN_LEVEL for possible levels
	 * 
	 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
	 * 
	 */
	this.securityLevel = record.admin_level;
	
	/**
	 * The ID of this property
	 * 
	 * @type {UUID}
	 */
	this.propertyId = record.svy_properties_id;
	
	/**
	 * The ID of the property set
	 * 
	 * @type {UUID}
	 */
	this.propertySetId = record.svy_property_sets_id;
	
	/**
	 * The ID of the application this property is uniquely for
	 * 
	 * @type {UUID}
	 */
	this.applicationId = record.application_id;
	
	/**
	 * The name of the servoy solution this property is uniquely for
	 * 
	 * @type {String}
	 */
	this.solutionName = (record.application_id && utils.hasRecords(record.svy_properties_to_prov_application)) ? record.svy_properties_to_prov_application.servoy_solution_name : null;
	
	/**
	 * The sort order for this property
	 * 
	 * @type {Number}
	 */
	this.sortOrder = record.sort_order;
	
	/**
	 * Adds a value description to this Property
	 * 
	 * @param {Number} sortOrder
	 * @param {String} name
	 * @param {Number} dataType
	 * @param {Number} [displayType]
	 * @param {String} [label]
	 * @param {String} [description]
	 * @param {Object} [defaultValue]
	 * @param {String} [valueListName]
	 * @param {Array} [valueListValues]
	 * 
	 * @this {Property}
	 * 
	 * @return {PropertyValue}
	 */
	this.addValueDescription = function(sortOrder, name, dataType, displayType, label, description, defaultValue, valueListName, valueListValues) {
		var propDescription = new PropertyValue(this, sortOrder, name, dataType, displayType, label, description, defaultValue, valueListName, valueListValues);
		var values = new Array();
		for (var i = 0; i < this.valueDescriptions.length; i++) {
			values.push(this.valueDescriptions[i]);
		}
		values.push(propDescription);
		record.value_description = values;
		databaseManager.saveData(record);
		this.valueDescriptions = values;
		return propDescription;
	}
	
	/**
	 * Returns the property value with the given name
	 * 
	 * @this {Property}
	 * 
	 * @return {PropertyValue}
	 */
	this.getPropertyValue = function(propertyValueName) {
		/** @type {Array<PropertyValue>} */		
		var values = this.valueDescriptions;
		for (var i = 0; i < values.length; i++) {
			var value = values[i];
			if (value.name == propertyValueName) {
				return value;
			}
		}
		return null;
	}	
	
	/**
	 * Returns the property set of this property
	 * 
	 * @return {PropertySet}
	 */
	this.getPropertySet = function() {
		/** @type {UUID} */
		var uuid = this.propertySetId;
		return getPropertySetById(uuid);
	}
	
	/**
	 * Saves the value description
	 * 
	 * @this {Property}
	 */
	this.saveValueDescription = function() {
		record.value_description = this.valueDescriptions;
		databaseManager.saveData(record);
	}
	
	Object.defineProperty(this, "name", {
		get: function() {
			return record.property_name;
		},
		set: function(x) {
			if (x) {
				if (!scopes.modUtils.isValueUnique(record, "property_name", x)) {
					throw new scopes.modUtils$data.ValueNotUniqueException(null, record, "property_name", x);
				}
				record.property_name = x;
				databaseManager.saveData(record);
			}
		}
	})

	Object.defineProperty(this, "header", {
		get: function() {
			return record.header_text;
		},
		set: function(x) {
			if (x) {
				record.header_text = x;
				databaseManager.saveData(record);
			}
		}
	})
	
	Object.defineProperty(this, "propertyId", {
		get: function() {
			return record.svy_properties_id;
		}
	})	
	
	Object.defineProperty(this, "propertySetId", {
		get: function() {
			return record.svy_property_sets_id;
		},
		set: function(x) {
			if (x) {
				record.svy_property_sets_id = x;
				databaseManager.saveData(record);
			}
		}
	})
	
	Object.defineProperty(this, "applicationId", {
		get: function() {
			return record.application_id;
		},
		set: function(x) {
			if (x) {
				record.application_id = x;
				databaseManager.saveData(record);
			}
		}
	})
	
	Object.defineProperty(this, "solutionName", {
		get: function() {
			if (utils.hasRecords(record.svy_properties_to_prov_application)) {
				return record.svy_properties_to_prov_application.servoy_solution_name;
			} else {
				return null;
			}
		}
	})
	
	Object.defineProperty(this, "securityLevel", {
		get: function() {
			return record.admin_level;
		},
		set: function(x) {
			if (scopes.modUtils.objectHasValue(scopes.svySecurityManager.ADMIN_LEVEL, x)) {
				record.admin_level = x;
				databaseManager.saveData(record);
			} else {
				throw new scopes.modUtils$exceptions.IllegalArgumentException("Property security level must be one of the constants defined in scopes.svySecurityManager.ADMIN_LEVEL");
			}
		}
	})
	
	Object.defineProperty(this, "sortOrder", {
		get: function() {
			return record.sort_order;
		},
		set: function(x) {
			record.sort_order = x;
			databaseManager.saveData(record);
		}
	})	
	
	Object.defineProperties(this, {
		"addValueDescription": {
			enumerable: false
		}
	});
	
	Object.seal(this);
}

/**
 * Property set<br>
 * holds name, description and icon for a set of properties
 * 
 * @param {JSRecord<db:/svy_framework/svy_property_sets>} propertySetRecord
 * 
 * @constructor
 * @private 
 *
 * @properties={typeid:24,uuid:"99A097CF-1AE3-4412-B9C3-A7EB7EC9F88A"}
 */
function PropertySet(propertySetRecord) {
	
	/**
	 * @type {JSRecord<db:/svy_framework/svy_property_sets>}
	 */
	var record = propertySetRecord;
	
	/**
	 * The name of this property set
	 * 
	 * @type {String}
	 */
	this.name = record.name;
	
	/**
	 * The display name of this set, usually an i18n key
	 * 
	 * @type {String}
	 */
	this.displayName = record.display_name;
	
	/**
	 * The description of this property set
	 * 
	 * @type {String}
	 */
	this.description = record.description;
	
	/**
	 * The ID of the application this set is uniquely for
	 * 
	 * @type {UUID}
	 */
	this.applicationId = record.application_id;
	
	/**
	 * The ID of this property set
	 * 
	 * @type {UUID}
	 */
	this.propertySetId = record.svy_property_sets_id;
	
	/**
	 * The icon of this property set<br>
	 * The icon can be provided as either a String URL or a byte[] containing the media data
	 * 
	 * @type {byte[]}
	 */
	this.icon = record.icon;
	
	/**
	 * The optional form name of the form used to display this set
	 * 
	 * @type {String}
	 */
	this.formName = record.form_name;
	
	/**
	 * The sort order for this property set
	 * 
	 * @type {Number}
	 */
	this.sortOrder = record.sort_order;
	
	/**
	 * Returns all properties of this set
	 * 
	 * @return {Array<Property>}
	 */
	this.getProperties = function() {
		/** @type {Array<Property>} */
		var result = new Array();
		if (utils.hasRecords(record.svy_property_sets_to_svy_properties)) {
			for (var i = 1; i <= record.svy_property_sets_to_svy_properties.getSize(); i++) {
				var propRecord = record.svy_property_sets_to_svy_properties.getRecord(i);
				result.push(new Property(propRecord));
			}
		}
		return result;
	}
	
	/**
	 * Returns all property names of this set
	 * 
	 * @return {Array<String>}
	 */
	this.getPropertyNames = function() {
		/** @type {Array<String>} */
		var result = new Array();
		if (utils.hasRecords(record.svy_property_sets_to_svy_properties)) {
			for (var i = 1; i <= record.svy_property_sets_to_svy_properties.getSize(); i++) {
				var propRecord = record.svy_property_sets_to_svy_properties.getRecord(i);
				result.push(propRecord.property_name);
			}
		}
		return result;
	}
	
	Object.defineProperty(this, "name", {
		get: function() {
			return record.name;
		},
		set: function(x) {
			record.name = x;
			databaseManager.saveData(record);
		}
	})
	
	Object.defineProperty(this, "applicationId", {
		get: function() {
			return record.application_id;
		},
		set: function(x) {
			record.application_id = x;
			databaseManager.saveData(record);
		}
	})	
	
	Object.defineProperty(this, "displayName", {
		get: function() {
			return record.display_name;
		},
		set: function(x) {
			record.display_name = x;
			databaseManager.saveData(record);
		}
	})
	
	Object.defineProperty(this, "description", {
		get: function() {
			return record.description;
		},
		set: function(x) {
			record.description = x;
			databaseManager.saveData(record);
		}
	})
	
	Object.defineProperty(this, "propertySetId", {
		get: function() {
			return record.svy_property_sets_id;
		},
		set: function(x) {
		}
	})	
	
	Object.defineProperty(this, "icon", {
		get: function() {
			return record.icon;
		},
		set: function(x) {
			record.icon = x;
			databaseManager.saveData(record);
		}
	})	
	
	Object.defineProperty(this, "formName", {
		get: function() {
			return record.form_name;
		},
		set: function(x) {
			record.form_name = x;
			databaseManager.saveData(record);
		}
	})
	
	Object.defineProperty(this, "sortOrder", {
		get: function() {
			return record.sort_order;
		},
		set: function(x) {
			record.sort_order = x;
			databaseManager.saveData(record);
		}
	})	
	
	Object.seal(this);
}

/**
 * @param {Property} propertyDescription
 * @param {Number} sortOrder
 * @param {String} name
 * @param {Number} dataType
 * @param {Number} displayType
 * @param {String} label
 * @param {String} description
 * @param {Object} value
 * @param {String} [valueListName]
 * @param {Array} [valueListValues]
 * 
 * @constructor 
 * @private 
 *
 * @properties={typeid:24,uuid:"10C602B8-B4BB-4ACB-97CE-D10E54714734"}
 */
function PropertyValue(propertyDescription, sortOrder, name, dataType, displayType, label, description, value, valueListName, valueListValues) {
	
	/**
	 * The Property this value description belongs to
	 * 
	 * @type {Property}
	 */
	var propertyDescriptionObj = propertyDescription;
	
	/**
	 * The sort order for this value
	 * 
	 * @type {Number}
	 */
	this.sortOrder = -1;	
	
	/**
	 * The name of this value
	 * 
	 * @type {String}
	 */
	this.name = "";
	
	/**
	 * The Id of the application this property value is for
	 * 
	 * @type {UUID}
	 */
	this.application_id = propertyDescriptionObj.applicationId;
	
	/**
	 * The name of the solution this value is for
	 * 
	 * @type {String}
	 */
	this.solutionName = propertyDescriptionObj.solutionName;
	
	/**
	 * Internal var holding name
	 * @type {String}
	 */
	var $name = name ? name : propertyDescriptionObj.name;		
	
	/**
	 * The name of this value
	 * 
	 * @type {String}
	 */
	this.label = "";
	
	/**
	 * Internal var holding label
	 * @type {String}
	 */
	var $label = label;
	
	/**
	 * The header label placed above the properties
	 * 
	 * @type {String}
	 */
	this.header = "";
	
	/**
	 * Internal var holding header
	 * @type {String}
	 */
	var $header = null;	
	
	/**
	 * A description of the value
	 * 
	 * @type {String}
	 */
	this.description = "";
	
	/**
	 * Internal var holding description
	 * @type {String}
	 */
	var $description = description;
	
	/**
	 * The data type given as a JSColumn constant
	 * 
	 * @type {Number}
	 */
	this.dataType = -1;
	
	/**
	 * Internal var holding dataType
	 * @type {Number}
	 */
	var $dataType = dataType;
	
	/**
	 * The display type given as a JSField constant
	 * 
	 * @type {Number}
	 */
	this.displayType = -1;		
	
	/**
	 * Internal var holding displayType
	 * @type {Number}
	 */
	var $displayType = displayType ? displayType : JSField.TEXT_FIELD;
	
	/**
	 * The (default) value of this property
	 * 
	 * @type {Object}
	 */
	this.value = {};
	
	/**
	 * Internal var holding defaultValue
	 * @type {Object}
	 */
	var $value = value;	
	
	/**
	 * The name of the value list to be used
	 * 
	 * @type {String}
	 */
	this.valueListName = "";	
	
	/**
	 * Internal var holding valueListName
	 * @type {String}
	 */
	var $valueListName = valueListName;	
	
	/**
	 * Fixed values for the value list
	 * 
	 * @type {Array}
	 */
	this.valueListValues = new Array();
	
	/**
	 * Internal var holding valueListValues
	 * @type {Array}
	 */
	var $valueListValues = valueListValues;	
	
	/**
	 * Returns the security level of the property
	 * 
	 * @return {Number}
	 */
	this.securityLevel = propertyDescriptionObj.securityLevel;
	
	/**
	 * Internal var sortOrder
	 * @type {Number}
	 */
	var $sortOrder = sortOrder;		
	
	// Try to guess data type if not given
	if (!$dataType && $value) {
		if ($value instanceof Number) {
			$dataType = JSVariable.NUMBER;
		} else if ($value instanceof Date) {
			$dataType = JSVariable.DATETIME;
		} else if ($value instanceof Array) {
			$dataType = JSVariable.MEDIA;
		} else {
			$dataType = JSVariable.TEXT;
		}
	}
	
	/**
	 * Returns an object to be stored in nav_property
	 * 
	 * @this {PropertyValue}
	 * 
	 * @return {{name: String, value: Object}}
	 */
	this.getValueObject = function() {
		var result = new Object();
		result.name = this.name;
		result.value = this.value;
		result.sort = this.sortOrder;
		return result;
	}
	
	Object.defineProperty(this, "applicationId", {
		get: function() {
			return $description;
		},
		set: function(x) {
			$description = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})
	
	Object.defineProperty(this, "description", {
		get: function() {
			return $description;
		},
		set: function(x) {
			$description = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})
	
	Object.defineProperty(this, "name", {
		get: function() {
			return $name;
		},
		set: function(x) {
			$name = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})
	
	Object.defineProperty(this, "label", {
		get: function() {
			return $label;
		},
		set: function(x) {
			$label = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})	
	
	Object.defineProperty(this, "header", {
		get: function() {
			return $header;
		},
		set: function(x) {
			$header = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})		
	
	Object.defineProperty(this, "sortOrder", {
		get: function() {
			return $sortOrder;
		},
		set: function(x) {
			$sortOrder = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})	

	Object.defineProperty(this, "displayType", {
		get: function() {
			return $displayType;
		},
		set: function(x) {
			$displayType = x;	
			propertyDescriptionObj.saveValueDescription();
		}
	})
	
	Object.defineProperty(this, "value", {
		get: function() {
			if ($value === true) {
				return 1;
			} else if ($value === false) {
				return 0;
			} else {
				return $value;
			}
		},
		set: function(x) {
			$value = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})	
	
	Object.defineProperty(this, "dataType", {
		get: function() {
			return $dataType;
		},
		set: function(x) {
			$dataType = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})		
	
	Object.defineProperty(this, "valueListName", {
		get: function() {
			return $valueListName;
		},
		set: function(x) {
			$valueListName = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})		
	
	Object.defineProperty(this, "valueListValues", {
		get: function() {
			return $valueListValues;
		},
		set: function(x) {
			$valueListValues = x;
			propertyDescriptionObj.saveValueDescription();
		}
	})
	
	Object.seal(this);	
}

/**
 * Creates a value array from the serialized array
 * 
 * @param {String} _values
 * @return {Array}
 * 
 * @private
 * 
 * @author patrick
 * @since 11.09.2012
 * 
 * @properties={typeid:24,uuid:"FFADE8FA-F97C-4883-A256-0FC6774899CF"}
 */
function getValueArray(_values) {
	/** @type {Array} */	
	var result = new Array();
	if (!_values || !(_values instanceof Array)) {
		return result;
	}
	for (var i = 0; i < _values.length; i++) {
		var entry = _values[i];
		if (parseInt(entry) && utils.numberFormat(parseInt(entry),"####") == entry) {
			result.push(parseInt(entry))
		} else if (entry == "true") {
			result.push(true);
		} else if (entry == "false") {
			result.push(false);
		} else if (entry == "") {
			result.push(null);
		} else {
			result.push(entry);
		}
	}
	return result;
}

/**
 * Updates the given properties<p>
 * 
 * This is usually called when modules are initialized
 * 
 * @param {{propertySet: Object, properties: Array<Object>}} props
 *
 * @properties={typeid:24,uuid:"CC1F58C5-B612-4476-B1F3-AF267DDAC38B"}
 */
function updateDefaultProperties(props) {
	/** @type {{name: String, applicationName: String, displayName: String, description: String, icon: String, sort: Number, formName: String}} */
	var givenSet = props.propertySet;
	// Get a property set
	var propertySet = getPropertySet(givenSet.name);
	if (!propertySet) {
		propertySet = createPropertySet(
			givenSet.name, 
			givenSet.applicationName,
			givenSet.displayName, 
			givenSet.description, 
			givenSet.icon, 
			givenSet.formName, 
			givenSet.sort
		);
	} else {
		if (propertySet.description != givenSet.description) {
			propertySet.description = givenSet.description;
		}
		if (propertySet.applicationName != givenSet.applicationName) {
			propertySet.applicationName = givenSet.applicationName;
		}		
		if (propertySet.displayName != givenSet.displayName) {
			propertySet.displayName = givenSet.displayName;
		}
		if (propertySet.formName != givenSet.formName) {
			propertySet.formName = givenSet.formName;
		}		
		if (propertySet.icon != givenSet.icon) {
			propertySet.icon = givenSet.icon;
		}		
		if (propertySet.name != givenSet.displayName) {
			propertySet.displayName = givenSet.displayName;
		}		
		if (propertySet.sortOrder != givenSet.sort) {
			propertySet.sortOrder = givenSet.sort;
		}		
	}
	
	// now see which properties already exist
	/** @type {Array<{name: String, applicationName: String, value: Object, securityLevel: Number, sort: Number, dataType: Number, displayType: Number, label: String, header: String, description: String, valueListName: String, valueListValues: Array}>} */
	var givenProperties = props.properties;
	var givenPropertyNames = new Array();
	for (var i = 0; i < givenProperties.length; i++) {
		givenPropertyNames.push(givenProperties[i].name);
	}
	
	/** @type {QBSelect<db:/svy_framework/svy_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_properties");
	query.result.addPk();
	query.where.add(query.columns.svy_property_sets_id.eq(propertySet.propertySetId.toString()));
	query.where.add(query.columns.property_name.isin(givenPropertyNames));
	
	/** @type {JSFoundSet<db:/svy_framework/svy_properties>} */
	var fs = databaseManager.getFoundSet(query);
	
	function removeItem(name) {
		for (var z = 0; z < givenProperties.length; z++) {
			if (givenProperties[z].name == name) {
				givenProperties.splice(z, 1);
			}
		}		
	}
	
	function findValueItem(name) {
		function filterForName(z) {
			if (z.name == name) {
				return true;
			} else {
				return false;
			}
		}
		var result = givenProperties.filter(filterForName);
		if (result.length >= 0) {
			return result[0];
		} else {
			return null;
		}
	}
	
	if (utils.hasRecords(fs)) {
		for (var j = 1; j <= fs.getSize(); j++) {
			var record = fs.getRecord(j);
			if (givenPropertyNames.indexOf(record.property_name) != -1) {
				// found this property; adjust values if necessary
				/** @type {Array<PropertyValue>} */
				var propValues = new Array();
				for ( var x = 0 ; x < record.value_description.length ; x ++ ) {
					propValues[x] = record.value_description[x];
				}
				
				var valueItem = findValueItem(record.property_name);
				
				// adjust booleans
				if (valueItem.value === true) {
					valueItem.value = 1;
				} else if (valueItem.value === false) {
					valueItem.value = 0;
				}
				
				var itemFound = false;
				var itemChanged = false;
				for (var p = 0; p < propValues.length; p++) {
					if (propValues[p].name == valueItem.name) {
						// item found
						itemFound = true;
						if ("dataType" in valueItem && propValues[p].dataType !== valueItem.dataType) {
							propValues[p].dataType = valueItem.dataType;
							itemChanged = true;
						}
						if ("applicationName" in valueItem && propValues[p].solutionName !== valueItem.applicationName) {
							propValues[p].solutionName = valueItem.applicationName;
							itemChanged = true;
						}
						if ("description" in valueItem && propValues[p].description !== valueItem.description) {
							propValues[p].description = valueItem.description;
							itemChanged = true;
						}
						if ("displayType" in valueItem && propValues[p].displayType !== valueItem.displayType) {
							propValues[p].displayType = valueItem.displayType;
							itemChanged = true;
						}
						if ("header" in valueItem && propValues[p].header !== valueItem.header) {
							propValues[p].header = valueItem.header;
							itemChanged = true;
						}
						if ("label" in valueItem && propValues[p].label !== valueItem.label) {
							propValues[p].label = valueItem.label;
							itemChanged = true;
						}
						if ("securityLevel" in valueItem && propValues[p].securityLevel !== valueItem.securityLevel) {
							propValues[p].securityLevel = valueItem.securityLevel;
							itemChanged = true;
						}
						if ("value" in valueItem && propValues[p].value !== valueItem.value) {
							propValues[p].value = valueItem.value;
							itemChanged = true;
						}
						if ("valueListName" in valueItem && propValues[p].valueListName !== valueItem.valueListName) {
							propValues[p].valueListName = valueItem.valueListName;
							itemChanged = true;
						}
						if ("valueListValues" in valueItem && propValues[p].valueListValues !== valueItem.valueListValues) {
							propValues[p].valueListValues = valueItem.valueListValues;
							itemChanged = true;
						}
					}
				}
				
				if (!itemFound) {
					application.output("Could not update default property value for property " + valueItem.name + " because the property could not be found", LOGGINGLEVEL.WARNING);
				} else if (itemChanged) {
					record.value_description = propValues;
					databaseManager.saveData(record);
				}
				removeItem(record.property_name);
			}
		}
	}
	
	if (givenProperties && givenProperties.length > 0) {
		for (var rp = 0; rp < givenProperties.length; rp++) {
			var givenProperty = givenProperties[rp];
			var newProperty = createProperty(givenProperty.name, propertySet, givenProperty.applicationName, givenProperty.sort, givenProperty.securityLevel);
			newProperty.addValueDescription(1, givenProperty.name, givenProperty.dataType, givenProperty.displayType, givenProperty.label, givenProperty.description, givenProperty.value, givenProperty.valueListName, givenProperty.valueListValues);
		}
		updateDefaultPropertyValues();
		reloadRuntimeProperties();
	}
}

/**
 * Loads all relevant properties for the logged in user<p>
 * 
 * If an adminLevel is given, runtime values for that admin level are returned<p>
 * 
 * Properties are prioritized in this order:<br>
 * 
 * <ul>
 * <li>user</li>
 * <li>organization</li>
 * <li>owner</li>
 * <li>global</li>
 * </ul>
 * 
 * @param {Number} [adminLevel]
 * @param {String|UUID} [ownerId]
 * 
 * @return {Array<RuntimeProperty>} runtime properties for either the current user or the given admin level
 * 
 * @private 
 * @properties={typeid:24,uuid:"45FFC645-B941-42E6-A2A1-63AA5F16D0B8"}
 */
function loadRuntimeProperties(adminLevel, ownerId) {
	
	if (!ownerId) {
		ownerId = globals.svy_sec_lgn_owner_id;
	}
	if (ownerId) {
		ownerId = ownerId.toString();
	} else {
		ownerId = null;
	}
	
	/** @type {QBSelect<db:/svy_framework/svy_property_values>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_property_values");
	query.result.addPk();	
	query.where.add(query.columns.owner_id.isin([null, ownerId, globals.zero_uuid.toString()]));
	
	/** @type {JSFoundSet<db:/svy_framework/svy_property_values>} */
	var fs = databaseManager.getFoundSet(query);
	
	/** @type {Array<RuntimeProperty>} */
	var result = new Array();
	var runtimeProp;
	
	var givenAdminLevel = -1;
	if (!(adminLevel == undefined || adminLevel == null)) {
		givenAdminLevel = adminLevel;
	}
	
	if (fs && utils.hasRecords(fs)) {
		var relevantProperties = new Object();
		for (var i = 1; i <= fs.getSize(); i++) {
			var record = fs.getRecord(i);
			
			var propertyLevel = record.admin_level;
			/** @type {Array<{name: String, value, Object, sort: Number}>} */
			var propertyValues = record.property_value;
			for (var j = 0; j < propertyValues.length; j++) {
				var propertyValue = propertyValues[j];
				if (propertyValue.name in relevantProperties) {
					if (givenAdminLevel > -1 && relevantProperties[propertyValue.name].level > givenAdminLevel && record.admin_level < relevantProperties[propertyValue.name].level && record.admin_level >= givenAdminLevel) {
						// highest level wins
						relevantProperties[propertyValue.name].value = propertyValue.value;
						relevantProperties[propertyValue.name].record = record;
						relevantProperties[propertyValue.name].level = record.admin_level;
					} else if (givenAdminLevel == -1 && relevantProperties[propertyValue.name].level > propertyLevel) {
						// smallest level wins
						relevantProperties[propertyValue.name].value = propertyValue.value;
						relevantProperties[propertyValue.name].record = record;
						relevantProperties[propertyValue.name].level = record.admin_level;						
					}
				} else {
					relevantProperties[propertyValue.name] = new Object();
					relevantProperties[propertyValue.name].level = propertyLevel;
					relevantProperties[propertyValue.name].value = propertyValue.value;
					relevantProperties[propertyValue.name].name = propertyValue.name;
					relevantProperties[propertyValue.name].sort = propertyValue.sort;
					relevantProperties[propertyValue.name].record = record;
				}
			}
		}
		for ( var rp in relevantProperties) {
			runtimeProp = createRuntimeProperty(relevantProperties[rp].record, {name: relevantProperties[rp].name, value: relevantProperties[rp].value, sort: relevantProperties[rp].sort});
			result.push(runtimeProp);
		}
	}
	
	// Add user properties from file
	var userPropNames = application.getUserPropertyNames();
	if (userPropNames && userPropNames.length > 0) {
		for (var up = 0; up < userPropNames.length; up++) {
			var userPropValue = application.getUserProperty(userPropNames[up]);
			function runtimeFilter(element) {
				return (element.propertyValueName == userPropNames[up]);
			}
			if (result.filter(runtimeFilter).length == 0) {
				runtimeProp = new RuntimeProperty(userPropNames[up], userPropValue);	
				result.push(runtimeProp);			
			} else {
				application.output("Property " + userPropNames[up] + " already loaded from DB", LOGGINGLEVEL.DEBUG);
			}
		}
	}
		
	return result;
}

/**
 * Reloads the runtime properties
 * 
 * @private 
 * 
 * @properties={typeid:24,uuid:"6795B845-A902-49E8-804D-AC7D141845EB"}
 */
function reloadRuntimeProperties() {
	runtimeProperties = loadRuntimeProperties();
}

/**
 * @param {Property} propertyDescription
 *
 * @properties={typeid:24,uuid:"09B91526-05CA-46EA-909E-1CEBD6A204FC"}
 */
function addProperty(propertyDescription) {
	/** @type {JSFoundSet<db:/svy_framework/svy_properties>} */
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/svy_properties");
	var record = fs.getRecord(fs.newRecord());
	record.property_name = propertyDescription.name;
	record.value_description = propertyDescription.valueDescriptions;
	databaseManager.saveData(record);
	return record;
}

/**
 * Saves the given value to the property with the given name
 * 
 * @param {String} propertyName			- the name of the property
 * @param {Object} propertyValue		- the new value
 * @param {Number} [adminLevel]			- the admin level for which this property value is saved; if not given, the logged in user's level will be used
 * @param {String|UUID} [ownerId]		- the owner ID of this property value; if not given, the owner of the logged in user will be used
 * @param {String|UUID} [propertyOwner] - the owner or organization ID for which this property is set; if not given, the owner will depend on the logged in user and given admin level
 * @throws {scopes.modUtils$exceptions.SvyException}
 *
 * @properties={typeid:24,uuid:"A43388B0-686B-40F2-AD5C-0A9B4724C5B7"}
 */
function setPropertyValue(propertyName, propertyValue, adminLevel, ownerId, propertyOwner) {
	
	if (!propertyName) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("No property name given to setPropertyValue");
	}
	
	var runtimeProp = getRuntimeProperty(propertyName);
	
	if (!runtimeProp) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Unknown property given to setPropertyValue or runtime properties not loaded");
	}
	
	if (!adminLevel) {
		adminLevel = scopes.svySecurityManager.getUser().adminLevel;
	}
	
	var runtimePropId = runtimeProp.propertyId;
	
	/** @type {QBSelect<db:/svy_framework/svy_property_values>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_property_values");
	query.result.addPk();
	
	// ID of the owner of this property value
	var propertyOwnerId;
	if (propertyOwner) {
		propertyOwnerId = propertyOwner.toString();
	} else {
		propertyOwnerId = getOwnerIdForAdminLevel(adminLevel);
	}
	
	// Application manager and developer are treated equally
	if (adminLevel == scopes.svySecurityManager.ADMIN_LEVEL.APPLICATION_MANAGER) {
		adminLevel = scopes.svySecurityManager.ADMIN_LEVEL.DEVELOPER;
	}
	
	query.where.add(query.columns.svy_properties_id.eq(runtimePropId.toString()));
	query.where.add(query.columns.admin_level.eq(adminLevel));	
	query.where.add(query.columns.property_owner_id.eq(propertyOwnerId.toString()));	
	
	/** @type {JSFoundSet<db:/svy_framework/svy_property_values>} */
	var fs = databaseManager.getFoundSet(query);
	
	if (propertyValue instanceof UUID) {
		propertyValue = propertyValue.toString();
	}
	
	var propertyValueRecord;
	if (!utils.hasRecords(fs)) {
		propertyValueRecord = fs.getRecord(fs.newRecord());
		propertyValueRecord.svy_properties_id = runtimePropId;
		propertyValueRecord.property_name = runtimeProp.propertyName;
		propertyValueRecord.application_id = APPLICATION_CONTEXT ? APPLICATION_CONTEXT.id : null;
		if (adminLevel == scopes.svySecurityManager.ADMIN_LEVEL.DEVELOPER || adminLevel == scopes.svySecurityManager.ADMIN_LEVEL.APPLICATION_MANAGER) {
			propertyValueRecord.owner_id = globals.zero_uuid;
			propertyValueRecord.admin_level = scopes.svySecurityManager.ADMIN_LEVEL.DEVELOPER;
		} else {
			propertyValueRecord.owner_id = ownerId ? ownerId : globals.svy_sec_lgn_owner_id;
			propertyValueRecord.admin_level = adminLevel;			
		}
		propertyValueRecord.property_owner_id = propertyOwnerId;
		propertyValueRecord.property_value = [{name: runtimeProp.propertyValueName, value: propertyValue, sort: runtimeProp.sort}];
	} else {
		propertyValueRecord = fs.getRecord(1);
		/** @type {Array<{name: String, value: Object}>} */
		var currentValues = propertyValueRecord.property_value;
		var newValues = new Array();
		if (currentValues && currentValues.length > 0) {
			var found = false;			
			for (var i = 0; i < currentValues.length; i++) {
				newValues[i] = currentValues[i];
				if (currentValues[i].name == propertyName) {
					newValues[i].value = propertyValue;
					found = true;
				}
			}
			if (!found) {
				newValues.push({name: runtimeProp.propertyValueName, value: propertyValue, sort: runtimeProp.sort});
			}
			propertyValueRecord.property_value = newValues;
		} else {
			propertyValueRecord.property_value = [{name: runtimeProp.propertyValueName, value: propertyValue, sort: runtimeProp.sort}];
		}
	}
	
	databaseManager.saveData(propertyValueRecord);
	
	var propertyRecord = null;
	if (utils.hasRecords(propertyValueRecord.svy_property_values_to_svy_properties)) {
		propertyRecord = propertyValueRecord.svy_property_values_to_svy_properties;
	}
	
	if (propertyOwnerId == globals.svy_sec_lgn_owner_id.toString()) {
		// Reload runtime properties if a property of the logged in owner has been changed
		runtimeProperties = loadRuntimeProperties();
	}
	
	scopes.modUtils$eventManager.fireEvent(this, PROPERTY_CHANGED_EVENT_ACTION, [new Property(propertyRecord), getRuntimeProperty(propertyName)]);
	
}

/**
 * Returns the ID of either the owner, organization or user according to the admin level
 * 
 * @param {Number} adminLevel
 * 
 * @return {String}
 *
 * @private 
 * 
 * @properties={typeid:24,uuid:"04842D38-93F4-4DD8-B60D-EE8896683C9C"}
 */
function getOwnerIdForAdminLevel(adminLevel) {
	if (adminLevel == scopes.svySecurityManager.ADMIN_LEVEL.TENANT_MANAGER) {
		return globals.svy_sec_lgn_owner_id;
	} else if (adminLevel == scopes.svySecurityManager.ADMIN_LEVEL.ORGANIZATION_MANAGER) {
		return globals.svy_sec_lgn_organization_id;
	} else if (adminLevel == scopes.svySecurityManager.ADMIN_LEVEL.APPLICATION_MANAGER || 
			adminLevel == scopes.svySecurityManager.ADMIN_LEVEL.DEVELOPER) {
		return globals.zero_uuid.toString();
	} else {
		return globals.svy_sec_lgn_user_id;
	}
}

/**
 * Initializes the runtime properties
 * 
 * @param {Boolean} [forceReload]
 * 
 * @properties={typeid:24,uuid:"E0C41D84-7632-490D-82CD-D0C0F8706D92"}
 */
function initProperties(forceReload) {
	var start = new Date();
	updateDefaultPropertyValues();
	if (forceReload) {
		runtimeProperties = null;
	}
	getLoadedProperties();
	var end = new Date();
	application.output("[svyProperties] Initializing runtime properties took " + (end.valueOf() - start.valueOf()) + " ms", LOGGINGLEVEL.DEBUG);
}

/**
 * Updates the default property values for the logged in owner
 *
 * @properties={typeid:24,uuid:"50B0F774-D8A7-4370-917C-29AE32D71578"}
 */
function updateDefaultPropertyValues() {
	var ownerId = globals.zero_uuid;
	
	var filterOnSolutionName = getPropertyValueAsBoolean("filter_on_solution_name");
	
	/** @type {JSFoundSet<db:/svy_framework/svy_property_values>} */	
	var fsValues = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/svy_property_values");
	
	/** @type {QBSelect<db:/svy_framework/svy_properties>} */	
	var propQuery = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_properties");
	propQuery.result.addPk();
	if (filterOnSolutionName) {
		if (APPLICATION_CONTEXT) {
			propQuery.where.add(propQuery.columns.application_id.isin([null, APPLICATION_CONTEXT.id]));
		} else {
			propQuery.where.add(propQuery.columns.application_id.isin([null]));
		}
	}

	/** @type {JSFoundSet<db:/svy_framework/svy_properties>} */	
	var fs = databaseManager.getFoundSet(propQuery);
	
	/** @type {Array<PropertyValue>} */
	var propValues;
	/** @type {Array<PropertyValue>} */
	var propSavedValues;	
	/** @type {JSRecord<db:/svy_framework/svy_properties>} */
	var propValueRecord;
	
	/**
	 * @param {Array<PropertyValue>} values
	 * @param {Array<PropertyValue>} savedValues
	 * @return {Boolean} arrayChanged
	 */
	function addMissingValues(values, savedValues) {
		if (!savedValues) {
			return true;
		}
		var result = false;
		for (var x = 0; x < values.length; x++) {
			var found = false;
			for (var y = 0; y < savedValues.length; y++) {
				if (savedValues[y].name == values[x].name) {
					found = true;
					break;
				}
			}
			if (!found) {
				savedValues.push(values[x]);
				application.output("Added property \"" + values[x].name + "\" to the owner's properties", LOGGINGLEVEL.INFO);
				result = true;
			}
		}
		return result;
	}
	
	/**
	 * @param {Array<PropertyValue>} values
	 * @param {Array<PropertyValue>} savedValues
	 * @return {Boolean} arrayChanged
	 */
	function removeDeletedValues(values, savedValues) {
		if (!savedValues) {
			return true;
		}
		var result = false;
		for (var x = 0; x < savedValues.length; x++) {
			var found = false;
			for (var y = 0; y < values.length; y++) {
				if (savedValues[x].name == values[y].name) {
					found = true;
					break;
				}
			}
			if (!found) {
				savedValues.splice(x, 1);
				application.output("Removed property \"" + savedValues[x].name + "\" from the owner's properties", LOGGINGLEVEL.INFO);				
				result = true;
			}
		}
		return result;
	}
	
	function adjustDefaults(values, savedValues) {
		if (!savedValues) {
			return false;
		}
		
		var valueAdjusted = false;
		for (var x = 0; x < savedValues.length; x++) {
			for (var y = 0; y < values.length; y++) {
				if (values[y].name == savedValues[x].name) {
					if (savedValues[x].value != values[y].value) {
						savedValues[x].value = values[y].value;
						valueAdjusted = true;
					}
					if (savedValues[x].sort != values[y].sortOrder) {
						savedValues[x].sort = values[y].sortOrder;
						valueAdjusted = true;						
					}
				}
			}
		}
		return valueAdjusted;
	}
	
	/** @type {QBSelect<db:/svy_framework/svy_property_values>} */
	var valueQuery = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/svy_property_values");
	valueQuery.result.addPk();
	valueQuery.where.add(valueQuery.columns.owner_id.eq(globals.zero_uuid_string));
	valueQuery.where.add(valueQuery.columns.svy_properties_id.eq(valueQuery.getParameter("propertyId")));
	if (filterOnSolutionName) {
		if (APPLICATION_CONTEXT) {
			valueQuery.where.add(valueQuery.columns.application_id.isin([null, APPLICATION_CONTEXT.id]));
		} else {
			valueQuery.where.add(valueQuery.columns.application_id.isin([null]));
		}
	}
	
	for (var i = 1; i <= fs.getSize(); i++) {
		var propRecord = fs.getRecord(i);
		valueQuery.params["propertyId"] = propRecord.svy_properties_id.toString();
		fsValues.loadRecords(valueQuery);
		if (utils.hasRecords(fsValues)) {
			propValueRecord = fsValues.getRecord(1);
		} else {
			propValueRecord = fsValues.getRecord(fsValues.newRecord());
			propValueRecord.admin_level = scopes.svySecurityManager.ADMIN_LEVEL.DEVELOPER;
			propValueRecord.svy_properties_id = propRecord.svy_properties_id;
			propValueRecord.owner_id = ownerId;
			propValueRecord.property_owner_id = ownerId;
			propValueRecord.property_name = propRecord.property_name;
			propValueRecord.application_id = propRecord.admin_level >= scopes.svySecurityManager.ADMIN_LEVEL.APPLICATION_MANAGER ? null : propRecord.application_id;
		}
		
		propValues = propRecord.value_description;
		propSavedValues = propValueRecord.property_value;
		
		var arrayAdded;
		if (propValues && !propSavedValues) {
			propSavedValues = new Array();
			for (var j = 0; j < propValues.length; j++) {
				propSavedValues.push(propValues[j]);
			}
			arrayAdded = true;
		} else {
			arrayAdded = addMissingValues(propValues, propSavedValues);
		}
		
		var arrayRemoved = removeDeletedValues(propValues, propSavedValues);
		
		if (!arrayAdded && !arrayRemoved) {
//			if (adjustDefaults(propValues, propSavedValues)) {
//				propValueRecord.property_value = propSavedValues;
//				databaseManager.saveData(propValueRecord);			
//			}
			continue;
		}
		
		var propValuesToSave = new Array();			
		for (var p = 0; p < propSavedValues.length; p++) {
			propValuesToSave.push({name: propSavedValues[p].name, value: propSavedValues[p].value, sort: propSavedValues[p].sortOrder});
		}
		propValueRecord.property_value = propValuesToSave;
		databaseManager.saveData(propValueRecord);
	}
}

/**
 * Sets a given user property to the given value<p>
 * 
 * Depending on the setting in <code>save_user_properties_in_db</code> the 
 * user property is stored in the local .properties file or in the database
 * 
 * @param {String} propertyName
 * @param {Object} propertyValue
 * @param {String|UUID} [userId]
 * 
 * @return {RuntimeProperty} runtimeProperty
 * 
 * @author patrick
 * @since 25.10.2012
 *
 * @properties={typeid:24,uuid:"428D5170-E839-4866-A967-A41B07E3B739"}
 */
function setUserProperty(propertyName, propertyValue, userId) {
	if (!userId) {
		userId = globals.svy_sec_lgn_user_id;
	}
	
	/** @type {RuntimeProperty} */
	var runtimeProperty = getRuntimeProperty(propertyName);
	if (!getPropertyValue("save_user_properties_in_db")) {
		if (runtimeProperty) {
			runtimeProperty.value = propertyValue;
		} else {
			runtimeProperty = new RuntimeProperty(propertyName, propertyValue, userId);
			application.setUserProperty(propertyName, propertyValue ? propertyValue.toString() : null);
			runtimeProperties.push(runtimeProperty);
		}
		return runtimeProperty;
	}
	
	if (!userId) {
		application.output("No userId given in setUserProperty for property \"" + propertyName + "\" and globals.svy_sec_lgn_user_id has no value", LOGGINGLEVEL.ERROR);
		return null;
	}
	
	var user = scopes.svySecurityManager.getUserById(userId);
	if (!user) {
		return null;
	}
	
	/** @type {JSFoundSet<db:/svy_framework/svy_property_values>} */
	var fs;
	var record;
	if (runtimeProperty && ((runtimeProperty.loadedFromFile && !getPropertyValue("save_user_properties_in_db")) || (!runtimeProperty.loadedFromFile && getPropertyValue("save_user_properties_in_db")))) {
		runtimeProperty.value = propertyValue;
	} else if (runtimeProperty && runtimeProperty.loadedFromFile && getPropertyValue("save_user_properties_in_db")) {
		runtimeProperties.splice(runtimeProperties.indexOf(runtimeProperty),1);
		fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/svy_property_values");
		record = fs.getRecord(fs.newRecord());
		record.application_id = APPLICATION_CONTEXT ? APPLICATION_CONTEXT.id : null;
		record.admin_level = scopes.svySecurityManager.ADMIN_LEVEL.NONE;
		record.owner_id = user.ownerId;
		record.property_name = propertyName;
		record.property_owner_id = user.userId;
		record.property_value = [{name: propertyName, value: propertyValue, sort: 1}];
		runtimeProperty = createRuntimeProperty(record, {name: propertyName, value: propertyValue, sort: 1});
		runtimeProperties.push(runtimeProperty);
	} else {
		fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/svy_property_values");
		record = fs.getRecord(fs.newRecord());
		record.application_id = APPLICATION_CONTEXT ? APPLICATION_CONTEXT.id : null;
		record.admin_level = scopes.svySecurityManager.ADMIN_LEVEL.NONE;
		record.owner_id = user.ownerId;
		record.property_name = propertyName;
		record.property_owner_id = user.userId;
		record.property_value = [{name: propertyName, value: propertyValue, sort: 1}];
		runtimeProperty = createRuntimeProperty(record, {name: propertyName, value: propertyValue, sort: 1});
		runtimeProperties.push(runtimeProperty);
	}
	
	databaseManager.saveData(record);
	
	return runtimeProperty;
	
}

/**
 * Adds a listener that is notified whenever a property value is changed<p>
 * 
 * The method fired will receive the Property object and the RuntimeProperty for the changed property
 * 
 * @param {Function} action
 * 
 * @author patrick
 * @since 25.10.2012
 * 
 * @properties={typeid:24,uuid:"38CD589C-5D5D-4F4A-BB86-7AC6A8499BC2"}
 */
function addPropertyChangeListener(action) {
	scopes.modUtils$eventManager.addListener(this, PROPERTY_CHANGED_EVENT_ACTION, action);
}

/**
 * Prints all runtime properties for the given adminLevel
 * 
 * @private 
 * @properties={typeid:24,uuid:"5C156807-0FD5-47E7-8423-91C7DFD1BB0D"}
 */
function printRuntimeProperties(adminLevel) {
	var props = loadRuntimeProperties(adminLevel);
	props.sort(function(x1,x2) { return x1.propertyValueName > x2.propertyValueName });
	for (var i = 0; i < props.length; i++) {
		application.output(props[i].propertyValueName + ": " + props[i].value);
	}
}

/**
 * Sets the application/solution context for which properties are handled<p>
 * 
 * This should only be called if properties are used outside the security system of the BAP<br>
 * since the BAP filters on solution_name by itself<p>
 * 
 * Note: This call will trigger a reload of runtimeProperties
 * 
 * @param {String|UUID} applicationIdOrName
 *
 * @properties={typeid:24,uuid:"1BDF15F8-076D-45D8-81E8-9D21C0F564DC"}
 */
function setApplicationContext(applicationIdOrName) {
	if (!applicationIdOrName) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("application name or id is required for setApplicationContext");
	}
	var app;
	if (applicationIdOrName instanceof UUID) {
		app = scopes.svySecurityManager.getApplicationByID(applicationIdOrName);
	} else {
		app = scopes.svySecurityManager.getApplication(applicationIdOrName);
	}
	if (!app) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("application with name or id \"" + applicationIdOrName + "\" does not exist");
	}
	
	var currentFilters = databaseManager.getTableFilterParams(globals.nav_db_framework);
	currentFilters = currentFilters.filter(function(item) {
		return item[0] == "svy_property_values" || item[0] == "svy_properties" || item[0] == "svy_property_sets";
	});
	var success;
	if (currentFilters.length > 0) {
		// currently filtered
		for (var i = 0; i < currentFilters.length; i++) {
			/** @type {String} */
			var filterName = currentFilters[i][4];
			if (filterName) {
				success = databaseManager.removeTableFilterParam(globals.nav_db_framework, filterName);
				if (!success) {
					throw new scopes.modUtils$exceptions.IllegalStateException("Failed to remove table filter for table " + currentFilters[i][0]);
				}
			}
		}
	}
	
	// create table filters
	success = databaseManager.addTableFilterParam(globals.nav_db_framework, "svy_property_values", "application_id", "^||=", app.id, "solution_filter_svy_property_values");
	if (!success) {
		throw new scopes.modUtils$exceptions.IllegalStateException("Failed to create table filter for table svy_property_values");
	}
	success = databaseManager.addTableFilterParam(globals.nav_db_framework, "svy_properties", "application_id", "^||=", app.id, "solution_filter_svy_properties");
	if (!success) {
		throw new scopes.modUtils$exceptions.IllegalStateException("Failed to create table filter for table svy_properties");
	}
	success = databaseManager.addTableFilterParam(globals.nav_db_framework, "svy_property_sets", "application_id", "^||=", app.id, "solution_filter_svy_property_sets");
	if (!success) {
		throw new scopes.modUtils$exceptions.IllegalStateException("Failed to create table filter for table svy_property_sets");
	}	
	
	APPLICATION_CONTEXT = app;	
	reloadRuntimeProperties();	
}