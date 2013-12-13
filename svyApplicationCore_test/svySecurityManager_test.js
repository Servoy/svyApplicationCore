/**
 * Setup starts a transaction to prevent data mess
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"592BCBFA-48BC-4DE9-82B9-E22E39D2B1BA"}
 */
function setUp() {
	databaseManager.startTransaction();
}

/**
 * Run tests
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"777C1FF8-B3CF-43FA-8ACC-4E603C2E6EDD"}
 */
function test_securityManager() {
	owner();
	organization();
	user();
	keys();
	groups();
}

/**
 * Tests for owner
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"491C0CEC-7028-4053-854D-EA1E6D02CA7D"}
 */
function owner() {
	// Create a new owner
	var newOwner = scopes.svySecurityManager.createOwner("testOwner");
	jsunit.assertEquals("Create test owner", "testOwner", newOwner.name);
	
	// Creating a new owner with the same name should fail
	try {
		scopes.svySecurityManager.createOwner("testOwner");
		jsunit.assertEquals("Cannot create an owner with the same name", 1, 2);				
	} catch (e) {
		jsunit.assertNotNull("Cannot create an owner with the same name", e);
	}
	
	// fake a login
	globals.svy_sec_lgn_owner_id = newOwner.ownerId.toString();
	
	// Set some password rules
	newOwner.passwordMinimumLength = 5;
	jsunit.assertEquals("Set passwordMinimumLength", 5, newOwner.passwordMinimumLength);
	newOwner.passwordMustContainNumbersAndLetters = true;
	jsunit.assertEquals("Set passwordMustContainNumbersAndLetters", true, newOwner.passwordMustContainNumbersAndLetters);
}

/**
 * Tests for organization
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"094BD092-CE6A-4016-8BDF-1DD0CD4AE8E2"}
 */
function organization() {
	var newOwner = scopes.svySecurityManager.getOwner("testOwner");
	var newOrganization = newOwner.createOrganization("testOrganization");
	jsunit.assertEquals("Create test organization", "testOrganization", newOrganization.name);
	jsunit.assertEquals("Verify owner name of new organization", "testOwner", newOrganization.getOwner().name);
	try {
		scopes.svySecurityManager.createOrganization("testOrganization");
		jsunit.assertEquals("Cannot create an organization with the same name", 1, 2);		
	} catch (e) {
		jsunit.assertNotNull("Cannot create an organization with the same name", e);
	}
	// this should be created for the "logged in" owner
	var newOrganization2 = scopes.svySecurityManager.createOrganization("testOrganization2");
	jsunit.assertEquals("Create another test organization", "testOrganization2", newOrganization2.name);
	jsunit.assertEquals("Verify owner name of other new organization", "testOwner", newOrganization2.getOwner().name);
	
	var allOrganizations = newOwner.getOrganizations();
	jsunit.assertEquals("Owner should have 2 organizations", 2, allOrganizations.length);
	for (var i = 0; i < allOrganizations.length; i++) {
		jsunit.assertTrue("Organization names check", ["testOrganization", "testOrganization2"].indexOf(allOrganizations[i].name) >= 0);
	}
}

/**
 * Tests for user
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"59FD6CAD-528A-49C4-8989-B06D4DBC6A93"}
 */
