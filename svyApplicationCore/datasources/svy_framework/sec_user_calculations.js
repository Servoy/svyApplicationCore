/**
 * @properties={type:93,typeid:36,uuid:"B3BD8849-FF71-4FFD-AD81-8A4598A1B7B9"}
 */
function max_password_start_date()
{
	if (utils.hasRecords(sec_user_to_sec_user_password)) {
		return sec_user_to_sec_user_password.max_start_date;
	} else {
		return null;
	}
}
