/**
 * Handle record selected.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"A0CA6456-5EF1-4EE9-B245-95BE346E3FC8"}
 */
function onRecordSelection(event) {
	updateUI();
}

/**
 * Provides implementations of svyBase the opportunity to update the view whenever the model is believed to have changed
 * Implementations of this method should NOT update the model
 * Implementations should be safe for frequent and public invocations
 * @properties={typeid:24,uuid:"811259CD-C45B-495E-9D64-2A9F3D97F038"}
 */
function updateUI(){
	// TODO: Invoke in sub forms
}

/**
 * Callback method for when form is shown.
 *
 * @param {Boolean} firstShow form is shown first time after load
 * @param {JSEvent} event the event that triggered the action
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"C16ADCD3-8E46-4E96-9572-D474FB904C1F"}
 */
function onShow(firstShow, event) {
	updateUI();
}

/**
 * Callback method form when editing is stopped, return false if the record fails to validate then the user cannot leave the record.
 *
 * @param {JSRecord} record record being saved
 * @param {JSEvent} event the event that triggered the action
 *
 * @returns {Boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"43B70EDD-007F-4975-B338-E02AAF9F4453"}
 */
function onRecordEditStop(record, event) {
	updateUI();
	return true
}
