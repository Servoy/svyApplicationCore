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
 * 
 * This base implementation does nothing to the form, but does iterate over visible forms in tabpanels and split panes calling their updateUI implementations,
 * ...which if inherited from this form will be recursive to include all visible forms beneath the form which was called.
 * 
 * TODO: The recursive invocation through form-in-tab/split panels can cause unnecessary calls to updateUI. We should investigate ways to reduce to one call per thread, perhaps using continuations to defer to the end?
 * 
 * @author Sean
 * @since 2012.10.03
 * @properties={typeid:24,uuid:"811259CD-C45B-495E-9D64-2A9F3D97F038"}
 */
function updateUI(){
	// TODO: Invoke in sub forms
	if(!this['elements']) return;													//	Sometimes elements is undefined when changes broadcast from developer
	
	var form;
	var updateUIMethod = 'updateUI';
	for(var i=0; i<elements.length; i++){											//	Iterate over elements
		var e = elements[i]	
		var type = (e.getElementType) ? e.getElementType() : null;					//	get the element type
		if(type == ELEMENT_TYPES.TABPANEL){											//	operating only on tab panels
			form = forms[e.getTabFormNameAt(e.tabIndex)];							//	get the selected tab form
			if(form && form[updateUIMethod]){										//	update its UI
				form[updateUIMethod]();
			}
		} else if(type == ELEMENT_TYPES.SPLITPANE){									//	operate only on split pane
			form = e.getLeftForm();													//	update left form UI
			if(form && form[updateUIMethod]){
				form[updateUIMethod]();
			}
			form = e.getRightForm();												//	update right form UI
			if(form && form[updateUIMethod]){
				form[updateUIMethod]();
			}
		}
	}

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
