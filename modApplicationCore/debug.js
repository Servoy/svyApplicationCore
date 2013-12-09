
/**
 * Combines query and arguments into 1 string, to make is easier to debug big queries with for example dates
 *
 * @author Joas de Haan
 * @since 2011-07-11
 * @param {String} queryString
 * @param {Array} args
 * @return {String} _query including arguments
 *
 * @properties={typeid:24,uuid:"8E03B3C9-D178-41A2-94A2-CEE2A129F033"}
 */
function sql(queryString, args) {
	if (args == null) {
		return queryString;
	}

	if (args.length != utils.stringPatternCount(queryString, "?")) {
		return "-ERROR- args: " + args.length + "; query: " + utils.stringPatternCount(queryString, "?") + ";";
	}

	/** @type {String} */
	var val;

	for (var i = 0; i < args.length; i++) {
		switch (typeof args[i]) {
		case "string":
			val = "'" + args[i] + "'";
			break;
		case "object": //date
			/** @type {Date} */
			var _date = args[i]
			val = "'" + utils.dateFormat(_date, "yyyy-MM-dd HH:mm:ss") + "'";
			break;
		default: //number, integer
			val = args[i];
		}
		queryString = queryString.replace(/\?{1}/, val);
	}
	
	//format the query a little
	queryString = queryString.replace(/\t+/g, " ").replace(/(FROM|WHERE|AND|OR|GROUP|ORDER)/g, "\n$1").replace(/\n+/g, "\n");

	return queryString;
}