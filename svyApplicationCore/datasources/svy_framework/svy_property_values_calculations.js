/**
 * @properties={type:4,typeid:36,uuid:"C00CB4AB-BCBE-4B3F-B6AD-96FD846E1E09"}
 */
 function security_level()
 {
 	if (utils.hasRecords(svy_property_values_to_svy_properties)) {
 		return svy_property_values_to_svy_properties.admin_level;
 	} else {
 		return scopes.svySecurityManager.ADMIN_LEVEL.NONE;
 	}
 }
