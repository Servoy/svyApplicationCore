/**
 * @type {Array<Property>}
 * 
 * @private 
 *
 * @properties={typeid:35,uuid:"3047E651-2B75-436C-8DD9-6056800556AC",variableType:-4}
 */
var runtimeProperties = loadRuntimeProperties();

/**
 * @properties={typeid:35,uuid:"90B235D5-64C8-485C-B482-DCD4BFD9042E",variableType:-4}
 */
var SECURITY_LEVEL = { NOT_EDITABLE: 0, EDITABLE_BY_OWNER: 1, EDITABLE_BY_ORGANIZATION: 2, EDITABLE_BY_USER: 4 };

/**
 * @private 
 * @properties={typeid:24,uuid:"5F654912-306D-4609-81E5-D2230818627C"}
 */
function getLoadedProperties() {
	if (!runtimeProperties) {
		runtimeProperties = loadRuntimeProperties();
	}
	return runtimeProperties;
}

/**
 * @param {String} propertyName
 * 
 * @return {Property} property
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"D40C8A42-7A29-41E6-A324-0FC99CBE5C0B"}
 */
function getProperty(propertyName) {
	var props = getLoadedProperties();
	
	function propFilter(x) {
		return (x == propertyName);
	}
	
	var mappedArray = props.map(propFilter);
	if (mappedArray.length > 0) {
		return mappedArray[0];
	} else {
		return null;
	}
}

/**
 * 
 * @return {Array<Property>} properties
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"2DD6C79F-0E99-4F9B-A534-53EBECC5096E"}
 */
function getProperties() {
	return getLoadedProperties();
}

/**
 * Returns the value of the given property or null if not found<br><br>
 * 
 * This function should only be called if the property is known to have only one value; otherwise use scopes.svyProperties.getPropertyValues()
 * 
 * @param {String} propertyName
 * 
 * @return {Object} propertyValue
 * 
 * @author patrick
 * @since 06.09.2012
 *
 * @properties={typeid:24,uuid:"0267E8D6-0610-4B68-85B6-540E2D07CB8E"}
 */
function getPropertyValue(propertyName) {
	var values = getPropertyValues(propertyName);
	if (values && values.length > 0) {
		return values[0];
	} else {
		return null;
	}
}

/**
 * Returns the values of the given property or null if not found
 * 
 * @param {String} propertyName
 * 
 * @return {Array} propertyValues
 * 
 * @author patrick
 * @since 06.09.2012
 *
 * @properties={typeid:24,uuid:"88E60D1C-08FE-485D-8F25-F27441288531"}
 */
function getPropertyValues(propertyName) {
	var prop = getProperty(propertyName);
	if (!prop) {
		return null;
	} else {
		return prop.values;
	}
}

/**
 * Sets the values of the given property (optionally for the given userId)<br>
 * 
 * <b>Important:</b> All existing property values are removed!
 * 
 * @param {String} propertyName
 * @param {Array} propertyValues
 * @param {UUID|String} userId
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"1876BC12-2D20-48D5-8948-A99FB30DB805"}
 */
function setPropertyValues(propertyName, propertyValues, userId) {
	/** @type {QBSelect<db:/svy_framework/nav_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals["nav_db_framework"] + "/nav_properties");
	query.result.addPk();
	query.where.add(query.columns.property_name.eq(propertyName));
	if (userId) {
		query.where.add(query.columns.user_id.eq(userId.toString()));
	}
	
	// create String array
	var values = new Array();
	for (var i = 0; i < propertyValues.length; i++) {
		var _propValue = propertyValues[i];
		if (_propValue instanceof String) {
			values.push(_propValue);
		} else if (_propValue instanceof Boolean) {
			values.push(_propValue ? "true" : "false");
		} else {
			values.push(_propValue);
		}
	}
	
	/** @type {JSFoundSet<db:/svy_framework/nav_properties>} */
	var fs = databaseManager.getFoundSet(query);
	if (fs && fs.getSize() == 1) {
		var record = fs.getRecord(1);
		record.property_value = values;
		databaseManager.saveData(record);
	} else {
		application.output("Requested property \"" + propertyName + "\" is missing in the properties", LOGGINGLEVEL.WARNING);
	}
}

