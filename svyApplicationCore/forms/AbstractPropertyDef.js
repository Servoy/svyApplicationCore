/**
 * The admin level for which these properties are edited<p>
 * 
 * Set this in the initPropertyForm method
 * 
 * @see scopes.svySecurityManager.ADMIN_LEVEL for possible values
 * 
 * @type {Number}
 * 
 * @protected 
 *
 * @properties={typeid:35,uuid:"E303F1BB-856D-4109-82B9-B340D56E93EC",variableType:8}
 */
var adminLevel;

/**
 * The names of the properties used in this form<p>
 * 
 * Set this in the initPropertyForm method
 * 
 * @type {Array<String>}
 * 
 * @protected 
 *
 * @properties={typeid:35,uuid:"F097BCAA-A241-4B22-9B3E-B21F30596336",variableType:-4}
 */
var propertyNames;

/**
 * This method should be attached to the onDataChange event of any property that should be saved<br>
 * 
 * The name of the property to be set has to be provided
 * 
 * @param {Object} oldValue			- old value
 * @param {Object} newValue			- new value
 * @param {JSEvent} event			- the JSEvent
 * @param {String} [propertyName]	- if not given, it is assumed that the dataprovider name of the field is the property name
 * 
 * @throws {scopes.svyExceptions.IllegalArgumentException}
 * @throws {scopes.svyExceptions.SvyException}
 * 
 * @properties={typeid:24,uuid:"C9A8DB84-6EDF-40C6-889D-15C3EDD473FF"}
 */
function onDataChangeValue(oldValue, newValue, event, propertyName) {
	if (!propertyName) {
		var runtimeElement = forms[event.getFormName()].elements[event.getElementName()];
		if ("dataProviderID" in runtimeElement) {
			propertyName = runtimeElement["dataProviderID"];
		}
	}
	if (!propertyName) {
		throw new scopes.svyExceptions.IllegalArgumentException("Could not find the property name in onDataChangeValue");
	}
	scopes.svyProperties.setPropertyValue(propertyName, newValue, adminLevel);
}

/**
 * Saves the given property value
 * 
 * @param {String} propertyName
 * @param {Object} propertyValue
 * 
 * @throws {scopes.svyExceptions.SvyException}
 *
 * @properties={typeid:24,uuid:"BAF01236-BB62-4159-90F4-84A05A47845C"}
 */
function setPropertyValue(propertyName, propertyValue) {
	scopes.svyProperties.setPropertyValue(propertyName, propertyValue, adminLevel);
}

/**
 * Returns all the property values for the property names given by getPropertyNames()
 * 
 * @return {Array<scopes.svyProperties.RuntimeProperty>}
 * 
 * @properties={typeid:24,uuid:"554D9FB5-6904-4A51-B423-3A712D1FE546"}
 */
function getPropertyValues() {
	return scopes.svyProperties.getRuntimeProperties(adminLevel, getPropertyNames());
}

/**
 * @properties={typeid:24,uuid:"80B8EAE0-73C3-493B-B414-4DED315493BB"}
 */
function getPropertyNames() {
	return propertyNames;
}

/**
 * Abstract method, to override on instances<p>
 * 
 * Typically, in this method the adminLevel and the property names should be set
 * 
 * @abstract
 * @properties={typeid:24,uuid:"CC35C781-AC7F-463B-83C3-B3B8FB6E4239"}
 */
function initPropertyForm() {}
