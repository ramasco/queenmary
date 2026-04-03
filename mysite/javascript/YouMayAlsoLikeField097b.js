
/**
* YouMayAlsoLikeField.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*//**
 * Created with JetBrains PhpStorm.
 * User: nivankafonseka
 * Date: 8/10/13
 * Time: 1:05 PM
 * To change this template use File | Settings | File Templates.
 */

jQuery(document).ready(function(){
    jQuery('.actionLink').on('click', function(e){
        var iPrdID = jQuery(this).attr('prod-id');
        var qty = jQuery(".QuantitySelectContainer").find("[prod-id='" + iPrdID + "']").val();
        var currentUrl = jQuery(this).attr('absUrl');
        var redirectUrl = currentUrl+'book/add/p/'+iPrdID;
        window.location=redirectUrl;
    });
});