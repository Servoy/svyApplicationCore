/**
 * The names of the properties needed when the login form is shown
 * 
 * @properties={typeid:35,uuid:"F43B29A9-B169-488D-AA4B-A4F4A9D793ED",variableType:-4}
 */
var loginPropertyNames = ["hide_menu_bar", "force_window_size", "framework_window_size_height", "framework_window_size_width", "authentication_method", "user_language"];

/**
 * Runtime properties used in the login solution
 * 
 * @properties={typeid:35,uuid:"0D031F6E-D56B-41EF-89A0-3388D52A4B64",variableType:-4}
 */
var loginProperties = new Object();

/**
 * The startup arguments received when loading the solution
 * 
 * @type {String}
 *
 * @properties={typeid:35,uuid:"A3C5031B-8C48-4C1C-86BA-DA8731B78483"}
 */
var startupArguments;

/**
 * A dummy method that can be called with a deeplink
 * 
 * @properties={typeid:24,uuid:"3EF9A247-9D65-4BD4-9BFE-70F726FA9F60"}
 */
function startMethodDummy() {
}

/**
 * The Authentication object passed between the login solution and the authenticator
 * 
 * @param {String} [userName]
 * @param {String} [password]
 * 
 * @constructor 
 *
 * @properties={typeid:24,uuid:"7066F284-C668-4B17-BE2B-AC99A88F7947"}
 */
function AuthenticationObject(userName, password) {
	
	/**
	 * The userName used to login
	 * 
	 * @type {String}
	 */
	this.userName = userName;
	
	/**
	 * The password used to login
	 * 
	 * @type {String}
	 */
	this.password = password;
	
	/**
	 * Indicates whether the password validation was successful
	 * 
	 * @type {Boolean}
	 */
	this.loginSuccessful = false;
	
	/**
	 * The name of the owner
	 * 
	 * @type {String}
	 */
	this.owner = "";
	
	/**
	 * The ID of the owner
	 * 
	 * @type {String}
	 */
	this.ownerId = null;
	
	/**
	 * The ID of the user
	 * 
	 * @type {String}
	 */
	this.userId = null;
	
	/**
	 * The ID of the organization
	 * 
	 * @type {String}
	 */
	this.organizationId = null;
	
	/**
	 * The ID of the user organization link
	 * 
	 * @type {String}
	 */
	this.userOrganizationId = null;
	
	
	/**
	 * The name of the Framework database
	 * 
	 * @type {String}
	 */
	this.frameworkDB = "";
	
	/**
	 * The name of the user database
	 * 
	 * @type {String}
	 */
	this.userDB = "";
	
	/**
	 * The organizations to which this user is assigned
	 * 
	 * @type {JSDataSet<{name: String, organization_id: String}>}
	 */
	this.organizations = null;
	
	/**
	 * The name of the authentication implementation form
	 * 
	 * @type {String}
	 */
	this.authenticationImplForm = "";
	
	/**
	 * Indicates whether the user is locked
	 * 
	 * @type {Boolean}
	 */
	this.userLocked = false;
	
	/**
	 * The amount of licenses of the owner
	 * 
	 * @type {Number}
	 */
	this.licenseAmount = 0;
	
	/**
	 * The adminLevel of the user
	 * 
	 * @type {Number}
	 */
	this.userAdminLevel = 0;
	
	/**
	 * The error message if the login failed
	 * 
	 * @type {String}
	 */
	this.error = null;
	
	/**
	 * The name of the exception that might have occured during login
	 * 
	 * @type {String}
	 */
	this.exception = null;
	
	Object.seal(this);
	
}