/**
 * Sets the value of the given property (optionally for the given userId)<br>
 * 
 * @param {String} propertyName
 * @param {Array} propertyValue
 * @param {UUID|String} userId
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"41C3838A-B8C1-4DB6-86D9-AEA1C38473AA"}
 */
function setPropertyValue(propertyName, propertyValue, userId) {
	setPropertyValues(propertyName, [propertyValue], userId);
}

/**
 * @param {JSRecord<db:/svy_framework/nav_properties>} propertyRecord
 *
 * @properties={typeid:24,uuid:"10C602B8-B4BB-4ACB-97CE-D10E54714734"}
 */
function Property(propertyRecord) {
	
	var record = propertyRecord;
	
	/**
	 * The name of this property
	 * 
	 * @type {String}
	 */
	this.name = propertyRecord.property_name;
	
	/**
	 * The ID of this property
	 * 
	 * @type {UUID}
	 */
	this.propertyId = propertyRecord.nav_property_id;
	
	/**
	 * The values of this property
	 * 
	 * @type {Array}
	 */
	this.values = getValueArray(propertyRecord.property_value);
	
	/**
	 * The owner ID of this property
	 *  
	 * @type {UUID}
	 */
	this.ownerId = propertyRecord.owner_id ? propertyRecord.owner_id : null;	
	
	/**
	 * The organization ID of this property
	 *  
	 * @type {UUID}
	 */
	this.orgId = propertyRecord.organization_id ? propertyRecord.organization_id : null;
	
	/**
	 * The user ID of this property
	 * 
	 * @type {UUID}
	 */
	this.userId = propertyRecord.user_id;
	
	/**
	 * The modification date of this property
	 * 
	 * @type {Date}
	 */
	this.lastModified = propertyRecord.modification_date ? propertyRecord.modification_date : null;
	
	/**
	 * If true, the property is a user property
	 * 
	 * @type {Boolean}
	 */
	this.isUserProperty = propertyRecord.user_id ? true : false;
	
	/**
	 * If true, the property is an organization property
	 * 
	 * @type {Boolean}
	 */
	this.isOrganizationProperty = propertyRecord.organization_id ? true : false;
	
	/**
	 * If true, the property is an owner property
	 * 
	 * @type {Boolean}
	 */
	this.isOwnerProperty = propertyRecord.owner_id ? true : false;	
	
	/**
	 * The id of the module to which this property belongs
	 * 
	 * @type {String}
	 */
	this.moduleId = propertyRecord.module_id ? propertyRecord.module_id : null;
	
	/**
	 * Returns the user of this property as a scopes.svySecurityManager.User object
	 * 
	 * @type {Object}
	 */
	this.getUser = function() {
		if (!record.user_id) {
			return null;
		} else {
			return scopes.svySecurityManager.getUserById(record.user_id);
		}
	}
	
	/**
	 * Returns the organization of this property as a scopes.svySecurityManager.Organization object
	 * 
	 * @type {Object}
	 */
	this.getOrganization = function() {
		if (!record.organization_id) {
			return null;
		} else {
			return scopes.svySecurityManager.getOrganizationById(record.organization_id);
		}
	}
	
	/**
	 * Returns the owner of this property as a scopes.svySecurityManager.Owner object
	 * 
	 * @type {Object}
	 */
	this.getOwner = function() {
		if (!record.owner_id) {
			return null;
		} else {
			return scopes.svySecurityManager.getOwnerById(record.owner_id);
		}
	}	
	
	Object.defineProperty(this, "name", { 
		get: function() {
			return record.property_name;
		},
		set: function(x) {
			
		}
	});
	
	Object.defineProperty(this, "propertyId", { 
		get: function() {
			return record.nav_property_id;
		},
		set: function(x) {
			
		}
	});
	
	Object.defineProperty(this, "values", { 
		get: function() {
			var _result = getValueArray(record.property_value);
			return _result;
		},
		set: function(x) {
			setPropertyValues(record.property_name, x, record.user_id);
		}
	});
	
	Object.defineProperties(this, {
		"getUser": {
			enumerable: false
		},
		"getOrganization": {
			enumerable: false
		},
		"getOwner": {
			enumerable: false
		}
	});
	
	Object.seal(this);
	
}

/**
 * @properties={typeid:24,uuid:"0084C159-E8D0-4DA8-BEC1-48E70A8EDF6E"}
 */
