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
 * @properties={typeid:35,uuid:"0D685C21-F438-4E57-9B0F-007CD4B88E71",variableType:8}
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
 * @properties={typeid:35,uuid:"F2AAD16C-AF9C-4B25-9D79-E2989051A5C4",variableType:-4}
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
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
 * @throws {scopes.modUtils$exceptions.SvyException}
 * 
 * @properties={typeid:24,uuid:"BD147337-DC27-4F86-BB16-564E3E8C798E"}
 */
function onDataChangeValue(oldValue, newValue, event, propertyName) {
	if (!propertyName) {
		var runtimeElement = forms[event.getFormName()].elements[event.getElementName()];
		if ("getDataProviderID" in runtimeElement) {
			propertyName = runtimeElement["getDataProviderID"]();
		}
	}
	if (!propertyName) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Could not find the property name in onDataChangeValue");
	}
	scopes.svyProperties.setPropertyValue(propertyName, newValue, adminLevel);
}

/**
 * Saves the given property value
 * 
 * @param {String} propertyName
 * @param {Object} propertyValue
 * 
 * @throws {scopes.modUtils$exceptions.SvyException}
 *
 * @properties={typeid:24,uuid:"0971E366-C940-4346-B033-2ED299C50051"}
 */
function setPropertyValue(propertyName, propertyValue) {
	scopes.svyProperties.setPropertyValue(propertyName, propertyValue, adminLevel);
}

/**
 * Returns all the property values for the property names given by getPropertyNames()
 * 
 * @return {Array<scopes.svyProperties.RuntimeProperty>}
 * 
 * @properties={typeid:24,uuid:"DEAC0C97-2650-4C0E-A71B-F630C2E19398"}
 */
function getPropertyValues() {
	return scopes.svyProperties.getRuntimeProperties(adminLevel, getPropertyNames());
}

/**
 * @properties={typeid:24,uuid:"E8C7804A-240F-4DCD-AF3C-7FD431F0E648"}
 */
function getPropertyNames() {
	return propertyNames;
}

/**
 * Abstract method, to override on instances<p>
 * 
 * Typically, in this method the adminLevel and the property names should be set
 * 
 * @param {Number} propertyEditorAdminLevel the admin level of the editor calling this form
 * @param {String} styleClass the style name used by the propertyEditor that called this form
 * 
 * @abstract
 * @properties={typeid:24,uuid:"C4757087-A7C5-4269-B764-D918AF7A18A3"}
 */
function initPropertyForm(propertyEditorAdminLevel, styleClass) {}