function user() {
	var newOwner = scopes.svySecurityManager.getOwner("testOwner");
	var newUser = newOwner.createUser("testUser");
	jsunit.assertEquals("Create test user", "testUser", newUser.userName);
	jsunit.assertTrue("new user has no valid password", newUser.isPasswordExpired());
	var testPassword;
	try {
		testPassword = scopes.svySecurityManager.checkPasswordRules("testUser", "a1", newOwner.ownerId);
		jsunit.assertEquals("Password too short exception", 1, 2);		
	} catch (/** @type {scopes.svySecurityManager.PasswordRuleViolationException} */ e) {
		jsunit.assertNotNull("Password is too short", e);
		jsunit.assertEquals("Password too short exception", i18n.getI18NMessage('svy.fr.dlg.password_min_length', [5]), e.getMessage());
	}
	try {
		testPassword = scopes.svySecurityManager.checkPasswordRules("testUser", "a", newOwner.ownerId);
		jsunit.assertEquals("Password must contain numbers and letters", 1, 2);
	} catch (/** @type {scopes.svySecurityManager.PasswordRuleViolationException} */ e) {
		jsunit.assertNotNull("Password must contain numbers and letters", e);
		jsunit.assertEquals("Password must contain numbers and letters exception", i18n.getI18NMessage('svy.fr.dlg.password_contain_letters_numbers'), e.getMessage());
	}
	try {
		testPassword = scopes.svySecurityManager.checkPasswordRules("testUser", "xxxx1", newOwner.ownerId);
		jsunit.assertTrue("Password should be valid", testPassword);				
	} catch (/** @type {scopes.svySecurityManager.PasswordRuleViolationException} */ e) {
	}
	newUser.changePassword("xxxx1");
	jsunit.assertTrue("Password set", testPassword);
	
	jsunit.assertFalse("new user has valid password", newUser.isPasswordExpired());
	jsunit.assertFalse("new user does not require a new password", newUser.requireNewPassword);
	jsunit.assertTrue("Password is correct", newUser.isPasswordValid("xxxx1"));
	jsunit.assertFalse("Password is correct", newUser.isPasswordValid("abc"));
	
	// user should have no organizations
	var userOrgs = newUser.getOrganizations();
	jsunit.assertEquals("User should have no organizations", 0, userOrgs.length);
	
	newUser.addToOrganization(newOwner.getOrganization("testOrganization"));
	userOrgs = newUser.getOrganizations();
	jsunit.assertEquals("User should have 1 organization", 1, userOrgs.length);
	
	newUser.addToOrganization(newOwner.getOrganization("testOrganization2"));
	userOrgs = newUser.getOrganizations();
	jsunit.assertEquals("User should have 2 organizations", 2, userOrgs.length);
	
	newUser.lockUser();
	jsunit.assertTrue("User should be locked", newUser.isLocked());
	
	newUser.unlockUser();
	jsunit.assertFalse("User should be locked", newUser.isLocked());
	
	try {
		newUser.emailAddress = "huhu";
		jsunit.assertEquals("Email address is not valid", 1, 2);
	} catch (e) {
		jsunit.assertNotNull("Email address is not valid", e);
	}

	newUser.emailAddress = "huhu@huhu.com";
	jsunit.assertEquals("Email address set", "huhu@huhu.com", newUser.emailAddress);
	
	var otherNewUser;
	try {
		otherNewUser = newOwner.createUser("testUser");
		jsunit.assertEquals("Creating a user with a name that already exists", 1, 2);		
	} catch (e) {
		jsunit.assertNotNull("Creating a user with a name that already exists", e);
	}
	
	// Create another user and assign to organization in a different way
	otherNewUser = newOwner.createUser("testUser2");
	var allUsers = newOwner.getUsers();
	jsunit.assertEquals("Owner has 2 users", 2, allUsers.length);
	newOwner.getOrganization("testOrganization").addUser(otherNewUser);
	jsunit.assertEquals("Organization has 2 users", 2, newOwner.getOrganization("testOrganization").getUsers().length);
	jsunit.assertEquals("Organization2 has 1 users", 1, newOwner.getOrganization("testOrganization2").getUsers().length);
	
	try {
		scopes.svySecurityManager.createUser("testUser", "abcdef1", newOwner, newOwner.getOrganization("testOrganization"));
		jsunit.assertEquals("User name not unique", 1, 2);
	} catch (e) {
		jsunit.assertTrue("User name not unique", e instanceof scopes.svyDataUtils.ValueNotUniqueException);
	}

	try {
		scopes.svySecurityManager.createUser("testUser3", "a", newOwner, newOwner.getOrganization("testOrganization"));
		jsunit.assertEquals("Password rule violated", 1, 2);
	} catch (e) {
		jsunit.assertTrue("Password rule violated", e instanceof scopes.svySecurityManager.PasswordRuleViolationException);
	}
	
	// This should work now
	scopes.svySecurityManager.createUser("testUser3", "xxxxx2", newOwner, newOwner.getOrganization("testOrganization"));
	jsunit.assertEquals("Organization has 3 users", 3, newOwner.getOrganization("testOrganization").getUsers().length);

}

