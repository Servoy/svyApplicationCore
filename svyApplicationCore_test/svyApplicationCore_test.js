/**
 * @properties={typeid:24,uuid:"237B9F77-817F-4846-9FBA-0953BB260999"}
 */
function testModuleDefinitions() {
	//Test for not overriding final methods
	//Test for implementing mandatory methods
	
	var mods = scopes.svyUI.getJSFormInstances(solutionModel.getForm('AbstractModuleDef')) 

	for (var i = 0; i < mods.length; i++) {
		mods[i].getMethods(false).indexOf('')
	}
}

/*
 * Start testcode for {@link #scopes#svyApplicationCore#addDataBroadcastListener()}
 */
/**
 * Stores a reference to a JSFoundSet on the svy_framework/log table, so the test client received incoming databroadcasts for this table
 * @type {JSFoundSet}
 *
 * @properties={typeid:35,uuid:"0AF38408-8622-4DE8-836D-3E516406FF67",variableType:-4}
 */
var emptyFSReferenceForDatabroadcast

/**
 * Method called in HC to fire a dataChange Notification
 * @properties={typeid:24,uuid:"47E0B392-B155-4BD1-8CCA-6045F3DA8153"}
 */
function fireDataBroadcastNotificication() {
	var pkDS = databaseManager.convertToDataSet([-10])
	plugins.rawSQL.notifyDataChange('svy_framework','log', pkDS, SQL_ACTION_TYPES.UPDATE_ACTION)
}

/**
 * Dummy method needed for HC.queueMethod
 *
 * @properties={typeid:24,uuid:"4B373614-4474-4CB4-B5D5-0B0A87E727C6"}
 */
function fireDataBroadcastNotificationCallbackHandler() {}

/**
 * @properties={typeid:35,uuid:"82854030-DEFD-4BFA-BEEB-A5F848B31753",variableType:-4}
 */
var fired = false

/**
 * @param {String} dataSource
 * @param {Number} action
 * @param {JSDataSet} pks
 * @param {Boolean} cached
 *
 * @properties={typeid:24,uuid:"CBD14D84-7D39-4B4B-98A6-C619DF732E5C"}
 */
function dataBroadcastEventHandler(dataSource, action, pks, cached) {
	if (dataSource == 'db:/svy_framework/log' &&
		action == SQL_ACTION_TYPES.UPDATE_ACTION &&
		pks.getValue(1,1) == -10) {
		fired = true
	}
}

/**
 * @properties={typeid:24,uuid:"289105EA-7D2D-4AD7-90BB-85F49A93A309"}
 */
function testDataBroadcastListener() {
	jsunit.assertTrue(fired)
}

/**
 * Callback method for when solution is opened.
 *
 * @properties={typeid:24,uuid:"9B16F740-0A85-4CA9-9F4F-91B5100D3080"}
 */
function onSolutionOpen() {
	if (application.getApplicationType() != APPLICATION_TYPES.HEADLESS_CLIENT) { //So code is only executed when it's in the Test Client
		scopes.svyApplicationCore.addDataBroadcastListener(dataBroadcastEventHandler)
		emptyFSReferenceForDatabroadcast = databaseManager.getFoundSet('db:/svy_framework/log')
		emptyFSReferenceForDatabroadcast.clear()
		var client = plugins.headlessclient.createClient(application.getSolutionName(),null,null,null)
		client.queueMethod('scopes.svyApplicationCore_test','fireDataBroadcastNotificication', null, fireDataBroadcastNotificationCallbackHandler)
	}
}

/*
 * End testcode for {@link #scopes#svyApplicationCore#addDataBroadcastListener()}
 */
