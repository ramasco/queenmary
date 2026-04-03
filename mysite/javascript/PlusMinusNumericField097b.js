
/**
* PlusMinusNumericField.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/

bl.PlusMinusNumericField = {
    
    onChange: null,
    
    _doChange: function(field, change) {
        var parentTag = jQuery(field).parent();
        var TextField = parentTag.find('.PlusMinusNumericText');
        var currentVal = TextField.val();
        var currentIntVal = parseInt(currentVal);
        var ChangeBy = parseInt(TextField.attr('data-incrementby'));
        var Limit = parseInt(TextField.attr('data-' + (change > 0 ? 'Max' : 'Min')));
        if (!isNaN(currentIntVal)) {
            var NewValue = currentIntVal + (ChangeBy * change);
            
            if ((change > 0 && NewValue<=Limit) || (change < 0 && NewValue>=Limit))
                TextField.val(NewValue);
            
        } else
            TextField.val(0);
            
        if(bl.BookingPage){
            if (!bl.FixedEventField && !bl.PlusMinusNumericField.onChange)
                bl.BookingPage.UpdateSummary();
            else if ($(field).parents('.RelatedProductField').length > 0)
                bl.BookingPage.UpdateSummary();
            else if(bl.PlusMinusNumericField.onChange)
                bl.PlusMinusNumericField.onChange(NewValue, change);

            bl.BookingPage.PlusMinusAdded = true;
        }

        if (bl.SevenDayCalenderField) {
            bl.SevenDayCalenderField.doCalendarUpdate(NewValue);
        }
        
        if(bl.BasketPage && $(field).hasClass('stockcontrol'))
            bl.BasketPage.UpdatePhysicalItem($(field).closest(".PhysicalItemProductUpdateField"));
    },
    
    init: function() {
        jQuery(".plus").livequery("click", function(e) {
            e.preventDefault();
            bl.PlusMinusNumericField._doChange(this, 1);
        });
        
        jQuery(".minus").livequery("click", function(e) {
            e.preventDefault();
            bl.PlusMinusNumericField._doChange(this, -1);
        });
    }
    
}


jQuery(document).ready(function(){

    bl.PlusMinusNumericField.init();

    if (jQuery(".Stock").length > 0) {
        var inputFieldName = jQuery(".Stock").attr('name').replace("_ItemType","");
        getMaxValue(inputFieldName,jQuery(".Stock").val());
    }

    jQuery( document ).on("change", ".Stock", function(e) {
        e.preventDefault();
        var inputFieldName = jQuery(this).attr('name').replace("_ItemType","");

        getMaxValue(inputFieldName,$(this).val());
    });

    function getMaxValue(inputFieldName,iPhysicalItemTypeID) {
        var data = {
            'PhysicalItemTypeID'	: iPhysicalItemTypeID
        };
        $.ajax({
            url: bl.RequestUtil.getAbsolutePath('book/getPhysicalItemTypeMaxMinValue'),
            type: "POST",
            dataType :"json",
            data: data,
            success: function(data){

                if (data.maxValue > 0) {
                    $('[name="'+inputFieldName+'"]').attr("data-Max",data.maxValue);
                }

                if (data.minValue > 0) {
                    $('[name="'+inputFieldName+'"]').attr("data-Min",data.minValue);
                }

                if( data.maxValue > 0 &&  $('[name="'+inputFieldName+'"]').val() > parseInt(data.maxValue)){
                    $('[name="'+inputFieldName+'"]').val('0');
                }

                if( $('[name="'+inputFieldName+'"]').val() < parseInt(data.minValue)){
                    $('[name="'+inputFieldName+'"]').val(data.minValue);
                }

                if(bl.BookingPage){
                    bl.BookingPage.UpdateSummary();
                }
            }
        });
    }
});


