
/**
 * SpinnerNumericField.js
 * file javascript
 * @copyright 2010 - 2018 BookingLive Software Limited
 */

bl.SpinnerNumericField = {
    init: function() {
        $('input.spinnernumeric').spinner({
            stop: function (event, ui) {
                clearTimeout(timer)
                timer = setTimeout('bl.BookingPage.UpdateSummaryInternal();', 1000);
            }
        });
    }
}
var timer = '';
jQuery(document).ready(function(){
    bl.SpinnerNumericField.init();
});


