/**
 * Returns the name to be shown for this authentication method<p>
 * 
 * Override this method and return the name of the authentication implementation (e.g. "LDAP")
 * 
 * @properties={typeid:24,uuid:"4D4BAEC9-B153-4330-855B-5795F83678D3"}
 */
function getDisplayName() {
	return "Authentication implementation on form \"" + controller.getName() + "\" does not provide a name";
 }

/**
 * Validates the login using the relevant properties (e.g. "userName", "password", "owner")
 * from the given scopes.svyLogin.AuthenticationObject authObject<p>
 * 
 * If the login is successful the <b>loginSuccessful</b> property of the given authObject has to be
 * set to <code>true</code> and the object has to be returned<p>
 * 
 * If the login fails the <b>loginSuccessful</b> property of the given authObject has to be set to
 * <code>false</code> and a message indicating the problem should assigned to the <b>error</b> property
 * 
 * @param {scopes.svyLogin.AuthenticationObject} authObject
 * @param {Object} [authProperties] key/value object holding properties needed by the authentication implementation
 * 
 * @return {scopes.svyLogin.AuthenticationObject} authObject
 * 
 * @AllowToRunInFind
 *
 * @properties={typeid:24,uuid:"7AC00E61-A91F-4D3F-B0D9-F8685C8EFD37"}
 */
function validateLogin(authObject, authProperties) {
	authObject.loginSuccessful = false;
	authObject.error = "Authentication implementation does not implement \"validateLogin\" on form " + controller.getName() + "!";
	return authObject;
}

/**
 * Override this method and return the name of the form containing the properties needed for this authentication method<p>
 * 
 * That form has to be an instance of the AbstractPropertyDef form, so it can be properly initialized<p>
 * 
 * If this method returns null, the selected authentication method cannot be further configured in the property editor.
 * 
 * @return {String} propertyEditorFormName
 * 
 * @properties={typeid:24,uuid:"E8A72432-7987-4415-A2F5-27FC7EBAE250"}
 */
function getPropertyEditorFormName() {
	return null;
}

/**
 * Override this method and return the name of the properties needed in the password validation process (e.g. LDAP server)
 * 
 * @return {Array<String>} requiredPropertyNames
 * 
 * @properties={typeid:24,uuid:"CDAD0617-A654-4E9F-A8A4-780BEF1D914C"}
 */
function getRequiredPropertyNames() {
	return new Array();
}
