/**
 * Admin levels for users<p>
 * NONE 					= normal user with no special priviliges<br>
 * ORGANIZATION_MANAGER		= the manager of an organization, can make settings for organizations, create users<br>
 * OWNER_MANAGER			= the manager of an owner/tenant, can create organizations, users etc<br>
 * APPLICATION_MANAGER		= the manager of the application, can create owners<br>
 * DEVELOPER				= has no limitations
 * 
 * @enum
 * @final
 * @properties={typeid:35,uuid:"D0A4C4A2-CCFC-45E8-86A3-8A5748045075",variableType:-4}
 */
var ADMIN_LEVEL = {
	
	/**
	 * Normal user with no special privileges
	 */
	NONE: 0,
	
	/**
	 * The manager of an organization
	 */
	ORGANIZATION_MANAGER: 1,
	
	/**
	 * The manager of an owner/tenant
	 */
	TENANT_MANAGER: 2,
	
	/**
	 * The manager of the application
	 */
	APPLICATION_MANAGER: 4,
	
	/**
	 * The developer of the application
	 */
	DEVELOPER: 8
	
};

/**
 * Type of events that are fired from the SecurityManager
 * 
 * @enum
 * @final
 * 
 * @properties={typeid:35,uuid:"92CD54F8-2B67-4BCB-8D18-41A91A8F4297",variableType:-4}
 */
var EVENT_TYPES = {
	ORGANIZATION_CHANGE: "organization_change"
};

/**
 * Error codes used by PasswordRuleViolationException<p>
 * 
 * These codes can be used to figure out why a password change failed
 * 
 * @enum
 * @final
 * 
 * @example <pre>try {
 *    user.changePassword(newPassword);
 * } catch ( &#47;** @type {scopes.svySecurityManager.PasswordRuleViolationException} *&#47; e) {
 *    if (e.errorCode == scopes.svySecurityManager.ERROR_CODE.PASSWORD_TOO_SHORT) {
 *       &#47;&#47; Password too short
 *    } else if (e.errorCode == scopes.svySecurityManager.ERROR_CODE.PASSWORD_NOT_UNIQUE) {
 *       &#47;&#47; Password used before
 *    } 
 *    &#47;&#47; ...
 * }
 * </pre>
 * 
 * @properties={typeid:35,uuid:"129CE0C9-E269-4CE3-98FD-40780FEAF730",variableType:-4}
 */
var ERROR_CODE = {
	EMPTY_PASSWORD: 1000,
	PASSWORD_MUST_NOT_START_WITH_USER_NAME: 2000,
	PASSWORD_MUST_CONTAIN_NUMBERS_AND_LETTERS: 3000,
	PASSWORD_TOO_SHORT: 4000,
	PASSWORD_TOO_LONG: 5000,
	PASSWORD_NOT_UNIQUE: 6000
};

/**
 * If <code>true</code>, the framework will create a hash of the data <br>
 * in the security tables and save that in sec_owner.hash. <br>
 * The hash will be checked at login. <br>
 * If the security data is changed from outside of Servoy, the hash is <br>
 * not correct and users can't login anymore. This prevents users from <br>
 * giving themselves more privileges by meddling with the database.
 * 
 * @type {Boolean}
 *
 * @properties={typeid:35,uuid:"26503E8F-B704-4830-A38D-639F27A37E65",variableType:-4}
 */
var PERFORM_HASH_CHECKS = false;

/**
 * Password pepper added before the password
 * 
 * @type {String}
 * 
 * @final
 * 
 * @private 
 *
 * @properties={typeid:35,uuid:"0EFB97F1-7EDD-4C26-9E7B-F769BCED9E60"}
 */
var PBKDF2_PEPPER = "Uv9<42,3yN6rDw;FL{8i+T}dsQEC=3Gj67xk:cRzn]MhaJ8[Wg+t38rDvV}823X*nWYK4h;Uu$Po2#7@k]m=9qwMGgjpi<HL6dENL9kUs)}xPbc/2AK9oCD+Nh6Bp73^]&2@8eZy8MmvWiFJ4>zg=V";

/**
 * PBKDF2 password iterations stored in sec_user.password_version
 * 
 * @enum
 * @final 
 * 
 * @private 
 *
 * @properties={typeid:35,uuid:"2F866789-C952-45BC-91EC-E08001728A1D",variableType:-4}
 */
var PBKDF2_ITERATIONS = {
	VERSION_1: 5000
};

/**
 * The version number of the current PBKDF2_ITERATIONS used
 * 
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"243CCB52-56AF-44AC-99F1-9AEF89577813",variableType:4}
 */
var PBKDF2_CURRENT_ITERATION_VERSION = 1;

/**
 * The current PBKDF2 iteration used
 * 
 * @type {Number}
 * 
 * @properties={typeid:35,uuid:"DEC7A0C1-54F6-43DF-9206-305258E8E703",variableType:8}
 */
var PBKDF2_CURRENT_ITERATION = PBKDF2_ITERATIONS["VERSION_" + PBKDF2_CURRENT_ITERATION_VERSION];

/**
 * @type {Array<Key>}
 * 
 * @private 
 * 
 * @properties={typeid:35,uuid:"F684D9DE-BDB5-4543-84FB-D0ABF67CFED5",variableType:-4}
 */
var securityKeys = null;

/**
 * Additional keys provided from elsewhere
 * 
 * @type {Array<Key>}
 * 
 * @private 
 * 
 * @properties={typeid:35,uuid:"54104078-EB68-47C8-AA33-C224DD6F7583",variableType:-4}
 */
var runtimeSecurityKeys = null;

/**
 * Keys that should be removed from the loaded keys
 * 
 * @type {Array<Key>}
 * 
 * @private
 * 
 * @properties={typeid:35,uuid:"ACF69F58-B611-4BB9-9A27-5A8FE7A64FE5",variableType:-4}
 */
var runtimeSecurityKeysRemoved = null;

/**
 * Returns the Application with the given ID or null if not found
 * 
 * @param {String|UUID} applicationID
 * 
 * @return {Application}
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"65929948-DD81-4824-84A8-B919DF1D678F"}
 */
function getApplicationByID(applicationID){
	if (!applicationID) {
		return null;
	}
	if (applicationID instanceof String) {
		applicationID = application.getUUID(applicationID);
	}
	/** @type {JSFoundSet<db:/svy_framework/prov_application>} */
	var fs = databaseManager.getFoundSet(globals.nav_db_framework, 'prov_application');
	if (fs.loadRecords(applicationID)) {
		return new Application(fs.getSelectedRecord());
	}
	return null;
}

/**
 * Returns the Application with the given name or null if not found<p>
 * 
 * If no application name is given, the current solution name is used
 * 
 * @param {String} [applicationName]
 * 
 * @return {Application}
 * 
 * @author patrick
 * @since 2012-12-12
 *
 * @properties={typeid:24,uuid:"50268174-D81C-409A-93D4-642AF60B9F74"}
 */
