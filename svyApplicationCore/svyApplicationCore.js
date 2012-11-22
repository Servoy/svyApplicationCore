/*
 * Core Application logic.
 * Provides:
 * - Module initialization with dependencies
 */

/**
 * Method to call from the onOpen method of a solution (can be used directly as the onOpen event handler).
 *
 * The method will invoke the moduleInit method on all instances of the AbstractModuleDef class
 *
 * @param {Object<Array<String>>} [startupArguments] all startup arguments with which the solution is opened
 *
 * @properties={typeid:24,uuid:"2BCF34F0-F66E-456A-A493-2EE1B3EBE1B8"}
 */
function initModules(startupArguments) {
	//Init self
	//TODO: implement something if that is needed
	
	scopes.svyProperties.initProperties();
	
	//Init modules
	var mods = scopes.svyUtils.getJSFormInstances(solutionModel.getForm('AbstractModuleDef')) 

	for (var i = 0; i < mods.length; i++) {
		/** @type {RuntimeForm<AbstractModuleDef>}*/
		var form = forms[mods[i].name];
		/** @type {{propertySet: Object, properties: Array<Object>}} */
		var props = form.getProperties();
		if (props) {
			scopes.svyProperties.updateDefaultProperties(props);
		}		
		form.moduleInit.call(null, startupArguments);
		application.output('Initialized module ' + (form.getId() ? form.getId() : "[no ID provided from moduleInit on form \"" + form.controller.getName() + "\"]") + ' version ' + form.getVersion(), LOGGINGLEVEL.DEBUG);
		history.removeForm(mods[i].name);
	}
}

/**
 * Method to assign to or call from the solution's onDataBroadcast event
 * 
 * @param {String} dataSource table data source
 * @param {Number} action see SQL_ACTION_TYPES constants
 * @param {JSDataSet} pks affected primary keys
 * @param {Boolean} cached data was cached
 * 
 * @properties={typeid:24,uuid:"FAA2B4E0-180C-4CDF-BE10-2D458AE6EC07"}
 */
function fireDataBroadcastEvent(dataSource, action, pks, cached) {
	scopes.svyEventManager.fireEvent(null,this,'databroadcast', Array.prototype.slice.call(arguments, 0))
}

/**
 * Registers a listener for incoming databroadcast events.<br><br>
 * Note that a Client only receives databroadcast events for datasources to which is holds a reference, for example has a form loaded connected to the datasource
 * 
 * @param {Function} listener
 * 
 * @example <pre> &#47;**
 *  * Var holding a reference to a foundset on the contacts table of the udm database, so this client receives databroadcast events for this table
 *  * @private
 *  * @type {JSFoundSet}
 *  *&#47;
 * var fs
 *
 * function onLoad() {
 * 	fs = databaseManager.getFoundSet('db:/udm/contacts')
 * 	fs.clear()
 * 	scopes.svyApplicationCore.addDataBroadcastListener(dataBroadcastEventListener)
 * }
 * 	
 * &#47;**
 *  * @param {JSEvent} [event]
 *  * @param {String} dataSource
 *  * @param {Number} action
 *  * @param {JSDataSet} pks
 *  * @param {Boolean} cached
 *  *&#47;
 * function dataBroadcastEventListener(event, dataSource, action, pks, cached) {
 * 	if (dataSource == 'db:/udm/contacts' && action & (SQL_ACTION_TYPES.INSERT_ACTION | SQL_ACTION_TYPES.DELETE_ACTION)) {
 * 		//Your business logic here
 * 	}
 * }
 *</pre>
 * 
 * @properties={typeid:24,uuid:"DD317CC0-665B-4993-8669-D6B42A279B4D"}
 */
function addDataBroadcastListener(listener) {
	//TODO: figure out how to filter and fire only for datasource/pk match
	//TODO: add option to hold a reference to an empty foundset on the datasource, so the client gets the databroadcast for that entity
	scopes.svyEventManager.addListener(this,'databroadcast', listener)
}

///**
// * TODO: figure out how to properly type the parameter, of get is properly supported in Servoy
// * @param {Exception} exception exception to handle
// *
// * @returns {Boolean}
// *
// * @properties={typeid:24,uuid:"36335419-CFB4-40F3-990B-EF6E6355EB72"}
// */
//function fireException(exception) {
//	scopes.svyEventManager.fireEvent(null,this,'error',arguments)
//}
//
///**
// * @param {Function} action
// * @properties={typeid:24,uuid:"3FABF7E3-F0B7-423E-AD12-001705FF601B"}
// */
//function addExceptionListener(action) {
//	scopes.svyEventManager.addListener(this,'error',action)
//}
