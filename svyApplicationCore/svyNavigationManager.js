/**
 * @properties={typeid:35,uuid:"62B8F05C-FFA4-491D-A19E-EC9F75DC95B2",variableType:-4}
 */
var ERROR_CODES = {
	'NO_MENU': 1,
	'NO_PROGRAMS': 2
}

/**
 * @extends {scopes.svyExceptions.IllegalStateException}
 * 
 * @param {String} errorMessage
 * @param {Number} code see {@link #ERROR_CODES}
 *
 * @properties={typeid:24,uuid:"31728A63-B04A-481B-BB80-D629A88DBB84"}
 */
function SvyNavigationException(errorMessage, code) {
	if (!(this instanceof SvyNavigationException)) {
		return new SvyNavigationException(errorMessage, code)
	}
	this.code = code
	scopes.svyExceptions.IllegalStateException.call(this, errorMessage||'Illegal state in Navigation')
}

/**
 * Set all prototypes to super class
 *
 * @private 
 * @SuppressWarnings(unused)
 * @properties={typeid:35,uuid:"63104534-E136-4F5C-A3D1-9809EE4785D0",variableType:-4}
 */
var init = (function() {
	SvyNavigationException.prototype = Object.create(scopes.svyExceptions.IllegalStateException.prototype);
	SvyNavigationException.prototype.constructor = SvyNavigationException
}())

/**
 * TODO: move this method to the appropriate scope, instead of on the moduleInit form
 * @public 
 * @param {ServoyException|Error|*} e
 * @return {Boolean}
 * @properties={typeid:24,uuid:"821EB28F-D3FA-4041-9AAE-7678A0D15FAE"}
 */
function errorHandler(e) {
	if (e instanceof ServoyException) {
		/** @type {ServoyException} */
		var servoyException = e;
		
		switch (servoyException.getErrorCode()) {
			case ServoyException.SAVE_FAILED:
				globals.DIALOGS.showErrorDialog('Error', 'It seems you did not fill in a required field', 'OK');
				//Get the failed records after a save
				var array = databaseManager.getFailedRecords()
				for (var i = 0; i < array.length; i++) {
					var record = array[i];
					application.output(record.exception);
					if (record.exception instanceof DataException) {
						/** @type {DataException} */
						var dataException = record.exception;
						application.output('SQL: ' + dataException.getSQL())
						application.output('SQLState: ' + dataException.getSQLState())
						application.output('VendorErrorCode: ' + dataException.getVendorErrorCode())
					}
				}
				return true
			case ServoyException.NO_PARENT_DELETE_WITH_RELATED_RECORDS:
				globals.DIALOGS.showErrorDialog(i18n.getI18NMessage('svy.fr.dlg.error'), i18n.getI18NMessage('svy.fr.dlg.noParentDeleteWithRelatedRecords'), 'OK');
				if (databaseManager.hasTransaction()) {
					databaseManager.rollbackTransaction()
				}
				if (databaseManager.hasLocks()) {
					databaseManager.releaseAllLocks();
				}
				return true;
	
			case servoyException.getErrorCode() == ServoyException.NO_RELATED_CREATE_ACCESS:
				globals.DIALOGS.showErrorDialog(i18n.getI18NMessage('svy.fr.dlg.error'), i18n.getI18NMessage('svy.fr.dlg.noRelatedCreateAccess'), 'OK');
				if (databaseManager.hasTransaction()) {
					databaseManager.rollbackTransaction()
				}
				if (databaseManager.hasLocks()) {
					databaseManager.releaseAllLocks()
				}
				return true;
			default:
				break;
		}
	}
}