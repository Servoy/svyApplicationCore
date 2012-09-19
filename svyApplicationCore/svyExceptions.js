/**
 * @param {String} errorMessage
 * @param {String} [i18nKey]
 * @param {Array} [i18nArguments]
 *
 * @properties={typeid:24,uuid:"B5C94D85-CC71-44A2-B728-99252273A4FF"}
 */
function SvyException(errorMessage, i18nKey, i18nArguments) {
	
	var message = errorMessage;
	
	var localeMessage = i18nKey ? (i18nArguments ? i18n.getI18NMessage(i18nKey, i18nArguments) : i18n.getI18NMessage(i18nKey)) : errorMessage;
	
	this.getMessage = function() {
		return message;
	}
	
	this.getLocaleMessage = function() {
		return localeMessage;
	}
	
	Object.defineProperty(this, "message", {
		get: function() {
			return message;
		},
		set: function(x) {
		}
	});
	
	Object.defineProperty(this, "localeMessage", {
		get: function() {
			return localeMessage;
		},
		set: function(x) {
		}
	});	
}

/**
 * No record present
 * 
 * @properties={typeid:24,uuid:"B22507E5-510C-4365-B71D-4376200D8FC7"}
 */
function NO_RECORD() {
	
	NO_RECORD.prototype = new SvyException("No record was given or the foundset is empty");
	
}

/**
 * No owner set
 * 
 * @param {JSRecord} record
 * @properties={typeid:24,uuid:"C64D9C03-D0FF-4064-A9EE-978057A63BA7"}
 */
function NO_OWNER(record) {
	
	/**
	 * The record where the problem occured
	 * @type {JSRecord}
	 */
	this.record = record;
	
	NO_OWNER.prototype = new SvyException("There is no owner for the current record.");
	
}

/**
 * The password has to contain letters and numbers
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} record
 *
 * @properties={typeid:24,uuid:"6513677B-3EA8-4BF5-80DA-E0EE4C6BEC6F"}
 */
function PASSWORD_MUST_CONTAIN_LETTERS_AND_NUMBERS(record) {
	
	/**
	 * The record where the problem occured
	 * @type {JSRecord<db:/svy_framework/sec_user>}
	 */
	this.record = record;
	
	PASSWORD_MUST_CONTAIN_LETTERS_AND_NUMBERS.prototype = new SvyException("The password must contain letters and numbers.", "svy.fr.dlg.password_contain_letters_numbers");

}

/**
 * Thrown when a password does not comply to the rules set for the owner
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} record
 * @param {String} message
 * @param {String} [i18nKey]
 * @param {Array} [i18nArguments]
 *
 * @properties={typeid:24,uuid:"D31D1A18-4D09-421C-B288-4DEEA554B637"}
 */
function PASSWORD_RULE_VIOLATION(record, message, i18nKey, i18nArguments) {
	
	/**
	 * The record where the problem occured
	 * @type {JSRecord<db:/svy_framework/sec_user>}
	 */
	this.record = record;
	
	PASSWORD_RULE_VIOLATION.prototype = new SvyException(message, i18nKey, i18nArguments);
}

/**
 * The user is not part of the organization with the given ID
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} record
 * @param {UUID|String} organizationId
 *
 * @properties={typeid:24,uuid:"2CA76922-50A3-405E-AAD1-A430C3DA4479"}
 */
function USER_NOT_MEMBER_OF_ORGANIZATION(record, organizationId) {
	
	/**
	 * The record where the problem occured
	 * @type {JSRecord<db:/svy_framework/sec_user>}
	 */
	this.record = record;
	
	/**
	 * The ID of the organization the user does not belong to
	 */
	this.organizationId = organizationId;
	
	USER_NOT_MEMBER_OF_ORGANIZATION.prototype = new SvyException("User not part of organization");
}

/**
 * The given file could not be found
 * 
 * @param {plugins.file.JSFile} file
 *
 * @properties={typeid:24,uuid:"294FA011-F0BA-4AAA-A2EB-D25492367723"}
 */
function FILE_NOT_FOUND(file) {
	
	/**
	 * The file that could not be found
	 * @type {plugins.file.JSFile}
	 */
	this.file = file;
	
	FILE_NOT_FOUND.prototype = new SvyException("File not found");
}