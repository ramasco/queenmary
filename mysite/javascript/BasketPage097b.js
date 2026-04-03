
/**
* BasketPage.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/// Most BL code should now be in the single global bl variable
if (typeof bl === 'undefined') {var bl = {};}

(function($){

    bl.BasketPage = {
        'NetworkCall'           : null,
        UpdatePhysicalItem: function(dom){
            strName = dom.find("input.PlusMinusNumericText").attr("name");
            strName = strName.replace("RelateProduct_", "");
            arrParts = strName.split("_");
            iOrderItemID = arrParts[0];
            iProductID = arrParts[1];
            quantity = dom.find("input.PlusMinusNumericText").val();
            iType = dom.find("select").val();

            var strPlusMinusFieldName = dom.find("input.PlusMinusNumericText").attr("name");
            var DropDownFieldName = dom.find("select").attr("name");

            var iMinValue = dom.find("input.PlusMinusNumericText").attr("data-total-min");
            var iMaxValue = dom.find("input.PlusMinusNumericText").attr("data-total-max");

            if(bl.BasketPage.NetworkCall){
                bl.BasketPage.NetworkCall.abort();
            }

            bl.BasketPage.NetworkCall = $.ajax({
                url: bl.RequestUtil.getAbsolutePath('basket/updatephysicalitem'),
                type: "POST",
                dataType :"json",
                data: {
                    "OrderItemID"   : iOrderItemID,
                    "ProductID"     : iProductID,
                    "Type"          : iType,
                    "Quantity"      : quantity
                },
                success: function(data){
                    bl.BasketPage.SetUpBookingSummaryFromJSON(data);
                    $('[name="'+strPlusMinusFieldName+'"]').attr("data-total-min",iMinValue).attr("data-total-max",iMaxValue);
                    $('[name="'+DropDownFieldName+'"]').val(iType);
                }
            });


        },

        SetUpBookingSummaryFromJSON : function(data){
            if(data.Error == 1){
                $("#BasketPageBookingSummaryError").html(data.Message).show();
            }else{
                $("#BasketPageBookingSummaryError").hide();
            }
            $("#BasketPageBookingSummaryAjax").html(data.Summary);
        },
        
        EditOrderItem: function(event) {
            var container = $(this).parents("tr").next().find('.basket-edit-container');
            bl.BasketEdit.EditOrderItem(container, $(this).data('orderitem'));
            
            return false;
        },
        
        RemoveItemConfirmation : function(event) {
            var url = $(this).attr('href');
            var popup = $('<div>'+bl.TranslateUtil.translate('YouSureYouWantToRemoveItem', 'Are you sure you want to remove this item?')+'</div>');
 
            var buttons = {};

            buttons[bl.TranslateUtil.translate('Close','Close')] = function () {
                        popup.dialog("close");
                    };
            
            buttons[bl.TranslateUtil.translate('Confirm','Confirm')] = function () {
                        window.location = url;
                    };

            popup.BLPopUp({
                size: 'Medium',
                height: 400,
                title: bl.TranslateUtil.translate('Confirmremoval','Confirm removal'),
                modal: true,
                buttons: buttons,
            });
            return false;
        },

        VoucherAlert: function(value) {
            var popup = $('<div><div class="VoucherValue">£'+value+'</div><div class="VoucherDescription">'+bl.TranslateUtil.translate("VoucherPopUpDescription","has been added to you basket.<br>Please continue to book your items and the basket total will reflect this")+'</div></div>');
            popup.dialog({
                height: 300,
                width:300,
                title: false,
                modal: true,
                buttons: {
                    OK: function () {
                        popup.dialog("close");
                    }
                }
            });
            return false;
        },
        
        init: function() {
            $(".edit a").livequery("click", bl.BasketPage.EditOrderItem);
            $(".remove a").livequery("click", bl.BasketPage.RemoveItemConfirmation);
        }
        
    };


    bl.BasketPage.init();

})(jQuery);