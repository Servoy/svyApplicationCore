/*
 * Abstract class for modules to extend to provide metadata on the module and to receive initialization callbacks
 * 
 * TODO:
 * - Module name
 * - Test if version is not static
 * - Allow revolving module dependancies
 */

/**
 * @type {Number}
 * @protected
 * @properties={typeid:35,uuid:"EEACC49F-D09D-488E-B428-00641387B37E",variableType:4}
 */
var version = -1

/**
 * Returns the module version. Is final, DO NOT OVERRIDE
 * @final
 * @properties={typeid:24,uuid:"88C8B51B-1405-4ED0-A0A0-389230BF5663"}
 */
function getVersion() {
	return version;
}

/**
 * @type {String}
 * @protected
 * 
 * @properties={typeid:35,uuid:"B0F7941E-23FE-4D1F-9E26-696D15EFC95D"}
 */
var id

/**
 * @final
 * @properties={typeid:24,uuid:"47D17F1A-7591-435A-9952-E0366D65F206"}
 */
function getId() {}

/**
 * Abstract method, to override on instances 
 * @abstract
 * @param {Object<Array<String>>} [startupArguments] all startup arguments with which the solution is opened
 * 
 * @properties={typeid:24,uuid:"348C7102-DD5B-492D-8092-D5961AAF2CE4"}
 */
function moduleInit(startupArguments) {}