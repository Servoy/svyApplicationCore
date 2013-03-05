/**
 * Removes the given user to either the selected or the provided organization
 * 
 * @param {String|UUID} userId
 * @param {JSRecord<db:/svy_framework/sec_organization>} [record]
 * 
 * @return {Boolean} success
 * 
 * @throws {scopes.modUtils$data.NoRecordException} - no record given or foundset empty
 * 
 * @author patrick
 * @since 2012-10-12
 * 
 * @properties={typeid:24,uuid:"76F4FB16-5532-41E6-A09A-C80C6B5818EC"}
 */
function removeUser(userId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	if (userId instanceof UUID) {
		userId = userId.toString();
	}
	
	var fs = record.sec_organization_to_sec_user_org;
	var userOrgRecord;
	if (fs && utils.hasRecords(fs)) {
		for (var i = 1; i <= fs.getSize(); i++) {
			userOrgRecord = fs.getRecord(i);
			if (userOrgRecord.user_id && userOrgRecord.user_id.toString() == userId) {
				fs.deleteRecord(userOrgRecord);
			}
		}
	}
	
	return databaseManager.saveData(fs);
}

/**
 * Adds the given user to either the selected or the provided organization
 * 
 * @param {String|UUID} userId
 * @param {JSRecord<db:/svy_framework/sec_organization>} [record]
 * 
 * @return {Boolean} success
 * 
 * @throws {scopes.modUtils$data.NoRecordException} - no record given or foundset empty
 * 
 * @author patrick
 * @since 2012-09-19
 *
 * @properties={typeid:24,uuid:"9447A8E5-CDED-4CC9-8220-0FC25494925F"}
 */
function addUser(userId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$data.NoRecordException();
	}
	
	if (userId instanceof UUID) {
		userId = userId.toString();
	}
	
	var fs = record.sec_organization_to_sec_user_org;
	var userOrgRecord;
	if (fs && utils.hasRecords(fs)) {
		for (var i = 1; i <= fs.getSize(); i++) {
			userOrgRecord = fs.getRecord(i);
			if (userOrgRecord.user_id && userOrgRecord.user_id.toString() == userId) {
				return true;
			}
		}
	}
	
	userOrgRecord = record.sec_organization_to_sec_user_org.getRecord(record.sec_organization_to_sec_user_org.newRecord());
	userOrgRecord.user_id = userId;
	return databaseManager.saveData(userOrgRecord);
}
