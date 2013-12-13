/*
 * Core Application logic.
 * Provides:
 * - Module initialization with dependencies
 */

/**
 * @properties={typeid:35,uuid:"F718A8F5-5153-4A37-95A2-9B572ABFABDE",variableType:-4}
 */
var log = scopes.svyLogManager.getLogger('com.servoy.bap.core')

/**
 * Enumeration of event type constants for forms.
 * Listeners can be attached to form events
 * 
 * @public 
 * @enum
 * @see forms.svyBase.addListener
 * 
 * @properties={typeid:35,uuid:"28D14430-2DF3-4EE4-A975-6C4DE2530390",variableType:-4}
 */
var FORM_EVENT_TYPES = { //Some of these are backed up by constants on JS(DND)Event
	DRAG:'drag',
	DRAG_END:'drag-end',
	DRAG_OVER:'drag-over',
	DROP:'drop',
	ELEMENT_FOCUS_GAINED:'element-focus-lost',
	ELEMENT_FOCUS_LOST:'element-focus-lost',
	LOAD:'load',
	HIDE:'hide',
	RECORD_EDIT_START:'record-edit-start',
	RECORD_EDIT_STOP:'record-edit-stop',
	RECORD_SELECTION:'record-selection',
	RESIZE:'resize',
	SHOW:'show',
	UNLOAD:'unload'
};

/**
 * @private
 * @type {Object}
 *
 * @properties={typeid:35,uuid:"877FD551-605E-49FF-A497-FAEC8DBFD9D8",variableType:-4}
 */
var APPLICATION_EVENT_TYPES = {
	DATABROADCAST: 'svy.databroadcast',
	ERROR: 'svy.error',
	MODULE_INITIALIZED: 'bap.moduleinitialized'
}

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
	//TODO: check for multiple mods with the same ID
	//TODO: more severe logging on mods without ID
	var processed = {}
	/** @type {Array<String>} */
	var stack = []

	var mods = scopes.svyUI.getJSFormInstances(solutionModel.getForm('AbstractModuleDef'))
	var moduleDefNameById = {}
	
	/** @type {RuntimeForm<AbstractModuleDef>}*/
	var form
	for (var i = 0; i < mods.length; i++) {
		moduleDefNameById[forms[mods[i].name].getId()] = mods[i].name
	}
	
	for (i = 0; i < mods.length; i++) {
		stack.length = 0
		stack.push(mods[i].name)
		
		stack: while (stack.length) {
			var moduleDefName = stack.slice(-1)[0]
			log.trace('Processing moduleDefinition "' + moduleDefName + '"')
			
			if (moduleDefName in processed) {
				stack.pop()
				continue
			}
			
			form = forms[moduleDefName];
			var dependancies = form.getDependancies()
			if (dependancies) {
				dependancies: for (var j = 0; j < dependancies.length; j++) {
					var name = moduleDefNameById[dependancies[j].id]
					if (name in processed) { //already processed
						continue dependancies
					}
					if (stack.indexOf(name) != -1 || name === moduleDefName) { //circular reference
						var ids = stack.map(function(value) {
							return forms[value].getId()
						})
						ids.push(dependancies[j].id)
						log.error('Circuclar module dependancies detected: ' + ids.join(' > '))
						continue dependancies
					}
					stack.push(name)
					continue stack
				}
			}
			
			form.moduleInit.call(null, startupArguments);
			scopes.svyEventManager.fireEvent(this, APPLICATION_EVENT_TYPES.MODULE_INITIALIZED, [form])
			log.trace('Initialized module ' + (form.getId() ? form.getId() : "[no ID provided for moduleDefinition \"" + moduleDefName + "\"]") + ' version ' + form.getVersion());
			stack.pop()
			processed[moduleDefName] = null
		}
	}
	
	//Forced unload of the AbstractModuleDef instances
	for (i = 0; i < mods.length; i++) {
		history.removeForm(mods[i].name);
	}
}

/**
 * @param {function(RuntimeForm<AbstractModuleDef>)} listener
 *
 * @properties={typeid:24,uuid:"AC2D6443-559D-4ED5-A5F3-9A26AC4F4FDB"}
 */
