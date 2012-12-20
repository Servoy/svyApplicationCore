/**
 * Gets the deeplink url for the smart Client
 * @properties={type:12,typeid:36,uuid:"BCF8E1F0-B639-4EBC-8176-EE89A2F0223A"}
 */
function solution_deeplink_sc()
{
	if(!servoy_solution_name){
		return null;
	}
	return application.getServerURL() + '/servoy-client/' + servoy_solution_name + '.jnlp';
}

/**
 * Gets the deeplink url for the web client
 * @properties={type:12,typeid:36,uuid:"BCD6A8D8-B4C2-44BE-9A8C-510D0F24DD6D"}
 */
function solution_deeplink_wc()
{
	if(!servoy_solution_name){
		return null;
	}
	return application.getServerURL() + '/servoy-webclient/ss/s/' + servoy_solution_name;
}
