
/**
 *
 * @param {String} name
 *
 * @properties={typeid:24,uuid:"B12C6FF7-3569-45EC-8402-EF494927374F"}
 */
function getUserProperty(name) {
	return scopes.svyProperties.getPropertyValue(name);
}

/**
*
* @param {String} name
* @param {String} value
*
* @properties={typeid:24,uuid:"946B291F-3DE6-4D3D-BE94-00F827FBEAEA"}
*/
function setUserProperty(name, value) {
	scopes.svyProperties.setUserProperty(name,value);
}
