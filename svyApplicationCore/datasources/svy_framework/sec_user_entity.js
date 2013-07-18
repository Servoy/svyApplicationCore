/**
 * Returns the date of the last login of this User
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Date} lastLogin
 * 
 * @author patrick
 * @since 28.09.2012
 * 
 * @properties={typeid:24,uuid:"EB4F1613-5467-4BCB-9E33-C7695D813A6F"}
 */
function getLastLogin(record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	if (utils.hasRecords(record.sec_user_to_sec_user_login_attempt)) {
		return record.sec_user_to_sec_user_login_attempt.max_attempt_datetime;
	} else {
		return null;
	}
}

/**
 * Sets the admin level
 * 
 * @param {Number} level
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @see scopes.svySecurityManager.ADMIN_LEVEL for possible values
 * 
 * @author patrick
 * @since 28.09.2012
 * 
 * @properties={typeid:24,uuid:"C965E260-0685-4481-BB85-42F020DE92B9"}
 */
function setAdminLevel(level, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	if (level == null) {
		level = scopes.svySecurityManager.ADMIN_LEVEL.NONE;
	}
	
	if (scopes.modUtils.objectHasValue(scopes.svySecurityManager.ADMIN_LEVEL, level)) {
		record.admin_level = level;
		return databaseManager.saveData(record);
	} else {
		return false;
	}
}

/**
 * Activates the user<br>
 * Only active users can login<br>
 * For count of users per package only active users will be counted.
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 28.09.2012
 *
 * @properties={typeid:24,uuid:"9AFE7D6A-F9BF-41C3-9E4A-B76F3E47E6B6"}
 */
function activateUser(record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	record.flag_inactive = 0;
	return databaseManager.saveData(record);
}

/**
 * Deactivates the user<br>
 * Only active users can login<br>
 * For count of users per package only active users will be counted.
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 28.09.2012
 * 
 * @properties={typeid:24,uuid:"9E6E8C70-8CA3-42E7-B7B4-A2344048E493"}
 */
function deactivateUser(record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	record.flag_inactive = 1;
	return databaseManager.saveData(record);
}

/**
 * Marks as deleted, will also remove related records
 * User is not really deleted because it might be used in log.
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 28.09.2012
 * 
 * @properties={typeid:24,uuid:"FE9F81E1-E5BB-4B94-8B2A-FE68B97E7913"}
 */
function deleteUser(record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	// remove related records
	record.sec_user_to_sec_user_org.deleteAllRecords();
	record.sec_user_to_sec_user_password.deleteAllRecords();
	record.sec_user_to_sec_user_login_attempt.deleteAllRecords();
	record.flag_inactive = 1;
	record.flag_deleted = 1;
	return databaseManager.saveData(record);
}

/**
 * Assigns the given key to either the given or the selected record for the given organization
 * 
 * @param {String|UUID} keyId
 * @param {String|UUID} organizationId
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 19.09.2012
 *
 * @properties={typeid:24,uuid:"B3613BEA-C8FE-4917-A666-B15A0D0B9164"}
 */
function assignKey(keyId, organizationId, record) {
	if (!organizationId || !keyId) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Wrong arguments provided for assignKey");
	}

	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}

	if (keyId instanceof UUID) {
		keyId = keyId.toString();
	}
	if (organizationId instanceof UUID) {
		organizationId = organizationId.toString();
	}

	var userOrgRecord;
	if (utils.hasRecords(record.sec_user_to_sec_user_org)) {
		for (var uoi = 1; uoi <= record.sec_user_to_sec_user_org.getSize(); uoi++) {
			userOrgRecord = record.sec_user_to_sec_user_org.getRecord(uoi);
			if (userOrgRecord.organization_id && userOrgRecord.organization_id.toString() == organizationId) {
				break;
			}
		}
	}

	if (!userOrgRecord) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("User not member of the given organization");
	}

	var userRightRecord;
	if (utils.hasRecords(userOrgRecord.sec_user_org_to_sec_user_right)) {
		for (var uri = 1; uri <= userOrgRecord.sec_user_org_to_sec_user_right.getSize(); uri++) {
			userRightRecord = userOrgRecord.sec_user_org_to_sec_user_right.getRecord(uri);
			if (userRightRecord.security_key_id && userRightRecord.security_key_id.toString() == keyId) {
				return true;
			}
		}
	}

	userRightRecord = userOrgRecord.sec_user_org_to_sec_user_right.getRecord(userOrgRecord.sec_user_org_to_sec_user_right.newRecord());
	userRightRecord.security_key_id = keyId;

	return databaseManager.saveData(userRightRecord);
}