/**
 * Tests for security keys
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"5D4755DA-A373-4386-87B2-AD4BAD2E057E"}
 */
function keys() {
	var newKey = scopes.svySecurityManager.createKey("testKey", "test key description");
	jsunit.assertEquals("Key added", "testKey", newKey.name);
	newKey = scopes.svySecurityManager.createKey("testKey2", "test key description");
	jsunit.assertEquals("Second key added", "testKey2", newKey.name);
	try {
		newKey = scopes.svySecurityManager.createKey("testKey", "test key description");
		jsunit.assertEquals("Key name not unique", 1, 2);
	} catch(e) {
		jsunit.assertTrue("Key name not unique", e instanceof scopes.svyDataUtils.ValueNotUniqueException);
	}
	newKey = scopes.svySecurityManager.createKey("testKey3", "test key description");
	jsunit.assertEquals("Third key added", "testKey3", newKey.name);
}

/**
 * Tests for groups
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"036D4226-BFF2-4F1B-8BA5-7029B7909BAE"}
 */
function groups() {
	var newOwner = scopes.svySecurityManager.getOwner("testOwner");
	var newGroup = scopes.svySecurityManager.createGroup("testGroup", newOwner);
	jsunit.assertEquals("Owner group added", 1, newOwner.getGroups().length);
	jsunit.assertEquals("Owner group added", "testGroup", newGroup.name);
	
	var otherNewGroup;
	try {
		otherNewGroup = newOwner.createGroup("testGroup");
		jsunit.assertEquals("Group name not unique", 1, 2);
	} catch(e) {
		jsunit.assertTrue("Group name not unique", e instanceof scopes.svyDataUtils.ValueNotUniqueException);
	}
	
	otherNewGroup = newOwner.createGroup("testGroup2");
	jsunit.assertEquals("Second owner group added", 2, newOwner.getGroups().length);
	jsunit.assertEquals("Second owner group added", "testGroup2", otherNewGroup.name);
	
	var keyToAdd = scopes.svySecurityManager.getKey("testKey");
	newGroup.addKey(keyToAdd);
	jsunit.assertEquals("Group has 1 key", 1, newGroup.getKeys().length);
	
	keyToAdd = scopes.svySecurityManager.getKey("testKey2");
	newGroup.addKey(keyToAdd);
	jsunit.assertEquals("Group has 2 keys", 2, newGroup.getKeys().length);
	
	var newOrganization = newOwner.getOrganization("testOrganization");
	var newUser = newOrganization.getUser("testUser");
	newGroup.addUser(newUser,newOrganization);
	jsunit.assertEquals("Group has 1 user", 1, newGroup.getUsers().length);
	jsunit.assertEquals("Group has 1 user", 1, newGroup.getUsers(newOrganization).length);
	
	var userKeys = newUser.getKeys(newOrganization);
	jsunit.assertEquals("User has 2 keys through the group", 2, userKeys.length);
	
	// directly assign a key to this user
	newUser.assignKey(newOrganization, scopes.svySecurityManager.getKey("testKey3"));
	jsunit.assertEquals("User has 1 key directly assigned", 3, newUser.getKeys(newOrganization).length);
	
	jsunit.assertTrue("hasKey testKey2", newUser.hasKeyName("testKey2", newOrganization));
	jsunit.assertFalse("hasKey testKey2", newUser.hasKeyName("testKey4", newOrganization));
}


/**
 * Tear down rolls back all changes
 * 
 * @private
 * 
 * @version 5.0
 * @since 
 * @author patrick
 *
 * @properties={typeid:24,uuid:"FE1752F3-A865-493B-BAD9-8178D028E28E"}
 */
function tearDown() {
	databaseManager.rollbackTransaction();
}