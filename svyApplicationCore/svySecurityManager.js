/**
 * Admin levels for users<p>
 * 
 * NONE 					= normal user with no special priviliges<br>
 * ORGANIZATION_MANAGER		= the manager of an organization, can make settings for organizations, create users<br>
 * OWNER_MANAGER			= the manager of an owner, can create organizations, users etc<br>
 * APPLICATION_MANAGER		= the manager of the application, can create owners<br>
 * DEVELOPER				= has no limitations
 * 
 * @final
 * @properties={typeid:35,uuid:"D0A4C4A2-CCFC-45E8-86A3-8A5748045075",variableType:-4}
 */
var ADMIN_LEVEL = {
	
	/**
	 * Normal user with no special privileges
	 * @type {Number}
	 */
	NONE: 0,
	
	/**
	 * The manager of an organization
	 * @type {Number}
	 */
	ORGANIZATION_MANAGER: 1,
	
	/**
	 * The manager of an owner/tenant
	 * @type {Number}
	 */
	TENANT_MANAGER: 2,
	
	/**
	 * The manager of the application
	 * @type {Number}
	 */
	APPLICATION_MANAGER: 4,
	
	/**
	 * The developer of the application
	 * @type {Number}
	 */
	DEVELOPER: 8
	
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
		throw new scopes.modUtils$exceptions.IllegalArgumentException('Application ID Required');
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
	var _result = new Array();
	var _fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_group");
	_fs.loadAllRecords();
	if (utils.hasRecords(_fs)) {
		/** @type {JSFoundset<db://>} */
		for (var i = 1; i <= _fs.getSize(); i++) {
			var _groupRecord = _fs.getRecord(i);
			_result.push(new Group(_groupRecord));
		}
	}
	return _result;
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
	/** @type {QBSelect<db:/svy_framework/sec_group>} */
	var _query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_group");
	_query.result.addPk();
	_query.where.add(_query.columns.name.lower.eq(groupname.toLowerCase()));
	var _fs = databaseManager.getFoundSet(_query);
	if (utils.hasRecords(_fs)) {
		return new Group(_fs.getRecord(1));
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
		throw new scopes.modUtils$exceptions.IllegalArgumentException('ModuleID cannot be null');
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
	/** @type {JSRecord<db:/svy_framework/sec_organization>} */
	var orgRecord = null;
	
	/** @type {QBSelect<db:/svy_framework/sec_organization>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
	query.result.addPk()
	query.where.add(query.columns.organization_id.eq(organizationId));
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
	var _query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
	_query.result.addPk();
	if (organization) {
		_query.where.add(_query.columns.name.eq(organization));
	} else {
		_query.where.add(_query.columns.organization_id.eq(globals["svy_sec_lgn_organization_id"]));
	}
	var _fs = databaseManager.getFoundSet(_query);
	if (!utils.hasRecords(_fs)) {
		return null;
	} else {
		return new Organization(_fs.getRecord(1));
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
	var _query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
	_query.result.addPk();
	var _foundset = databaseManager.getFoundSet(_query);
	if (!utils.hasRecords(_foundset)) {
		return null;
	}
	/** @type {Array<Organization>} */
	var _result = new Array();
	/** @type {JSFoundset<db://>} */
	for (var i = 1; i <= _foundset.getSize(); i++) {
		var _userRecord = _foundset.getRecord(i);
		_result.push(new Organization(_userRecord));
	}
	return _result;
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
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_owner");
	fs.loadAllRecords();
	/** @type {JSFoundset<db://>} */
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
	
	if (!userName && globals["svy_sec_user_id"]) {
		query.where.add(query.columns.user_id.eq(globals["svy_sec_user_id"]));
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
	var foundset = databaseManager.getFoundSet(query);
	if (!utils.hasRecords(foundset)) {
		return null;
	}
	/** @type {Array<User>} */
	var result = new Array();
	/** @type {JSFoundset<db://>} */
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
		throw new scopes.modUtils$exceptions.NoRecordException();
	}
}

/**
 * Creates a new application record and returns an Object handle
 * 
 * @param {String} name must be unique
 * 
 * @return {Application}
 * 
 * @throws {scopes.modUtils$exceptions.ValueNotUniqueException} 
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"6CC68D24-ED77-4B34-B6B0-4EF3490EDF79"}
 */
function createApplication(name){
	if (!name) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException('Name is required');
	}
	/** @type {JSFoundSet<db:/svy_framework/prov_application>} */
	var fs = databaseManager.getFoundSet(scopes.globals.nav_db_framework, 'prov_application');
	if (!scopes.modUtils.isValueUnique(fs, 'application_name', name)) {
		throw new scopes.modUtils$exceptions.ValueNotUniqueException(fs, 'application_name');
	}
	if (!fs.newRecord()) {
		throw new scopes.modUtils$exceptions.NewRecordFailedException('Could not create Application', fs);
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
 * @throws {scopes.modUtils$exceptions.ValueNotUniqueException}
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"14038587-E684-4051-A469-3A1D97C18392"}
 */
function createModule(name){
	if (!name) {
		throw new scopes.modUtils$exceptions.IllegalArgumentException('Name is required');
	}
	/** @type {JSFoundSet<db:/svy_framework/sec_module>} */
	var fs = databaseManager.getFoundSet(globals.nav_db_framework, 'sec_module');
	if (!scopes.modUtils.isValueUnique(fs, 'name', name)) {
		throw new scopes.modUtils$exceptions.ValueNotUniqueException(fs, 'name');
	}
	if (!fs.newRecord()) {
		throw new scopes.modUtils$exceptions.NewRecordFailedException('Cound not create module record', fs);
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
 * @throws {scopes.modUtils$exceptions.ValueNotUniqueException} - the owner name must be unique
 * 
 * @author patrick
 * @since 02.08.2012
 *
 * @properties={typeid:24,uuid:"A6DFFFB1-AB2B-4AE6-AE8A-C3B0DDF776F4"}
 */
function createOwner(ownerName) {
	if (!ownerName)
		throw new scopes.modUtils$exceptions.IllegalArgumentException('Owner Name cannot be null');
	/** @type {JSFoundSet<db:/svy_framework/sec_owner>} */
	var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_owner");
	
	if (!scopes.modUtils.isValueUnique(fs,"name",ownerName)) {
		throw new scopes.modUtils$exceptions.ValueNotUniqueException(null, "ownername");
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
 * @throws {scopes.modUtils$exceptions.ValueNotUniqueException} the user name has to be unique for an owner
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
	if (!scopes.modUtils.isValueUnique(userFs, "user_name", userName, ["owner_id"],[owner.ownerId.toString()])) {
		throw new scopes.modUtils$exceptions.ValueNotUniqueException(null, "owner_id");
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
 * @param {JSRecord<db:/svy_framework/sec_user>} userRecord
 *
 * @constructor 
 * 
 * @author patrick
 * @since 01.08.2012 
 * 
 * @properties={typeid:24,uuid:"9D7D01BC-C223-4EA2-A4FA-EA2267BEDDC7"}
 */
function User(userRecord) {
	/** @type {JSRecord<db:/svy_framework/sec_user>} */
	var record = userRecord;

	/**
	 * Gets / Sets the user name of this User
	 * @type {String}
	 *
	 */
	this.userName = userRecord.user_name;
	
	/**
	 * Returns the ID of this user
	 * @return {Object} userId
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
		var fs = record.foundset;
		try {
			return fs.changePassword(newPassword, record);
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
		var fs = record.foundset;
		return fs.lockUser(record);
	}
	
	/**
	 * Unlocks the user
	 * 
	 * @return {Boolean} success
	 */
	this.unlockUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = record.foundset;
		return fs.unlockUser(record);
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
		var fs = record.foundset;
		return fs.addToOrganization(organization.orgId, record);
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
		var fs = record.foundset;
		return fs.removeFromOrganization(organization.orgId, record);
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
		var fs = record.foundset;
		return fs.addToGroup(group.groupId, organization.orgId, record);
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
		var fs = record.foundset;
		return fs.assignKey(key.keyId, organization.orgId, record);
	}
	
	/**
	 * Returns all organizations of this user as an array
	 * 
	 * @return {Array<Organization>}
	 */
	this.getOrganizations = function() {
		/** @type {User} */
		var _this = this;
		
		/** @type {Array<Organization>} */
		var result = new Array();
		
		/** @type {QBSelect<db:/svy_framework/sec_organization>} */
		var orgQuery = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_organization");
		orgQuery.result.addPk();
		/** @type {QBJoin<db:/svy_framework/sec_user_org>} */
		var userOrgJoin = orgQuery.joins.add("db:/" + globals.nav_db_framework + "/sec_user_org", JSRelation.INNER_JOIN);
		userOrgJoin.on.add(orgQuery.columns.organization_id.eq(userOrgJoin.columns.organization_id));
		orgQuery.where.add(userOrgJoin.columns.user_id.eq(_this.userId));
		
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
	 * @return {Array<Group>}
	 */
	this.getGroups = function(organization) {
		/** @type {User} */
		var _this = this;
		
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
		query.where.add(joinUserOrg.columns.organization_id.eq(organization.orgId));
		query.where.add(joinUserOrg.columns.user_id.eq(_this.userId));
		
		var groupFs = databaseManager.getFoundSet(query);
		if (utils.hasRecords(groupFs)) {
			/** @type {JSFoundset<db:/svy_framework/sec_group>} */
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
		var fs = record.foundset;
		return fs.getLastLogin(record);
	}
	
	/**
	 * Returns all login attempts of this user
	 * 
	 * @return {Array<UserLogin>}
	 */
	this.getLogins = function() {
		var fs = record.sec_user_to_sec_user_login_attempt;
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
		query.where.add(query.columns.user_id.eq(record.user_id.toString()));
		query.where.add(query.columns.attempt_datetime.ge(start));
		query.where.add(query.columns.attempt_datetime.le(end));
		query.sort.add(query.columns.attempt_datetime.desc);
		
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
		var fs = record.foundset;
		return fs.isPasswordExpired(record);
	}
	
	/**
	 * Returns <code>true</code> if the given password is correct
	 * 
	 * @return {Boolean} isValid
	 */
	this.isPasswordValid = function(password) {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = record.foundset;
		return fs.isPasswordValid(password, record);
	}
	
	/**
	 * Returns <code>true</code> if the user has the key with the given name in the given organization
	 * 
	 * @param {String} keyName
	 * @param {Organization} organization
	 * 
	 * @return {boolean} hasKey
	 */
	this.hasKeyName = function(keyName, organization) {
		/** @type {User} */
		var that = this;
		var keys = that.getKeys(organization);
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
	 * @return {boolean} hasKey
	 */
	this.hasKeyId = function(keyId, organization) {
		/** @type {User} */
		var that = this;
		var keys = that.getKeys(organization);
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
		var fs = record.foundset;
		return fs.deleteUser(record);
	}
	
	/**
	 * Activates the user<br>
	 * Only active users can login<br>
	 * For count of users per package only active users will be counted.
	 */
	this.activateUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = record.foundset;
		return fs.activateUser(record);
	}
	
	/**
	 * Deactivates the user<br>
	 * Only active users can login<br>
	 * For count of users per package only active users will be counted.
	 */
	this.deactivateUser = function() {
		/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
		var fs = record.foundset;
		return fs.deactivateUser(record);
	}
	
	Object.defineProperty(this, "adminLevel", {
        set: function (level) {
        	/** @type {JSFoundSet<db:/svy_framework/sec_user>} */
        	var fs = record.foundset;
        	fs.setAdminLevel(level, record);
        },
        get: function () {
            return record.admin_level;
        }
    });	
	
	Object.defineProperty(this, "userName", {
        set: function (x) {
            record.user_name = x;
            save(record);
        },
        get: function () {
            return record.user_name;
        }
    });		
	
	Object.defineProperty(this, "userId", {
       get: function () {
            return record.user_id;
        }
    });		
	
	Object.defineProperty(this, "ownerId", {
       get: function () {
            return record.owner_id;
        },
		set: function(x) {
			var owner = getOwnerById(x);
			if (!owner) {
				throw new scopes.modUtils$exceptions.IllegalArgumentException("The owner with the ID " + x + " could not be found");
			}
			record.owner_id = owner.ownerId;
			save(record);
		}
    });		
	
	Object.defineProperty(this, "emailAddress", {
       get: function () {
            return record.com_email;
        },
		set: function(x) {
			if (plugins.mail.isValidEmailAddress(x)) {
				record.com_email = x;
				save(record);
			} else {
				throw new scopes.modUtils$exceptions.IllegalArgumentException("Invalid email address: " + x);
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
 * @param {JSRecord<db:/svy_framework/sec_group>} ownerRecord
 * 
 * @constructor 
 * 
 * @author patrick
 * @since 01.08.2012
 * 
 * @properties={typeid:24,uuid:"905BA6B0-C4E8-4083-B13D-E77F66A6F0AE"}
 */
function Group(ownerRecord) {

	var record = ownerRecord;
	
	/**
	 * The name of this group
	 * @type {String}
	 */
	this.name = ownerRecord.name;

	/**
	 * Description of this Group
	 * @type {String}
	 */
	this.description = ownerRecord.description;
	
	/**
	 * Returns the users in this group for all or the given organization
	 * @this {Group}
	 * @param {Organization} [organization]
	 * 
	 * @return {Array<User>} users
	 */
	this.getUsers = function(organization) {
		/** @type {Group} */
		var _this = this;

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
		
		query.where.add(joinGroup.columns.group_id.eq(_this.groupId.toString()));
		if (organization) {
			query.where.add(joinUserOrg.columns.organization_id.eq(organization.orgId.toString()));
		}
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
	this.groupId = ownerRecord.group_id;
	
	/**
	 * Adds the given User to the group<br>
	 * for the given organization.<br><br>
	 * If the user is not yet in the given<br>
	 * organization, it will be added to it.
	 * 
	 * @param {User} userToAdd
	 * @param {Organization} organization
	 * 
	 * @return {boolean} success
	 */
	this.addUser = function(userToAdd, organization) {
		/** @type {Group} */
		var _this = this;
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
		
		var groupId = _this.groupId;
		/** @type {JSFoundset<db:/svy_framework/sec_user_in_group>} */	
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
	 * @return {Boolean} success
	 * 
	 */
	this.addKey = function(keyToAdd) {
		/** @type {Group} */
		var _this = this;
		if (!keyToAdd || !(keyToAdd instanceof Key)) {
			return false;
		}
		
		/** @type {JSFoundSet<db:/svy_framework/sec_user_right>} */
		var fs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_user_right");
		var newUserRightRec = fs.getRecord(fs.newRecord());
		newUserRightRec.group_id = _this.groupId;
		newUserRightRec.security_key_id = keyToAdd.keyId;
		return save(newUserRightRec);
	}
	
	Object.defineProperty(this, "name", {
        set: function (x) {
            record.name = x;
            save(record);
        },
        get: function () {
            return record.name;
        }
    });
	
	Object.defineProperty(this, "description", {
        set: function (x) {
            record.description = x;
            save(record);
        },
        get: function () {
            return record.description;
        }
    });	
	
	Object.defineProperty(this, "groupId", {
        get: function () {
            return record.group_id;
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
	 * @return {Array<Group>} groups
	 */
	this.getGroups = function() {
		/** @type {Key} */
		var that = this;
		
		/** @type {Array<Group>} */
		var result = new Array();
		
		/** @type {QBSelect<db:/svy_framework/sec_group>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_group");
		query.result.addPk();
		/** @type {QBJoin<db:/svy_framework/sec_user_right>} */
		var userRightJoin = query.joins.add("db:/" + globals.nav_db_framework + "/sec_user_right");
		userRightJoin.on.add(query.columns.group_id.eq(userRightJoin.columns.group_id));
		query.where.add(query.columns.group_id.not.isNull);
		query.where.add(userRightJoin.columns.security_key_id.eq(that.keyId.toString()));
		
		/** @type {JSFoundset<db:/svy_framework/sec_group>} */		
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
	 * @return {Boolean} success
	 * 
	 */
	this.addTableSecurity = function(serverName, tableName, canRead, canInsert, canUpdate, canDelete, tracking) {
		/** @type {Key} */
		var that = this;
		
		/** @type {QBSelect<db:/svy_framework/sec_table>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_table");
		query.result.addPk();
		query.where.add(query.columns.server_name.eq(serverName));
		query.where.add(query.columns.table_name.eq(tableName));
		query.where.add(query.columns.security_key_id.eq(that.keyId.toString()));
		
		var fs = databaseManager.getFoundSet(query);
		
		/** @type {JSRecord<db:/svy_framework/sec_table>} */
		var secTableRecord;
		if (!utils.hasRecords(fs)) {
			secTableRecord = fs.getRecord(fs.newRecord());
			secTableRecord.server_name = serverName;
			secTableRecord.table_name = tableName;
			secTableRecord.security_key_id = that.keyId;
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
		
		/** @type {Key} */
		var that = this;
		
		/** @type {QBSelect<db:/svy_framework/sec_element>} */
		var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_element");
		query.result.addPk();
		query.where.add(query.columns.form_name.eq(formName));
		query.where.add(query.columns.element_name.eq(elementName));
		query.where.add(query.columns.security_key_id.eq(that.keyId.toString()));
		
		var fs = databaseManager.getFoundSet(query);
		
		/** @type {JSRecord<db:/svy_framework/sec_element>} */
		var secElementRecord;
		if (!utils.hasRecords(fs)) {
			secElementRecord = fs.getRecord(fs.newRecord());
			secElementRecord.security_key_id = that.keyId;
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
 * 
 * @author patrick
 * @since 2012-10-23
 *
 * @properties={typeid:24,uuid:"126E7F79-9F86-486F-8CDD-6B07012B305A"}
 */
function UserLogin(userLoginAttempt) {
	
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
 * @author patrick
 * @since 01.08.2012 
 * 
 * @properties={typeid:24,uuid:"5CCED2CB-57D4-4BA4-9839-794C404BA9C1"}
 */
function Organization(organizationRecord) {
	
	/**
	 * The JSRecord of this organization
	 * 
	 * @type {JSRecord<db:/svy_framework/sec_organization>}
	 */
	var record = organizationRecord;
	
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
	 * @throws {scopes.modUtils$exceptions.ValueNotUniqueException} the name of the organization has to be unique for a given owner
	 */
	this.name = organizationRecord.name;
	
	/**
	 * Returns the Owner of this organization
	 * 
	 * @return {Owner}
	 */
	this.getOwner = function() {
		if (utils.hasRecords(record.sec_organization_to_sec_owner)) {
			return new Owner(record.sec_organization_to_sec_owner);
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
        		throw new scopes.modUtils$exceptions.ValueNotUniqueException(organizationRecord, "name");
        	}
            record.name = x;
            save(record);
        },
        get: function () {
            return record.name;
        }
    });	
	
	Object.defineProperty(this, "orgId", {
        get: function () {
            return record.organization_id;
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
 * @properties={typeid:24,uuid:"23E6F372-7564-4F60-A4F1-AFFC10763CDB"}
 */
function Owner(ownerRecord) {
	
	//	TODO: what if owner record null ?? (sean)
	
	/**
	 * The JSRecord of this organization
	 * 
	 * @type {JSRecord<db:/svy_framework/sec_owner>}
	 */
	var record = ownerRecord;
	
	/**
	 * The ID of this owner
	 */
	this.ownerId = ownerRecord.owner_id;	
	
	/**
	 * Gets the name of this owner
	 * @return {String} name
	 */
	this.name = ownerRecord.name;
	
	/**
	 * The database name used by this owner
	 * @type {String}
	 */
	this.databaseName = record.database_name;
	
	/**
	 * Gets the filter field name
	 * @type {String}
	 */
	this.filterFieldName = record.filter_field_organization;
	
	/**
	 * The company name of this owner
	 * @type {String}
	 */
	this.companyName = record.company_name;
	
	/**
	 * The number of licenses of this owner
	 * @type {Number}
	 */
	this.numberOfLicenses = record.license_amount;
	
	/**
	 * The minimum password length for this owner
	 * @type {Number}
	 */
	this.passwordMinimumLength = record.password_min_lenght;
	
	/**
	 * The number of days a password is valid before it has to be changed
	 * @type {Number}
	 */
	this.passwordValidity = record.password_num_let;
	
	/**
	 * If true, the password must contain letters and numbers
	 * @type {Boolean}
	 */
	this.passwordMustContainNumbersAndLetters = record.password_num_let ? true : false;
	
	/**
	 * Number of maximum login attempts before a user is locked
	 * @type {Number}
	 */
	this.maximumNumberOfLoginAttempts = record.password_times_wrong;
	
	/**
	 * The date the account was registered
	 * @type {Date}
	 */
	this.registrationDate = record.registration_date;
	
	/**
	 * The date the account was activated
	 * @type {Date}
	 */
	this.activationDate = record.activation_date;
	
	/**
	 * Returns all organizations of this owner as an array
	 * 
	 * @return {Array<Organization>} organizations
	 */
	this.getOrganizations = function() {
		/** @type {Array<Organization>} */
		var result = new Array();
		if (utils.hasRecords(record.sec_owner_to_sec_organization)) {
			/** @type {JSFoundset<db://>} */
			for (var i = 1; i <= record.sec_owner_to_sec_organization.getSize(); i++) {
				var organizationRecord = record.sec_owner_to_sec_organization.getRecord(i);
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
		for(var i = 1; i <= record.sec_owner_to_sec_user.getSize(); i++){
			result.push(new User(record.sec_owner_to_sec_user.getRecord(i)));
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
	
	Object.defineProperty(this, "name", {
        set: function (x) {
            record.name = x;
            save(record);
        },
        get: function () {
            return record.name;
        }
    });	
	
	Object.defineProperty(this, "ownerId", {
        get: function () {
            return record.owner_id;
        }
    });		
	
	Object.defineProperty(this, "filterFieldName", {
        get: function () {
            return record.filter_field_organization;
        },
		set: function(fieldName) {
			record.filter_field_organization = fieldName;
			save(record);
		}
    });		
	
	Object.defineProperty(this, "passwordMinimumLength", {
        get: function () {
            return record.password_min_lenght;
        },
		set: function(length) {
			record.password_min_lenght = length;
			save(record);
		}
    });		
	
	Object.defineProperty(this, "passwordValidity", {
        get: function () {
            return record.password_renew;
        },
		set: function(days) {
			record.password_renew = days;
			save(record);
		}
    });			
	
	Object.defineProperty(this, "passwordMustContainNumbersAndLetters", {
        get: function () {
            return record.password_num_let;
        },
		set: function(value) {
			record.password_num_let = value ? 1 : 0;
			save(record);
		}
    });	
	
	Object.defineProperty(this, "companyName", {
        get: function () {
            return record.company_name;
        },
		set: function(value) {
			record.company_name = value;
			save(record);
		}
    });	
	
	Object.defineProperty(this, "maximumNumberOfLoginAttempts", {
        get: function () {
            return record.password_times_wrong;
        },
		set: function(value) {
			if (value >= 0) {
				record.password_times_wrong = value;
				save(record);
			}
		}
    });	
	
	Object.defineProperty(this, "databaseName", {
        get: function () {
            return record.database_name;
        },
		set: function(value) {
			record.database_name = value;
			save(record);
		}
    });	
	
	Object.defineProperty(this, "numberOfLicenses", {
        get: function () {
            return record.license_amount;
        },
		set: function(value) {
			if (value >= 0) {
				record.license_amount = value;
				save(record);
			}
		}
    });	
	
	Object.defineProperty(this, "registrationDate", {
        get: function () {
            return record.registration_date;
        },
		set: function(value) {
			if (value instanceof Date) {
				record.registration_date = value;
				save(record);
			}
		}
    });	
	
	Object.defineProperty(this, "activationDate", {
        get: function () {
            return record.activation_date;
        },
		set: function(value) {
			if (value instanceof Date) {
				record.activation_date = value;
				save(record);
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
 * Wrapper class for db:/svy_framework/sec_module record
 * 
 * @param {JSRecord<db:/svy_framework/sec_module>} moduleRecord
 * @constructor 
 * @properties={typeid:24,uuid:"C1138192-FBC2-4F1D-A7BF-8D4B13F3379B"}
 */
function Module(moduleRecord){
	var record = moduleRecord;
	
	/**
	 * The module PK ID
	 * @type {UUID}
	 */
	this.id = record.module_id;
	
	Object.defineProperty(this,'id',{
		get:function(){return record.module_id;}
	});
	
	/**
	 * The name of the module. Must be unique.
	 * @type {String}
	 */
	this.name = record.name;
	
	Object.defineProperty(this,'name',{
		get:function(){return record.name},
		set:function(x){
			if(!x){
				throw new scopes.modUtils$exceptions.IllegalArgumentException('Name is required');
			}
			if(!scopes.modUtils.isValueUnique(record,'name',x)){
				throw new scopes.modUtils$exceptions.ValueNotUniqueException(record,'name');
			}
			record.name = x;
			save(record);
		}
	});
	
	/**
	 * Description of the module
	 * @type {String}
	 */
	this.description = record.description;
	
	Object.defineProperty(this,'description',{
		get:function(){return record.description},
		set:function(x){
			record.description = x;
			save(record);
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
		var fs = record.sec_module_to_sec_owner_in_module;
		for (var i = 1; i <= fs.getSize(); i++) {
			var ownerRecord = fs.getRecord(i);
			if (utils.hasRecords(ownerRecord.sec_owner_in_module_to_sec_owner)) {
				result.push(new Owner(ownerRecord));
			}
		}
		return result;
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
 * 
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"E68458CB-E38A-4039-AE02-6117088D5AA4"}
 */
function Application(applicationRecord){
	var record = applicationRecord;
	
	/**
	 * The application ID
	 * @type {UUID}
	 */
	this.id = record.application_id;
	Object.defineProperty(this, 'id', {
			get: function() {
				return record.application_id
			}
		});
	
	/**
	 * The name of the application. Must be unique in database
	 * @type {String}
	 */
	this.name = record.application_name;
	Object.defineProperty(this, 'name', {
			get: function() {
				return record.application_name;
			},
			set: function(x) {
				if (!x) {
					throw new scopes.modUtils$exceptions.IllegalArgumentException('Name is required');
				}
				if (!scopes.modUtils.isValueUnique(record, 'application_name', x)) {
					throw new scopes.modUtils$exceptions.ValueNotUniqueException(record, 'application_name');
				}
				record.application_name = x;
				save(record);
			}
		});
	
	/**
	 * The name of the corresponding servoy solution
	 * @type {String}
	 */
	this.servoySolutionName = record.servoy_solution_name;
	Object.defineProperty(this, 'servoySolutionName', {
			get: function() {
				return record.servoy_solution_name;
			},
			set: function(x) {
				if (!x) {
					throw new scopes.modUtils$exceptions.IllegalArgumentException('solution name is required');
				}
				record.servoy_solution_name = x;
				save(record);
			}
	});
	
	/**
	 * Gets the deeplink URL for the web client
	 * @return {String}
	 */
	this.getDeepLinkWebClient = function(){
		return scopes.modUtils$system.getSolutionDeepLinkSmartClient(record.servoy_solution_name);
	}
	
	/**
	 * Gets the deep link URL for the smart client
	 * @return {String}
	 */
	this.getDeepLinkSmartClient = function(){
		return scopes.modUtils$system.getSolutionDeepLinkSmartClient(record.servoy_solution_name);
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
		if (!record.prov_application_to_prov_application_modules.newRecord()) {
			throw new scopes.modUtils$exceptions.NewRecordFailedException('Failed to create record', record.prov_application_to_prov_application_modules);
		}
		record.prov_application_to_prov_application_modules.module_id = moduleID;
		save(record.prov_application_to_prov_application_modules);
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
		for (var i = 1; i <= record.prov_application_to_prov_application_modules.getSize(); i++) {
			var link = record.prov_application_to_prov_application_modules.getRecord(i);
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
		var modules = record.prov_application_to_prov_application_modules;
		for (var i = 1; i <= modules.getSize(); i++) {
			var module = modules.getRecord(i);
			if (module.module_id == moduleRecordOrID) {
				if (!modules.deleteRecord(module)) {
					throw new scopes.modUtils$exceptions.DeleteRecordFailedException('Failed to delete record', module);
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
		for(var i = 1; i <= record.prov_application_to_prov_application_modules.getSize(); i++){
			var id = record.prov_application_to_prov_application_modules.getRecord(i).module_id;
			modules.push(new Module(id));
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
		throw new scopes.modUtils$exceptions.SaveDataFailedException('Save data failed:' + record.exception, record);
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
	
	/** @type {JSFoundset<db:/svy_framework/sec_owner>} */
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
 * @param {String} serverName
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
	if (!serverName) {
		serverName = globals.nav_db_framework;
	}
	
	/** @type {QBSelect<db:/svy_framework/sec_owner>} */
	var query = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_owner");
	query.result.addPk();
	query.where.add(query.columns.name.eq(ownerName));
	
	/** @type {JSFoundset<db:/svy_framework/sec_owner>} */
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
	var navDatabase = globals.nav_db_framework
	databaseManager.removeTableFilterParam(navDatabase, "frameworkdb_organization_filter");
	success = databaseManager.addTableFilterParam(navDatabase, "nav_user_required_field", "organization_id", "IN", [organizationId, globals.zero_uuid], "frameworkdb_organization_filter");
	if (!success) {
		application.output("Failed to add required field filter for database \"" + navDatabase + "\"", LOGGINGLEVEL.ERROR);
	} else {
		application.output("Created required field filter for database \"" + navDatabase + "\"", LOGGINGLEVEL.DEBUG);
	}
	
	// filter i18n
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
	
	/** @type {JSFoundset<db:/svy_framework/sec_table_filter>} */
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
			var global = record.filter_value.match(/(globals\.\w*)/)[0];
			value = record.filter_value.replace(/(globals\.\w*)/, eval(global));
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
	var orgId = organization.orgId;
	var userId = user.userId;
	
	/** @type {QBSelect<db:/svy_framework/sec_user_org>} */
	var userQuery = databaseManager.createSelect("db:/" + globals.nav_db_framework + "/sec_user_org");
	userQuery.result.addPk();
	userQuery.where.add(userQuery.columns.organization_id.eq(orgId));
	userQuery.where.add(userQuery.columns.user_id.eq(userId));
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
 *
 * @properties={typeid:24,uuid:"BE06D0A6-A86F-426E-ABE6-610D46175DF6"}
 */
function PasswordRuleViolationException(record, message) {
	/**
	 * The record where the problem occured
	 * @type {JSRecord<db:/svy_framework/sec_user>}
	 */
	this.record = record;
	
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
	var query = '\
					SELECT DISTINCT	surd.security_key_id \
					FROM sec_user_right surd \
					WHERE (\
						surd.security_key_id IN (\
							SELECT	ssk.security_key_id  \
							FROM	sec_security_key ssk, \
									sec_user_right sur, \
									sec_user_in_group sug \
							WHERE	ssk.security_key_id = sur.security_key_id \
							AND		sur.group_id = sug.group_id \
							AND		sug.user_org_id = ? \
							AND		(\
								ssk.module_id IS NULL OR ssk.module_id IN (\
									SELECT	som.module_id \
									FROM	sec_owner_in_module som \
									WHERE	som.owner_id = ? \
									AND		som.start_date <= ? \
									AND		som.end_date >= ? \
								)\
							)\
						)\
						AND NOT EXISTS (\
							SELECT	* \
							FROM	sec_user_right surd2, sec_user_in_group sug2 \
							WHERE	surd.security_key_id = surd2.security_key_id \
							AND		(\
								surd2.user_org_id = ? \
								OR (\
									surd2.group_id = sug2.group_id\
									AND sug2.user_org_id = ?\
								)\
							)\
							AND		surd2.is_denied = 1 \
						) \
					)\
					OR	surd.user_org_id = ? \
					AND	(\
						surd.is_denied IS NULL \
						OR	surd.is_denied = 0 \
					)\
					UNION\
					(\
						SELECT	ssk2.security_key_id  \
						FROM	sec_security_key ssk2, \
								prov_package_modules ppm,\
								prov_owner_packages pop \
						WHERE	ssk2.module_id = ppm.module_id \
						AND		ppm.package_id = pop.package_id \
						AND 	pop.start_date <= ? \
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
								FROM 	sec_user_right sur5, \
										sec_user_in_group uig5 \
								WHERE 	sur5.group_id = uig5.group_id \
								AND 	sur5.is_denied = 1 \
							)\
						)\
					)';
	
	var queryArgs = new Array();
	queryArgs[0] = userOrgId;
	queryArgs[1] = ownerId;
	queryArgs[2] = application.getServerTimeStamp();
	queryArgs[3] = application.getServerTimeStamp();
	queryArgs[4] = userOrgId;
	queryArgs[5] = userOrgId;
	queryArgs[6] = userOrgId;
	queryArgs[7] = application.getServerTimeStamp();
	queryArgs[8] = application.getServerTimeStamp();
	queryArgs[9] = ownerId;
	queryArgs[10] = userOrgId;
	
	var dataset = databaseManager.getDataSetByQuery(serverName, query, queryArgs, -1);
	
	/** @type {JSFoundSet<db:/svy_framework/sec_security_key>} */
	var keyFs = databaseManager.getFoundSet("db:/" + globals.nav_db_framework + "/sec_security_key");
	keyFs.loadRecords(dataset);
	
	var result = new Array();
	for (var i = 1; i <= keyFs.getSize(); i++) {
		var record = keyFs.getRecord(i);
		var key = new Key(record.security_key_id, record.name, record.description, record.owner_id, record.module_id);
		result.push(key);
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
 * Returns the key with the given name or UUID or null if not found
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
function getKey(key) {
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
		throw new scopes.modUtils$exceptions.IllegalArgumentException('Key ID and name cannot be null');
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
 * Set exception prototypes to super class
 * 
 * @protected  
 * 
 * @properties={typeid:35,uuid:"A2432865-B484-4ABD-9DA4-3FA1E713D328",variableType:-4}
 */
var init = function() {
	PasswordRuleViolationException.prototype = 	new scopes.modUtils$exceptions.IllegalArgumentException("Password rule violated");
}()
