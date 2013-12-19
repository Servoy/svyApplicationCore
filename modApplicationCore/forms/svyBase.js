/**
 * Import Event Manager for convenience
 * @private 
 * @properties={typeid:35,uuid:"59000B5E-2BB2-43A5-8DFF-3801818EF317",variableType:-4}
 */
var eventManager = scopes.svyEventManager;

/**
 * Enumeration of event type constants for forms.
 * Listeners can be attached to form events
 * 
 * @public 
 * @enum
 * @see forms.svyBase.addListener
 * 
 * @properties={typeid:35,uuid:"E74C65B2-2C50-49DE-971B-2660005C9ACE",variableType:-4}
 */
var FORM_EVENT_TYPES = { //Some of these are backed up by constants on JS(DND)Event
	DRAG:'drag',
	DRAG_END:'drag-end',
	DRAG_OVER:'drag-over',
	DROP:'drop',
	ELEMENT_FOCUS_GAINED:'element-focus-lost',
	ELEMENT_FOCUS_LOST:'element-focus-lost',
	LOAD:'load',
	HIDE:'hide',
	RECORD_EDIT_START:'record-edit-start',
	RECORD_EDIT_STOP:'record-edit-stop',
	RECORD_SELECTION:'record-selection',
	RESIZE:'resize',
	SHOW:'show',
	UNLOAD:'unload'
};

/**
 * Provides implementations of svyBase the opportunity to update the view whenever the model is believed to have changed
 * Implementations of this method should NOT update the model
 * Implementations should be safe for frequent and public invocations
 * 
 * This base implementation does nothing to the form
 * 
 * @protected
 * @author Sean
 * @properties={typeid:24,uuid:"811259CD-C45B-495E-9D64-2A9F3D97F038"}
 */
function updateUI(){
	//	to be overridden
}

/**
 * Add callback handler for form-based events.
 * Callback receives the forwarded event as an argument
 * 
 * @public 
 * @author Sean
 * 
 * @param {Function} listener
 * @param {String} eventType
 * 
 * @see {@link #FORM_EVENT_TYPES}
 * 
 * @properties={typeid:24,uuid:"D8096A41-2CA9-4D4B-BE60-8302D0CE6676"}
 */
function addListener(listener, eventType){
	eventManager.addListener(this,eventType,listener);	
}

/**
 * Remove a listener for form-based events
 * 
 * @param {Function} listener to be removed
 * @param {String} eventType
 *
 * @public 
 * @see {@link #FORM_EVENT_TYPES}
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"3F1F7F10-0595-4638-A726-17B937866047"}
 */
function removeListener(listener, eventType){
	eventManager.removeListener(this,eventType,listener);
}

/**
 * Handle start of a drag, it can set the data that should be transfered and should return a constant which dragndrop mode/modes is/are supported.
 *
 * Should return a DRAGNDROP constant or a combination of 2 constants:
 * DRAGNDROP.MOVE if only a move can happen,
 * DRAGNDROP.COPY if only a copy can happen,
 * DRAGNDROP.MOVE|DRAGNDROP.COPY if a move or copy can happen,
 * DRAGNDROP.NONE if nothing is supported (drag should not start).
 * 
 *
 * @protected
 * 
 * @param {JSDNDEvent} event the event that triggered the action
 *
 * @returns {Number}
 *
 * @example 
 * @properties={typeid:24,uuid:"BD554093-A048-46B8-83C8-D9F62E4962B5"}
 */
function onDrag(event) {
	updateUI();
	fireEvent(FORM_EVENT_TYPES.DRAG, event);
	return DRAGNDROP.NONE
}

/**
 * Handle end of a drag.
 *
 * @param {JSDNDEvent} event the event that triggered the action
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"1E4919FD-83D6-4CF9-9AA4-82286B0E3C0D"}
 */
function onDragEnd(event) {
	updateUI();
	fireEvent(FORM_EVENT_TYPES.DRAG_END, event);
}

/**
 * Handle a drag over. Determines of a drop is allowed in this location.
 * Return true is drop is allowed, otherwise false.
 *
 * @param {JSDNDEvent} event the event that triggered the action
 *
 * @returns {Boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"EBC2F97A-EE17-4A12-8CB2-8DF7C48FF192"}
 */
function onDragOver(event) {
	updateUI();
	var permitted = fireEvent(FORM_EVENT_TYPES.DRAG_OVER, event, true);
	return permitted;
}

/**
 * Handle a drop.
 * Return true if drop has been performed successfully, otherwise false.
 * 
 * @param {JSDNDEvent} event the event that triggered the action
 *
 * @returns {Boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"DF4DA119-AE68-44D6-984C-3563F6BD47CA"}
 */
function onDrop(event) {
	updateUI();
	var permitted = fireEvent(FORM_EVENT_TYPES.DROP, event, true);
	return permitted;
}

