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
	//TODO: implement something is that is needed
	
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
		application.output('Initialized module ' + (form.getId() ? form.getId() : "[no ID provided from moduleInit on form \"" + form.controller.getName() + "\"]") + ' version ' + form.getVersion());
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
	scopes.svyEventManager.fireEvent(null,this,'databroadcast',arguments)
}

/**
 * @param {Function} action
 * @param {String} datasource
 * @param {Array<Array>} pks
 * @properties={typeid:24,uuid:"DD317CC0-665B-4993-8669-D6B42A279B4D"}
 */
function addDataBroadcastListener(action, datasource, pks) {
	//TODO: figure out how to filter and fire only for datasource/pk match
	scopes.svyEventManager.addListener(this,'databroadcast',action)
}

/**
 * TODO: figure out how to properly type the parameter, of get is properly supported in Servoy
 * @param {Exception} exception exception to handle
 *
 * @returns {Boolean}
 *
 * @properties={typeid:24,uuid:"36335419-CFB4-40F3-990B-EF6E6355EB72"}
 */
function fireException(exception) {
	scopes.svyEventManager.fireEvent(null,this,'error',arguments)
}

/**
 * @param {Function} action
 * @properties={typeid:24,uuid:"3FABF7E3-F0B7-423E-AD12-001705FF601B"}
 */
function addExceptionListener(action) {
	scopes.svyEventManager.addListener(this,'error',action)
}
