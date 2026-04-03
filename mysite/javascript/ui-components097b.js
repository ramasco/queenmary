
(function($){

	/**
	 * Alert boxes
	 */
	$( '.bodyInner' ).on('click', '.Alert .js-close', function(e){
		e.stopPropagation();
		$(this).parent('.Alert').fadeOut();
		return false;
	});


	/**
	 * Accordion
	 */
	$( '.bodyInner' ).on('click', '.Accordion__title', function(e) {
		e.stopPropagation();
		var parent = $(this).parent();

		if (parent.hasClass('Accordion--start-expanded'))
			parent.addClass('Accordion--expanded').removeClass('Accordion--start-expanded');

		parent.toggleClass('Accordion--expanded');

		if (parent.hasClass('Accordion--expanded')) {
			parent.find('.Accordion__content').slideDown();
		} else {
			parent.find('.Accordion__content').slideUp();
		}

		return false;
	});

})(jQuery);
