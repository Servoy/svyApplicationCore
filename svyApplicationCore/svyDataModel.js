/**
 * Returns a sorted String[] array with all the table names of the given server
 * 
 * @param {String} serverName the name of the server for which table names are returned
 * @param {Boolean} [includeViews] if false, views are not included (defaults to true)
 *
 * @properties={typeid:24,uuid:"AB1808F8-C918-49BA-9FAA-EB8C62559FD6"}
 */
function getTableNames(serverName, includeViews) {
	var result = new Array();
	if (serverName) {
		result = databaseManager.getTableNames(serverName);
		if (includeViews !== false) {
			result = result.concat(databaseManager.getViewNames(serverName));
		}
		result.sort();
	}
	return result;
}

/**
 * Returns a sorted String[] array with all the server names
 * 
 * @return {Array<String>} serverNames
 * 
 * @properties={typeid:24,uuid:"754E7BF7-6493-446F-8213-77F4BF9C4D3F"}
 */
function getServerNames() {
	var serverNames = databaseManager.getServerNames();
	serverNames.sort();
	return serverNames;
}