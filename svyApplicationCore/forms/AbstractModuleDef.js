/*
 * Abstract class for modules to extend to provide metadata on the module and to receive initialization callbacks
 */

/**
 * @deprecated Override getVersion instead. Will be removed in version 6
 * @type {String}
 * @protected
 * 
 * @properties={typeid:35,uuid:"EEACC49F-D09D-488E-B428-00641387B37E"}
 */
var version;

/**
 * Returns the module version. User semantic versions {@link http://semver.org/}
 * @abstract
 * @return {String} version
 * @properties={typeid:24,uuid:"88C8B51B-1405-4ED0-A0A0-389230BF5663"}
 */
function getVersion() {
	throw new scopes.svyExceptions.AbstractMethodInvocationException('Abstract method getVersion() must be implemented on instances of AbstractModuleDef');
}

/**
 * @deprecated Override getId instead. Will be removed in version 6
 * @type {String}
 * @protected
 * 
 * @properties={typeid:35,uuid:"B0F7941E-23FE-4D1F-9E26-696D15EFC95D"}
 */
var id;

/**
 * Returns the module identifier
 * @abstract
 * @return {String} id
 * @properties={typeid:24,uuid:"47D17F1A-7591-435A-9952-E0366D65F206"}
 */
function getId() {
	throw new scopes.svyExceptions.AbstractMethodInvocationException('Abstract method getId() must be implemented on instances of AbstractModuleDef');
}

/**
 * Override to invoke module initialization code
 * 
 * @param {Object.<String,String>} [startupArguments] all startup arguments with which the solution is opened
 * 
 * @properties={typeid:24,uuid:"348C7102-DD5B-492D-8092-D5961AAF2CE4"}
 */
function moduleInit(startupArguments) {}

/**
 * If the module depends on other modules being initialized first, return the ID's of those modules as an Array of Strings
 * @return {Array<{id: String}>}
 *
 * @properties={typeid:24,uuid:"D6A3F8D4-5E03-40BA-93DF-84D39270A3DF"}
 */
function getDependencies() {
	return null
}