/**
 * Removes the key with the given ID from either the given or the selected record for the given organization<p>
 *
 * If no organization is provided, the key will be removed from all organizations of the user
 *
 * @version 5.0
 * @since 18.07.2013
 * @author patrick
 *
 * @param {String|UUID} keyId
 * @param {String|UUID} [organizationId]
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 *
 * @properties={typeid:24,uuid:"335C9A27-9E89-4AEF-B7CB-4CA491675E27"}
 */
function removeKey(keyId, organizationId, record) {
	if (!keyId) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Wrong arguments provided for removeKey");
	}

	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}

	if (keyId instanceof UUID) {
		keyId = keyId.toString();
	}
	if (organizationId && organizationId instanceof UUID) {
		organizationId = organizationId.toString();
	}

	/**
	 * @param {JSRecord<db:/svy_framework/sec_user_org>} recordUserOrg
	 * @return {Boolean} success
	 */
	function removeKeyFromUserOrg(recordUserOrg) {
		if (utils.hasRecords(recordUserOrg.sec_user_org_to_sec_user_right)) {
			for (var i = 1; i <= recordUserOrg.sec_user_org_to_sec_user_right.getSize(); i++) {
				var recordSecUserRight = recordUserOrg.sec_user_org_to_sec_user_right.getRecord(i);
				if (recordSecUserRight.security_key_id == keyId) {
					recordUserOrg.sec_user_org_to_sec_user_right.deleteRecord(recordSecUserRight);
				}
			}
			return databaseManager.saveData(recordUserOrg.sec_user_org_to_sec_user_right);
		} else {
			return true;
		}
	}

	if (utils.hasRecords(record.sec_user_to_sec_user_org)) {
		for (var uo = 1; uo <= record.sec_user_to_sec_user_org.getSize(); uo++) {
			/** @type {JSRecord<db:/svy_framework/sec_user_org>} */
			var recordSecUserOrg = record.sec_user_to_sec_user_org.getRecord(uo);
			if (!organizationId) {
				removeKeyFromUserOrg(recordSecUserOrg);
			} else if (organizationId == recordSecUserOrg.organization_id) {
				removeKeyFromUserOrg(recordSecUserOrg);
				break;
			}
		}
	}
}


/**
 * Adds either the given or the selected record to the given group for the given organization.<br>
 * 
 * If the user is not yet in the given organization, it will be added to it.
 * 
 * @param {String|UUID} groupId
 * @param {String|UUID} organizationId
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 19.09.2012
 *
 * @properties={typeid:24,uuid:"746A4761-8C11-4377-82A3-AC17E02542ED"}
 */
function addToGroup(groupId, organizationId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	try {
		if (!addToOrganization(organizationId, record)) {
			return false;
		}
	} catch (e) {
		throw e;
	}
	
	if (groupId instanceof UUID) {
		groupId = groupId.toString();
	}
	if (organizationId instanceof UUID) {
		organizationId = organizationId.toString();
	}
	
	var userOrgRecord,
		vUserOrgFound = false;
	
	if (utils.hasRecords(record.sec_user_to_sec_user_org)) {
		for (var i = 1; i <= record.sec_user_to_sec_user_org.getSize(); i++) {
			userOrgRecord = record.sec_user_to_sec_user_org.getRecord(i);
			if (userOrgRecord.organization_id && userOrgRecord.organization_id.toString() == organizationId) {
				vUserOrgFound = true;
				break;
			}
		}
	}
	
	if (!vUserOrgFound) {
		// should never happen, throws no exception
		return false;
	}
	
	var userInGroupRecord;
	
	if (utils.hasRecords(userOrgRecord.sec_user_org_to_sec_user_in_group)) {
		for (var uoi = 1; uoi <= userOrgRecord.sec_user_org_to_sec_user_in_group.getSize(); uoi++) {
			userInGroupRecord = userOrgRecord.sec_user_org_to_sec_user_in_group.getRecord(uoi);
			if (userInGroupRecord.group_id && userInGroupRecord.group_id.toString() == groupId) {
				return true;
			}
		}
	}
	
	userInGroupRecord = userOrgRecord.sec_user_org_to_sec_user_in_group.getRecord(userOrgRecord.sec_user_org_to_sec_user_in_group.newRecord());
	userInGroupRecord.group_id = groupId;
	return databaseManager.saveData(userInGroupRecord);
}

