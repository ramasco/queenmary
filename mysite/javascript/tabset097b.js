
/**
* tabset.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/// Most BL code should now be in the single global bl variable
if (typeof bl === 'undefined') {var bl = {};}

(function($){
	
	bl.TabSet = {
		
		GoToTab: function(){ 
			link = $(this);
			tabset = link.closest(".tabset");
			
			tabset.find(".gototab").removeClass('active');
			
			link.addClass("active");
			
			tabset.find(".tab").hide();
			tabid = link.data("tabid");
			tabset.find(".tab_" + tabid).show();
			
			return false;
		},
		
		init: function(){
			var sets = $(".tabset");
			if(sets.length){
				$.each(sets, function(){
					$(this).find(".tab").hide();
					$(this).find(".tab:first").show();
					
					$(this).find(".gototab:first").addClass("active");
				});
				
				$(".gototab").click(bl.TabSet.GoToTab);
				
			}
		}
		
	}
	
	$(document).ready(function(){
		bl.TabSet.init();
	});
	
})(jQuery);