function getApplication(applicationName) {
	if (!applicationName) {
		applicationName = application.getSolutionName();
	}
	/** @type {QBSelect<db:/svy_framework/prov_application>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/prov_application");
	query.result.addPk();
	query.where.add(query.columns.application_name.eq(applicationName));
	/** @type {JSFoundSet<db:/svy_framework/prov_application>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		return new Application(fs.getSelectedRecord());
	}
	return null;
}

/**
 * Returns an array with all groups
 * 
 * @return {Array<Group>}
 * 
 * @author patrick
 * @since 02.08.2012
 * 
 * @properties={typeid:24,uuid:"D622F5FC-0F98-4C79-8745-7E6448DEAAF6"}
 */
function getGroups() {
	/** @type {Array<Group>} */
	var result = new Array();
	/** @type {JSFoundSet<db:/svy_framework/sec_group>} */	
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_group");
	fs.loadAllRecords();
	if (utils.hasRecords(fs)) {
		for (var i = 1; i <= fs.getSize(); i++) {
			var _groupRecord = fs.getRecord(i);
			result.push(new Group(_groupRecord));
		}
	}
	return result;
}

/**
 * Returns the group with the given name
 * 
 * @param {String} groupname
 * @return {Group} group or null if not found
 * 
 * @author patrick
 * @since 02.08.2012
 *
 * @properties={typeid:24,uuid:"B80DB0BF-7C06-4097-B073-28E880F5F0B8"}
 */
function getGroup(groupname) {
	if (!groupname) {
		return null;
	}
	/** @type {QBSelect<db:/svy_framework/sec_group>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_group");
	query.result.addPk();
	query.where.add(query.columns.name.lower.eq(groupname.toLowerCase()));
	/** @type {JSFoundSet<db:/svy_framework/sec_group>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		return new Group(fs.getRecord(1));
	} else {
		return null;
	}
}

/**
 * Gets a Module object by id or null if not found
 * 
 * @param {UUID|String} moduleID
 * 
 * @return {Module} null if not found
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"629F43E3-9ACF-43C5-8362-D30D69640E37"}
 */
function getModuleByID(moduleID){
	if (!moduleID) {
		return null;
	}
	if (moduleID instanceof String) {
		moduleID = application.getUUID(moduleID);
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_module>} */
	var fs = databaseManager.getFoundSet(globals.nav_db_framework, 'sec_module');
	if (fs.loadRecords(moduleID)) {
		return new Module(fs.getSelectedRecord());
	}
	return null;
}

/**
 * Returns the Module with the given name or null if not found
 * 
 * @param {String} moduleName
 * 
 * @return {Module} module
 * 
 * @author patrick
 * @since 17.04.2013
 *
 * @properties={typeid:24,uuid:"E5197BB9-9AEF-490F-AE29-1D6342387ED7"}
 */
function getModule(moduleName) {
	if (!moduleName) {
		return null;
	}
	/** @type {QBSelect<db:/svy_framework/sec_module>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_module");
	query.result.addPk();
	query.where.add(query.columns.name.eq(moduleName));
	/** @type {JSFoundSet<db:/svy_framework/sec_module>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		return new Module(fs.getSelectedRecord());
	}
	return null;
}



/**
 * Returns an array with all modules
 * 
 * @return {Array<Module>} modules
 * 
 * @author patrick
 * @since 17.04.2013
 * 
 * @properties={typeid:24,uuid:"58E81012-52E2-42F3-A906-A96877854770"}
 */
function getModules() {
	/** @type {Array<Module>} */
	var result = new Array();
	/** @type {JSFoundSet<db:/svy_framework/sec_module>} */	
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_module");
	fs.loadAllRecords();
	if (utils.hasRecords(fs)) {
		for (var i = 1; i <= fs.getSize(); i++) {
			var moduleRecord = fs.getRecord(i);
			result.push(new Module(moduleRecord));
		}
	}
	return result;
}

/**
 * Returns the organization with the given UUID
 * 
 * @param {UUID|String} organizationId
 * 
 * @return {Organization} organization
 * 
 * @author patrick
 * @since 18.09.2012
 *
 * @properties={typeid:24,uuid:"4D12E185-AE62-4092-BE4A-F2F92A3446B9"}
 */
function getOrganizationById(organizationId) {
	if (!organizationId) {
		return null;
	}
	/** @type {JSRecord<db:/svy_framework/sec_organization>} */
	var orgRecord = null;
	
	/** @type {QBSelect<db:/svy_framework/sec_organization>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
	query.result.addPk()
	query.where.add(query.columns.organization_id.eq(organizationId.toString()));
	var foundset = databaseManager.getFoundSet(query);
	
	if (foundset.getSize() == 1) {
		orgRecord = foundset.getRecord(1);
	}
	return new Organization(orgRecord);
}

/**
 * Returns the organization with the given name 
 * or the organization of the logged in user if 
 * no name was provided
 * 
 * @param {String} [organization]
 * 
 * @return {Organization} organization
 * 
 * @author patrick
 * @since 02.08.2012
 *
 *
 * @properties={typeid:24,uuid:"59893496-64FA-4884-A832-B5C053B69D87"}
 */
function getOrganization(organization) {
	/** @type {QBSelect<db:/svy_framework/sec_organization>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
	query.result.addPk();
	if (organization) {
		query.where.add(query.columns.name.eq(organization));
	} else {
		query.where.add(query.columns.organization_id.eq(globals["svy_sec_lgn_organization_id"]));
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_organization>} */	
	var fs = databaseManager.getFoundSet(query);
	if (!utils.hasRecords(fs)) {
		return null;
	} else {
		return new Organization(fs.getRecord(1));
	}
}

/**
 * Returns all organizations as a Organization array
 * 
 * @return {Array<Organization>} organizations
 * 
 * @author patrick
 * @since 13.08.2012
 *
 * @properties={typeid:24,uuid:"601DD990-E9FC-4C04-A29E-EDE1CBEDCC7C"}
 */
function getOrganizations() {
	/** @type {QBSelect<db:/svy_framework/sec_organization>} */	
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
	query.result.addPk();
	/** @type {JSFoundSet<db:/svy_framework/sec_organization>} */	
	var foundset = databaseManager.getFoundSet(query);
	if (!utils.hasRecords(foundset)) {
		return null;
	}
	/** @type {Array<Organization>} */
	var result = new Array();
	for (var i = 1; i <= foundset.getSize(); i++) {
		var userRecord = foundset.getRecord(i);
		result.push(new Organization(userRecord));
	}
	return result;
}

/**
 * Returns an Owner array of all Owners
 * 
 * @return {Array<Owner>} owners
 * 
 * @author patrick
 * @since 01.08.2012
 * 
 * @properties={typeid:24,uuid:"059E12F6-345F-4F6A-8A16-AE2E98577824"}
 */
function getOwners() {
	/** @type {Array<Owner>} */
	var result = new Array();
	/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_owner");
	fs.loadAllRecords();
	for (var i = 1; i <= fs.getSize(); i++) {
		var ownerRecord = fs.getRecord(i);
		result.push(new Owner(ownerRecord));
	}
	return result;
}

/**
 * Returns the owner with the given name 
 * or the owner of the logged in user if 
 * no name was provided
 * 
 * @param {String} [owner]
 * 
 * @return {Owner} owner
 * 
 * @example var currentOwner = scopes.svySecurityManager.getOwner();
 * 
 * @author patrick
 * @since 14.08.2012
 *
 * @properties={typeid:24,uuid:"B58B2319-0821-4E17-B1B3-BCF09437B568"}
 */
function getOwner(owner) {
	if (!owner) {
		return getOwnerById(globals.svy_sec_lgn_owner_id);
	}
	/** @type {QBSelect<db:/svy_framework/sec_owner>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_owner");
	query.result.addPk()
	query.where.add(query.columns.name.eq(owner));
	/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */	
	var fs = databaseManager.getFoundSet(query);
	if (fs.getSize() == 1) {
		return new Owner(fs.getRecord(1));
	}
	return null;
}

/**
 * Returns the owner with the given UUID
 * 
 * @param {UUID|String} ownerId
 * 
 * @return {Owner} owner
 * 
 * @author patrick
 * @since 14.08.2012
 *
 * @properties={typeid:24,uuid:"17F86980-A110-452A-A8F2-88809251EC91"}
 */
function getOwnerById(ownerId) {
	if (!ownerId) {
		return null;
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */	
	var foundset = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_owner");
	if (ownerId instanceof String) {
		ownerId = application.getUUID(ownerId);
	}
	foundset.loadRecords(ownerId);
	if (foundset.getSize() == 1) {
		return new Owner(foundset.getRecord(1));
	}
	return null;
}

/**
 * Returns a User object for the given user name<br>
 * or the current user if no user name is provided
 * 
 * @param {String} [userName] - the name of the user
 * 
 * @return {User} user 
 * 
 * @author patrick
 * @since 01.08.2012
 *
 * @properties={typeid:24,uuid:"88EE5D89-8FFB-4440-AF06-1234B9E9BA3C"}
 */
function getUser(userName) {
	/** @type {JSRecord<db:/svy_framework/sec_user>} */
	var userRecord = null;
	
	/** @type {QBSelect<db:/svy_framework/sec_user>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user");
	query.result.addPk();
	
	if (!userName && globals.svy_sec_lgn_user_id) {
		query.where.add(query.columns.user_id.eq(globals.svy_sec_lgn_user_id.toString()));
	} else {
		query.where.add(query.columns.user_name.eq(userName));
	}
	var foundset = databaseManager.getFoundSet(query);
	
	if (foundset.getSize() == 1) {
		userRecord = foundset.getRecord(1);
	} else {
		return null;
	}
	
	return new User(userRecord);
}

/**
 * Returns all users as a User array
 * 
 * @return {Array<User>}
 * 
 * @author patrick
 * @since 13.08.2012
 * 
 * @properties={typeid:24,uuid:"E01040BC-347E-4EAA-A472-98CA5337F0E7"}
 */
function getUsers() {
	/** @type {QBSelect<db:/svy_framework/sec_user>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user");
	query.result.addPk();
	/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
	var foundset = databaseManager.getFoundSet(query);
	if (!utils.hasRecords(foundset)) {
		return null;
	}
	/** @type {Array<User>} */
	var result = new Array();
	for (var i = 1; i <= foundset.getSize(); i++) {
		var userRecord = foundset.getRecord(i);
		result.push(new User(userRecord));
	}
	return result;
}

/**
 * Returns a User object for the user with the given ID
 * 
 * @param {String|UUID} userId
 * 
 * @return {User} user
 * 
 * @author patrick
 * @since 10.08.2012
 *
 * @properties={typeid:24,uuid:"FE05C61B-A686-4C23-878A-932BB4C6B107"}
 */
function getUserById(userId) {
	if (!userId) {
		return null;
	}
	/** @type {JSRecord<db:/svy_framework/sec_user>} */
	var userRecord = null;
	/** @type {JSFoundSet<db:/svy_framework/sec_user>} */	
	var foundset = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_user");
	if (userId instanceof String) {
		userId = application.getUUID(userId);
	}
	foundset.loadRecords(userId);
	if (foundset.getSize() == 1) {
		userRecord = foundset.getRecord(1);
		return new User(userRecord);	
	} else {
		throw new scopes.modUtils$data.NoRecordException();
	}
}

/**
 * Creates a new application record and returns an Object handle
 * 
 * @param {String} name must be unique
 * 
 * @return {Application}
 * 
 * @throws {scopes.modUtils$data.ValueNotUniqueException} 
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"6CC68D24-ED77-4B34-B6B0-4EF3490EDF79"}
 */
function createApplication(name){
	if (!name) {
		return null;
	}
	/** @type {JSFoundSet<db:/svy_framework/prov_application>} */
	var fs = databaseManager.getFoundSet(scopes.globals.nav_db_framework, 'prov_application');
	if (!scopes.modUtils.isValueUnique(fs, 'application_name', name)) {
		throw new scopes.modUtils$data.ValueNotUniqueException(null, fs, 'application_name', name);
	}
	if (!fs.newRecord()) {
		throw new scopes.modUtils$data.NewRecordFailedException('Could not create Application', fs);
	}
	var record = fs.getSelectedRecord();
	record.application_name = name;
	save(record);
	return new Application(record);
}

/**
 * Creates and returns a new security key with the given name and optional description
 * 
 * @param {String} name
 * @param {String} [description]
 * @param {Owner} [owner]
 * 
 * @author patrick
 * @since 14.08.2012
 *
 * @properties={typeid:24,uuid:"7E02D49A-68EA-4B33-9348-FD43904E2128"}
 */
function createKey(name, description, owner) {
	if (!name) {
		return null;
	}
	
	/** @type {JSFoundSet<db:/svy_framework/sec_security_key>} */
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_security_key");
	var keyRecord = fs.getRecord(fs.newRecord());
	keyRecord.name = name;
	keyRecord.description = description;
	keyRecord.owner_id = owner ? owner.ownerId : "00000000-0000-0000-0000-000000000000";
	if (save(keyRecord)) {
		return new Key(keyRecord.security_key_id, keyRecord.name, keyRecord.description, keyRecord.owner_id);
	} else {
		return null;
	}
}

/**
 * Creates a new module
 * 
 * @param {String} name must be unique
 * 
 * @return {Module}
 * 
 * @throws {scopes.modUtils$data.ValueNotUniqueException}
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"14038587-E684-4051-A469-3A1D97C18392"}
 */
function createModule(name){
	if (!name) {
		return null;
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_module>} */
	var fs = databaseManager.getFoundSet(globals.nav_db_framework, 'sec_module');
	if (!scopes.modUtils.isValueUnique(fs, 'name', name)) {
		throw new scopes.modUtils$data.ValueNotUniqueException(null, fs, 'name', name);
	}
	if (!fs.newRecord()) {
		throw new scopes.modUtils$data.NewRecordFailedException('Cound not create module record', fs);
	}
	var record = fs.getSelectedRecord();
	record.name = name;
	save(record);
	return new Module(record);
}

/**
 * Creates and returns a new organization or null if the<br>
 * organization could not be created of no name was given<br><br>
 * 
 * If no Owner is provided, the current owner is used
 * 
 * @param {String} organizationName - the name of the new organization
 * @param {Owner} [owner] - the owner to which this organization is added; if not given, the current owner is used
 * 
 * @author patrick
 * @since 02.08.2012
 *
 * @properties={typeid:24,uuid:"5476EA9F-5602-4103-AE89-C41C0CB7B159"}
 */
function createOrganization(organizationName, owner) {
	if (!organizationName) {
		return null;
	}
	if (!owner) {
		owner = getOwner();
	}
	return owner.createOrganization(organizationName);
}

/**
 * Creates and returns a new owner or null if the<br>
 * owner could not be created of no name was given
 * 
 * @param {String} ownerName - the name of the new owner
 * @return {Owner} newOwner
 * 
 * @example var newOwner = scopes.svySecurityManager.createOwner("New owner");<br>
 * if (newOwner) {<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// Everything OK<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// ...<br>
 * }
 * 
 * @throws {scopes.modUtils$data.ValueNotUniqueException} - the owner name must be unique
 * 
 * @author patrick
 * @since 02.08.2012
 *
 * @properties={typeid:24,uuid:"A6DFFFB1-AB2B-4AE6-AE8A-C3B0DDF776F4"}
 */
function createOwner(ownerName) {
	if (!ownerName) {
		return null;
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_owner");
	
	if (!scopes.modUtils.isValueUnique(fs,"name",ownerName)) {
		throw new scopes.modUtils$data.ValueNotUniqueException(null, "ownername");
	}
	
	var ownerRecord = fs.getRecord(fs.newRecord());
	ownerRecord.name = ownerName;
	save(ownerRecord);
	return new Owner(ownerRecord);
}

/**
 * Creates and returns a new user
 * 
 * @param {String} userName
 * @param {String} [password]
 * @param {Owner} [owner]
 * @param {Organization} [organization]
 * 
 * @throws {scopes.modUtils$data.ValueNotUniqueException} the user name has to be unique for an owner
 * 
 * @return {User} newUser
 * 
 * @author patrick
 * @since 14.08.2012
 *
 * @properties={typeid:24,uuid:"7C5433FA-0BB3-473C-AE52-545DBC5FBDD4"}
 */
function createUser(userName, password, owner, organization) {
	if (!userName) {
		return null;
	}
	if (!owner) {
		owner = getOwner();
	}
	
	/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
	var userFs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_user");
	if (!scopes.modUtils.isValueUnique(userFs, "user_name", userName, ["owner_id"], [owner.ownerId.toString()])) {
		throw new scopes.modUtils$data.ValueNotUniqueException(null, "user_name");
	}
		
	var userRecord = userFs.getRecord(userFs.newRecord());
	userRecord.user_name = userName;
	userRecord.owner_id = owner.ownerId;
	save(userRecord);
	var user = new User(userRecord);
	if (password) {
		user.changePassword(password);
	}
	if (organization) {
		organization.addUser(user);
	}
	return user;
}

/**
 * Creates a user login
 * 
 * @param {String|UUID} userId
 * @param {Boolean} attemptSuccessful
 * @param {String} reasonUnsuccessful
 * @param {Boolean} reasonIncludeTimespan
 * @param {String} frameworkDB
 *
 * @properties={typeid:24,uuid:"A195364D-B164-4948-8476-16D4D42C68E4"}
 */
function createUserLogin(userId, attemptSuccessful, reasonUnsuccessful, reasonIncludeTimespan, frameworkDB) {
	if (!userId || !frameworkDB) {
		return null;
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_user_login_attempt>} */
	var fsUserLoginAttempt = databaseManager.getFoundSet(frameworkDB, "sec_user_login_attempt");
	var recUserLoginAttempt = fsUserLoginAttempt.getRecord(fsUserLoginAttempt.newRecord());
	recUserLoginAttempt.user_id = userId;
	recUserLoginAttempt.attempt_datetime = new Date();
	recUserLoginAttempt.is_successful = attemptSuccessful;
	recUserLoginAttempt.reason_unsuccessful = reasonUnsuccessful;
	recUserLoginAttempt.reason_include_timespan = reasonIncludeTimespan;
	if (databaseManager.saveData(fsUserLoginAttempt)) {
		return new UserLogin(recUserLoginAttempt);
	} else {
		return null;
	}
}

/**
 * @param {JSRecord<db:/svy_framework/sec_user>} userRecord
 *
 * @constructor 
 * 
 * @private
 * 
 * @author patrick
 * @since 01.08.2012 
 * 
 * @properties={typeid:24,uuid:"9D7D01BC-C223-4EA2-A4FA-EA2267BEDDC7"}
 */
function User(userRecord) {
	if (!userRecord || !(userRecord instanceof JSRecord) || databaseManager.getDataSourceTableName(userRecord.getDataSource()).toLowerCase() != "sec_user") {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("User constructor requires a sec_user record");
	}

	/**
	 * Gets / Sets the user name of this User
	 * @type {String}
	 *
	 */
	this.userName = userRecord.user_name;
	
	/**
	 * Returns the ID of this user
	 * @return {UUID} userId
	 */
	this.userId = userRecord.user_id;
	
	/**
	 * The admin level of the user
	 * 
	 * @type {Number}
	 * 
	 * @see ADMIN_LEVEL for possible values
	 */
	this.adminLevel = userRecord.admin_level;
	
	/**
	 * The user's email address
	 * 
	 * @type {String}
	 * 
	 * @throws scopes.modUtils$exceptions.InvalidEmailAddressException
	 */
	this.emailAddress = userRecord.com_email;
	
	/**
	 * The user's owner ID
	 * 
	 * @type {UUID}
	 * 
	 * @throws scopes.modUtils$exceptions.NoOwnerException if the given ownerId could not be found or reached
	 */
	this.ownerId = userRecord.owner_id;
	
	/**
	 * If true the user has to change his password when he logs in the next time
	 * 
	 * @type {Boolean}
	 */
	this.requireNewPassword = false;
	
	/**
	 * Changes the password for this user
	 * 
	 * @param {String} newPassword
	 * 
	 * @throws {scopes.modUtils$exceptions.SvyException}
	 * 
	 * @return {boolean} success
	 */
	this.changePassword = function(newPassword) {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		try {
			return fs.changePassword(newPassword, userRecord);
		} catch(e) {
			throw e;
		}
	}
	
	/**
	 * Locks the user
	 * 
	 * @return {Boolean} success
	 */
	this.lockUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.lockUser(userRecord);
	}
	
	/**
	 * Unlocks the user
	 * 
	 * @return {Boolean} success
	 */
	this.unlockUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.unlockUser(userRecord);
	}
	
	/**
	 * Adds this user to the given organization
	 * 
	 * @param {Organization} organization - the organization to add the user to
	 * 
	 * @return {boolean} success
	 */
	this.addToOrganization = function(organization) {
		if (!organization) {
			return false;
		}
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.addToOrganization(organization.orgId, userRecord);
	}
	
	/**
	 * Removes this user from the given organization
	 * 
	 * @param {Organization} organization - the organization to remove the user from
	 */
	this.removeFromOrganization = function(organization) {
		if (!organization) {
			return false;
		}
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.removeFromOrganization(organization.orgId, userRecord);
	}
	
	/**
	 * Adds this user to the given group
	 * 
	 * @param {Group} group
	 * @param {Organization} organization
	 * 
	 * @return {boolean} success
	 */
	this.addToGroup = function(group, organization) {
		if (!group || !organization) {
			return false;
		}
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.addToGroup(group.groupId, organization.orgId, userRecord);
	}
	
	/**
	 * Assigns the given security key to this user<br>
	 * and the given organziation
	 * 
	 * @param {Organization} organization
	 * @param {Key} key
	 * 
	 * @return {Boolean} success
	 */
	this.assignKey = function(organization, key) {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.assignKey(key.keyId, organization.orgId, userRecord);
	}
	
	/**
	 * Returns all organizations of this user as an array
	 * 
	 * @this {User}
	 * 
	 * @return {Array<Organization>}
	 */
	this.getOrganizations = function() {
		/** @type {Array<Organization>} */
		var result = new Array();
		
		/** @type {QBSelect<db:/svy_framework/sec_organization>} */
		var orgQuery = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
		orgQuery.result.addPk();
		/** @type {QBJoin<db:/svy_framework/sec_user_org>} */
		var userOrgJoin = orgQuery.joins.add("db:/" + globals.nav_db_framework + "/sec_user_org", JSRelation.INNER_JOIN);
		userOrgJoin.on.add(orgQuery.columns.organization_id.eq(userOrgJoin.columns.organization_id));
		orgQuery.where.add(userOrgJoin.columns.user_id.eq(this.userId.toString()));
		
		/** @type {JSFoundSet<db:/svy_framework/sec_organization>} */
		var orgFs = databaseManager.getFoundSet(orgQuery);
		if (utils.hasRecords(orgFs)) {
			for (var i = 1; i <= orgFs.getSize(); i++) {
				result.push(new Organization(orgFs.getRecord(i)));
			}
		}
		
		return result;
	}
	
	/**
	 * Returns all groups of this user and the given organization
	 * 
	 * @param {Organization} organization
	 * 
	 * @this {User}
	 * 
	 * @return {Array<Group>}
	 */
	this.getGroups = function(organization) {
		/** @type {Array<Group>} */
		var result = new Array();
		
		/** @type {QBSelect<db:/svy_framework/sec_group>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_group");
		query.result.addPk();
		/** @type {QBJoin<db:/svy_framework/sec_user_in_group>} */
		var joinUserInGroup = query.joins.add("db:/" + globals.nav_db_framework + "/sec_user_in_group");
		joinUserInGroup.on.add(query.columns.group_id.eq(joinUserInGroup.columns.group_id));
		/** @type {QBJoin<db:/svy_framework/sec_user_org>} */		
		var joinUserOrg = query.joins.add("db:/" + globals.nav_db_framework + "/sec_user_org");
		joinUserOrg.on.add(joinUserInGroup.columns.user_org_id.eq(joinUserOrg.columns.user_org_id));
		query.where.add(joinUserOrg.columns.organization_id.eq(organization.orgId.toString()));
		query.where.add(joinUserOrg.columns.user_id.eq(this.userId.toString()));
		
		/** @type {JSFoundSet<db:/svy_framework/sec_group>} */
		var groupFs = databaseManager.getFoundSet(query);
		if (utils.hasRecords(groupFs)) {
			for (var i = 1; i <= groupFs.getSize(); i++) {
				var groupRecord = groupFs.getRecord(i);
				result.push(new Group(groupRecord));
			}
		}
		
		return result;
	}
	
	/**
	 * Returns an Array<Key> of all keys of this User in the given organization
	 * 
	 * @param {Organization} organization
	 * @this {User}
	 * @return {Array<Key>} keys
	 */
	this.getKeys = function(organization) {
		return loadSecurityKeys(this, organization);
	}
	
	/**
	 * Returns the date of the last login of this User
	 * 
	 * @return {Date} lastLogin
	 */
	this.getLastLogin = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.getLastLogin(userRecord);
	}
	
	/**
	 * Returns all login attempts of this user
	 * 
	 * @return {Array<UserLogin>}
	 */
	this.getLogins = function() {
		var fs = userRecord.sec_user_to_sec_user_login_attempt;
		fs.sort("attempt_datetime desc");
		/** @type {Array<UserLogin>} */
		var result = new Array();
		for (var i = 1; i <= fs.getSize(); i++) {
			var loginRecord = fs.getRecord(i);
			result.push(new UserLogin(loginRecord));
		}
		return result;
	}
	
	/**
	 * Returns all logins between the given start and end date
	 * 
	 * @param {Date} start
	 * @param {Date} end
	 * 
	 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
	 * 
	 * @return {Array<UserLogin>}
	 */
	this.getLoginsBetween = function(start, end) {
		if (!start || !end) {
			throw new scopes.modUtils$exceptions.IllegalArgumentException("Missing date for getLoginsBetween");
		}
		
		var queryStart;
		var queryEnd;
		
		if (start instanceof Date || start instanceof String) {
			queryStart = new Date(start.valueOf());
		} else {
			throw new scopes.modUtils$exceptions.IllegalArgumentException("Wrong argument passed for start in getLoginsBetween");
		}
		if (end instanceof Date || end instanceof String) {
			queryEnd = new Date(end.valueOf());
		} else {
			throw new scopes.modUtils$exceptions.IllegalArgumentException("Wrong argument passed for end in getLoginsBetween");
		}
		
		if (queryStart > queryEnd) {
			var tmpStart = new Date(queryEnd.valueOf());
			queryEnd = new Date(queryStart.valueOf());
			queryStart = tmpStart;
		}
		
		/** @type {QBSelect<db:/svy_framework/sec_user_login_attempt>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user_login_attempt");
		query.result.addPk();
		query.where.add(query.columns.user_id.eq(userRecord.user_id.toString()));
		query.where.add(query.columns.attempt_datetime.ge(start));
		query.where.add(query.columns.attempt_datetime.le(end));
		query.sort.add(query.columns.attempt_datetime.desc);
		
		/** @type {JSFoundSet<db:/svy_framework/sec_user_login_attempt>} */
		var fs = databaseManager.getFoundSet(query);
		/** @type {Array<UserLogin>} */
		var result = new Array();
		for (var i = 1; i <= fs.getSize(); i++) {
			var loginRecord = fs.getRecord(i);
			result.push(new UserLogin(loginRecord));
		}
		return result;
	}
	
	/**
	 * Returns <code>true</code> if the password is expired, <code>false</code> otherwise
	 * 
	 * @return {Boolean} isExpired
	 */
	this.isPasswordExpired = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.isPasswordExpired(userRecord);
	}
	
	/**
	 * Returns <code>true</code> if the given password is correct
	 * 
	 * @return {Boolean} isValid
	 */
	this.isPasswordValid = function(password) {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.isPasswordValid(password, userRecord);
	}
	
	/**
	 * Returns <code>true</code> if the user has the key with the given name in the given organization
	 * 
	 * @param {String} keyName
	 * @param {Organization} organization
	 * 
	 * @this {User}
	 * 
	 * @return {boolean} hasKey
	 */
	this.hasKeyName = function(keyName, organization) {
		var keys = this.getKeys(organization);
		for (var i = 0; i < keys.length; i++) {
			/** @type {Key} */
			var key = keys[i];
			if (key.name == keyName) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Returns <code>true</code> if the user has the key with the given ID in the given organization
	 * 
	 * @param {UUID|String} keyId
	 * @param {Organization} organization
	 * 
	 * @this {User}
	 * 
	 * @return {boolean} hasKey
	 */
	this.hasKeyId = function(keyId, organization) {
		var keys = this.getKeys(organization);
		for (var i = 0; i < keys.length; i++) {
			/** @type {Key} */
			var key = keys[i];
			if (key.keyId.toString() == keyId.toString()) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Deletes this user
	 * 
	 */
	this.deleteUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.deleteUser(userRecord);
	}
	
	/**
	 * Activates the user<br>
	 * Only active users can login<br>
	 * For count of users per package only active users will be counted.
	 */
	this.activateUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.activateUser(userRecord);
	}
	
	/**
	 * Deactivates the user<br>
	 * Only active users can login<br>
	 * For count of users per package only active users will be counted.
	 */
	this.deactivateUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = userRecord.foundset;
		return fs.deactivateUser(userRecord);
	}
	
	Object.defineProperty(this, "adminLevel", {
        set: function (level) {
        	/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
        	var fs = userRecord.foundset;
        	fs.setAdminLevel(level, userRecord);
        },
        get: function () {
        	if (!userRecord.admin_level) {
        		return ADMIN_LEVEL.NONE;
        	} else {
        		return userRecord.admin_level;
        	}
        }
    });	
	
	Object.defineProperty(this, "userName", {
        set: function (x) {
        	if (!x || !(x instanceof String)) {
        		return;
        	}
        	if (userRecord.user_name != x) {
	        	if (!scopes.modUtils.isValueUnique(userRecord, "user_name", x, ["owner_id"],[userRecord.owner_id.toString()])) {
	        		throw new scopes.modUtils$data.ValueNotUniqueException(null, "user_name");
	        	}
	        	userRecord.user_name = x;
	            save(userRecord);
        	}
        },
        get: function () {
            return userRecord.user_name;
        }
    });		
	
	Object.defineProperty(this, "userId", {
       get: function () {
            return userRecord.user_id;
        }
    });		
	
	Object.defineProperty(this, "ownerId", {
       get: function () {
            return userRecord.owner_id;
        },
		set: function(x) {
			var owner = getOwnerById(x);
			if (!owner) {
				throw new scopes.modUtils$exceptions.IllegalArgumentException("The owner with the ID " + x + " could not be found");
			}
			userRecord.owner_id = owner.ownerId;
			save(userRecord);
		}
    });		
	
	Object.defineProperty(this, "emailAddress", {
       get: function () {
            return userRecord.com_email;
        },
		set: function(x) {
			if (plugins.mail.isValidEmailAddress(x)) {
				userRecord.com_email = x;
				save(userRecord);
			} else {
				throw new scopes.modUtils$exceptions.IllegalArgumentException("Invalid email address: " + x);
			}
		}
    });	

	Object.defineProperty(this, "requireNewPassword", {
       get: function () {
    	   /** @type {JSFoundSet<db:/svy_framework/sec_user>} */
    	   var fs = userRecord.foundset;
    	   return fs.isPasswordExpired(userRecord);
        },
		set: function(x) {
			if (x) {
	    	   /** @type {JSFoundSet<db:/svy_framework/sec_user>} */			
				var fs = userRecord.foundset;
		    	fs.setPasswordExpired(userRecord);
			}
		}
    });	
	
	
	Object.defineProperties(this, {
		"changePassword": {
			enumerable: false
		},
		"lockUser": {
			enumerable: false
		},
		"unlockUser": {
			enumerable: false
		},
		"addToOrganization": {
			enumerable: false
		},
		"removeFromOrganization": {
			enumerable: false
		},
		"addToGroup": {
			enumerable: false
		},
		"assignKey": {
			enumerable: false
		},
		"getOrganizations": {
			enumerable: false
		},
		"getGroups": {
			enumerable: false
		},
		"getKeys": {
			enumerable: false
		},
		"getLastLogin": {
			enumerable: false
		},
		"getLogins": {
			enumerable: false
		},		
		"getLoginsBetween": {
			enumerable: false
		},		
		"isPasswordExpired": {
			enumerable: false
		},
		"hasKeyName": {
			enumerable: false
		},
		"hasKeyId": {
			enumerable: false
		},
		"deleteUser": {
			enumerable: false
		},
		"activateUser": {
			enumerable: false
		},
		"deactivateUser": {
			enumerable: false
		}
	});
	
	Object.seal(this);
}

/**
 * @param {JSRecord<db:/svy_framework/sec_group>} groupRecord
 * 
 * @constructor 
 * @private 
 * 
 * @author patrick
 * @since 01.08.2012
 * 
 * @properties={typeid:24,uuid:"905BA6B0-C4E8-4083-B13D-E77F66A6F0AE"}
 */
function Group(groupRecord) {
	if (!groupRecord || !(groupRecord instanceof JSRecord) || databaseManager.getDataSourceTableName(groupRecord.getDataSource()).toLowerCase() != "sec_group") {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Group constructor requires a sec_group record");
	}
	
	/**
	 * The name of this group
	 * @type {String}
	 */
	this.name = groupRecord.name;

	/**
	 * Description of this Group
	 * @type {String}
	 */
	this.description = groupRecord.description;
	
	/**
	 * Returns the users in this group for all or the given organization
	 * 
	 * @this {Group}
	 * 
	 * @param {Organization} [organization]
	 * 
	 * @return {Array<User>} users
	 */
	this.getUsers = function(organization) {
		/** @type {Array<User>} */
		var result = new Array();
		
		/** @type {QBSelect<db:/svy_framework/sec_user>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user");
		query.result.add(query.columns.user_id);
		query.result.distinct = true;
		
		/** @type {QBJoin<db:/svy_framework/sec_user_org>} */
		var joinUserOrg = query.joins.add("db:/" + globals.nav_db_framework + "/sec_user_org");
		joinUserOrg.on.add(query.columns.user_id.eq(joinUserOrg.columns.user_id));
		/** @type {QBJoin<db:/svy_framework/sec_user_in_group>} */
		var joinUserInGroup = query.joins.add("db:/" + globals.nav_db_framework + "/sec_user_in_group");
		joinUserInGroup.on.add(joinUserOrg.columns.user_org_id.eq(joinUserInGroup.columns.user_org_id));
		/** @type {QBJoin<db:/svy_framework/sec_group>} */
		var joinGroup = query.joins.add("db:/" + globals.nav_db_framework + "/sec_group");
		joinGroup.on.add(joinUserInGroup.columns.group_id.eq(joinGroup.columns.group_id));
		
		query.where.add(joinGroup.columns.group_id.eq(this.groupId.toString()));
		if (organization) {
			query.where.add(joinUserOrg.columns.organization_id.eq(organization.orgId.toString()));
		}
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var foundset = databaseManager.getFoundSet(query);
		if (utils.hasRecords(foundset)) {
			for (var i = 1; i <= foundset.getSize(); i++) {
				var userRecord = foundset.getRecord(i);
				result.push(new User(userRecord));
			}
		}
		return result;
	}
	
	/**
	 * Returns the ID of this group
	 * 
	 * @type {UUID}
	 */
	this.groupId = groupRecord.group_id;
	
	/**
	 * Adds the given User to the group<br>
	 * for the given organization.<br><br>
	 * If the user is not yet in the given<br>
	 * organization, it will be added to it.
	 * 
	 * @param {User} userToAdd
	 * @param {Organization} organization
	 * 
	 * @this {Group}
	 * 
	 * @return {boolean} success
	 */
	this.addUser = function(userToAdd, organization) {
		if (!userToAdd || !(userToAdd instanceof User) || !organization || !(organization instanceof Organization)) {
			return false;
		}
		var success = organization.addUser(userToAdd);
		if (!success) {
			return success;
		}
		var userOrgId = getUserOrgId(organization,userToAdd);
		if (!userOrgId) {
			return false;
		}
		
		var groupId = this.groupId;
		/** @type {JSFoundSet<db:/svy_framework/sec_user_in_group>} */	
		var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_user_in_group");
		var userInGroupRec = fs.getRecord(fs.newRecord());
		userInGroupRec.group_id = groupId;
		userInGroupRec.user_org_id = userOrgId;
		return save(userInGroupRec);
	}
	
	/**
	 * Adds the given key to this group's rights
	 * 
	 * @param {Key} keyToAdd
	 * 
	 * @this {Group}
	 * 
	 * @return {Boolean} success
	 * 
	 */
	this.addKey = function(keyToAdd) {
		if (!keyToAdd || !(keyToAdd instanceof Key)) {
			return false;
		}
		
		/** @type {JSFoundSet<db:/svy_framework/sec_user_right>} */
		var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_user_right");
		var newUserRightRec = fs.getRecord(fs.newRecord());
		newUserRightRec.group_id = this.groupId;
		newUserRightRec.security_key_id = keyToAdd.keyId;
		return save(newUserRightRec);
	}
	
	Object.defineProperty(this, "name", {
        set: function (x) {
        	groupRecord.name = x;
            save(groupRecord);
        },
        get: function () {
            return groupRecord.name;
        }
    });
	
	Object.defineProperty(this, "description", {
        set: function (x) {
        	groupRecord.description = x;
            save(groupRecord);
        },
        get: function () {
            return groupRecord.description;
        }
    });	
	
	Object.defineProperty(this, "groupId", {
        get: function () {
            return groupRecord.group_id;
        }
    });	
	
	Object.seal(this);
}

/**
 * @param {UUID} keyID
 * @param {String} keyName
 * @param {String} [keyDescription]
 * @param {UUID} [keyOwnerId]
 * @param {UUID} [keyModuleId]
 * 
 * @constructor 
 * @private
 * 
 * @author patrick
 * @since 01.08.2012 
 *
 * @properties={typeid:24,uuid:"1CA88ECA-97B1-4086-9E95-748727448057"}
 */
function Key(keyID, keyName, keyDescription, keyOwnerId, keyModuleId) {
	
	/**
	 * The name of this key
	 * @type {String}
	 */
	this.name = "";
	
	var $name = keyName;
	
	/**
	 * Description of this Key
	 * @type {String}
	 */
	this.description = "";
	
	var $description = keyDescription;
	
	/**
	 * Gets the ID of this key
	 * @type {UUID}
	 */
	this.keyId = "";
	
	var $keyId = keyID;
	
	/**
	 * Gets the ownerId of this key
	 * @type {UUID}
	 */
	this.ownerId = "";
	
	var $ownerId = keyOwnerId;
	
	/**
	 * Gets the Owner of this key
	 * @type {Owner}
	 */
	this.owner = null;
	
	/**
	 * Gets the moduleId of this key
	 */
	this.moduleId = "";
	
	var $moduleId = "";
	
	/**
	 * Gets the Module of this key
	 * @type {Module}
	 */
	this.moduleId = null;
	
	/**
	 * Returns all groups with this key
	 * 
	 * @this {Key}
	 * 
	 * @return {Array<Group>} groups
	 */
	this.getGroups = function() {
		/** @type {Array<Group>} */
		var result = new Array();
		
		/** @type {QBSelect<db:/svy_framework/sec_group>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_group");
		query.result.addPk();
		/** @type {QBJoin<db:/svy_framework/sec_user_right>} */
		var userRightJoin = query.joins.add("db:/" + globals.nav_db_framework + "/sec_user_right");
		userRightJoin.on.add(query.columns.group_id.eq(userRightJoin.columns.group_id));
		query.where.add(query.columns.group_id.not.isNull);
		query.where.add(userRightJoin.columns.security_key_id.eq(this.keyId.toString()));
		
		/** @type {JSFoundSet<db:/svy_framework/sec_group>} */		
		var fs = databaseManager.getFoundSet(query);
		if (utils.hasRecords(fs)) {
			for (var i = 1; i <= fs.getSize(); i++) {
				var groupRecord = fs.getRecord(i);
				result.push(new Group(groupRecord));
			}
		}
		
		return result;
	}
	
	/**
	 * Adds table security to this key<br>
	 * If an entry for the given table already exists<br>
	 * it will be overwritten by what is provided here
	 * 
	 * @param {String} serverName
	 * @param {String} tableName
	 * @param {Boolean} canRead
	 * @param {Boolean} canInsert
	 * @param {Boolean} canUpdate
	 * @param {Boolean} canDelete
	 * @param {Boolean} tracking
	 * 
	 * @this {Key}
	 * 
	 * @return {Boolean} success
	 * 
	 */
	this.addTableSecurity = function(serverName, tableName, canRead, canInsert, canUpdate, canDelete, tracking) {
		/** @type {QBSelect<db:/svy_framework/sec_table>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_table");
		query.result.addPk();
		query.where.add(query.columns.server_name.eq(serverName));
		query.where.add(query.columns.table_name.eq(tableName));
		query.where.add(query.columns.security_key_id.eq(this.keyId.toString()));
		
		var fs = databaseManager.getFoundSet(query);
		
		/** @type {JSRecord<db:/svy_framework/sec_table>} */
		var secTableRecord;
		if (!utils.hasRecords(fs)) {
			secTableRecord = fs.getRecord(fs.newRecord());
			secTableRecord.server_name = serverName;
			secTableRecord.table_name = tableName;
			secTableRecord.security_key_id = this.keyId;
		} else {
			secTableRecord = fs.getRecord(1);
		}
		secTableRecord.flag_read = canRead ? 1 : 0; 
		secTableRecord.flag_insert = canInsert ? 1 : 0; 
		secTableRecord.flag_update = canUpdate ? 1 : 0; 
		secTableRecord.flag_delete = canDelete ? 1 : 0; 
		secTableRecord.flag_tracking = tracking ? 1 : 0; 
		return save(secTableRecord);
	}
	
	/**
	 * Adds element security to this key<br>
	 * If an entry for the given element already exists<br>
	 * it will be overwritten by what is provided here
	 * 
	 * @param {String} formName
	 * @param {String} elementName
	 * @param {Boolean} editable
	 * @param {Boolean} visible
	 * 
	 * @this {Key}
	 * 
	 * @return {Boolean} success
	 * 
	 */
	this.addElementSecurity = function(formName, elementName, editable, visible) {
		if (!formName || !elementName) {
			return false;
		}
		
		var formElementsUUIDDataSet = security.getElementUUIDs(formName);
		if (!formElementsUUIDDataSet || formElementsUUIDDataSet.getMaxRowIndex() == 0) {
			return false;
		}
		
		var elementUUID;
		for (var i = 1; i <= formElementsUUIDDataSet.getMaxRowIndex(); i++) {
			var rowData = formElementsUUIDDataSet.getRowAsArray(i);
			if (rowData[0] == elementName) {
				elementUUID = rowData[1];
				break;
			}
		}
		if (!elementUUID) {
			return false;
		}
		
		/** @type {QBSelect<db:/svy_framework/sec_element>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_element");
		query.result.addPk();
		query.where.add(query.columns.form_name.eq(formName));
		query.where.add(query.columns.element_name.eq(elementName));
		query.where.add(query.columns.security_key_id.eq(this.keyId.toString()));
		
		var fs = databaseManager.getFoundSet(query);
		
		/** @type {JSRecord<db:/svy_framework/sec_element>} */
		var secElementRecord;
		if (!utils.hasRecords(fs)) {
			secElementRecord = fs.getRecord(fs.newRecord());
			secElementRecord.security_key_id = this.keyId;
			secElementRecord.form_name = formName;
			secElementRecord.servoy_form_id = formName;			
			secElementRecord.element_name = elementName;
		} else {
			secElementRecord = fs.getRecord(1);
		}
		secElementRecord.flag_editable = editable ? 1 : 0; 
		secElementRecord.flag_visible = visible ? 1 : 0; 
		return save(secElementRecord);
	}
	
	Object.defineProperty(this, "keyId", {
        get: function () {
            return $keyId;
        }
    });
	
	Object.defineProperty(this, "name", {
        set: function (x) {
        	var record = getKeyRecord();
        	if (record) {
        		record.name = x;
                save(record);
                $name = x;
        	}
        },
        get: function () {
            return $name;
        }
    });
	
	Object.defineProperty(this, "description", {
        set: function (x) {
        	var record = getKeyRecord();
        	if (record) {
	        	record.description = x;
	            save(record);
	            $description = x;	            
        	}
        },
        get: function () {
            return $description;
        }
    });
	
	Object.defineProperty(this, "ownerId", {
        set: function (x) {
        	var record = getKeyRecord();
        	if (record) {
        		record.owner_id = x;
                save(record);
                $ownerId = x;                
        	}
        },
        get: function () {
        	return $ownerId;
        }
    });	
	
	Object.defineProperty(this, "moduleId", {
        set: function (x) {
        	var record = getKeyRecord();
        	if (record) {
        		record.module_id = x;
                save(record);
                $moduleId = x;                
        	}
        },
        get: function () {
        	return $moduleId;
        }
    });		
	
	Object.defineProperty(this, "owner", {
        set: function (x) {
        	/** @type {Owner} */
        	var givenOwner = x;
        	var record = getKeyRecord();
        	if (record) {
        		record.owner_id = givenOwner.ownerId;
                save(record);
                $ownerId = givenOwner.ownerId;                
        	}
        },
        get: function () {
        	if (!$ownerId || $ownerId.toString() == "00000000-0000-0000-0000-000000000000") {
        		return null;
        	}
        	return getOwnerById($ownerId);
        }
    });		
	
	Object.defineProperty(this, "module", {
        set: function (x) {
        	/** @type {Module} */
        	var givenModule = x;
        	var record = getKeyRecord();
        	if (record) {
        		record.module_id = givenModule.id;
                save(record);
                $moduleId = givenModule.id;                
        	}
        },
        get: function () {
        	if (!$moduleId || $moduleId.toString() == "00000000-0000-0000-0000-000000000000") {
        		return null;
        	}
            return getModuleByID($moduleId);
        }
    });	
	
	/**
	 * Loads the actual record
	 * @private
	 * @return {JSRecord<db:/svy_framework/sec_security_key>}
	 */
	function getKeyRecord() {
		application.output("getKeyRecord called")
		/** @type {JSFoundSet<db:/svy_framework/sec_security_key>} */
		var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_security_key");
		fs.loadRecords($keyId);
		if (utils.hasRecords(fs)) {
			return fs.getSelectedRecord();
		} else {
			return null;
		}
	}
	
	Object.defineProperties(this, {
		"getGroups": {
			enumerable: false
		},
		"addTableSecurity": {
			enumerable: false
		},
		"addElementSecurity": {
			enumerable: false
		}
	});
	
	Object.seal(this);
}

/**
 * A login attempt from a user
 * 
 * @param {JSRecord<db:/svy_framework/sec_user_login_attempt>} userLoginAttempt
 * 
 * @constructor 
 * @private
 * 
 * @author patrick
 * @since 2012-10-23
 *
 * @properties={typeid:24,uuid:"126E7F79-9F86-486F-8CDD-6B07012B305A"}
 */
function UserLogin(userLoginAttempt) {
	if (!userLoginAttempt || !(userLoginAttempt instanceof JSRecord) || databaseManager.getDataSourceTableName(userLoginAttempt.getDataSource()).toLowerCase() != "sec_user_login_attempt") {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("UserLogin requires a sec_user_login_attempt record");
	}
	
	/**
	 * The JSRecord of this login
	 * 
	 * @type {JSRecord<db:/svy_framework/sec_user_login_attempt>}
	 */
	var record = userLoginAttempt;
	
	/**
	 * The ID of this login
	 * 
	 * @type {UUID}
	 */
	this.loginId = record.sec_user_login_attempt_id;
	
	/**
	 * The user ID of this login
	 * 
	 * @type {UUID}
	 */
	this.userId = record.user_id;
	
	/**
	 * The datetime the user logged in
	 * 
	 * @type {Date}
	 */
	this.login = record.attempt_datetime;
	
	/**
	 * The datetime the user logged out
	 * 
	 * @type {Date}
	 */
	this.logout = record.logout_datetime;
	
	/**
	 * If <code>true</code>, the login was successfuly
	 * 
	 * @type {Boolean}
	 */
	this.loginSuccessful = record.is_successful ? true : false;
	
	/**
	 * The reason why the login failed
	 * 
	 * @type {String}
	 */
	this.reasonUnsuccesful = record.reason_unsuccessful;
	
	Object.freeze(this);
	
}

/**
 * An organization
 * 
 * @param {JSRecord<db:/svy_framework/sec_organization>} organizationRecord
 * 
 * @constructor 
 * 
 * @private
 * 
 * @author patrick
 * @since 01.08.2012 
 * 
 * @properties={typeid:24,uuid:"5CCED2CB-57D4-4BA4-9839-794C404BA9C1"}
 */
function Organization(organizationRecord) {
	if (!organizationRecord || !(organizationRecord instanceof JSRecord) || databaseManager.getDataSourceTableName(organizationRecord.getDataSource()).toLowerCase() != "sec_organization") {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Organization constructor requires a sec_organization record");
	}
	
	/**
	 * The ID of this organization
	 * 
	 * @type {UUID}
	 */
	this.orgId = organizationRecord.organization_id;	
	
	/**
	 * Gets / Sets the name of this organization
	 * 
	 * @return {String} name
	 * 
	 * @throws {scopes.modUtils$data.ValueNotUniqueException} the name of the organization has to be unique for a given owner
	 */
	this.name = organizationRecord.name;
	
	/**
	 * Returns the Owner of this organization
	 * 
	 * @return {Owner}
	 */
	this.getOwner = function() {
		if (utils.hasRecords(organizationRecord.sec_organization_to_sec_owner)) {
			return new Owner(organizationRecord.sec_organization_to_sec_owner.getRecord(1));
		} else {
			return null;
		}
	}
	
	/**
	 * Returns all users of this organization
	 * 
	 * @return {Array<User>}
	 */
	this.getUsers = function() {
		/** @type {Array<User>} */
		var result = new Array();
		/** @type {QBSelect<db:/svy_framework/sec_user>} */
		var userQuery = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user");
		userQuery.result.addPk();
		/** @type {QBJoin<db:/svy_framework/sec_user_org>} */
		var userOrgJoin = userQuery.joins.add("db:/" + globals.nav_db_framework + "/sec_user_org", JSRelation.INNER_JOIN);
		userOrgJoin.on.add(userQuery.columns.user_id.eq(userOrgJoin.columns.user_id));
		userQuery.where.add(userOrgJoin.columns.organization_id.eq(this.orgId));
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var userFs = databaseManager.getFoundSet(userQuery);
		if (utils.hasRecords(userFs)) {
			for (var i = 1; i <= userFs.getSize(); i++) {
				var userRecord = userFs.getRecord(i);
				result.push(new User(userRecord));
			}
		}
		return result;
	}
	
	/**
	 * Adds a user to this organization
	 * 
	 * @param {User} userToAdd
	 * 
	 * @return {boolean} success
	 */
	this.addUser = function(userToAdd) {
		/** @type {JSFoundSet<db:/svy_framework/sec_organization>} */
		var fs = organizationRecord.foundset;
		return fs.addUser(userToAdd.userId, organizationRecord);
	}
	
	/**
	 * Removes the given user from this organization
	 * 
	 * @param {User} userToRemove
	 * 
	 * @return {boolean} success
	 */
	this.removeUser = function(userToRemove) {
		/** @type {JSFoundSet<db:/svy_framework/sec_organization>} */
		var fs = organizationRecord.foundset;
		return fs.removeUser(userToRemove.userId, organizationRecord);
	}
	
	Object.defineProperty(this, "name", {
        set: function (x) {
        	if (!scopes.modUtils.isValueUnique(organizationRecord, "name", x, ["owner_id"], [organizationRecord.owner_id.toString()])) {
        		throw new scopes.modUtils$data.ValueNotUniqueException(null, organizationRecord, "name", x);
        	}
        	organizationRecord.name = x;
            save(organizationRecord);
        },
        get: function () {
            return organizationRecord.name;
        }
    });	
	
	Object.defineProperty(this, "orgId", {
        get: function () {
            return organizationRecord.organization_id;
        }
    });
	
	Object.defineProperties(this, {
		"getOwner": {
			enumerable: false
		},
		"getUsers": {
			enumerable: false
		},
		"addUser": {
			enumerable: false
		},
		"removeUser": {
			enumerable: false
		}
	});
	
	Object.seal(this);
}

/**
 * @param {JSRecord<db:/svy_framework/sec_owner>} ownerRecord
 * 
 * @constructor 
 * 
 * @author patrick
 * @since 01.08.2012
 * 
 * @private 
 *
 * @properties={typeid:24,uuid:"23E6F372-7564-4F60-A4F1-AFFC10763CDB"}
 */
function Owner(ownerRecord) {
	if (!ownerRecord || !(ownerRecord instanceof JSRecord) || databaseManager.getDataSourceTableName(ownerRecord.getDataSource()).toLowerCase() != "sec_owner") {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Owner constructor requires a sec_owner record");
	}
	
	/**
	 * The ID of this owner
	 */
	this.ownerId = ownerRecord.owner_id;
	
	/** 
	 * All password related property settings
	 * @type {Array<scopes.svyProperties.RuntimeProperty>}
	 */
	var passwordProperties;
	
	/**
	 * Gets the name of this owner
	 * @return {String} name
	 */
	this.name = ownerRecord.name;
	
	/**
	 * The database name used by this owner
	 * @type {String}
	 */
	this.databaseName = ownerRecord.database_name;
	
	/**
	 * Gets the filter field name
	 * @type {String}
	 */
	this.filterFieldName = ownerRecord.filter_field_organization;
	
	/**
	 * The company name of this owner
	 * @type {String}
	 */
	this.companyName = ownerRecord.company_name;
	
	/**
	 * The number of licenses of this owner
	 * @type {Number}
	 */
	this.numberOfLicenses = ownerRecord.license_amount;
	
	/**
	 * The minimum password length for this owner
	 * @type {Number}
	 */
	this.passwordMinimumLength = 0;
	
	/**
	 * The maximum password length for this owner
	 * @type {Number}
	 */
	this.passwordMaximumLength = null;
	
	/**
	 * The number of days a password is valid before it has to be changed
	 * @type {Number}
	 */
	this.passwordValidity = 0;
	
	/**
	 * If true, the password must contain letters and numbers
	 * @type {Boolean}
	 */
	this.passwordMustContainNumbersAndLetters = false;
	
	/**
	 * If true, the password may not start with the same 3 letters as the user name
	 * @type {Boolean}
	 */
	this.passwordMustNotStartWithUserName = false;
	
	/**
	 * Number of maximum login attempts before a user is locked
	 * @type {Number}
	 */
	this.maximumNumberOfLoginAttempts = 0;
	
	/**
	 * Number of unique passwords before the same password can be reused
	 * @type {Number}
	 */
	this.passwordNumberUniqueBeforeReuse = 0;
	
	/**
	 * The date the account was registered
	 * @type {Date}
	 */
	this.registrationDate = ownerRecord.registration_date;
	
	/**
	 * The date the account was activated
	 * @type {Date}
	 */
	this.activationDate = ownerRecord.activation_date;
	
	/**
	 * Returns all organizations of this owner as an array
	 * 
	 * @return {Array<Organization>} organizations
	 */
	this.getOrganizations = function() {
		/** @type {Array<Organization>} */
		var result = new Array();
		if (utils.hasRecords(ownerRecord.sec_owner_to_sec_organization)) {
			/** @type {JSFoundSet<db://>} */
			for (var i = 1; i <= ownerRecord.sec_owner_to_sec_organization.getSize(); i++) {
				var organizationRecord = ownerRecord.sec_owner_to_sec_organization.getRecord(i);
				result.push(new Organization(organizationRecord));
			}
		}
		return result;
	}
	
	/**
	 * Gets an array of users in this company
	 * @return {Array<User>}
	 */
	this.getUsers = function(){
		var result = [];
		for(var i = 1; i <= ownerRecord.sec_owner_to_sec_user.getSize(); i++){
			result.push(new User(ownerRecord.sec_owner_to_sec_user.getRecord(i)));
		}
		return result;
	}
	
	/**
	 * Creates a new organization for this owner
	 * and returns an Organization object
	 * 
	 * @param {String} organizationName
	 * 
	 * @return {Organization} newOrganization
	 */
	this.createOrganization = function(organizationName) {
		/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */
		var fs = ownerRecord.foundset;
		var orgRecord = fs.createOrganization(organizationName, ownerRecord);
		if (orgRecord) {
			return new Organization(orgRecord);
		} else {
			return null;
		}
	}
	/**
	 * @param {String} userName
	 * @param {String} [password]
	 * @param {Organization} [organization]
	 * @this {Owner}
	 */
	this.createUser = function(userName, password, organization){
		return createUser(userName,password,this,organization);
	}
	
	/**
	 * Deletes the given organization and related data
	 * 
	 * @param {Organization} organization
	 * 
	 * @return {Boolean} success
	 */
	this.deleteOrganization = function(organization) {
		/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */
		var fs = ownerRecord.foundset;
		return fs.deleteOrganization(organization.orgId, ownerRecord);
	}
	
	/**
	 * Returns all modules of this owner
	 * 
	 * @return {Array<Module>}
	 */
	this.getModules = function() {
		/** @type {Array<Module>} */
		var result = new Array();
		var fs = ownerRecord.sec_owner_to_sec_owner_in_module;
		for (var i = 1; i <= fs.getSize(); i++) {
			var moduleRecord = fs.getRecord(i);
			if (utils.hasRecords(moduleRecord.sec_owner_in_module_to_sec_module)) {
				result.push(new Module(moduleRecord.sec_owner_in_module_to_sec_module.getRecord(1)));
			}
		}
		return result;
	}
	
	/**
	 * Returns all owner modules of this owner
	 * 
	 * @return {Array<OwnerModule>}
	 */
	this.getOwnerModules = function() {
		/** @type {Array<OwnerModule>} */
		var result = new Array();
		var fs = ownerRecord.sec_owner_to_sec_owner_in_module;
		for (var i = 1; i <= fs.getSize(); i++) {
			result.push(new OwnerModule(fs.getRecord(i)));
		}
		return result;
	}
	
	/**
	 * Returns all active modules of this owner
	 * 
	 * @return {Array<Module>}
	 */
	this.getActiveModules = function() {
		/** @type {Array<Module>} */
		var result = new Array();
		var fs = ownerRecord.sec_owner_to_sec_owner_in_module$active;
		for (var i = 1; i <= fs.getSize(); i++) {
			var moduleRecord = fs.getRecord(i);
			if (utils.hasRecords(moduleRecord.sec_owner_in_module_to_sec_module)) {
				result.push(new Module(moduleRecord.sec_owner_in_module_to_sec_module.getRecord(1)));
			}
		}
		return result;
	}
	
	/**
	 * Adds a module to this owner
	 * 
	 * @param {Module} module the module to add
	 * @param {Date} startDate the date from which this module is active
	 * @param {Date} [endDate] optional date until this module is active
	 * 
	 * @return {OwnerModule} ownerModule
	 */
	this.addModule = function(module, startDate, endDate) {
		var fs = ownerRecord.sec_owner_to_sec_owner_in_module;
		var ownerInModuleRecord;
		for (var i = 1; i <= fs.getSize(); i++) {
			ownerInModuleRecord = fs.getRecord(i);
			if (ownerInModuleRecord.module_id == module.id) {
				return new OwnerModule(ownerInModuleRecord);
			}
		}
		ownerInModuleRecord = fs.getRecord(fs.newRecord());
		ownerInModuleRecord.module_id = module.id;
		ownerInModuleRecord.start_date = startDate;
		if (endDate && endDate > startDate) {
			ownerInModuleRecord.end_date = endDate;
		}
		
		return new OwnerModule(ownerInModuleRecord);
	}
	
	/**
	 * Returns true if the owner has the given Module or the module with the given name
	 * 
	 * @param {String|Module} module
	 * 
	 * @return {Boolean} hasModule
	 */
	this.hasModule = function(module) {
		var moduleId;
		if (module instanceof Module) {
			moduleId = module.id;
		} else if (module instanceof String) {
			var moduleObj = getModule(module);
			if (!moduleObj) {
				return false;
			}
			moduleId = moduleObj.id;
		}
		var fs = ownerRecord.sec_owner_to_sec_owner_in_module;
		for (var i = 1; i <= fs.getSize(); i++) {
			var ownerInModuleRecord = fs.getRecord(i);
			if (ownerInModuleRecord.module_id == moduleId) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Removes the given module from this owner
	 * 
	 * @param {Module|OwnerModule} moduleToRemove the module or ownerModule to remove
	 * 
	 * @return {Boolean} success
	 */
	this.removeModule = function(moduleToRemove) {
		if (!moduleToRemove || !(moduleToRemove instanceof Module || moduleToRemove instanceof OwnerModule)) {
			return false;
		}
		var moduleId;
		if (moduleToRemove instanceof Module) {
			/** @type {Module} */
			var moduleObj = moduleToRemove;
			moduleId = moduleObj.id;
		} else {
			/** @type {OwnerModule} */
			var ownerModuleObj = moduleToRemove;
			moduleId = ownerModuleObj.moduleId;
		}
		var fs = ownerRecord.sec_owner_to_sec_owner_in_module;
		var ownerInModuleRecord;
		for (var i = 1; i <= fs.getSize(); i++) {
			ownerInModuleRecord = fs.getRecord(i);
			if (ownerInModuleRecord.module_id == moduleId) {
				fs.deleteRecord(ownerInModuleRecord);
				databaseManager.saveData(fs);
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Returns the value of the given property
	 * @param {String} propertyName
	 * @return {Object} value
	 */
	function getPasswordProperty(propertyName) {
		if (!passwordProperties) {
			var passwordPropertyNames = ["password_minimum_length", "password_maxmimum_length", "password_numbers_and_letters", "password_must_not_start_with_user_name", "password_renewal_interval", "password_number_unique_before_reuse", "password_input_interval", "password_lock_user_after_number_of_attempts", "password_timespan_before_lock"];
			passwordProperties = scopes.svyProperties.getRuntimeProperties(ADMIN_LEVEL.TENANT_MANAGER, passwordPropertyNames, ownerRecord.owner_id);
		}
		function filterProperties(x) {
			if (x.propertyName == propertyName) {
				return true;
			} else {
				return false;
			}
		}
		var result = passwordProperties.filter(filterProperties);
		if (result && result.length == 1) {
			return result[0].value;
		} else {
			return null;
		}
	}
	
	/**
	 * Sets the given property value with the newSetting value
	 * @param {String} propertyName
	 * @param {Object} newSetting
	 */
	function setPasswordPropertyValue(propertyName, newSetting) {
		scopes.svyProperties.setPropertyValue(propertyName, newSetting, ADMIN_LEVEL.TENANT_MANAGER, ownerRecord.owner_id, ownerRecord.owner_id);
	}
	
	Object.defineProperty(this, "name", {
        set: function (x) {
        	ownerRecord.name = x;
            save(ownerRecord);
        },
        get: function () {
            return ownerRecord.name;
        }
    });	
	
	Object.defineProperty(this, "ownerId", {
        get: function () {
            return ownerRecord.owner_id;
        }
    });		
	
	Object.defineProperty(this, "filterFieldName", {
        get: function () {
        	if (!ownerRecord.filter_field_organization) {
        		return "organization_id";
        	} else {
        		return ownerRecord.filter_field_organization;
        	}
        },
		set: function(fieldName) {
			ownerRecord.filter_field_organization = fieldName;
			save(ownerRecord);
		}
    });		
	
	Object.defineProperty(this, "passwordMinimumLength", {
        get: function () {
            return getPasswordProperty("password_minimum_length");
        },
		set: function(length) {
			setPasswordPropertyValue("password_minimum_length", length);
		}
    });		
	
	Object.defineProperty(this, "passwordMaximumLength", {
        get: function () {
            return getPasswordProperty("password_maxmimum_length");
        },
		set: function(length) {
			setPasswordPropertyValue("password_maxmimum_length", length);
		}
    });		
	
	Object.defineProperty(this, "passwordValidity", {
        get: function () {
        	return getPasswordProperty("password_renewal_interval");
        },
		set: function(days) {
			setPasswordPropertyValue("password_renewal_interval", days);
		}
    });			
	
	Object.defineProperty(this, "passwordNumberUniqueBeforeReuse", {
        get: function () {
        	return getPasswordProperty("password_number_unique_before_reuse");
        },
		set: function(times) {
			setPasswordPropertyValue("password_number_unique_before_reuse", times);
		}
    });			
	
	Object.defineProperty(this, "passwordMustContainNumbersAndLetters", {
        get: function () {
        	return getPasswordProperty("password_numbers_and_letters") ? true : false;
        },
		set: function(value) {
			setPasswordPropertyValue("password_numbers_and_letters", value ? 1 :0);
		}
    });				
	
	Object.defineProperty(this, "passwordMustNotStartWithUserName", {
        get: function () {
        	return getPasswordProperty("password_must_not_start_with_user_name") ? true : false;
        },
		set: function(value) {
			setPasswordPropertyValue("password_must_not_start_with_user_name", value ? 1 :0);
		}
    });
	
	Object.defineProperty(this, "maximumNumberOfLoginAttempts", {
        get: function () {
        	return getPasswordProperty("password_lock_user_after_number_of_attempts");
        },
		set: function(value) {
			if (value >= 0) {
				setPasswordPropertyValue("password_lock_user_after_number_of_attempts", value);
			}
		}
    });		
	
	Object.defineProperty(this, "companyName", {
        get: function () {
            return ownerRecord.company_name;
        },
		set: function(value) {
			ownerRecord.company_name = value;
			save(ownerRecord);
		}
    });	
	
	Object.defineProperty(this, "databaseName", {
        get: function () {
            return ownerRecord.database_name;
        },
		set: function(value) {
			ownerRecord.database_name = value;
			save(ownerRecord);
		}
    });	
	
	Object.defineProperty(this, "numberOfLicenses", {
        get: function () {
            return ownerRecord.license_amount;
        },
		set: function(value) {
			if (value >= 0) {
				ownerRecord.license_amount = value;
				save(ownerRecord);
			}
		}
    });	
	
	Object.defineProperty(this, "registrationDate", {
        get: function () {
            return ownerRecord.registration_date;
        },
		set: function(value) {
			if (value instanceof Date) {
				ownerRecord.registration_date = value;
				save(ownerRecord);
			}
		}
    });	
	
	Object.defineProperty(this, "activationDate", {
        get: function () {
            return ownerRecord.activation_date;
        },
		set: function(value) {
			if (value instanceof Date) {
				ownerRecord.activation_date = value;
				save(ownerRecord);
			}
		}
    });	
	
	Object.defineProperties(this, {
		"getOrganizations": {
			enumerable: false
		},
		"createOrganization": {
			enumerable: false
		},
		"deleteOrganization": {
			enumerable: false
		},
		"getModules": {
			enumerable: false
		},
		"getUsers": {
			enumerable: false
		},
		"createUser": {
			enumerable: false
		}
	});
	Object.seal(this);	
}

/**
 * Wrapper class for db:/svy_framework/sec_owner_in_module record
 * 
 * @param {JSRecord<db:/svy_framework/sec_owner_in_module>} ownerInModuleRecord
 * 
 * @constructor 
 * @private 
 *
 * @properties={typeid:24,uuid:"DCCBC9E3-1683-413A-BA6D-08D4DD1D393B"}
 */
function OwnerModule(ownerInModuleRecord) {
	if (!ownerInModuleRecord || !(ownerInModuleRecord instanceof JSRecord) || databaseManager.getDataSourceTableName(ownerInModuleRecord.getDataSource()).toLowerCase() != "sec_owner_in_module") {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("OwnerModule constructor requires a sec_owner_in_module record");
	}
	
	/**
	 * The ownerModule ID
	 * @type {UUID}
	 */
	this.id = ownerInModuleRecord.owner_in_module_id;
	
	/**
	 * The module ID
	 * @type {UUID}
	 */
	this.moduleId = ownerInModuleRecord.module_id;
	
	/**
	 * The owner ID
	 * @type {UUID}
	 */
	this.ownerId = ownerInModuleRecord.owner_id;
	
	/**
	 * The start date after which this module is valid for the owner
	 * @type {Date}
	 */
	this.startDate = ownerInModuleRecord.start_date;
	
	/**
	 * The end date until this module is valid for the owner
	 * @type {Date}
	 */
	this.endDate = ownerInModuleRecord.end_date;	
	
	/**
	 * Returns true if this Module is active
	 * @return {Boolean} isActive
	 */
	this.isActive = function() {
		var today = new Date();
		if (ownerInModuleRecord.start_date && ownerInModuleRecord.start_date > today) {
			return false;
		}
		if (ownerInModuleRecord.end_date && ownerInModuleRecord.end_date <= today) {
			return false;
		}
		return true;
	}
	
	/**
	 * Returns the Module object
	 * @return {Module} module
	 */
	this.getModule = function() {
		if (utils.hasRecords(ownerInModuleRecord.sec_owner_in_module_to_sec_module)) {
			return new Module(ownerInModuleRecord.sec_owner_in_module_to_sec_module.getRecord(1));
		} else {
			return null;
		}
	}
	
	/**
	 * Returns the Owner object
	 * @return {Owner} owner
	 */
	this.getOwner = function() {
		if (utils.hasRecords(ownerInModuleRecord.sec_owner_in_module_to_sec_owner)) {
			return new Owner(ownerInModuleRecord.sec_owner_in_module_to_sec_owner.getRecord(1));
		} else {
			return null;
		}
	}
	
	/**
	 * Returns the security key associated with this Module
	 * 
	 * @return {Key}
	 */
	this.getKey = function() {
		if (utils.hasRecords(ownerInModuleRecord.sec_owner_in_module_to_sec_security_key$not_system)) {
			var keyRecord = ownerInModuleRecord.sec_owner_in_module_to_sec_security_key$not_system.getRecord(1);
			return new Key(keyRecord.security_key_id, keyRecord.name, keyRecord.description, keyRecord.owner_id, keyRecord.module_id);
		} else {
			return null;
		}
	}
	
	Object.defineProperty(this, 'id', {
		get: function() {
			return ownerInModuleRecord.owner_in_module_id;
		}
	});
	
	Object.defineProperty(this, 'moduleId', {
		get: function() {
			return ownerInModuleRecord.module_id;
		}
	});	
	
	Object.defineProperty(this, 'ownerId', {
		get: function() {
			return ownerInModuleRecord.owner_id;
		}
	});	
	
	Object.defineProperty(this, 'startDate', {
		get: function() {
			return ownerInModuleRecord.start_date;
		},
		set: function(x) {
			if (x && x instanceof Date && (ownerInModuleRecord.end_date && x >= ownerInModuleRecord.end_date)) {
				return;
			} else if (x && x instanceof Date) {
				ownerInModuleRecord.start_date = x;
				databaseManager.saveData(ownerInModuleRecord);
			}
		}
	});		
	
	Object.defineProperty(this, 'endDate', {
		get: function() {
			return ownerInModuleRecord.end_date;
		},
		set: function(x) {
			if (x && !(x >= ownerInModuleRecord.start_date)) {
				return;
			}
			ownerInModuleRecord.end_date = x;
			databaseManager.saveData(ownerInModuleRecord);
		}
	});
	
	Object.seal(this);
}

/**
 * Wrapper class for db:/svy_framework/sec_module record
 * 
 * @param {JSRecord<db:/svy_framework/sec_module>} moduleRecord
 * 
 * @constructor 
 * @private
 * 
 * @properties={typeid:24,uuid:"C1138192-FBC2-4F1D-A7BF-8D4B13F3379B"}
 */
function Module(moduleRecord){
	if (!moduleRecord || !(moduleRecord instanceof JSRecord) || databaseManager.getDataSourceTableName(moduleRecord.getDataSource()).toLowerCase() != "sec_module") {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Module constructor requires a sec_module record");
	}
	
	/**
	 * The module PK ID
	 * @type {UUID}
	 */
	this.id = moduleRecord.module_id;
	
	Object.defineProperty(this, 'id', {
		get: function() {
			return moduleRecord.module_id;
		}
	});
	
	/**
	 * The name of the module. Must be unique.
	 * @type {String}
	 */
	this.name = moduleRecord.name;
	
	Object.defineProperty(this, 'name', {
		get: function() {
			return moduleRecord.name
		},
		set: function(x) {
			if (!x) {
				throw new scopes.modUtils$exceptions.IllegalArgumentException('Name is required');
			}
			if (!scopes.modUtils.isValueUnique(moduleRecord, 'name', x)) {
				throw new scopes.modUtils$data.ValueNotUniqueException(null, moduleRecord, 'name', x);
			}
			moduleRecord.name = x;
			save(moduleRecord);
		}
	});
	
	/**
	 * Description of the module
	 * @type {String}
	 */
	this.description = moduleRecord.description;
	
	Object.defineProperty(this, 'description', {
		get: function() {
			return moduleRecord.description
		},
		set: function(x) {
			moduleRecord.description = x;
			save(moduleRecord);
		}
	});
	
	/**
	 * Returns all owner who have been assigned to this module
	 * 
	 * @return {Array<Owner>}
	 */
	this.getOwners = function() {
		/** @type {Array<Owner>} */
		var result = new Array();
		var fs = moduleRecord.sec_module_to_sec_owner_in_module;
		for (var i = 1; i <= fs.getSize(); i++) {
			var ownerInModuleRecord = fs.getRecord(i);
			if (utils.hasRecords(ownerInModuleRecord.sec_owner_in_module_to_sec_owner)) {
				result.push(new Owner(ownerInModuleRecord.sec_owner_in_module_to_sec_owner.getRecord(1)));
			}
		}
		return result;
	}
	
	/**
	 * Adds an owner to this module
	 * 
	 * @param {Owner} owner the owner to add
	 * @param {Date} startDate the date from which this module is active
	 * @param {Date} [endDate] optional date until this module is active
	 * 
	 * @return {OwnerModule} ownerModule
	 */
	this.addOwner = function(owner, startDate, endDate) {
		if (!owner || !(owner instanceof Owner) || !startDate) {
			return null;
		}
		var fs = moduleRecord.sec_module_to_sec_owner_in_module;
		var ownerInModuleRecord;
		for (var i = 1; i <= fs.getSize(); i++) {
			ownerInModuleRecord = fs.getRecord(i);
			if (ownerInModuleRecord.owner_id == owner.ownerId) {
				return new OwnerModule(ownerInModuleRecord);
			}
		}
		ownerInModuleRecord = fs.getRecord(fs.newRecord());
		ownerInModuleRecord.owner_id = owner.ownerId;
		ownerInModuleRecord.start_date = startDate;
		if (endDate && endDate > startDate) {
			ownerInModuleRecord.end_date = endDate;
		}
		databaseManager.saveData(ownerInModuleRecord);
		return new OwnerModule(ownerInModuleRecord);
	}
	
	/**
	 * Removes the given owner from this module
	 * 
	 * @param {Owner} ownerToRemove the owner to remove
	 * 
	 * @return {Boolean} success
	 */
	this.removeOwner = function(ownerToRemove) {
		if (!ownerToRemove || !(ownerToRemove instanceof Owner)) {
			return false;
		}
		var fs = moduleRecord.sec_module_to_sec_owner_in_module;
		var ownerInModuleRecord;
		for (var i = 1; i <= fs.getSize(); i++) {
			ownerInModuleRecord = fs.getRecord(i);
			if (ownerInModuleRecord.module_id == ownerToRemove.ownerId) {
				fs.deleteRecord(ownerInModuleRecord);
				databaseManager.saveData(fs);
				return true;
			}
		}
		return false;
	}
	
	Object.seal(this);
}

/**
 * Application wrapper class for db:/svy_framework/prov_application
 * Basic container of modules
 * 
 * @param {JSRecord<db:/svy_framework/prov_application>} applicationRecord
 * 
 * @constructor 
 * @private
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"E68458CB-E38A-4039-AE02-6117088D5AA4"}
 */
function Application(applicationRecord){
	if (!applicationRecord) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("prov_application record is required");
	}
	
	/**
	 * The application ID
	 * @type {UUID}
	 */
	this.id = applicationRecord.application_id;
	Object.defineProperty(this, 'id', {
			get: function() {
				return applicationRecord.application_id
			}
		});
	
	/**
	 * The name of the application. Must be unique in database
	 * @type {String}
	 */
	this.name = applicationRecord.application_name;
	Object.defineProperty(this, 'name', {
			get: function() {
				return applicationRecord.application_name;
			},
			set: function(x) {
				if (!x) {
					throw new scopes.modUtils$exceptions.IllegalArgumentException('Name is required');
				}
				if (!scopes.modUtils.isValueUnique(applicationRecord, 'application_name', x)) {
					throw new scopes.modUtils$data.ValueNotUniqueException(null, applicationRecord, 'application_name', x);
				}
				applicationRecord.application_name = x;
				save(applicationRecord);
			}
		});
	
	/**
	 * The name of the corresponding servoy solution
	 * @type {String}
	 */
	this.servoySolutionName = applicationRecord.servoy_solution_name;
	Object.defineProperty(this, 'servoySolutionName', {
			get: function() {
				return applicationRecord.servoy_solution_name;
			},
			set: function(x) {
				if (!x) {
					throw new scopes.modUtils$exceptions.IllegalArgumentException('solution name is required');
				}
				applicationRecord.servoy_solution_name = x;
				save(applicationRecord);
			}
	});
	
	/**
	 * Gets the deeplink URL for the web client
	 * @return {String}
	 */
	this.getDeepLinkWebClient = function(){
		return scopes.modUtils$system.getSolutionDeepLinkSmartClient(applicationRecord.servoy_solution_name);
	}
	
	/**
	 * Gets the deep link URL for the smart client
	 * @return {String}
	 */
	this.getDeepLinkSmartClient = function(){
		return scopes.modUtils$system.getSolutionDeepLinkSmartClient(applicationRecord.servoy_solution_name);
	}
	
	/**
	 * Links a module to this application
	 * @param {UUID|String} moduleID
	 */
	this.addModule = function(moduleID){
		if (!moduleID) {
			throw new scopes.modUtils$exceptions.IllegalArgumentException('Module cannot be null');
		}
		if (moduleID instanceof String) {
			moduleID = application.getUUID(moduleID);
		}
		if (this.containsModule(moduleID)) {
			return false;
		}
		if (!applicationRecord.prov_application_to_prov_application_modules.newRecord()) {
			throw new scopes.modUtils$data.NewRecordFailedException('Failed to create record', applicationRecord.prov_application_to_prov_application_modules);
		}
		applicationRecord.prov_application_to_prov_application_modules.module_id = moduleID;
		save(applicationRecord.prov_application_to_prov_application_modules);
		return true;
	}
	
	/**
	 * Test if a module is added to this application
	 * @param {UUID|String} moduleID
	 * @return {Boolean}
	 */
	this.containsModule = function(moduleID){
		if (!moduleID) {
			throw new scopes.modUtils$exceptions.IllegalArgumentException('Module ID cannot be null');
		}
		if (moduleID instanceof String) {
			moduleID = application.getUUID(moduleID);
		}
		for (var i = 1; i <= applicationRecord.prov_application_to_prov_application_modules.getSize(); i++) {
			var link = applicationRecord.prov_application_to_prov_application_modules.getRecord(i);
			if (link.module_id == moduleID) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Removes the specified module from this application
	 * @param {JSRecord<db:/svy_framework/sec_module>|UUID|String} moduleRecordOrID
	 * @return {Boolean} false if the module never belonged in the first place
	 */
	this.removeModule = function(moduleRecordOrID){
		if (!moduleRecordOrID) {
			throw new scopes.modUtils$exceptions.IllegalArgumentException('Module ID or Record cannot be null');
		}
		if (moduleRecordOrID instanceof JSRecord) {
			moduleRecordOrID = moduleRecordOrID.module_id;
		}
		if (moduleRecordOrID instanceof String) {
			moduleRecordOrID = application.getUUID(moduleRecordOrID);
		}
		var modules = applicationRecord.prov_application_to_prov_application_modules;
		for (var i = 1; i <= modules.getSize(); i++) {
			var module = modules.getRecord(i);
			if (module.module_id == moduleRecordOrID) {
				if (!modules.deleteRecord(module)) {
					throw new scopes.modUtils$data.DeleteRecordFailedException('Failed to delete record', module);
				}
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Returns the modules belonging to this application
	 * @return {Array<Module>}
	 */
	this.getModules = function(){
		var modules = [];
		for(var i = 1; i <= applicationRecord.prov_application_to_prov_application_modules.getSize(); i++){
			var moduleRecord = applicationRecord.prov_application_to_prov_application_modules.getRecord(i);
			if (utils.hasRecords(moduleRecord.prov_application_modules_to_sec_module)) {
				modules.push(new Module(moduleRecord.prov_application_modules_to_sec_module.getRecord(1)));
			}
		}
		return modules;
	}
	
	Object.seal(this);
}

/**
 * @param {JSRecord|JSFoundSet} record
 * @returns {Boolean} success
 * @private
 * @author Sean
 * @properties={typeid:24,uuid:"B4D1DC91-CF15-48AC-8B5D-39047104982F"}
 */
function save(record){
	if (!databaseManager.saveData(record)) {
		throw new scopes.modUtils$data.SaveDataFailedException('Save data failed:' + record.exception, record);
	}
	return true;
}

/**
 * Updates the security hash
 * 
 * @param {JSRecord} [record]
 * @param {String} [serverName]
 * @param {String} [ownerName]
 * 
 * @author patrick
 * @since 2012-10-02
 *
 * @properties={typeid:24,uuid:"ECA13B00-D635-4076-8631-9017686968B1"}
 */
function updateSecurityHash(record, serverName, ownerName) {
	if (!PERFORM_HASH_CHECKS) {
		return;
	}
	if ((!serverName) && record) {
		serverName = databaseManager.getDataSourceServerName(record.foundset.getDataSource());
	} else {
		serverName = globals.nav_db_framework;
	}
	
	/** @type {QBSelect<db:/svy_framework/sec_owner>} */
	var query = databaseManager.createSelect("db:/" + serverName + "/sec_owner");
	query.result.addPk();
	
	if (ownerName) {
		query.where.add(query.columns.name.eq(ownerName));
	} else if (globals.svy_sec_lgn_owner_id) {
		query.where.add(query.columns.owner_id.eq(globals.svy_sec_lgn_owner_id.toString()));
	}
	
	/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */
	var fs = databaseManager.getFoundSet(query);
	
	if (utils.hasRecords(fs)) {
		var ownerRecord = fs.getRecord(1);
		ownerRecord.hash = createHash(serverName);
		save(ownerRecord);
	}
}

/**
 * Verifies the security hash and returns false, if one of <br>
 * the tables has been changed from outside the application.<br>
 * 
 * If <code>PERFORM_HASH_CHECKS</code> is false, this method always returns <code>true</code>
 * 
 * @param {String} ownerName
 * @param {String} [serverName]
 * 
 * @return {Boolean} result
 * 
 * @author patrick
 * @since 2012-10-02
 *
 * @properties={typeid:24,uuid:"565C4A20-BB74-431E-A33C-AA9F0A2C41E9"}
 */
function verifySecurityHash(ownerName, serverName) {
	if (!PERFORM_HASH_CHECKS) {
		return true;
	}
	if (!ownerName) {
		return false;
	}
	if (!serverName) {
		serverName = globals.nav_db_framework;
	}
	
	/** @type {QBSelect<db:/svy_framework/sec_owner>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_owner");
	query.result.addPk();
	query.where.add(query.columns.name.eq(ownerName));
	
	/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */
	var fs = databaseManager.getFoundSet(query);
	if (utils.hasRecords(fs)) {
		var ownerRecord = fs.getRecord(1);
		var hash = createHash(serverName);
		if (ownerRecord.hash == hash) {
			return true;
		}
	}
	return false;
}

/**
 * Filters all tables on owner_id
 * 
 * @properties={typeid:24,uuid:"FCFE99CB-13EF-4C5B-9F87-0059C19FF032"}
 */
function filterOwner() {
	var ownerId = globals.svy_sec_lgn_owner_id;
	
	var database;
	if (globals["svy_nav_getUserDBName"]) {
		database = globals["svy_nav_getUserDBName"]();
		if (database != globals.nav_db_framework) {
			databaseManager.addTableFilterParam(database, null, "owner_id", "=", ownerId, "owner_filter");
		}
	}
	
	// filter navigation tables
	var tables = databaseManager.getTableNames(globals.nav_db_framework);
	tables = tables.filter(
		function (x) {
			var ignoredTables = ["sec_owner", "sec_owner_in_module","sec_security_key", "vlt_valuelistvalues", "vlt_valuetranslations"];
			if (ignoredTables.indexOf(x) > -1) {
				return false;
			}
			var jsTable = databaseManager.getTable(globals.nav_db_framework, x);
			if (jsTable && jsTable.getColumn("owner_id") == null) {
				return false;
			}
			return true;
		}
	);
	
	for (var i = 0; i < tables.length; i++) {
		var success = databaseManager.addTableFilterParam(globals.nav_db_framework, tables[i], "owner_id", "IN", [ownerId, globals.zero_uuid, '-1'], "owner_filter");
		if (!success) {
			application.output("Failed to add owner table filter for table \"" + tables[i] + "\"", LOGGINGLEVEL.ERROR);
		} else {
			application.output("Created owner table filter for table \"" + tables[i] + "\"", LOGGINGLEVEL.DEBUG);
		}
	}
}

/**
 * Filters all tables of the user DB on the relevant organization column
 * 
 * @properties={typeid:24,uuid:"0899F742-38FA-4386-8670-7B9524B79EB8"}
 */
function filterOrganization() {
	var organizationId = globals.svy_sec_lgn_organization_id;
	
	var databaseName, success;
	if (globals["svy_nav_getUserDBName"]) {
		databaseName = globals["svy_nav_getUserDBName"]();
		
		var owner = getOwner();
		if (owner.filterFieldName) {
			databaseManager.removeTableFilterParam(databaseName, "organization_filter");
			success = databaseManager.addTableFilterParam(databaseName, null, owner.filterFieldName, "IN", [organizationId, globals.zero_uuid], "organization_filter")
			if (!success) {
				application.output("Failed to add organization filter for database \"" + databaseName + "\"", LOGGINGLEVEL.ERROR);
			} else {
				application.output("Created organization filter for database \"" + databaseName + "\"", LOGGINGLEVEL.DEBUG);
			}
		}
	}
	
	// filter navigation tables
	var navDatabase = globals.nav_db_framework;
	
	var tablesToFilter = databaseManager.getTableNames(navDatabase);
	
	// filter all tables that have an organization_id column
	function findTablesToFilter(x) {
		if (x == "sec_organization" || x == "sec_user_org") {
			return false;
		}
		var jsTable = databaseManager.getTable(navDatabase, x);
		if (jsTable.getColumnNames().indexOf("organization_id") != -1) {
			return true;
		} else {
			return false;
		}
	}
	
	tablesToFilter = tablesToFilter.filter(findTablesToFilter);
	
	for (var i = 0; i < tablesToFilter.length; i++) {
		var filterName = "frameworkdb_organization_filter_" + tablesToFilter[i];
		databaseManager.removeTableFilterParam(navDatabase, filterName);
		success = databaseManager.addTableFilterParam(navDatabase, tablesToFilter[i], "organization_id", "IN", [organizationId, globals.zero_uuid], filterName);
		if (!success) {
			application.output("Failed to organization filter for table \"" + tablesToFilter[i] + "\" in database \"" + navDatabase + "\"", LOGGINGLEVEL.ERROR);
		} else {
			application.output("Created organization filter for table \"" + tablesToFilter[i] + "\" in database \"" + navDatabase + "\"", LOGGINGLEVEL.DEBUG);
		}
	}
	
	// filter i18n
//	databaseManager.addTableFilterParam(navDatabase, "i18n_messages", "i18n_organization_id", "IN", (organizationId, null));
	i18n.setI18NMessagesFilter("i18n_organization_id", organizationId);
}

/**
 * Applies filters based on security keys to tables 
 * 
 * @properties={typeid:24,uuid:"777EDD27-60C1-4424-ABC4-98EDD207897B"}
 */
function filterTables() {
	// query all the element right from the sec_ tables
	var serverName = globals.nav_db_framework;
	
	var success;
	
	var keyIdList = getSecurityKeysIds();
	
	/** @type {QBSelect<db:/svy_framework/sec_table_filter>} */
	var query = databaseManager.createSelect("db:/" + serverName + "/sec_table_filter");
	query.result.addPk();
	query.where.add(query.columns.security_key_id.isin(keyIdList));
	
	/** @type {JSFoundSet<db:/svy_framework/sec_table_filter>} */
	var foundset = databaseManager.getFoundSet(query);
	var record, value;
	for (var i = 1; i <= foundset.getSize(); i++) {
		record = foundset.getRecord(i)
		if ("IN".equalsIgnoreCase(record.filter_operator) && /^[\[\(]{0,1}([\w\'\"]+\,)*([\w\'\"]+)[\]\)]{0,1}$/.test(record.filter_value)) {
			// operator is "IN" and value is of form: [1,212,4] or ('ABC', 'DEF')
			value = record.filter_value.substr(1, record.filter_value.length-2);
			value = value.split(","); //value is now array containing all the values
			value.map(function (x) { return utils.stringTrim(x); }); //remove exces spaces
		} else if (/globals\./.test(record.filter_value)) {
			/** @type {String} */
			var global = record.filter_value.match(/(globals\.\w*)/)[0];
			value = record.filter_value.replace(/(globals\.\w*)/, globals[global.split(".")[1]]);
		} else {
			value = record.filter_value
		}
		success = databaseManager.addTableFilterParam(record.server_name, record.table_name, record.filter_field_name, record.filter_operator, value, record.name);
		if (!success) {
			application.output("Failed to add table filter for table \"" + record.table_name + "\", filter field \"" + record.filter_field_name + "\"", LOGGINGLEVEL.WARNING);
		} else {
			application.output("Created field filter for table \"" + record.table_name + "\", filter field \"" + record.filter_field_name + "\"", LOGGINGLEVEL.DEBUG);
		}
	}

	// filter for deleted user records
	success = databaseManager.addTableFilterParam(globals.nav_db_framework, "sec_user", "flag_deleted", "^||=", 0);
	if (!success) {
		application.output("Failed to add table filter for deleted users", LOGGINGLEVEL.WARNING);
	} else {
		application.output("Created table filter for deleted users", LOGGINGLEVEL.DEBUG);
	}
	
	// filter for records that have deletion_date set
	success = databaseManager.addTableFilterParam(globals.nav_db_framework, null, "deletion_date", "=", null, "deleted_meta_data");
	if (!success) {
		application.output("Failed to add table filter for deleted metadata records", LOGGINGLEVEL.WARNING);
	} else {
		application.output("Created table filter for deleted metadata records", LOGGINGLEVEL.DEBUG);
	}	
	
}

/**
 * Sets the security settings on servoy elements and 
 * table read, insert, update, delete and tracking rights
 * from the keys of the logged in user 
 * by using security.setSecuritySettings()
 * 
 * @properties={typeid:24,uuid:"FBDE84EE-E1A2-48B3-ABFC-EFC216A2A77B"}
 */
function setSecuritySettings() {
	var keyIds = getSecurityKeysForInQuery();
	
	// query all the element right from the sec_tables
	var query = ' SELECT \
						se.servoy_element_id, \
						(SELECT sum(se_fe.flag_editable) \
						FROM 		sec_element se_fe \
						WHERE 		se_fe.security_key_id IN (' + keyIds + ') and \
									se.servoy_element_id =  se_fe.servoy_element_id \
						GROUP BY 	se_fe.servoy_element_id), \
						(SELECT 	sum(se_se.flag_visible) \
						FROM 		sec_element se_se \
						WHERE 		se_se.security_key_id IN (' + keyIds + ') and \
									se.servoy_element_id =  se_se.servoy_element_id \
						GROUP BY	se_se.servoy_element_id) \
						FROM 		sec_element se\
   						GROUP BY 	se.servoy_element_id'

	var dataset = databaseManager.getDataSetByQuery(globals.nav_db_framework, query, null, -1);
	
	// Create dataset to be used for security.setSecuritySettings(dataset)
	var securitySettingsDataset = databaseManager.createEmptyDataSet(0, ["id", "flags"]);
	var rowData;

	// convert the rights to the form required by security.setSecuritySettings
	for (var i = 1; i <= dataset.getMaxRowIndex(); i++) {
		rowData = new Array();
		rowData[0] = dataset.getValue(i, 1);
		if (dataset.getValue(i, 2) > 0 && dataset.getValue(i, 3) > 0) {
			rowData[1] = JSSecurity.VIEWABLE | JSSecurity.ACCESSIBLE;
		} else if (dataset.getValue(i, 2) > 0) {
			rowData[1] = JSSecurity.ACCESSIBLE;
		} else if (dataset.getValue(i, 3) > 0) {
			rowData[1] = JSSecurity.VIEWABLE;
		} else {
			rowData[1] = 0;
		}
		securitySettingsDataset.addRow(rowData);
	}

	// get the table security  // 1 = READ / 2 = INSERT / 4 = UPDATE / 8 = DELETE / 16 = TRACKING;
	query = ' SELECT \
									st.server_name, \
									st.table_name, \
									(max(st.flag_read) * 1) ,\
									(max(st.flag_insert) * 2) , \
									(max(st.flag_update) * 4),\
									(max(st.flag_delete) * 8) , \
									(max(st.flag_tracking) * 16)\
						FROM 		sec_table st \
						WHERE 		st.security_key_id IN (' + keyIds + ') \
						GROUP BY	st.server_name, st.table_name\
						ORDER BY	st.table_name desc '

	dataset = databaseManager.getDataSetByQuery(globals.nav_db_framework, query, null, -1);

	// convert the rights to the form required by security.setSecuritySettings
	var tableSecurityObject = new Object()
	var tableName
	for (var j = 1; j <= dataset.getMaxRowIndex(); j++) {
		if (dataset.getValue(j, 2) != "-1") // not all tables
		{
			tableName = dataset.getValue(j, 1) + '.' + dataset.getValue(j, 2);
			tableSecurityObject[tableName] = new Object();
			tableSecurityObject[tableName].fRead = dataset.getValue(j, 3);
			tableSecurityObject[tableName].fInsert = dataset.getValue(j, 4);
			tableSecurityObject[tableName].fUpdate = dataset.getValue(j, 5);
			tableSecurityObject[tableName].fDelete = dataset.getValue(j, 6);
			tableSecurityObject[tableName].fTracking = dataset.getValue(j, 7);

		} else // all tables of the server
		{
			/** @type {String} */
			var serverName = dataset.getValue(j, 1);
			var tableNames = databaseManager.getTableNames(serverName);
			for (var k = 0; k < tableNames.length; k++) {
				tableName = dataset.getValue(j, 1) + '.' + tableNames[k];
				if (tableSecurityObject[tableName]) // Object allready exists, synchronise properties
				{
					if (dataset.getValue(j, 3) > 0 && tableSecurityObject[tableName].fRead < 0) {
						tableSecurityObject[tableName].fRead = dataset.getValue(j, 3);
					}
					if (dataset.getValue(j, 4) > 0 && tableSecurityObject[tableName].fInsert < 0) {
						tableSecurityObject[tableName].fInsert = dataset.getValue(j, 4);
					}
					if (dataset.getValue(j, 5) > 0 && tableSecurityObject[tableName].fUpdate < 0) {
						tableSecurityObject[tableName].fUpdate = dataset.getValue(j, 5);
					}
					if (dataset.getValue(j, 6) > 0 && tableSecurityObject[tableName].fDelete < 0) {
						tableSecurityObject[tableName].fDelete = dataset.getValue(j, 6);
					}
					if (dataset.getValue(j, 7) > 0 && tableSecurityObject[tableName].fTracking < 0) {
						tableSecurityObject[tableName].fTracking = dataset.getValue(j, 7);
					}
				} else // Object doesn't exist jet
				{
					tableSecurityObject[tableName] = new Object();
					tableSecurityObject[tableName].fRead = dataset.getValue(j, 3);
					tableSecurityObject[tableName].fInsert = dataset.getValue(j, 4);
					tableSecurityObject[tableName].fUpdate = dataset.getValue(j, 5);
					tableSecurityObject[tableName].fDelete = dataset.getValue(j, 6);
					tableSecurityObject[tableName].fTracking = dataset.getValue(j, 7);
				}
			}
		}
	}
	
	for (var m in tableSecurityObject) {
		rowData = new Array();
		rowData[0] = m;
		rowData[1] = Math.abs(tableSecurityObject[m].fRead) + Math.abs(tableSecurityObject[m].fInsert) + Math.abs(tableSecurityObject[m].fUpdate) + Math.abs(tableSecurityObject[m].fDelete) + Math.abs(tableSecurityObject[m].fTracking);
		securitySettingsDataset.addRow(rowData)
	}
	
	security.setSecuritySettings(securitySettingsDataset);
}

/**
 * Toggles the PERFORM_HASH_CHECKS property that controls whether
 * security hashes are calculated to prevent unauthorized manipulation
 * of security relevant data directly in the database
 * 
 * @param {Boolean} performHashChecks
 * 
 * @author patrick
 * @since 2012-10-12
 *
 * @properties={typeid:24,uuid:"2C0CEBFF-2842-4627-8F15-10D0A38EA13A"}
 */
function setPerformHashChecks(performHashChecks) {
	PERFORM_HASH_CHECKS = performHashChecks;
}

/**
 * Creates a hash from the data of security relevant tables
 * 
 * @param {String} serverName
 *
 * @return {String} hash
 * 
 * @private
 * 
 * @author patrick
 * @since 2012-10-02
 * 
 * @properties={typeid:24,uuid:"0D95E777-6484-4D27-95F5-3007B9A87FF8"}
 */
function createHash(serverName) {
	if (!serverName) {
		serverName = globals.nav_db_framework;
	}
	
	var tableNames = ["sec_organization", "sec_user_org", "sec_owner", "sec_user_in_group", "sec_user_password", "sec_user_in_group", "sec_user_right", "sec_security_key", "sec_element", "sec_table", "sec_table_filter"];
	var jsTable, jsColumns;
	
	var start = application.getServerTimeStamp();
	var dataset, hash = "";
	for (var i = 0; i < tableNames.length; i++) {
		jsTable = databaseManager.getTable(serverName, tableNames[i]);
		jsColumns = jsTable.getColumnNames().filter(function(x) { return (x != "hash") && (x != "modification_date")});		
		/** @type {QBSelect} */
		var query = databaseManager.createSelect("db:/" + serverName + "/" + tableNames[i]);
		for (var ci = 0; ci < jsColumns.length; ci++) {
			query.result.add(query.getColumn(jsColumns[ci]));
		}
		
		dataset = databaseManager.getDataSetByQuery(query, -1);
		hash += utils.stringMD5HashBase64(dataset.getAsText("", "", "", false));
	}
	
	hash = utils.stringMD5HashBase64(hash);
	
	var end = application.getServerTimeStamp();
	var ms = end.valueOf() - start.valueOf();
	
	application.output("Calculating hash took " + ms + "ms", LOGGINGLEVEL.DEBUG);
	
	return hash;
}

/**
 * @param {Organization} organization
 * @param {User} user
 * @return {Object}
 * 
 * @private
 * 
 * @author patrick
 * @since 14.08.2012
 *
 * @properties={typeid:24,uuid:"00C34352-CBA1-4D9A-A0BB-3A74789FAF6E"}
 */
function getUserOrgId(organization, user) {
	if (!organization || !user) {
		return null;
	}
	var orgId = organization.orgId;
	var userId = user.userId;
	
	/** @type {QBSelect<db:/svy_framework/sec_user_org>} */
	var userQuery = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user_org");
	userQuery.result.addPk();
	userQuery.where.add(userQuery.columns.organization_id.eq(orgId.toString()));
	userQuery.where.add(userQuery.columns.user_id.eq(userId.toString()));
	var dataset = databaseManager.getDataSetByQuery(userQuery, -1);
	if (dataset && dataset.getMaxRowIndex() == 1) {
		return dataset.getValue(1, 1);
	} else {
		return null;
	}
}

/**
 * Removes all the data in the user DB that is linked to the given organizationId
 * 
 * @param {UUID|String} organizationId
 * 
 * @return {Array<String>} failedTables - array containing all table names for which the delete failed
 *
 * @properties={typeid:24,uuid:"6FE90E4F-BBB8-4DE6-8081-417B84475017"}
 */
function removeDataForOrganization(organizationId) {
	if (!organizationId) {
		return null;
	}
	var organization = getOrganizationById(organizationId);
	if (!organization) {
		return null;
	}
	var owner = organization.getOwner();
	var userDbName;
	if (!userDbName && globals["svy_nav_getUserDBName"]) {
		userDbName = globals["svy_nav_getUserDBName"]();
	}	
	if (owner.databaseName && owner.databaseName != userDbName) {
		userDbName = owner.databaseName;
	}
	if (!userDbName) {
		return null;
	}
	var filterField = "organization_id";
	if (owner.filterFieldName) {
		filterField = owner.filterFieldName;
	}
	
	var tableNames = databaseManager.getTableNames(userDbName);
	tableNames = tableNames.filter(
		function (x) {
			var jsTable = databaseManager.getTable(userDbName, x);
			if (jsTable && jsTable.getColumn(filterField) == null) {
				return false;
			}
			return true;
		});
	
	/** @type {Array<String>} */
	var failedTables = new Array();
	for (var i = 0; i < tableNames.length; i++) {
		var foundset = databaseManager.getFoundSet(userDbName, tableNames[i]);
		var query = databaseManager.createSelect("db:/" + userDbName + "/" + tableNames[i]);
		query.result.addPk();
		query.where.add(query.getColumn(filterField).eq(organizationId.toString()));
		foundset.loadRecords(query);
		if (utils.hasRecords(foundset)) {
			var deleteCount = databaseManager.getFoundSetCount(foundset);
			try {
				foundset.deleteAllRecords();		
				save(foundset);
				application.output("Deleted " + deleteCount + " records for organization from table \"" + userDbName + "." + tableNames[i] + "\"", LOGGINGLEVEL.INFO);
			} catch (e) {
				failedTables.push(tableNames[i]);
				application.output("Failed to delete records for organization from table \"" + userDbName + "." + tableNames[i] + "\": " + e.message, LOGGINGLEVEL.ERROR);
			}
		}
	}
	
	if (failedTables.length > 0) {
		return failedTables;
	} else {
		return null;
	}
}

/**
 * Thrown when a password does not comply to the rules set for the owner
 * 
 * @param {JSRecord<db:/svy_framework/sec_user>} record
 * @param {String} message
 * @param {Number} errorCode
 * 
 * @constructor 
 * 
 * @extends {scopes.modUtils$exceptions.IllegalArgumentException}
 *
 * @properties={typeid:24,uuid:"BE06D0A6-A86F-426E-ABE6-610D46175DF6"}
 */
function PasswordRuleViolationException(record, message, errorCode) {
	
	/**
	 * The record where the problem occured
	 * @type {JSRecord<db:/svy_framework/sec_user>}
	 */
	this.record = record;
	
	/**
	 * One of the ERROR_CODE enum values
	 * @type {Number}
	 */
	this.errorCode = errorCode;
	
	scopes.modUtils$exceptions.IllegalArgumentException.call(this, message);
}

/**
 * Gets all the security keys for the logged in user
 * 
 * @return {Array<Key>}
 * 
 * @param {User} [user]
 * @param {Organization} [organization]
 * 
 * @properties={typeid:24,uuid:"321EDB6A-DD45-4990-B0FF-BF76D381C5D6"}
 */
function loadSecurityKeys(user, organization) {
	var ownerId, userOrgId;
	
	if (!user || !organization) {
		ownerId = globals.svy_sec_lgn_owner_id;
		userOrgId = globals.svy_sec_lgn_user_org_id;
	} else {
		ownerId = user.ownerId;
		userOrgId = getUserOrgId(organization, user);
	}
	
	if (!ownerId || !userOrgId) {
		return null;
	}
	
	ownerId = ownerId.toString();
	userOrgId = userOrgId.toString();
	
	var serverName = globals.nav_db_framework;
	var currentDate = application.getServerTimeStamp();
	
	/* 
	 * 
	 * 	Loads the keys (* the query does not follow this order but has the same logic)
	 *  - directly assigned to user and not denied for the user
	 *  - contained by the groups assigned to the user, excluding the keys denied for any of the user-groups, or directly denied for the user.
	 *  - keys related to the modules directly assigned to the owner, excluding the keys denied for any of the user-groups, or directly denied for the user
	 *  - keys related to the modules included in the packages assigned to the owner , excluding the keys denied for any of the user-groups, or directly denied for the user 
	 * 
	 * 
	 * Query logic: Retrieve 
	 *      ( keys owned by the logged user-groups in the organization OR the keys assigned to the valid modules related to the user-owner ) AND not denied to the logged user !
	 *      OR all the keys directly assigned to the user
	 *   UNION
	 *      keys related to the modules contained into the packages owned by the user-owner, not denied for the logged user !
	 * 
	 *    
	 * */
	
	/* Query fixes:
	 * 
	 * 1: sec_owner_module keys UNION sec_user_rights keys instead of INTERSECT
	 * 
	 * 2: All te security Keys with module IN 'sec_org_module': 
	 *    ( ssk.module_id IS NOT NULL AND ssk.module_id IN.. ) replace ( ssk.module_id IS NULL OR ssk.module_id IN.. )
	 *  
	 * 3: check NULL end_date for modules 
	 *    sec_owner_in_module.endDate is NULL OR >= ?
	 *  */
	var query = '\
		SELECT DISTINCT	surd.security_key_id \
		FROM sec_user_right surd \
		WHERE (\
			surd.security_key_id IN (\
				SELECT	ssk.security_key_id  \
				FROM	sec_security_key ssk \
						JOIN sec_user_right sur ON ssk.security_key_id = sur.security_key_id \
						JOIN sec_user_in_group sug ON sur.group_id = sug.group_id\
				WHERE	sug.user_org_id = ? \
				OR		(\
					ssk.module_id IS NOT NULL AND ssk.module_id IN (\
						SELECT	som.module_id \
						FROM	sec_owner_in_module som \
						WHERE	som.owner_id = ? \
						AND		som.start_date <= ? \
						AND		( som.end_date IS NULL OR som.end_date >= ? ) \
					)\
				)\
			)\
			AND NOT EXISTS (\
				SELECT	* \
				FROM sec_user_right surd2, sec_user_in_group sug2 \
				WHERE surd.security_key_id = surd2.security_key_id \
				AND (\
					surd2.user_org_id = ? \
					OR (\
						surd2.group_id = sug2.group_id\
						AND sug2.user_org_id = ?\
					)\
				)\
				AND		surd2.is_denied = 1 \
			) \
		)\
		OR	(surd.user_org_id = ? \
			AND	(\
				surd.is_denied IS NULL \
				OR	surd.is_denied = 0 \
			))\
		UNION\
		(\
			SELECT	ssk2.security_key_id  \
			FROM	sec_security_key ssk2  \
					JOIN prov_package_modules ppm ON ssk2.module_id = ppm.module_id \
					JOIN prov_owner_packages pop ON  ppm.package_id = pop.package_id \
			WHERE	pop.start_date <= ? \
			AND   ( pop.end_date >= ? OR pop.end_date is null) \
			AND		pop.owner_id = ? \
			AND	 ssk2.security_key_id NOT IN \
			( \
				( 	SELECT 	sur4.security_key_id \
					FROM 	sec_user_right sur4 \
					WHERE 	sur4.user_org_id = ? \
					AND 	sur4.is_denied = 1 \
				)\
				UNION \
				(	SELECT	sur5.security_key_id \
					FROM 	sec_user_right sur5 \
							JOIN sec_user_in_group uig5 ON sur5.group_id = uig5.group_id\
					WHERE 	uig5.user_org_id = ?\
					AND		sur5.is_denied = 1 \
				)\
			)\
		)';
	
	var queryArgs = new Array();
	queryArgs[0] = userOrgId;
	queryArgs[1] = ownerId;
	queryArgs[2] = currentDate;
	queryArgs[3] = currentDate;
	queryArgs[4] = userOrgId;
	queryArgs[5] = userOrgId;
	queryArgs[6] = userOrgId;
	queryArgs[7] = currentDate;
	queryArgs[8] = currentDate;
	queryArgs[9] = ownerId;
	queryArgs[10] = userOrgId;
	queryArgs[11] = userOrgId;
	
	var dataset = databaseManager.getDataSetByQuery(serverName, query, queryArgs, -1);
	
	/** @type {JSFoundSet<db:/svy_framework/sec_security_key>} */
	var keyFs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_security_key");
	keyFs.loadRecords(dataset);
	
	var result = new Array();
	var debugOutput = new Array();
	for (var i = 1; i <= keyFs.getSize(); i++) {
		var record = keyFs.getRecord(i);
		debugOutput.push(record.name);
		var key = new Key(record.security_key_id, record.name, record.description, record.owner_id, record.module_id);
		result.push(key);
	}
	debugOutput.sort();
	application.output("Found security keys: " + debugOutput.join("; "), LOGGINGLEVEL.DEBUG);
	
	if (securityKeys == null || securityKeys.length == 0) {
		securityKeys = result;
	}
	
	return result;
}

/**
 * Returns the IDs of all keys of the logged in user as a quoted, 
 * comma separated list that can be directly parsed into IN queries
 * 
 * @return {String}
 * 
 * @author patrick
 * @date 2012-12-12
 * 
 * @properties={typeid:24,uuid:"A4498256-7071-43FF-B2EE-67820EBA787E"}
 */
function getSecurityKeysForInQuery() {
	var runtimeKeys = getRuntimeSecurityKeys();
	var result = new Array();
	runtimeKeys.forEach(function addIdString(key) {result.push("'" + key.keyId + "'");});
	if (result.length == 0) {
		result.push("'" + globals.zero_uuid_string + "'");
	}
	return result.join(",");
}

/**
 * Returns an array with all security key IDs of the logged in user<br>
 * or [00000000-0000-0000-0000-000000000000] if the user has no keys
 * 
 * @return {Array<String>}
 * 
 * @author patrick
 * @date 2012-12-12
 * 
 * @properties={typeid:24,uuid:"820CD12B-245A-454E-A571-28155168F06A"}
 */
function getSecurityKeysIds() {
	var runtimeKeys = getRuntimeSecurityKeys();
	/** @type {Array<String>} */
	var result = new Array();
	runtimeKeys.forEach(function addIdString(key) {result.push(key.keyId.toString());});
	if (result.length == 0) {
		result.push(globals.zero_uuid_string);
	}
	return result;
}

/**
 * Returns the runtime key with the given name or UUID or null if not found
 * 
 * @param {String|UUID} key
 * 
 * @return {Key} key
 * 
 * @author patrick
 * @date 2012-12-12
 *
 * @properties={typeid:24,uuid:"06B4409B-3C62-4D22-8652-1C29F6E5FC82"}
 */
function getRuntimeKey(key) {
	if (!key) {
		return null;
	}
	var runtimeKeys = getRuntimeSecurityKeys();
	
	function filterByName(x) {
		return x.name == key;
	}
	function filterByUuid(x) {
		return x.keyId == key;
	}
	var filtered;
	if (key instanceof UUID) {
		filtered = runtimeKeys.filter(filterByUuid);
	} else {
		filtered = runtimeKeys.filter(filterByName);
	}
	return filtered.length > 0 ? filtered[0] : null;
}

/**
 * Returns the last registered login attempt of the User with the given ID
 * 
 * @param {String|UUID} userId
 * @param {String} [frameworkDb] the name of the framework database
 * 
 * @return {Date} lastLoginAttempt
 *
 * @properties={typeid:24,uuid:"7A1C6F5A-D4DE-4C14-BC7D-326CE1557AB8"}
 */
function getLastLoginAttempt(userId, frameworkDb) {
	if (!userId) {
		return null;
	}
	if (!frameworkDb) {
		frameworkDb = globals.nav_db_framework;
	}
	/** @type {QBSelect<db:/svy_framework/sec_user_login_attempt>} */
	var query = databaseManager.createSelect("db:/" + frameworkDb + "/sec_user_login_attempt");
	query.result.add(query.columns.attempt_datetime.max);
	query.where.add(query.columns.user_id.eq(userId.toString()));
	
	var dataset = databaseManager.getDataSetByQuery(query, 1);
	if (dataset && dataset.getMaxRowIndex() > 0) {
		return dataset.getValue(1,1);
	} else {
		return null;
	}
}

/**
 * Returns the key with the given name or UUID or null if not found
 * 
 * @param {String|UUID} key
 * 
 * @return {Key} key
 * 
 * @author patrick
 * @date 2012-12-12
 *
 * @properties={typeid:24,uuid:"5AC2CA33-649E-406A-A637-1E95C70E6823"}
 */
function getKey(key) {
	if (!key) {
		return null;
	}
	/** @type {QBSelect<db:/svy_framework/sec_security_key>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_security_key");
	query.result.addPk();
	if (key instanceof UUID) {
		query.where.add(query.columns.security_key_id.eq(key.toString()));
	} else {
		query.where.add(query.columns.name.eq(key));
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_security_key>} */
	var foundset = databaseManager.getFoundSet(query);
	if (utils.hasRecords(foundset)) {
		var keyRecord = foundset.getRecord(1);
		return new Key(keyRecord.security_key_id, keyRecord.name, keyRecord.description, keyRecord.owner_id);
	} else {
		return null;
	}
}

/**
 * Returns <code>true</code> if the logged in user has 
 * the key with the given name or UUID
 * 
 * @param {String|UUID} key
 * 
 * @return {Boolean} hasKey
 * 
 * @author patrick
 * @date 2012-12-12
 *
 * @properties={typeid:24,uuid:"43986720-C100-4F2C-9D75-D2BF6ADA9E16"}
 */
function hasKey(key) {
	if (!key) {
		return false;
	}
	var runtimeKeys = getRuntimeSecurityKeys();
	
	function filterByName(x) {
		return x.name == key;
	}
	function filterByUuid(x) {
		return x.keyId == key;
	}
	var filtered;
	if (key instanceof UUID) {
		filtered = runtimeKeys.filter(filterByUuid);
	} else {
		filtered = runtimeKeys.filter(filterByName);
	}
	return filtered.length > 0;
}

/**
 * Returns all security keys<p>
 * 
 * Concatenates all keys assigned to the user and all keys added at runtime
 * 
 * @private 
 * 
 * @properties={typeid:24,uuid:"E74F5441-547A-4391-9AA5-97F1D757C899"}
 */
function getRuntimeSecurityKeys() {
	if (securityKeys == null) {
		securityKeys = loadSecurityKeys();
	}
	
	if (runtimeSecurityKeys == null) {
		runtimeSecurityKeys = new Array();
	}
	
	/** @type {Array<Key>} */
	var result = securityKeys.concat(runtimeSecurityKeys);
	if (runtimeSecurityKeysRemoved) {
		for (var i = 0; i < result.length; i++) {
			for (var j = 0; j < runtimeSecurityKeysRemoved.length; j++) {
				if (result[i].keyId == runtimeSecurityKeysRemoved[j].keyId) {
					result.splice(i,1);
				}
			}
		}
	}	
	
	return result;
}

/**
 * Adds the given key to the list of loaded security keys
 * 
 * @param {UUID|String} keyId
 * @param {String} keyName
 * @param {String} [keyDescription]
 * @param {UUID|String} [keyOwnerId]
 * @param {UUID|String} [keyModuleId]
 * 
 * @return {Key}
 * 
 * @throws {scopes.modUtils$exceptions.IllegalArgumentException}
 *
 * @properties={typeid:24,uuid:"B2513CBE-E5E8-4ECD-A75C-51DD2248F9FC"}
 */
function addRuntimeKey(keyId, keyName, keyDescription, keyOwnerId, keyModuleId) {
	if (!keyId && !keyName) {
		return null;
	}
	var id = keyId;
	if (keyId instanceof String) {
		id = application.getUUID(keyId);
	}
	var ownerId = keyOwnerId;
	if (keyOwnerId instanceof String) {
		ownerId = application.getUUID(keyOwnerId);
	}
	var moduleId = keyModuleId;
	if (keyModuleId instanceof String) {
		moduleId = application.getUUID(keyModuleId);
	}	
	var newKey = new Key(id, keyName, keyDescription, ownerId, moduleId);
	if (runtimeSecurityKeys == null) {
		runtimeSecurityKeys = new Array();
	}
	runtimeSecurityKeys.push(newKey);
	return newKey;
}

/**
 * Removes the key with the given Id from the list of runtime keys
 * 
 * @param {UUID|String} keyId
 *
 * @properties={typeid:24,uuid:"5ABE723C-054F-4F82-A3E9-174286CB87EA"}
 */
function removeRuntimeKey(keyId) {
	if (!keyId) {
		return;
	}
	if (keyId instanceof String) {
		keyId = application.getUUID(keyId);
	}
	var key = getKey(keyId);
	if (key) {
		if (!runtimeSecurityKeysRemoved) {
			runtimeSecurityKeysRemoved = new Array();
		}
		runtimeSecurityKeysRemoved.push(key);
	}
}

/**
 * Generates a PBKDF2 hash from the given password and 
 * returns an object containing the salt and the password hash<br>
 * 
 * Note that the method uses a pepper defined in PBKDF2_PEPPER
 * 
 * @param {String} password
 * 
 * @return {{salt: String, hash: String, iterations: Number, iterationVersion: Number}} saltAndHash
 *
 * @properties={typeid:24,uuid:"7DACBD38-2AE6-4B3D-A397-85F5C990B75A"}
 */
function calculatePBKDF2Hash(password) {
	var hash;
	
	// in Servoy 6.1.4 and lower the library used to calculate the PBKDF2 hash
	// is not sent to the Smart client and cannot be used
	// TODO: Remove this silly workaround when 6.1.5 is released
	var versionNum = getServoyVersionNumber();
	if (versionNum > 6104) {
		hash = utils.stringPBKDF2Hash(PBKDF2_PEPPER + password, PBKDF2_CURRENT_ITERATION);
	} else {
		PBKDF2_CURRENT_ITERATION_VERSION = 0;
		var someSalt = utils.stringLeft(utils.stringMD5HashBase64(application.getUUID().toString()) , 20);
		hash = utils.stringMD5HashBase64(someSalt + password + PBKDF2_PEPPER);
		hash = someSalt + ":0:" + hash;
	}
	var hashParts = hash.split(":");
	/** @type {Number} */
	var iterations = parseInt(hashParts[1]);
	return {salt: hashParts[0], hash: hashParts[2], iterations: iterations, iterationVersion: PBKDF2_CURRENT_ITERATION_VERSION};
}

/**
 * Returns the Servoy version as a number<p>
 * 
 * The number returned is calculated as these examples:<p>
 * 
 * 5.1.4 is returned as 5104<br>
 * 7.0.0 is returned as 7000<br>
 * 5.1.12i1 is returned as 5112<br>
 * 
 * @return {Number}
 * 
 * @private
 * 
 * @properties={typeid:24,uuid:"C1897D3C-1BF3-4DAB-8457-237EBDC5E0E6"}
 */
function getServoyVersionNumber() {
	var version = application.getVersion();
	var versionParts = version.split(".");
	var majorVersion = versionParts[0];
	var middleVersion = versionParts[1];
	var minorVersion = versionParts[2];
	minorVersion = minorVersion.split(/\D/);
	return parseInt(majorVersion + middleVersion + (utils.stringRight("0" + minorVersion[0],2)));
}

/**
 * Validates the given password using the given salt and hash<br>
 * 
 * Note that the method uses a pepper defined in PBKDF2_PEPPER
 * 
 * @param {String} password 					- the password to validate
 * @param {String} salt 						- the salt used when the hash was calculated
 * @param {String} hash 						- the password hash
 * @param {Number} [pbkdf2IterationVersion] 	- one of the iteration versions in PBKDF2_ITERATIONS
 * 
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"9AEBFDA3-5294-4241-AB02-764EC249717F"}
 */
function validatePBKDF2Hash(password, salt, hash, pbkdf2IterationVersion) {
	if (!password || !salt || !hash) {
		return false;
	}
	
	// in Servoy 6.1.4 and lower the library used to calculate the PBKDF2 hash
	// is not sent to the Smart client and cannot be used
	// TODO: Remove this silly workaround when 6.1.5 is released
	var versionNum = getServoyVersionNumber();
	if (versionNum > 6104 && pbkdf2IterationVersion > 0) {
		var iterations = PBKDF2_CURRENT_ITERATION;
		if (pbkdf2IterationVersion && PBKDF2_ITERATIONS["VERSION_" + pbkdf2IterationVersion]) {
			iterations = PBKDF2_ITERATIONS["VERSION_" + pbkdf2IterationVersion];
		}
		return utils.validatePBKDF2Hash(PBKDF2_PEPPER + password, salt + ":" + iterations + ":" + hash);
	} else {
		var calculatedHash = utils.stringMD5HashBase64(salt + password + PBKDF2_PEPPER);
		return calculatedHash == hash;
	}
}

/**
 * Changes the organization of the logged in user<p>
 * 
 * Fires a ORGANIZATION_CHANGE event when successful
 * 
 * @param {String|UUID} oldOrganizationId
 * @param {String|UUID} newOrganizationId
 * 
 * @return {Boolean} success
 *
 * @properties={typeid:24,uuid:"BFD5B7D2-B02A-4EBD-8845-42DB0A1B3C87"}
 */
function changeOrganization(oldOrganizationId, newOrganizationId) {
	if (!newOrganizationId) {
		return false;
	}
	var user = getUser();
	var org = getOrganizationById(newOrganizationId);
	if (!user || !org) {
		return false;
	}
	var userOrgId = getUserOrgId(org, user);
	if (!userOrgId && user.adminLevel < ADMIN_LEVEL.APPLICATION_MANAGER) {
		return false;
	}
	
	globals.svy_sec_lgn_organization_id = newOrganizationId.toString();
	globals.svy_sec_lgn_user_org_id = userOrgId;
	
	// re-apply the security settings
	loadSecurityKeys();
	filterOrganization();
	setSecuritySettings();
	filterTables();
	
	scopes.modUtils$eventManager.fireEvent(this, EVENT_TYPES.ORGANIZATION_CHANGE, [oldOrganizationId, newOrganizationId]);
	return true;
}

/**
 * Adds a listener that will be notified whenever the organization changes<p>
 * 
 * The listener will fire the methodToCall and passes<p>
 * <ul>
 * <li>oldOrganizationId - the organizationId before the change</li>
 * <li>newOrganizationId - the organizationId after the change</li> 
 * </ul>
 * as parameters
 * 
 * @param {Function} methodToCall
 * 
 * @return {Boolean} success
 *
 * @properties={typeid:24,uuid:"E8922DDB-B242-41F9-AB42-57A12F78E885"}
 */
function addOrganizationChangeListener(methodToCall) {
	if (!methodToCall) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException("Method is required");
	}
	return scopes.modUtils$eventManager.addListener(this, EVENT_TYPES.ORGANIZATION_CHANGE, methodToCall);
}

/**
 * Set exception prototypes to super class
 * 
 * @protected  
 * 
 * @properties={typeid:35,uuid:"A2432865-B484-4ABD-9DA4-3FA1E713D328",variableType:-4}
 */
var init = function() {
	PasswordRuleViolationException.prototype = new scopes.modUtils$exceptions.IllegalArgumentException("Password rule violated");
}();
