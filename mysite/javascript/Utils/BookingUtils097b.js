
/**
* BookingUtils.js
* file javascript/Utils
* @copyright 2010 - 2015 BookingLive Software Limited
*/
// Most BL code should now be in the single global bl variable
if (typeof bl === 'undefined') {var bl = {};}

(function($){
    var stopCount = false;
    bl.BookingUtils = {

        CheckOrderItemLeft: function(){
            if (stopCount == false) {
                $.ajax({
                    url: bl.RequestUtil.getAbsolutePath("Page_Controller/GetTimeLeftForPending"),
                    type: "POST",
                    success: function(minutes){
                        if(minutes <= 0){
                            $(".BookingContentsHolder").html("<p class='message bad'>"+bl.TranslateUtil.translate('OrderExpired', 'Order Expired')+"</p>");
                            $(".GetTimeLeftForPendingInMinutes").html(' 0 ');
							bl.Availability.ClearBasketItemCount();
                            stopCount = true;
                        }else{
                            $(".GetTimeLeftForPendingInMinutes").html(' '+minutes+' ');
                        }
                    }
                })
            }
        }

    }


    $(document).ready(function(){
        var minutesHoldSpans = $(".GetTimeLeftForPendingInMinutes");
        if(minutesHoldSpans.length){
                window.setInterval(bl.BookingUtils.CheckOrderItemLeft, 60000);
                bl.BookingUtils.CheckOrderItemLeft(); 
            }
    });

})(jQuery);
