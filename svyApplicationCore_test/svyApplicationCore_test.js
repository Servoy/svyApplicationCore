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

/**
 * @properties={typeid:24,uuid:"EA781DF8-997D-44EE-ABC9-61451665A260"}
 */
function setUp() {
	
	
}

/**
 * TODO generated, please specify type and doc for the params
 * @param args
 *
 * @properties={typeid:24,uuid:"4B373614-4474-4CB4-B5D5-0B0A87E727C6"}
 */
function fireDataBroadcastNotificicationCallbackHandler(args) {
	
}

/**
 * @properties={typeid:24,uuid:"47E0B392-B155-4BD1-8CCA-6045F3DA8153"}
 */
function fireDataBroadcastNotificication() {
	var pkDS = databaseManager.convertToDataSet([-10])
	plugins.rawSQL.notifyDataChange('svy_framework','log', pkDS, SQL_ACTION_TYPES.UPDATE_ACTION)
}

/**
 * @properties={typeid:35,uuid:"82854030-DEFD-4BFA-BEEB-A5F848B31753",variableType:-4}
 */
var fired = false

/**
 * @param {JSEvent} [event]
 * @param {String} dataSource
 * @param {Number} action
 * @param {JSDataSet} pks
 * @param {Boolean} cached
 *
 * @properties={typeid:24,uuid:"CBD14D84-7D39-4B4B-98A6-C619DF732E5C"}
 */

function dataBroadcastEventHandler(event, dataSource, action, pks, cached) {
	application.output(arguments)
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
 * @properties={typeid:24,uuid:"F9D47B83-7B9E-4EDC-B4E4-C5ACEE327254"}
 */
function tearDown() {
	
}
/**
 * Callback method for when solution is opened.
 *
 * @properties={typeid:24,uuid:"9B16F740-0A85-4CA9-9F4F-91B5100D3080"}
 */
function onSolutionOpen() {
	application.output('open')
	scopes.svyApplicationCore.addDataBroadcastListener(dataBroadcastEventHandler)
	var client = plugins.headlessclient.createClient(application.getSolutionName(),null,null,null)
	client.queueMethod('scopes.svyApplicationCore_test','fireDataBroadcastNotificication', null, fireDataBroadcastNotificicationCallbackHandler)
	application.sleep(2000)
}