function PropertyDescription() {
	
	/**
	 * The name of this Property
	 * 
	 * @type {String}
	 */
	this.name = "";
	
	/**
	 * Array with all PropertyValueDescription objects of this Property
	 * 
	 * @type {Array<PropertyValueDescription>}
	 */
	this.valueDescriptions = new Array();
	
	/**
	 * The security level of this Property<br><br>
	 * 
	 * The following levels are supported:<br>
	 * <ul>
	 * <li>SECURITY_LEVEL.NOT_EDITABLE = not editable</li>
	 * <li>SECURITY_LEVEL.EDITABLE_BY_OWNER = editable by tenant admin</li>
	 * <li>SECURITY_LEVEL.EDITABLE_BY_ORGANIZATION = editable by organization admin</li>
	 * <li>SECURITY_LEVEL.EDITABLE_BY_USER = editable by user</li>
	 * </ul>
	 * 
	 */
	var securityLevel = 0;
	
	/**
	 * Adds a value description to this PropertyDescription
	 * 
	 * @param {Number} sortOrder
	 * @param {String} name
	 * @param {Number} dataType
	 * 
	 * @return {PropertyValueDescription}
	 */
	this.addValueDescription = function(sortOrder, name, dataType) {
		var propDescription = new PropertyValueDescription(sortOrder, name, dataType);
		this.valueDescriptions.push(propDescription);
		return propDescription;
	}
	
	Object.defineProperty(this, "securityLevel", {
		get: function() {
			if (securityLevel == 4) {
				return "EDITABLE_BY_USER";
			} else if (securityLevel == 2) {
				return "EDITABLE_BY_ORGANIZATION";
			}  else if (securityLevel == 1) {
				return "EDITABLE_BY_OWNER";
			} else {
				return "NOT_EDITABLE";
			} 
		},
		set: function(x) {
			if (x == SECURITY_LEVEL.EDITABLE_BY_ORGANIZATION || x == SECURITY_LEVEL.EDITABLE_BY_OWNER || x == SECURITY_LEVEL.EDITABLE_BY_USER || x == SECURITY_LEVEL.NOT_EDITABLE) {
				securityLevel = x;
			}
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
 * Description of a single property value
 * 
 * @constructor 
 * @private 
 * 
 * @param {Number} sortOrder
 * @param {String} name
 * @param {Number} dataType
 *
 * @properties={typeid:24,uuid:"7D1F559F-06AE-4A8D-8869-AB10AB834FC6"}
 */
function PropertyValueDescription(sortOrder, name, dataType) {
	
	/**
	 * The sort order for this value
	 * 
	 * @type {Number}
	 */
	this.sortOrder = sortOrder;
	
	/**
	 * The name of this value
	 * 
	 * @type {String}
	 */
	this.name = name;
	
	/**
	 * The data type given as a JSColumn constant
	 * 
	 * @type {Number}
	 */
	this.dataType = dataType;
	
	/**
	 * The display type given as a JSField constant
	 * 
	 * @type {Number}
	 */
	this.displayType = null;
	
	/**
	 * The default value of this property
	 * 
	 * @type {Object}
	 */
	this.defaultValue = null;
	
	/**
	 * The name of the value list to be used
	 * 
	 * @type {String}
	 */
	this.valueListName = null;
	
	/**
	 * Fixed values for the value list
	 * 
	 * @type {Array}
	 */
	this.valueListValues = null;
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
 * Returns all properties of the given module
 * 
 * @param {String} moduleId
 * 
 * @return {Array<Property>} moduleProperties
 * 
 * @author patrick
 * @since 18.09.2012
 *
 * @properties={typeid:24,uuid:"DADA9046-8E92-403A-815A-48E7D2CE60F3"}
 */
function getModuleProperties(moduleId) {
	var props = getLoadedProperties();
	function propFilter(property) {
		return (property.moduleId == moduleId);
	}
	return props.filter(propFilter);
}

/**
 * Creates properties as given<br>
 * 
 * The method will only create the properties that do not already exist
 * 
 * @param {Array} defaultProperties as Array<{name: String, value: Object}>
 * @param {String} [moduleId] the ID of the module to which these properties belong
 *
 * @properties={typeid:24,uuid:"73A7F888-D54A-40FD-9968-740E24D6BFCC"}
 */
function setDefaultProperties(defaultProperties, moduleId) {
	if (!defaultProperties || defaultProperties.length == 0) {
		return;
	}
	
	// Init
	getLoadedProperties();
	
	var propertyNames = new Array();
	for (var pp = 0; pp < defaultProperties.length; pp++) {
		propertyNames.push(defaultProperties[pp].name);
	}
	
	/** @type {QBSelect<db:/svy_framework/nav_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals["nav_db_framework"] + "/nav_properties");
	query.result.addPk();
	query.where.add(query.columns.property_name.isin(propertyNames));
	
	/** @type {JSFoundSet<db:/svy_framework/nav_properties>} */
	var fs = databaseManager.getFoundSet(query);
	
	if (utils.hasRecords(fs)) {
		for (var fsi = 1; fsi <= fs.getSize(); fsi++) {
			var record = fs.getRecord(fsi);
			var index = propertyNames.indexOf(record.property_name);
			if (index > -1) {
				propertyNames.splice(index,1);
				defaultProperties.splice(index,1);
			}
		}
	}
	
	for (var i = 0; i < defaultProperties.length; i++) {
		/** @type {{name: String, value: Object}} */
		var prop = defaultProperties[i];
		record = fs.getRecord(fs.newRecord());
		record.property_name = prop.name;
		record.property_value = prop.value instanceof Array ? prop.value : [prop.value];
		record.module_id = moduleId;
		if (databaseManager.saveData(record)) {
			runtimeProperties.push(new Property(record));
			application.output("Created new property \"" + prop.name + "\" with value " + record.property_value, LOGGINGLEVEL.INFO);
		} else {
			application.output("Failed to create new property \"" + prop.name + "\"", LOGGINGLEVEL.WARNING);
		}
	}
}

/**
 * Loads all relevant properties for the logged in user<br>
 * 
 * properties are prioritized in this order:<br>
 * 
 * <ul>
 * <li>user</li>
 * <li>organization</li>
 * <li>owner</li>
 * <li>global</li>
 * </ul>
 * 
 * @return {Array<Property>}
 * 
 * @private 
 * @properties={typeid:24,uuid:"45FFC645-B941-42E6-A2A1-63AA5F16D0B8"}
 */
function loadRuntimeProperties() {
	var userId = scopes.svySecurityManager.getUser().userId;
	var orgId = scopes.svySecurityManager.getOrganization().orgId;
	var ownerId = scopes.svySecurityManager.getOwner().ownerId;
	
	/** @type {QBSelect<db:/svy_framework/nav_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals["nav_db_framework"] + "/nav_properties");
	query.result.addPk();
	query.where.add(query.columns.owner_id.isin([null, ownerId.toString(), "00000000-0000-0000-0000-000000000000"]));
	query.where.add(query.columns.organization_id.isin([null, orgId.toString(), "00000000-0000-0000-0000-000000000000"]));	
	query.where.add(query.columns.user_id.isin([null, userId.toString(), "00000000-0000-0000-0000-000000000000"]));
	
	/** @type {JSFoundSet<db:/svy_framework/nav_properties>} */
	var fs = databaseManager.getFoundSet(query);
	
	/** @type {Array<Property>} */
	var result = new Array();	
	
	if (fs && utils.hasRecords(fs)) {
		var relevantProperties = new Object();
		for (var i = 1; i <= fs.getSize(); i++) {
			var record = fs.getRecord(i);
			var propertyLevel = 0;
			if (record.owner_id) {
				propertyLevel = 1;
			} else if (record.organization_id) {
				propertyLevel = 2;
			} else if (record.user_id) {
				propertyLevel = 4;
			}
			if (record.property_name in relevantProperties) {
				if (relevantProperties[record.property_name].level < propertyLevel) {
					relevantProperties[record.property_name].level = propertyLevel;
					relevantProperties[record.property_name].record = record;
				}
			} else {
				relevantProperties[record.property_name] = new Object();
				relevantProperties[record.property_name].level = propertyLevel;
				relevantProperties[record.property_name].record = record;
			}
		}
		for ( var rp in relevantProperties) {
			result.push(new Property(relevantProperties[rp].record));
		}
	}
	runtimeProperties = result;
	application.output("Properties filled");
	return result;
}