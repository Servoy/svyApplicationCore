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
 * Returns the module version
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
 * TODO type return type
 * FIXME description mentions this is an abstract method, but I dont think it should be and it is not annotated as such
 * Abstract method, to override on instances<p>
 * 
 * Returns the default properties for this module provided as an object of type {{propertySet: Object, properties: Array<Object>}}<p>
 * 
 * The object has two properties:<p>
 * 
 * the <code>propertySet</code> is an object describing the set by which properties are grouped:<p>
 * 
 * {name: String, displayName: String, description: String, icon: String, sort: Number, formName: String}<p>
 * 
 * where<p>
 * 
 * <code>name</code> is the name of the property set<br>
 * <code>displayName</code> is the name that is shown to the user (i18n)<br>
 * <code>description</code> is a descriptive text (i18n) for this set<br>
 * <code>icon</code> is the icon of this property set<br>
 * <code>sort</code> is the sort order of this set<br>
 * <code>formName</code> is the name of a custom form used for this set<br>
 * 
 * the <code>properties</code> Array is an array of objects representing the single properties:<p>
 * 
 * {name: String, value: Object, securityLevel: Number, sort: Number, dataType: Number, displayType: Number, label: String, description: String, valueListName: String, valueListValues: Array}<p>
 * 
 * where<p>
 * 
 * <code>name</code> is the name of the property<br>
 * <code>value</code> is the default value of this property<br>
 * <code>dataType</code> is the data type of this property (one of JSVariable constants)<br>
 * <code>displayType</code> is the display type of this property (one of JSField constants)<br>
 * <code>value</code> is the default value of this property<br>
 * <code>sort</code> is the sort order of this value in the set<br>
 * <code>securityLevel</code> is the minimum security level required to edit this property (one of scopes.svySecurityManager.ADMIN_LEVEL)<br>
 * <code>label</code> is the label text used when this property is shown (i18n)<br>
 * <code>description</code> is the description of this property (i18n)<br>
 * <code>valueListName</code> is the name of a value list to be used when this property is shown<br>
 * <code>valueListValues</code> is an array used to fill a custom value list<br>
 * 
 * 
 * @properties={typeid:24,uuid:"1A9F7572-E49F-472B-A7DF-011A2CF251D3"}
 */
function getProperties() {}

/**
 * Override to invoke module initialization code
 * 
 * @param {Object<Array<String>>} [startupArguments] all startup arguments with which the solution is opened
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