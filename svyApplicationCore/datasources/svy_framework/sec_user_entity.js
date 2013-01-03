/**
 * Returns the date of the last login of this User
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Date} lastLogin
 * 
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
 * 
 * @author patrick
 * @since 19.09.2012
 *
 * @properties={typeid:24,uuid:"B3613BEA-C8FE-4917-A666-B15A0D0B9164"}
 */
function assignKey(keyId, organizationId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
	}
	record.user_locked = null;
	record.user_locked_datetime = null;
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
	}
	
	// check if there is an owner
	if (!record.owner_id || !databaseManager.hasRecords(record.sec_user_to_sec_owner)) {
		throw new scopes.modUtils$exceptions.IllegalStateException("User has no owner");
	}
	
	var ownerRecord = record.sec_user_to_sec_owner.getRecord(1);
	
	// no password given
	if (!newPassword) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, "The password cannot be empty.", "svy.fr.dlg.password_empty");
	}
	
	// password can not have same begin as username
	if (ownerRecord.password_same_letters && newPassword.substr(0, 3) == record.user_name.substr(0, 3)) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, "The password cannot begin with the same letters as the username.", "svy.fr.dlg.password_same_begin");
	}
	
	// password has to contain letters and numbers
	if (ownerRecord.password_num_let && !(/[0-9]/.test(newPassword) && /[a-zA-Z]/.test(newPassword))) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, "The password must contain letters and numbers.", "svy.fr.dlg.password_contain_letters_numbers");
	}
	
	// password is too short
	if (ownerRecord.password_min_lenght && newPassword.length < ownerRecord.password_min_lenght) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, "The password is too short.", "svy.fr.dlg.password_min_length", [ownerRecord.password_min_lenght]);
	}
	
	// password is too long
	if (ownerRecord.password_max_length && newPassword.length > ownerRecord.password_max_length) {
		throw new scopes.svySecurityManager.PasswordRuleViolationException(record, "The password is too long.", "svy.fr.dlg.password_max_length", [ownerRecord.password_max_length]);
	}
	
	var md5Hash = utils.stringMD5HashBase64(newPassword);
	var maxPasswordValidity = 5;
	var oldPasswordRecord;
	
	// password has to be unique for a certain number of previous passwords
	if (ownerRecord.password_unique_before_reuse) {
		/** @type {JSFoundSet<db:/svy_framework/sec_user_password>} */
		var previousPasswordFs = record.sec_user_to_sec_user_password;
		previousPasswordFs.sort("start_date desc");
		
		var endLoopAt = previousPasswordFs.getSize() < ownerRecord.password_unique_before_reuse ? previousPasswordFs.getSize() : ownerRecord.password_unique_before_reuse;
		
		for (var pp = 1; pp <= endLoopAt; pp ++) {
			oldPasswordRecord = previousPasswordFs.getRecord(pp);
			if (oldPasswordRecord.password_value == md5Hash) {
				throw new scopes.svySecurityManager.PasswordRuleViolationException(record, "The password may not be the same as a previous password.", "svy.fr.dlg.password_unique_before_reuse", [ownerRecord.password_unique_before_reuse]);
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
	
	if (ownerRecord.password_renew) {
		newPasswordRecord.end_date = scopes.modUtils$date.addDays(newPasswordRecord.start_date, ownerRecord.password_renew);
	} else {
		newPasswordRecord.end_date = new Date(newPasswordRecord.start_date.getFullYear() + maxPasswordValidity, 
			newPasswordRecord.start_date.getMonth(), 
			newPasswordRecord.start_date.getDate(), 
			newPasswordRecord.start_date.getHours(), 
			newPasswordRecord.start_date.getMinutes(), 
			newPasswordRecord.start_date.getSeconds());
	}
	
	newPasswordRecord.password_value = md5Hash;
	
	return databaseManager.saveData(newPasswordRecord);
}


/**
 * Returns <code>true</code> if the password is expired, <code>false</code> otherwise
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} [record]
 * 
 * @return {Boolean} isExpired
 * 
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
	}
	
	/** @type {QBSelect<db:/svy_framework/sec_user_password>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user_password");
	query.result.add(query.columns.user_password_id.count);
	query.where.add(query.columns.user_id.eq(record.user_id.toString())).
		add(query.or.add(query.columns.end_date.gt(new Date())).
			add(query.columns.end_date.isNull));
	var dataset = databaseManager.getDataSetByQuery(query, 1);
	if (dataset.getValue(1, 1) == 0) {
		return true;
	} else {
		return false;
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
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
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
		throw new scopes.modUtils$exceptions.NoRecordException();
	}
	
	/** @type {QBSelect<db:/svy_framework/sec_user_password>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user_password");
	query.result.add(query.columns.password_value);
	query.where.add(query.columns.user_id.eq(record.user_id.toString())).
		add(query.or.add(query.columns.end_date.gt(new Date())).
			add(query.columns.end_date.isNull));
	var dataset = databaseManager.getDataSetByQuery(query, 1);
	if (dataset.getValue(1, 1) == utils.stringMD5HashBase64(password)) {
		return true;
	} else {
		return false;
	}
}