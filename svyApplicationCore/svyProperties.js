/**
 * @param {String} propertyName
 * @param {UUID|String} [userId]
 * 
 * @return {Property} propertyValue
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"D40C8A42-7A29-41E6-A324-0FC99CBE5C0B"}
 */
function getProperty(propertyName, userId) {
	/** @type {QBSelect<db:/svy_framework/nav_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals["nav_db_framework"] + "/nav_properties");
	query.result.addPk();
	query.where.add(query.columns.property_name.eq(propertyName));
	if (userId) {
		query.where.add(query.columns.user_id.eq(userId.toString()));
	}
	
	/** @type {JSFoundSet<db:/svy_framework/nav_properties>} */
	var fs = databaseManager.getFoundSet(query);
	
	if (fs && fs.getSize() == 1) {
		return new Property(fs.getRecord(1));
	} else {
		return null;
	}
}

/**
 * @param {UUID|String} [userId]
 * 
 * @return {Array<Property>} properties
 * 
 * @author patrick
 * @since 11.09.2012
 *
 * @properties={typeid:24,uuid:"2DD6C79F-0E99-4F9B-A534-53EBECC5096E"}
 */
function getProperties(userId) {
	/** @type {QBSelect<db:/svy_framework/nav_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals["nav_db_framework"] + "/nav_properties");
	query.result.addPk();
	if (userId) {
		query.where.add(query.columns.user_id.eq(userId.toString()));
	}
	
	/** @type {JSFoundSet<db:/svy_framework/nav_properties>} */
	var fs = databaseManager.getFoundSet(query);
	
	if (fs && utils.hasRecords(fs)) {
		/** @type {Array<Property>} */
		var result = new Array();
		for (var i = 1; i <= fs.getSize(); i++) {
			var record = fs.getRecord(i);
			result.push(new Property(record));
		}
		return result;
	} else {
		return null;
	}
}

/**
 * Returns the value of the given property (optionally for the given userId) or null if not found<br><br>
 * 
 * This function should only be called if the property is known to have only one value; otherwise use scopes.svyProperties.getPropertyValues()
 * 
 * @param {String} propertyName
 * @param {UUID|String} [userId]
 * 
 * @return {Object} propertyValue
 * 
 * @author patrick
 * @since 06.09.2012
 *
 * @properties={typeid:24,uuid:"0267E8D6-0610-4B68-85B6-540E2D07CB8E"}
 */
function getPropertyValue(propertyName, userId) {
	var values = getPropertyValues(propertyName, userId);
	if (values && values.length > 0) {
		return values[0];
	} else {
		return null;
	}
}

/**
 * Returns the values of the given property (optionally for the given userId) or null if not found
 * 
 * @param {String} propertyName
 * @param {UUID|String} [userId]
 * 
 * @return {Array} propertyValues
 * 
 * @author patrick
 * @since 06.09.2012
 *
 * @properties={typeid:24,uuid:"88E60D1C-08FE-485D-8F25-F27441288531"}
 */
function getPropertyValues(propertyName, userId) {
	/** @type {QBSelect<db:/svy_framework/nav_properties>} */	
	var query = databaseManager.createSelect("db:/" + globals["nav_db_framework"] + "/nav_properties");
	query.result.addPk();
	query.where.add(query.columns.property_name.eq(propertyName));
	if (userId) {
		query.where.add(query.columns.user_id.eq(userId.toString()));
	}
	
	/** @type {JSFoundSet<db:/svy_framework/nav_properties>} */
	var fs = databaseManager.getFoundSet(query);
	
	if (fs && fs.getSize() == 1) {
		return getValueArray(fs.getRecord(1).property_value);
	} else {
		application.output("Requested property \"" + propertyName + "\" is missing in the properties", LOGGINGLEVEL.WARNING);
		return null;
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
	this.lastModified = propertyRecord.modification_date;
	
	/**
	 * If true, the property is a user property
	 * 
	 * @type {Boolean}
	 */
	this.isUserProperty = propertyRecord.user_id ? true : false;
	
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
		}
	});
	
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
 * Creates properties as given<br>
 * 
 * The method will only create the properties that do not already exist
 * 
 * @param {Array} properties - Array<{name: String, value: Object}>
 *
 * @properties={typeid:24,uuid:"73A7F888-D54A-40FD-9968-740E24D6BFCC"}
 */
function setDefaultProperties(properties) {
	if (!properties || properties.length == 0) {
		return;
	}
	
	var propertyNames = new Array();
	for (var pp = 0; pp < properties.length; pp++) {
		propertyNames.push(properties[pp].name);
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
				properties.splice(index,1);
			}
		}
	}
	
	for (var i = 0; i < properties.length; i++) {
		var prop = properties[i];
		record = fs.getRecord(fs.newRecord());
		record.property_name = prop.name;
		record.property_value = prop.value instanceof Array ? prop.value : [prop.value];
		if (databaseManager.saveData(record)) {
			application.output("Created new property \"" + prop.name + "\" with value " + record.property_value, LOGGINGLEVEL.INFO);
		} else {
			application.output("Failed to create new property \"" + prop.name + "\"", LOGGINGLEVEL.WARNING);
		}
	}
}