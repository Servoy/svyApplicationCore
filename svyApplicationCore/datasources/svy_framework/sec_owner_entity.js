/**
 * Deletes the organization with the given ID<p>
 * 
 * Related records from sec_user_org, sec_user_in_group and sec_user_right are also removed
 * 
 * @param {UUID} organizationId
 * @param {JSRecord<db:/svy_framework/sec_owner>} [record]
 * 
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
 * 
 * @properties={typeid:24,uuid:"13EB5360-FD11-4FBD-A2E8-5C758D047737"}
 */
function deleteOrganization(organizationId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$exceptions.NoRecordException();
	}
	
	if (utils.hasRecords(record.sec_owner_to_sec_organization)) {
		for (var i = 1; i <= record.sec_owner_to_sec_organization.getSize() ; i++) {
			var orgRecord = record.sec_owner_to_sec_organization.getRecord(i);
			if (orgRecord.organization_id.toString() == organizationId.toString()) {
				// org record found
				if (utils.hasRecords(orgRecord.sec_organization_to_sec_user_org)) {
					// loop over user_org to remove related stuff
					for (var j = 1; j <= orgRecord.sec_organization_to_sec_user_org.getSize(); j++) {
						var secUserOrgRecord = orgRecord.sec_organization_to_sec_user_org.getRecord(j);
						if (utils.hasRecords(secUserOrgRecord.sec_user_org_to_sec_user_in_group)) {
							// user_in_group
							secUserOrgRecord.sec_user_org_to_sec_user_in_group.deleteAllRecords();
							databaseManager.saveData(secUserOrgRecord.sec_user_org_to_sec_user_in_group);
						}
						if (utils.hasRecords(secUserOrgRecord.sec_user_org_to_sec_user_right)) {
							// user_right
							secUserOrgRecord.sec_user_org_to_sec_user_right.deleteAllRecords();
							databaseManager.saveData(secUserOrgRecord.sec_user_org_to_sec_user_right);
						}
					}
					// user_org
					orgRecord.sec_organization_to_sec_user_org.deleteAllRecords();
					databaseManager.saveData(orgRecord.sec_organization_to_sec_user_org);
				}
				// organization
				record.sec_owner_to_sec_organization.deleteRecord(orgRecord);
			}
		}
		return databaseManager.saveData(record.sec_owner_to_sec_organization);		
	}
	
	return true;
}

/**
 * Removes the given user to either the selected or the provided organization
 * 
 * @param {String} organizationName
 * @param {JSRecord<db:/svy_framework/sec_owner>} [record]
 * 
 * @return {JSRecord<db:/svy_framework/sec_organization>} the sec_organization record created
 * 
 * @throws {scopes.modUtils$exceptions.NoRecordException} - no record given or foundset empty
 * @throws {scopes.modUtils$exceptions.ValueNotUniqueException} -the name of the new organization has to be unique for this owner
 * @throws {scopes.modUtils$exceptions.SaveDataFailedException} - the new organization could not be saved
 * 
 * @author patrick
 * @since 2012-10-12
 * 
 * @properties={typeid:24,uuid:"93249E86-5E83-4DD1-90AE-2F6415458CE2"}
 */
function createOrganization(organizationName, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.modUtils$exceptions.NoRecordException();
	}
	
	if (!scopes.svyUtils.isValueUnique(sec_owner_to_sec_organization, "name", organizationName, ["owner_id"], [record.owner_id.toString()])) {
		throw new scopes.modUtils$exceptions.ValueNotUniqueException(null, "name");
	}
	
	var organizationRecord = record.sec_owner_to_sec_organization.getRecord(record.sec_owner_to_sec_organization.newRecord());
	organizationRecord.name = organizationName;
	if (databaseManager.saveData(organizationRecord)) {
		return organizationRecord;
	} else {
		throw new scopes.modUtils$exceptions.SaveDataFailedException(organizationRecord.exception ? organizationRecord.exception.getMessage() : "", "", [], record.sec_owner_to_sec_organization);
	}
}
