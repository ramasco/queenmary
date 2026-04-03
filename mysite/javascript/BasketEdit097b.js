if (typeof bl === 'undefined') {var bl = {};}

(function($){
    bl.BasketEdit = {
        container: null,
        
        GetContainer: function(context) {
            return $(context).parents('.orderitem-edit-container');
        },
        
        HideEditContainers: function() {
            $(".orderitem-edit-container").empty().hide();
        },
        
        EditOrderItem: function(container, iOrderItem) {
            $(container)
                .addClass('orderitem-edit-container')
                .attr('id', 'orderitem-edit-container-' + iOrderItem)
                .addClass('pleasewait')
                .show()
                .load(bl.BasketEdit.GetEditingUrl(iOrderItem), function(e) {
                    $(this).removeClass('pleasewait');
                });
        },
        
        GetEditingUrl: function(iOrderItem) {
            return bl.RequestUtil.getAbsolutePath('basket/edit/' + iOrderItem);
        },
        
        onSaveEdit: function(event) {
            bl.BasketEdit.GetContainer(this)
                .css('position', 'relative')
                .append(
                    $('<div/>').css({
                        'position': 'absolute',
                        'top': '0',
                        'left': '0',
                        'bottom': '0',
                        'right': '0',
                        'width': '100%',
                        'height': '100%',
                        'background-color': 'rgb(0,0,0)',
                        'opacity': '0',
                    })
                    .addClass('pleasewait')
                    .fadeTo('slow', 0.15)
                );
                
            return true;
        },
        
        onCancelEdit: function(event) {
            bl.BasketEdit.GetContainer(this).hide();
            return false;
        },
        
        
        init: function() {
            $("#Form_BookingFormEdit").livequery('submit', bl.BasketEdit.onSaveEdit)
            $("#Form_BookingFormEdit_action_cancelEditOrderItem").livequery('click', bl.BasketEdit.onCancelEdit);
        },
    };

    $(function() {
        bl.BasketEdit.init();
    });

})(jQuery);