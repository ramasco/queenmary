
/**
* FAQs.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/(function($){
    $(document).ready(function(){
        $("#AllBookingFAQs").dialog({
            width: $(window).width() * 50 / 100,
            height: $(window).height() * 60 / 100,
            title: bl.TranslateUtil.translate('FAQs', 'FAQs'),
            autoOpen: false
        });

        $("ul.Accordion").accordion({
            icons:false,
            active: false,
            collapsible: true,
            heightStyle: 'content'
        });

        $('.readAllBookingFAQs').on('click', function(){
            $("#AllBookingFAQs").dialog("open");
            return false;
        });
    });
})(jQuery);