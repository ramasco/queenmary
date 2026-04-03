/**
 * ProductEventUpsellField.js
 * file javascript
 * @copyright 2010 - 2015 BookingLive Software Limited
 */

if (typeof bl === 'undefined') {var bl = {};}
var timer = '';
(function($) {
    bl.ProductEventUpsellField = {

		EventDetailRequest : false,
        EventDetailRequestResponse: '',
        FullDate: function (da,separator) {
		    if (typeof separator === undefined)
		        separator = '-';
            d = new Date(da);
            return d.getDate()+separator+(d.getMonth()+1)+separator+d.getFullYear();
        },
        DrawTable: function(successCallback){
		    $(".ProductEventUpsellFieldTable ").html("<img src='mysite/images/network-save.gif'>");
            var quantity = bl.BookingPage.GetMainProductQuantity();

            if (typeof quantity === 'undefined')
                quantity = 1;

            var arrEventIDs = [];
			if (typeof bl.SevenDayCalenderField != 'undefined') {
				arrEventIDs = bl.SevenDayCalenderField.GetAllSelectedEvents();
			} else if (typeof bl.SeasonSevenDayCalenderField != 'undefined') {
				arrEventIDs = bl.SeasonSevenDayCalenderField.GetAllSelectedEvents();
			} else if (typeof bl.FixedEventField != 'undefined' && !bl.FixedEventField.UseCustomEventsForUpsell)  {
				arrEventIDs = bl.FixedEventField.GetAllSelectedEvents();
            }

			var arrCustomEvents = [];
			
			if (typeof(bl.ProductTemplateEventJSSevenDayCalendarField) != 'undefined') {
				arrCustomEvents = bl.ProductTemplateEventJSSevenDayCalendarField.SelectedEvents;
			// else if FixedEventCalProductAvailabilityFormField
			} else if (typeof bl.FixedEventField != 'undefined' && bl.FixedEventField.UseCustomEventsForUpsell) {
				arrCustomEvents = bl.FixedEventField.GetAllSelectedEventsForUpsells();
            } else if (typeof bl.AvailabilityEventProductField != 'undefined' && $("#Form_BookingForm_ProductClassName").val() == 'ProductAvailability') {
                arrCustomEvents = bl.AvailabilityEventProductField.GetAllSelectedEvents();
            }
            else if($("#Form_BookingForm_ProductClassName").val() == 'ProductMembership') {
            	var timeRangeField = $('#Form_BookingForm_TimeRange');
            	var arrTimeRanges = timeRangeField.data('timeranges');
            	arrCustomEvents.push(arrTimeRanges[timeRangeField.val()]);
            }

            if (typeof(bl.AvailabilityEventProductField) != 'undefined') {
                arrEventIDs = bl.AvailabilityEventProductField.GetAllSelectedEvents();
            }
            
			var iEventGroupID;
			if (typeof bl.FixedEventField != 'undefined' && $('#Form_BookingForm_ProductClassName').val() == 'ProductEventSeries')
				iEventGroupID = jQuery('input[name="EventGroupID"]:checked').val();

            if((arrEventIDs.length || iEventGroupID || arrCustomEvents.length) && quantity){
				var data = {
					'EventUpsellProducts' : []
				};

				if ($('#Form_BookingForm_ProductGroupID').val()) {
					data.ProductGroupID = $('#Form_BookingForm_ProductGroupID').val();
				} else {
					data.ProductID = $('#Form_BookingForm_ProductID').val();
				}

				if (arrEventIDs.length)
					data.events = arrEventIDs.join(',');

				if (arrCustomEvents.length)
					data.customevents = arrCustomEvents.join(',');
				
				if (iEventGroupID)
					data.event_group = iEventGroupID;

				$('.ProductEventUpsellField .QtyContainer input').each(function(){
					data.EventUpsellProducts.push($(this).data('product'));
				});

				
				if (bl.ProductEventUpsellField.EventDetailRequest)
					bl.ProductEventUpsellField.EventDetailRequest.abort();

				$('.ProductEventUpsellFieldTable input').each(function() {
				    data[$(this).attr('name')] = $(this).val();
				});
			
				
				bl.ProductEventUpsellField.EventDetailRequest = $.ajax({
                    url:    $('.ProductEventUpsellFieldTable:first').data('eventdata'),
                    data : data,
                    dataType: 'json',
                    type: 'POST',
                    success: function(result){

						var tmpData = result;

						bl.ProductEventUpsellField.EventDetailRequest = false;
						bl.ProductEventUpsellField.EventDetailRequestResponse = result;

						var data = result;

                        var productMaxCapacity = {};
                        $.each(data, function(){
                            var dayData = this;
                            for (var productId in dayData.MaxCapacity) {
                                if(!dayData.MaxCapacity.hasOwnProperty(productId)) continue;
								if (typeof(productMaxCapacity[productId]) == 'undefined') {
                                    productMaxCapacity[productId] = dayData.MaxCapacity[productId];
                                } else if(dayData.MaxCapacity[productId] < productMaxCapacity[productId]) {
                                    productMaxCapacity[productId] = dayData.MaxCapacity[productId];
                                }

                                $('input#RelatedProduct_' + productId + '_Quantity').attr('data-total-max', productMaxCapacity[productId]).val(0);
                            }
                        });
                        // TODO dependecies over same resources and their capacities
                        $('.ProductEventUpsellFieldTable').each(function () {
                            $(this).html('');
                                                        
                                    var data = result;

                                    docWidth = document.body.clientWidth;
                                    currentStep = 1;
                                    totalRows = 7;
                                    if (docWidth <= 360)
                                        totalRows = 3;
                                    else if (docWidth <= 460)
                                        totalRows = 4;
                                    else if (docWidth <= 560)
                                        totalRows = 5;
                                    else
                                        totalRows = 7;

                                    var nextStep = 0;
                                    var dom = $(this);
                                    var name = dom.data('name');
                                    var product_id = name.split('_')[1];
                                    var type = dom.data('choosetype');

                                    var strHTML = '<table class="'+type+'">';

                                    // Flatten data so we can loop over all selected events.
                                    var flatData = [];
                                    $.each(data, function (date, eventData) {
                                    	$.each(eventData, function(index, data) {
                                    		data['eventID'] = index;
                                    		data['strDate'] = date;
                                    		flatData.push(data);
                                    	});
                                    	
                                    });
                                    
                                    var numberOfBookings = flatData.length;

                                    // Find upsell items
                                    var items = [];
                                    $('.ProductQuantityContainer input.productquantity.PlusMinusNumericText:not(.RelatedProductField),'+
                                    		'.ProductQuantityContainer input.productfixedquantity:not(.RelatedProductField),'+
                                    		'input.productquantity:not(.RelatedProductField),'+
                                    		'.ProductGroupQuantity').each(function (index) {
                                    			items[index + 1] = {
                                    					name: $(this).closest('tr').find('.label').length ? $(this).closest('tr').find('.label').html() : bl.TranslateUtil.translate('Participant', 'Participant') + ' ',
                                    							quantity: $(this).val(),
                                    							pricing_id: $(this).closest('tr').data('priceid')
                                        };
                                    });

                                    if ($("#Form_BookingForm_ProductClassName").val() == 'ProductAvailability') {
                                        if (typeof items[1] == 'undefined') {
                                            items[1] = {
                                                name: $(this).closest('tr').find('.label').length ? $(this).closest('tr').find('.label').html() : bl.TranslateUtil.translate('Participant', 'Participant') + ' ',
                                                quantity: 1,
                                                pricing_id: $(this).closest('tr').data('priceid')
                                            };
                                        }
                                    }

                                    if (items.length == 0 || items[1].quantity == 0) {
                                		return;
                                    }

                                    var OneAvailabilityOnly = true;

                                    $.each(data, function (date, eventData) {
                                        $.each(eventData, function (eventID, eventCapacityData) {
                                            if (eventCapacityData['MaxCapacity'][product_id] > 1 || eventCapacityData['MaxCapacity'][product_id] == 0)
                                                OneAvailabilityOnly = false;
                                        });
                                    });

                                    var rows = 0;
                                    
                                    for (index = 0; index < numberOfBookings; index+=totalRows) {
                                    	
                            			var colsToWrite = totalRows;
                            			if (index + totalRows > numberOfBookings) {
                            				colsToWrite = numberOfBookings - index;
                            			};
                                    	
                                            strHTML += '<tr><td>&nbsp;</td>';
                                    		if (type == 'ChooseDays') {
                                    			
                                    			for (col = 0; col<colsToWrite; col++) {
                                    			    var showTime = '';
                                                    var date = new Date(flatData[index+col].StartDateTime);
                                                    var endDate = new Date(flatData[index+col].EndDateTime);
                                                    var strStartDate = date.getDate() + ' ' + bl.DateUtil.MonthName(date.getMonth() + 1)+' '+date.getYear();
                                                    var strEndDate = endDate.getDate() + ' ' + bl.DateUtil.MonthName(endDate.getMonth() + 1)+' '+endDate.getYear();

                                                    if (strStartDate == strEndDate) {
                                                        showTime = date.getHours()+':'+('0'+date.getMinutes()).slice(-2)+' - '+endDate.getHours()+':'+('0'+endDate.getMinutes()).slice(-2);
                                                    }
                                                    else {
                                                        showTime = date.getHours()+':'+('0'+date.getMinutes()).slice(-2)+' - '+endDate.getHours()+':'+('0'+endDate.getMinutes()).slice(-2);
                                                    };
                                                    strHTML += '<td width="0" nowrap align="center"><div class="ProductUpsellDate"><strong>' + ' ' +
                                                        bl.ProductEventUpsellField.FullDate(date,'/') + '</strong></div><div class="ProductUpsellTime">'+
                                                        showTime +
                                                        '</div></td>';                                 				
                                    			}
                                    		}

                                        strHTML += '</tr>';

                                        var iParticipantIndex = 0;

                                        $.each(items, function () {
                                            var item = this;

                                            for (var i = 1; i <= item.quantity; i++) {
                                                iParticipantIndex++;
                                                strHTML += '<tr>';
                                                strHTML += '<td width="20%"><div><strong>' + item.name + ' ' + i + '</strong></div></td>';
                                                if (type == 'ChooseDays') {
                                                    
                                        			for (col = 0; col<colsToWrite; col++) {

                                        				var eventDate = new Date(flatData[index+col].StartDateTime);
                                                        eventDate.setHours(0, 0, 0, 0);
                                                        let Min = flatData[index+col].UpsellMinMax[product_id].Min;
                                                        let Max = flatData[index+col].UpsellMinMax[product_id].Max;
                                                        let bDisabled = flatData[index+col]['MaxCapacity'][product_id] == 0 || flatData[index+col]['MaxCapacity'][product_id] < item.quantity;
                                                        if (flatData[index+col]['MaxCapacity'][product_id] >= 0 && flatData[index+col]['Resource'][product_id]) {
                                                           if (OneAvailabilityOnly)
                                                               strHTML += bl.ProductEventUpsellField.MakeInputCell(name, iParticipantIndex, eventDate.valueOf(), flatData[index+col].eventID, item.pricing_id, flatData[index+col].strDate, false, 1, true, true,'',type, Min, Max);
                                                           else
                                                               strHTML += bl.ProductEventUpsellField.MakeInputCell(name, iParticipantIndex, eventDate.valueOf(), flatData[index+col].eventID, item.pricing_id, flatData[index+col].strDate, false, flatData[index+col]['MaxCapacity'][product_id], false, true,'',type, Min, Max);
                                                            }
                                                        else {
                                                              strHTML += bl.ProductEventUpsellField.MakeInputCell(name, iParticipantIndex, eventDate.valueOf(), flatData[index+col].eventID, item.pricing_id, flatData[index+col].strDate, false, 99, true, false,'',type, Min, Max);
                                                         }
                                        			}
                                                }
                                                else {
                                                    var bHaveCapacity = true;

                                                    $.each(data, function (strDate, eventData) {
                                                        if (rows < totalRows)
                                                            return;

                                                        $.each(eventData, function (eventID, eventCapacityData) {
                                                            $.each(eventCapacityData['MaxCapacity'], function (productID, capacity) {
                                                                if (productID = product_id && (capacity == 0 || capacity < item.quantity)) {
                                                                    bHaveCapacity = false;
                                                                    return;
                                                                }
                                                            });
                                                            if (!bHaveCapacity)
                                                                return;
                                                        });
                                                        if (!bHaveCapacity)
                                                            return;
                                                        rows++;
                                                    });
                                                    strHTML += bl.ProductEventUpsellField.MakeInputCell(name, iParticipantIndex, 0, 0, item.pricing_id, '', !bHaveCapacity, 1, true,false,'Add to all events', type,0,0);
                                                    index = index + totalRows;	// Break loop;
                                                }
                                                strHTML += '</tr>';
                                            }
                                        });

                                        strHTML += '</tr>';
                            };

                            strHTML += '</table>';
                            dom.html(strHTML);
                        });

                        if ($('input.uicheckbox').length) {

                            $('input.uicheckbox').labelauty({label: false});
                            $('input.uicheckbox').on('change', function() {

                                let max = $(this).attr('max');
                                let dataClassName = $(this).data('classname');
                                let dataName = $(this).attr('Name')
                                let parentCheckBox = $(this);
                                let totalCheckboxes = 0;
                                let type = $(this).attr('choosetype');

                                if (max == 1) {
                                    if (type != 'ChooseDays') {
                                        $('.SpinnerHolder .' + dataClassName).each(function () {
                                            if ($(this).attr('Name') == dataName) {
                                                totalCheckboxes++;
                                            }
                                        });
                                        if (totalCheckboxes > 1) {
                                            $('.SpinnerHolder .' + dataClassName).each(function () {
                                                if ($(this).attr('Name') == dataName) {
                                                    $(this).attr('checked', false);
                                                }
                                            })
                                            parentCheckBox.attr('checked', true);
                                        }
                                    } else {
                                        if ($('.SpinnerHolder .'+dataClassName).length > 1) {
                                            $('.SpinnerHolder .'+dataClassName).prop('checked', false)
                                            $(this).prop('checked', true)
                                        }
                                    }
                                }

                                let min = $(this).data('min');
                                if (min == 1) {
                                    $(this).prop('checked', true);
                                    $(this).parent().find('label').prop('aria-checked', true);
                                    return;
                                }

                                clearTimeout(timer);
                                timer = setTimeout('bl.BookingPage.UpdateSummaryInternal();', 1000);
                            })

                            $('input.uicheckbox').each(function() {
                                let min = $(this).data('min');
                                if (min == 1) {
                                    $(this).trigger('click');
                                }
                            })
                        }

                        $('.spinner').spinner({
                            stop: function (event, ui) {
                                currentClass = $(this).data('classname');
                                var capacity = $(this).attr('max');
                                var data_min = $(this).data('min');
                                var data_max = $(this).data('max');
                                var totalCap = 0;
                                $(this).addClass('Selected')

                                $("." + currentClass).each(function (v, k) {
                                    totalCap = Math.abs(totalCap + parseInt($(this).val()));
                                });

                                $("." + currentClass).each(function (v, k) {
                                    if ($(this).hasClass('Selected')) {
                                        if (data_max > 0 && data_max < capacity)
                                            $(this).spinner({max: data_max});
                                    } else {
                                        if (totalCap < $(this).val()) {
                                            $(this).spinner({max: $(this).val()});
                                        } else {
                                            $(this).spinner({max: ((capacity - totalCap) + parseInt($(this).val()))});
                                        }
                                    }
                                })

                                $(this).removeClass('Selected')

                                clearTimeout(timer)
                                timer = setTimeout('bl.BookingPage.UpdateSummaryInternal();', 1000);
                            }
                        })
                        if(typeof successCallback != 'undefined')
                            successCallback();
                    }

                });
            } else {
				$('.ProductEventUpsellFieldTable').html('');
				if(typeof successCallback != 'undefined')
					successCallback();
			}
        },

        MakeInputCell: function(name, iCount, iID, eventID, iPricingID, strDate, bDisabled, MaxCapacity, checkbox, showAvailability,info,chooseType,min, max){
            if(typeof iPricingID === 'undefined')
                iPricingID = 0;

            if(typeof strDate === 'undefined')
                strDate = '';

            if(typeof bDisabled === 'undefined')
                bDisabled = false;

            if (MaxCapacity == 0)
                bDisabled = true;

            if (typeof chooseType === 'undefined')
                chooseType = 'ChooseDays';

            var strRet = '';
            var className = name + '_' + iCount +'_' + iID + '_' + iPricingID;
            var className2 = name + '_' + iID;
            var bChecked = $('.' + className).is(':checked');
            var avslots = '';

            var inputType = !checkbox ? 'type="text" class="spinner '+className2+'"' : 'type="checkbox" class="uicheckbox '+className2+'"';

            if (iCount == 1 && showAvailability)
                avslots = '<div class="AvailabeSlotsRelatedProducts">' + MaxCapacity +' Available</div>';



            strRet += '<td width="0" class="SpinnerHolder" nowrap="nowrap" align="center">' + avslots +
                '<input '+inputType+' data-classname="'+className2+'" name="' + name +'[' + iCount +'__' + eventID +'__' + iPricingID + ']" class="' + className + ' upsellevents"' +
                (bChecked ? ' checked="checked"' : '') +
                (bDisabled ? ' disabled="disabled"' : '') +
                'max="'+MaxCapacity+'"' +
                'min="'+min+'"' +
                'data-min="'+min+'"' +
                'data-max="'+max+'"' +
                'ChooseType="' + chooseType + '"' +
                'data-event-id="' + eventID + '"' +
                'data-event-date="' + strDate + '"' +
                ' value="'+(!checkbox ? min : 1)+'">' +
                (info ? '<label>' + bl.TranslateUtil.translate('AddToAllEvents', 'Add to all events') + '</label>' : '') +
                '</td>';
            return strRet;
        },

        SelectRow: function() {
            var bNewSelected = false;
			$(this).parent().parent().find('input:checkbox:not(:checked):not(:disabled)').each(function() {
				// if not disabled
	                $(this).prop('checked', true);
	                bNewSelected = true;
				//bl.ProductEventUpsellField.DisableUpsellByAvailability($(this));
            });

            if(bNewSelected)
                bl.BookingPage.UpdateSummary();

            return false;
        },


		/**
		 * This must be called when a upsell checkbox is ticked to disable upsells when no more availability
		 * @param checkbox
		 */
		DisableUpsellByAvailability : function(checkbox){
            return;
		    var upsellFieldTable = checkbox.parents('.ProductEventUpsellFieldTable');

		    if(upsellFieldTable.data('choosetype') == 'AllDays')
		        return;



			var eventID						= checkbox.data('event-id'),
				iSelectedUpsellsForDate		= checkbox.parents('.ProductEventUpsellFieldTable').find('input[data-event-id="'+eventID+'"]:checked').length,
				productID					= checkbox.attr('class').split('_')[1],
				eventDate					= checkbox.data('event-date'),
				iTotalAvailabilityForDate	= bl.ProductEventUpsellField.EventDetailRequestResponse[eventDate][eventID]['MaxCapacity'][productID];

			checkbox.parents('.ProductEventUpsellFieldTable').find('input[data-event-id="'+eventID+'"]').removeAttr('disabled');
			if (iSelectedUpsellsForDate >= iTotalAvailabilityForDate)
				checkbox.parents('.ProductEventUpsellFieldTable').find('input[data-event-id="'+eventID+'"]').not(':checked').attr('disabled', 'disabled');
		},


        init: function(){
            this.DrawTable();

            $('input.upsellevents').livequery('click', function(){
				//var checkbox = $(this);
				//bl.ProductEventUpsellField.DisableUpsellByAvailability(checkbox);
				bl.BookingPage.UpdateSummaryInternal();
			});
            $('.ProductEventUpsellField .plus, .ProductEventUpsellField .minus').livequery('click', function(){
				setTimeout(bl.BookingPage.UpdateSummaryInternal, 250);
			});
            $('.upsells-select-all').livequery('click', bl.ProductEventUpsellField.SelectRow);

        }
    };

    bl.ProductEventUpsellField.init();
})(jQuery);
