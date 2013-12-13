/**
 * Adds the given user to either the given or the selected record for the given organization.<br>
 * 
 * If the user is not yet in the given organization, it will be added to it.
 * 
 * @param {String|UUID} userId
 * @param {String|UUID} organizationId
 * @param {JSRecord<db:/svy_framework/sec_group>} [record]
 * 
 * @return {Boolean} success
 * 
 * @throws {scopes.svyDataUtils.NoRecordException} - no record given or foundset empty
 * 
 * @author patrick
 * @since 19.09.2012
 * 
 * @properties={typeid:24,uuid:"AB4DD623-1338-4C04-8568-957BFF06C9ED"}
 */
function addUser(userId, organizationId, record)
{
	if (!record) {
		record = getSelectedRecord();
	}
	if (!record) {
		throw new scopes.svyDataUtils.NoRecordException();
	}
}
