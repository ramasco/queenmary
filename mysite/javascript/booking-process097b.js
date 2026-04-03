
/**
 * Notification close buttons
 */
(function($){
	$('.Alert[data-notification]').each(function(){
		$(this).prepend('<button class="Alert__close js-notification-close"><span class="icon icon-cancel-circle"></span></button>');
	});

	$('.js-notification-close').on('click', function(e){
		e.stopPropagation();
		var notification = $(this).parent('.Alert');

		$.get('CustomerNotification_Controller/Closed',{
			notification : notification.data('notification')
		},function(){

		});

		notification.fadeOut();
		return false;
	});

	$('.action').on('click', function (e) {
       if ($(this).is('[type=submit]')) {
           if (!$(this).closest('form')[0].checkValidity()) {
			    e.preventDefault();
			    return false;
		    }
		}
		loadingScreen('start');
	});

    $(document).ready(function(){
		$("#accordion").accordion({
			active: false,
			collapsible: true,
			heightStyle: "content"
		});

		if (isiPad()) {
        	$('body,html').css({'height': '100%', 'overflow': 'auto', '-webkit-overflow-scrolling': 'auto'})
        }
    });

})(jQuery);

function isiPad(){
    return (navigator.platform.indexOf("iPad") != -1 || navigator.platform.indexOf("iPhone") != -1);
}