function addModuleInitListener(listener) {
	scopes.svyEventManager.addListener(this, APPLICATION_EVENT_TYPES.MODULE_INITIALIZED, listener)
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
	//Fire it for global databroadcast listeners
	scopes.svyEventManager.fireEvent(this, APPLICATION_EVENT_TYPES.DATABROADCAST, Array.prototype.slice.call(arguments, 0))

	//Fire it for a specific DataSource
	scopes.svyEventManager.fireEvent(dataSource, APPLICATION_EVENT_TYPES.DATABROADCAST, Array.prototype.slice.call(arguments, 0))
	
	//Fire it for a specific JSRecord
	for (var i = 1; i <= pks.getMaxRowIndex(); i++) {
		var row = pks.getRowAsArray(i);
		var id = dataSource + '/'
		for (var j = 0; j < row.length; j++) {
			id += '/' + (row[j] + '').replace(/\./g, '%2E').replace(/\//g, '%2F') //Encoding .'s and /-es 
		}
		scopes.svyEventManager.fireEvent(id, APPLICATION_EVENT_TYPES.DATABROADCAST, Array.prototype.slice.call(arguments, 0))
	}
}

/**
 * Registers a listener for incoming databroadcast events.<br><br>
 * Note that a Client only receives databroadcast events for datasources to which is holds a reference, for example has a form loaded connected to the datasource
 * 
 * @param {Function} listener
 * @param {String|JSRecord} [obj] Listen to just databroadcasts on a specific datasource or JSRecord
 * 
 * @example <pre> &#47;**
 *  * Var holding a reference to a foundset on the contacts table of the udm database, so this client receives databroadcast events for this table
 *  * &#64;private
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
 *  * @param {String} dataSource
 *  * @param {Number} action
 *  * @param {JSDataSet} pks
 *  * @param {Boolean} cached
 *  *&#47;
 * function dataBroadcastEventListener(dataSource, action, pks, cached) {
 * 	if (dataSource == 'db:/udm/contacts' && action & (SQL_ACTION_TYPES.INSERT_ACTION | SQL_ACTION_TYPES.DELETE_ACTION)) {
 * 		//Your business logic here
 * 	}
 * }
 *</pre>
 * 
 * @properties={typeid:24,uuid:"DD317CC0-665B-4993-8669-D6B42A279B4D"}
 */
function addDataBroadcastListener(listener, obj) {
	var context = this
	if (obj) {
		if (!(obj instanceof JSRecord || obj.constructor instanceof String)) {
			throw scopes.svyExceptions.IllegalArgumentException('obj param value passed into addDatabroadcastListener must be either a JSRecord or a String representing a datasource')
		} else if (obj instanceof JSRecord) {
			var pks = obj.getPKs()
			context = obj.getDataSource() + '/'
			for (var j = 0; j < pks.length; j++) {
				context += '/' + (pks[j] + '').replace(/\./g, '%2E').replace(/\//g, '%2F') //Encoding .'s and /-es 
			}
		} else {
			context = obj;
		}
	}
	//TODO: add option to hold a reference to an empty foundset on the datasource, so the client gets the databroadcast for that entity
	scopes.svyEventManager.addListener(context, APPLICATION_EVENT_TYPES.DATABROADCAST, listener)
}

/**
 * Method to assign to or call from the solution's onError event handler<br>
 * <br>
 * Will fire all attached eventHandlers until one return true
 * 
 * @param {*} exception exception to handle
 *
 * @returns {Boolean} Whether or not the exception was handled
 *
 * @properties={typeid:24,uuid:"36335419-CFB4-40F3-990B-EF6E6355EB72"}
 */
function executeErrorHandlers(exception) {
	return scopes.svyEventManager.fireEvent(this, APPLICATION_EVENT_TYPES.ERROR, arguments, true)
}

/**
 * To handle uncaught exceptions that propagate through to the solutions onError handler<br>
 * <br>
 * If an error is handled by an errorHandler, other errorHandlers will not be invoked anymore<br>
 * <br>
 * @param {function(*):Boolean} handler Returning true will stop further errorHandlers form being called
 * @properties={typeid:24,uuid:"3FABF7E3-F0B7-423E-AD12-001705FF601B"}
 */
function addErrorHandler(handler) {
	//TODO: figure out how to filter and fire only for specific Exceptions
	scopes.svyEventManager.addListener(this, APPLICATION_EVENT_TYPES.ERROR, handler)
}

/**
 * Default onError handler implementation to attach to the Solutions onError event property<br>
 * Will call all registered ErrorHandlers.
 * If the error is not handled after invoking all the registered handlers, the unhandledErrorCallback will be invoked.
 * If there is no callback registered or the callback does not return true, an error dialog will be show to the user
 * and the error will be logged
 * @param {ServoyException|Error|*} e
 *
 * @properties={typeid:24,uuid:"7BA4782A-8BC4-47A4-BD84-9F56FA4EC386"}
 */
function onErrorHandler(e) {
	//workaround to get to the throw exception in JavaScript. See SVY-5618
	if (e instanceof Packages.org.mozilla.javascript.JavaScriptException) {
 		e = e['getValue']()
 	}
 	var handled = false
	try {
		handled = executeErrorHandlers(e)
	} catch (ex) {
		e = ex
	}
	
	if (typeof handled == 'boolean' && !handled) {
		if (uncaughtExceptionCallback) {
			handled = scopes.svyUtils.callMethod(uncaughtExceptionCallback, e)
		}
		if (typeof handled == 'boolean' && !handled) {
			if (e instanceof Error || e instanceof ServoyException) {
				/** @type {Error|ServoyException} */
				var exc = e
				log.error('Uncaught exception', exc)
			} else {
				log.error('Uncaught exception: ' + e)
			}
			//TODO: implement better actionable dialog
			//TODO: i18n the message
			globals.DIALOGS.showErrorDialog(i18n.getI18NMessage('svy.fr.lbl.warning'), 'Oops, things seem to have gone pear shaped', i18n.getI18NMessage('svy.fr.lbl.ok'))
		} 
		
		/* Returning anything but a Boolean true will make Servoy consider the exception handled.
		 * 
		 * When returning an explicit true, the exception will be "reported"
		 * In the Smart Client this will mean that the exception will be reported to the user via a dialog
		 * In the Web Client the exception will be logged to the serverside log file
		 */
		return false
	}
}

/**
 * @private 
 * @type {String}
 *
 * @properties={typeid:35,uuid:"0850509D-9D8C-44A6-8E66-E5BF070AEDDF"}
 */
var uncaughtExceptionCallback

/**
 * @param {function(ServoyException|Error|*):Boolean} callback
 * @return {Boolean} true is setting the callback was successful
 * 
 * @properties={typeid:24,uuid:"83356E84-1E42-4BE7-AC11-AA60357DA587"}
 */
function setUncaughtExceptionCallback(callback) {
	uncaughtExceptionCallback = scopes.svyUtils.convertServoyMethodToQualifiedName(callback)
	return uncaughtExceptionCallback || callback == null ? true : false
}

