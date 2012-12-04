/**
 * @properties={typeid:24,uuid:"237B9F77-817F-4846-9FBA-0953BB260999"}
 */
function testModuleDefinitions() {
	//Test for not overriding final methods
	//Test for implementing mandatory methods
	
	var mods = scopes.svyUtils.getJSFormInstances(solutionModel.getForm('AbstractModuleDef')) 

	for (var i = 0; i < mods.length; i++) {
		mods[i].getMethods(false).indexOf('')
	}
}