/**
 * Adds either the given or the selected record to the given organization
 * 
 * @param {String|UUID} organizationId
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 19.09.2012
 *
 * @properties={typeid:24,uuid:"8E266AEE-39C0-49C5-8A54-A0DE0A0D384A"}
 */
function addToOrganization(organizationId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	var orgId = organizationId;
	if (orgId instanceof UUID) {
		orgId = orgId.toString();
	}
	
	var fs = record.sec_user_to_sec_user_org;
	var userOrgRecord;
	if (fs && utils.hasRecords(fs)) {
		for (var i = 1; i <= fs.getSize(); i++) {
			userOrgRecord = fs.getRecord(i);
			if (userOrgRecord.organization_id && userOrgRecord.organization_id.toString() == orgId) {
				return true;
			}
		}
	}
	
	userOrgRecord = fs.getRecord(fs.newRecord());
	userOrgRecord.organization_id = orgId;
	return databaseManager.saveData(userOrgRecord);
}

/**
 * Removes the user from the given organization
 * 
 * @param {String|UUID} organizationId
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 28.09.2012
 * 
 * @properties={typeid:24,uuid:"B21214D8-7817-44C9-A0B6-5715D3AE3575"}
 */
function removeFromOrganization(organizationId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	var orgId = organizationId;
	if (orgId instanceof UUID) {
		orgId = orgId.toString();
	}
	
	var fs = record.sec_user_to_sec_user_org;
	var userOrgRecord;
	if (fs && utils.hasRecords(fs)) {
		for (var i = 1; i <= fs.getSize(); i++) {
			userOrgRecord = fs.getRecord(i);
			if (userOrgRecord.organization_id && userOrgRecord.organization_id.toString() == orgId) {
				fs.deleteRecord(userOrgRecord);
			}
		}
	}
	return databaseManager.saveData(fs);
}

/**
 * Removes the user from the given group in the given organization
 * 
 * @param {String|UUID} groupId
 * @param {String|UUID} organizationId
 * @param {JSRecord<db:/svy_framework/sec_user>} record
 * 
 * @return {Boolean} success
 *
 * @properties={typeid:24,uuid:"AC025622-6A70-424F-8013-07E23B051E3F"}
 */
function removeFromGroup(groupId, organizationId, record) {
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	if (groupId instanceof UUID) {
		groupId = groupId.toString();
	}
	if (organizationId instanceof UUID) {
		organizationId = organizationId.toString();
	}
	
	var userOrgRecord,
		vUserOrgFound = false;
	
	if (utils.hasRecords(record.sec_user_to_sec_user_org)) {
		for (var i = 1; i <= record.sec_user_to_sec_user_org.getSize(); i++) {
			userOrgRecord = record.sec_user_to_sec_user_org.getRecord(i);
			if (userOrgRecord.organization_id && userOrgRecord.organization_id.toString() == organizationId) {
				vUserOrgFound = true;
				break;
			}
		}
	}
	
	if (!vUserOrgFound) {
		// should never happen, throws no exception
		return false;
	}
	
	var userInGroupRecord;
	
	if (utils.hasRecords(userOrgRecord.sec_user_org_to_sec_user_in_group)) {
		for (var uoi = 1; uoi <= userOrgRecord.sec_user_org_to_sec_user_in_group.getSize(); uoi++) {
			userInGroupRecord = userOrgRecord.sec_user_org_to_sec_user_in_group.getRecord(uoi);
			if (userInGroupRecord.group_id && userInGroupRecord.group_id.toString() == groupId) {
				userOrgRecord.sec_user_org_to_sec_user_in_group.deleteRecord(userInGroupRecord);
			}
		}
	}
	
	return databaseManager.saveData(userOrgRecord.sec_user_org_to_sec_user_in_group);
}

/**
 * Locks either the given or the selected record
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 19.09.2012
 *
 * @properties={typeid:24,uuid:"26323812-FEE7-4CA1-A82B-F4B558E4E896"}
 */
function lockUser(record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	record.user_locked = 1;
	record.user_locked_datetime = new Date();
	return databaseManager.saveData(record);
}

/**
 * Unlocks either the given or the selected record
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @author patrick
 * @since 19.09.2012
 *
 * @properties={typeid:24,uuid:"E5544486-3014-47F7-B718-8D7A1D210108"}
 */
function unlockUser(record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	record.user_locked = null;
	record.user_locked_datetime = null;
	record.times_wrong_login = null;
	return databaseManager.saveData(record);
}

