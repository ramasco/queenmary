/**
* BookingFilter.js
* file javascript
* @copyright 2010 - 2016 BookingLive Software Limited
*/

if (typeof bl === 'undefined') {var bl = {};}

(function($){

    bl.BookingFilter = {
        onUpdateCallback : null,

        HandleFilterChange : function(){
            var field = $(this);
            var value = field.val();
            var form = field.closest('form');

            var formData = {};
            $('#BookingPageFilters').find('[name]').each(function() {
                formData[field.attr('name')] = field.val();  
            });

            $("#Form_BookingForm_Location").val('');
            
            $.ajax({
                type: 'POST',
                url: bl.RequestUtil.getAbsolutePath('BookingPage_Controller/UpdateFilter'),
                data: formData,
                dataType: 'json'
            }).always(function() {

                if(bl.BookingFilter.onUpdateCallback != null) {
                    bl.BookingFilter.onUpdateCallback(field);
                }
            });
        },
        
        init: function(){
            $('#BookingPageFilters').find('[name]').on('change', bl.BookingFilter.HandleFilterChange);
        }        
    };

    $(function() {
        bl.BookingFilter.init();        
    });


})(jQuery);