/**
 * Handle focus gained event of an element on the form. Return false when the focus gained event of the element itself shouldn't be triggered.
 * 
 * @param {JSEvent} event the event that triggered the action
 *
 * @returns {Boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"FECD0294-9040-40F5-A40A-AC59C98B6127"}
 */
function onElementFocusGained(event) {
	updateUI();
	var permitted = fireEvent(FORM_EVENT_TYPES.ELEMENT_FOCUS_GAINED, event, true);
	return permitted;
}

/**
 * Handle focus lost event of an element on the form. Return false when the focus lost event of the element itself shouldn't be triggered.
 * 
 * @param {JSEvent} event the event that triggered the action
 *
 * @returns {Boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"A75AF1BB-E748-4025-A362-A844C7AA7DC0"}
 */
function onElementFocusLost(event) {
	updateUI();
	var permitted = fireEvent(FORM_EVENT_TYPES.ELEMENT_FOCUS_LOST, event, true);
	return permitted;
}

/**
 * Handle hide window.
 * TODO Add support for VEOTABLE events
 * @param {JSEvent} event the event that triggered the action
 *
 * @returns {Boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"E32455DA-B6F2-45CB-BAEA-FA9952612CEE"}
 */
function onHide(event) {
	var permitted = fireEvent(FORM_EVENT_TYPES.HIDE, event, true);
	return permitted;
}

/**
 * Callback method when form is (re)loaded.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"46694C05-A39B-4069-A027-D3A14E1D4212"}
 */
function onLoad(event) {
	//	TODO Add support for a global form (re) loaded event in addition to registered listeners
	fireEvent(FORM_EVENT_TYPES.LOAD,event);
}

/**
 * Callback method form when editing is started.
 * 
 * @param {JSEvent} event the event that triggered the action
 *
 * @returns {Boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"48C740DB-AE56-4E9F-8376-064D0F44D836"}
 */
function onRecordEditStart(event) {
	updateUI();
	var permitted = fireEvent(FORM_EVENT_TYPES.RECORD_EDIT_START, event, true);
	return permitted;
}

/**
 * Handle onRecordEditStop event binding to form
 * - Calls updateUI
 * - Notifies any event listeners for the RECORD_EDIT_STOP event
 * - Return false if the record fails to validate then the user cannot leave the record.
 * 
 * 
 * @param {JSRecord} record record being saved
 * @param {JSEvent} event the event that triggered the action
 * @returns {Boolean} Always true in svyBase
 *
 * @protected
 * @see {@link #FORM_EVENT_TYPES}
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"43B70EDD-007F-4975-B338-E02AAF9F4453"}
 */
function onRecordEditStop(record, event) {
	updateUI();
	var permitted = fireEvent(FORM_EVENT_TYPES.RECORD_EDIT_STOP, event, true);
	return permitted;
}

/**
 * Handle onRecordSelection event binding to form
 * - Calls updateUI
 * - Notifies any event listeners for the RECORD_SELECTION event
 * 
 * @param {JSEvent} event the event that triggered the action
 *
 * @protected
 * @see {@link #FORM_EVENT_TYPES}
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"A0CA6456-5EF1-4EE9-B245-95BE346E3FC8"}
 */
function onRecordSelection(event) {
	updateUI();
	fireEvent(FORM_EVENT_TYPES.RECORD_SELECTION, event);
}

/**
 * Callback method when form is resized.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"EBABA192-262C-4615-904A-A452D07F9ABC"}
 */
function onResize(event) {
	updateUI();	
	fireEvent(FORM_EVENT_TYPES.RESIZE, event);
}

/**
 * Handle onShow event binding to form
 * - Calls updateUI
 * - Notifies any event listeners for the SHOW event
 *  
 * @param {Boolean} firstShow form is shown first time after load
 * @param {JSEvent} event the event that triggered the action
 *
 * @protected
 * @see {@link #FORM_EVENT_TYPES}
 * @author Sean
 * 
 * @properties={typeid:24,uuid:"C16ADCD3-8E46-4E96-9572-D474FB904C1F"}
 */
function onShow(firstShow, event) {
	updateUI();
	fireEvent(FORM_EVENT_TYPES.SHOW, event);
}

/**
 * Callback method when form is destroyed.
 *
 * @param {JSEvent} event the event that triggered the action
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"94A128E1-5822-4982-8A79-1D648CE1769C"}
 */
function onUnload(event) {
	fireEvent(FORM_EVENT_TYPES.UNLOAD, event);
}

/**
 * Convenience method: Fires an event
 * 
 * @private
 *  
 * @param {String} eventType
 * @param {*} [data] Event args
 * @param {Boolean} [isVetoable] Optionally specify if an event can be vetoed. A listener may veto an event by returning false. Subsequent propagation of the event is then cancelled
 * 
 * @return {Boolean} True unless event was vetoed
 * @properties={typeid:24,uuid:"24330B43-0D04-4896-9A33-35D1023E01A9"}
 */
function fireEvent(eventType, data, isVetoable){
	return eventManager.fireEvent(this,eventType, data, isVetoable);
}