/**
 * Changes the password of either the given or the selected record to the provided newPassword
 * 
 * @param {String} newPassword
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} success
 * 
 * @throws {scopes.svySecurityManager.PasswordRuleViolationException} - one of the security rules for the password is violated
 * 
 * @author patrick
 * @since 19.09.2012
 *
 * @properties={typeid:24,uuid:"9052DA27-D6A7-4790-91C8-9807A5C094C7"}
 */
function changePassword(newPassword, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	// check if there is an owner
	if (!record.owner_id || !databaseManager.hasRecords(record.sec_user_to_sec_owner)) {
		throw new scopes.modUtils$exceptions.IllegalStateException("User has no owner");
	}
	
	var propValues = scopes.svyProperties.getRuntimeProperties(scopes.svySecurityManager.ADMIN_LEVEL.TENANT_MANAGER, ["password_must_not_start_with_user_name", "password_numbers_and_letters", "password_minimum_length", "password_maximum_length", "password_number_unique_before_reuse"], owner_id);
	function findPasswordRule(givenValue) {
		function filter(x) {
			return x.propertyName == givenValue;
		}
		var result = propValues.filter(filter);
		if (result && result.length > 0) {
			return result[0].value;
		} else {
			return null;
		}
	}
	
	// no password given
	if (!newPassword) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, i18n.getI18NMessage('svy.fr.dlg.password_empty')||"The password cannot be empty.", scopes.svySecurityManager.ERROR_CODE.EMPTY_PASSWORD);
	}
	
	// password can not have same begin as username
	var passwordRule = findPasswordRule("password_must_not_start_with_user_name");
	if (passwordRule && newPassword.substr(0, 3) == record.user_name.substr(0, 3)) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, i18n.getI18NMessage('svy.fr.dlg.password_same_begin')||"The password cannot begin with the same letters as the username.", scopes.svySecurityManager.ERROR_CODE.PASSWORD_MUST_NOT_START_WITH_USER_NAME);
	}
	
	// password has to contain letters and numbers
	passwordRule = findPasswordRule("password_numbers_and_letters");
	if (passwordRule && !(/[0-9]/.test(newPassword) && /[a-zA-Z]/.test(newPassword))) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, i18n.getI18NMessage('svy.fr.dlg.password_contain_letters_numbers')||'The password must contain letters and numbers.', scopes.svySecurityManager.ERROR_CODE.PASSWORD_MUST_CONTAIN_NUMBERS_AND_LETTERS);
	}
	
	// password is too short
	passwordRule = findPasswordRule("password_minimum_length");
	if (passwordRule && newPassword.length < passwordRule) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, i18n.getI18NMessage('svy.fr.dlg.password_min_length', [passwordRule])||"The password is too short.", scopes.svySecurityManager.ERROR_CODE.PASSWORD_TOO_SHORT);
	}
	
	// password is too long
	passwordRule = findPasswordRule("password_maximum_length");
	if (passwordRule && newPassword.length > passwordRule) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, i18n.getI18NMessage('svy.fr.dlg.password_max_length', [passwordRule])||"The password is too long.", scopes.svySecurityManager.ERROR_CODE.PASSWORD_TOO_LONG);
	}
	
	var md5Hash = utils.stringMD5HashBase64(newPassword);
	var saltAndHash = scopes.svySecurityManager.calculatePBKDF2Hash(newPassword);
	var maxPasswordValidity = 5;
	var oldPasswordRecord;
	
	// password has to be unique for a certain number of previous passwords
	passwordRule = findPasswordRule("password_number_unique_before_reuse");
	if (passwordRule) {
		/** @type {JSFoundSet<db:/svy_framework/sec_user_password>} */
		var previousPasswordFs = record.sec_user_to_sec_user_password;
		previousPasswordFs.sort("start_date desc");
		
		var endLoopAt = previousPasswordFs.getSize() < passwordRule ? previousPasswordFs.getSize() : passwordRule;
		
		for (var pp = 1; pp <= endLoopAt; pp ++) {
			oldPasswordRecord = previousPasswordFs.getRecord(pp);
			if (oldPasswordRecord.password_value && oldPasswordRecord.password_value == md5Hash) {
				throw new scopes.svySecurityManager.PasswordRuleViolationException(record, i18n.getI18NMessage('svy.fr.dlg.password_unique_before_reuse', [passwordRule])||"The password may not be the same as a previous password.", scopes.svySecurityManager.ERROR_CODE.PASSWORD_NOT_UNIQUE);
			} else if (oldPasswordRecord.password_hash && oldPasswordRecord.password_salt && oldPasswordRecord.password_version) {
				if (scopes.svySecurityManager.validatePBKDF2Hash(newPassword, oldPasswordRecord.password_salt, oldPasswordRecord.password_hash, oldPasswordRecord.password_version)) {
					throw new scopes.svySecurityManager.PasswordRuleViolationException(record, i18n.getI18NMessage('svy.fr.dlg.password_unique_before_reuse', [passwordRule])||"The password may not be the same as a previous password.", scopes.svySecurityManager.ERROR_CODE.PASSWORD_NOT_UNIQUE);
				}
			}
		}
	}
	
	var now = new Date();
	
	// Invalidate old password
	if (utils.hasRecords(record.sec_user_to_sec_user_password)) {
		record.sec_user_to_sec_user_password.sort("start_date desc");
		oldPasswordRecord = record.sec_user_to_sec_user_password.getRecord(1);
		oldPasswordRecord.end_date = now;
	}
	
	// Save new password	
	var newPasswordRecord = record.sec_user_to_sec_user_password.getRecord(record.sec_user_to_sec_user_password.newRecord());
	newPasswordRecord.start_date = new Date(now.getTime() + 1);
	
	/** @type {Number} */
	var renewInterval = findPasswordRule("password_renewal_interval");
	if (renewInterval) {
		newPasswordRecord.end_date = scopes.modUtils$date.addDays(newPasswordRecord.start_date, renewInterval);
	} else {
		newPasswordRecord.end_date = new Date(newPasswordRecord.start_date.getFullYear() + maxPasswordValidity, 
			newPasswordRecord.start_date.getMonth(), 
			newPasswordRecord.start_date.getDate(), 
			newPasswordRecord.start_date.getHours(), 
			newPasswordRecord.start_date.getMinutes(), 
			newPasswordRecord.start_date.getSeconds());
	}
	
	newPasswordRecord.password_hash = saltAndHash.hash;
	newPasswordRecord.password_salt = saltAndHash.salt;
	newPasswordRecord.password_version = saltAndHash.iterationVersion;
	
	return databaseManager.saveData(newPasswordRecord);
}


/**
 * Returns <code>true</code> if the password is expired, <code>false</code> otherwise
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} isExpired
 *
 * @author patrick
 * @since 2012-10-02
 * 
 * @properties={typeid:24,uuid:"1071D206-5D2E-4402-9761-0120EC7B8B0A"}
 */
function isPasswordExpired(record) {
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	var currentPasswordRecord = getCurrentPasswordRecord(record);
	if (currentPasswordRecord) {
		return (currentPasswordRecord.end_date < new Date());
	} else {
		return true;
	}
}

/**
 * Sets the end_date of the password to the current date, making it expired
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 *
 * @properties={typeid:24,uuid:"64615A43-D150-4F7B-8254-D180D4FDA3A8"}
 */
function setPasswordExpired(record) {
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	var currentPasswordRecord = getCurrentPasswordRecord(record);
	if (currentPasswordRecord) {
		currentPasswordRecord.end_date = new Date();
		databaseManager.saveData(currentPasswordRecord);
	}
}

/**
 * Validates the given password and returns true if it is correct and false otherwise
 * 
 * @param {String} password
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} isValid
 * 
 * @author patrick
 * @since 2012-10-11
 * 
 * @properties={typeid:24,uuid:"24AD1C1E-E045-42EC-A28D-7C3AD988DEA9"}
 */
function isPasswordValid(password, record) {
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	var currentPasswordRecord = getCurrentPasswordRecord(record);
	var md5Hash = currentPasswordRecord.password_value;
	var salt = currentPasswordRecord.password_salt;
	var hash = currentPasswordRecord.password_hash;
	var version = currentPasswordRecord.password_version;
	
	if (md5Hash && md5Hash == utils.stringMD5HashBase64(password)) {
		return true;
	} else if (salt && hash && scopes.svySecurityManager.validatePBKDF2Hash(password, salt, hash, version)) {
		return true;
	} else {
		return false;
	}
}

/**
 * Returns the last/current sec_user_password record
 * 
 * @return {JSRecord<db:/svy_framework/sec_user_password>}
 * 
 * @private
 * 
 * @properties={typeid:24,uuid:"A64D9638-7487-467A-8865-C61ED583957B"}
 */
function getCurrentPasswordRecord(record) {
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	/** @type {JSFoundSet<db:/svy_framework/sec_user_password>} */
	var fs = record.sec_user_to_sec_user_password$current;
	if (utils.hasRecords(fs)) {
		return fs.getRecord(1);
	} else {
		return null;
	}
}