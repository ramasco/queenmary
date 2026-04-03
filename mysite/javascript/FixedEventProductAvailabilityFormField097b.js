/**
* FixedEventProductAvailabilityFormField.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/
if (typeof bl === 'undefined') {var bl = {};}
(function($){
    bl.FixedEventField = {
        updateTimer: null,
        UpdateRequest: null,
        MonthChanged: false,
        UpdateSummaryBool: false,

		/**
		 * bl.FixedEventField.GetAllSelectedEvents
		 * @constructor
         */
		GetAllSelectedEvents: function(){
			return [bl.FixedEventField.GetSelectedEvent()];
		},


		/**
		 * bl.FixedEventField.GetSelectedEvent
		 * @constructor
		 */
		GetSelectedEvent : function() {
			var iEventID = $('input[name="EventID"]:checked').val();

			if(document.getElementById('Form_BookingForm_EventID')){
				iEventID = $('#Form_BookingForm_EventID').val();
			}
			if ($("input#event-id").length) {
				iEventID = $("input#event-id").val();
			}

			return iEventID;
		},


        'UpdateField': function(){
            if(bl.BookingPage){
                var intervalId = setInterval(function() {
                    if(bl.BookingPage.PlusMinusAdded) {
                        clearInterval(intervalId);
                        bl.FixedEventField.DoUpdate();
                    }
                }, 100);
            } else {
                bl.FixedEventField.DoUpdate();
            }
        },

        'DoUpdate' : function(callback) {
            if (bl.FixedEventField.UpdateRequest) {
                bl.FixedEventField.UpdateRequest.abort();
			}
            bl.BookingPage.PlusMinusAdded = false;
            var strUpdateLink = '';
            if (typeof $(".EventProductContainer").data("link") != 'undefined') {
                strUpdateLink = $(".EventProductContainer").data("link");
            } else if (typeof $("#updatelink").data("updatelink") != 'undefined') {
                strUpdateLink = $("#updatelink").data("updatelink");
            }
			var iEventID = bl.FixedEventField.GetSelectedEvent();


            var selectedDate = null;
            if(document.getElementById('calendardatepicker')){
                selectedDate = $("#calendardatepicker").datepicker('getDate');
            }

            if (strUpdateLink) {
                $('.AllEventList').css('position', 'relative');
                $('<div/>', {
                    'class': 'loading-overlay',
                    'css': {
                        'left':             0,
                        'right':            0,
                        'top':              0,
                        'bottom':           0,
                        'position':         'absolute',
                        'background-color': 'white',
                        'opacity':          0.0,
                        'z-index':          1,
                    }
                })
                    .appendTo('.AllEventList')
                    .fadeTo('fast', 0.4 );

                bl.FixedEventField.UpdateRequest = $.ajax({
                    url: strUpdateLink,
                    type: "POST",
                    data: {
                        Quantity: bl.BookingPage.SumOfQuantity(),
                        ProductID: parseInt($("#Form_BookingForm_ProductID").val()),
                        LocationID: $('#LocationFilterLocationID').val(),
                        SelectedEventID : iEventID,
                        EventID: iEventID,
                    },
                    success: function(html){
                        $(".AllEventList").replaceWith(html);

						bl.BookingPage.UpdateSummary();

                        bl.FixedEventField.AddCalendar(selectedDate);
                        if(bl.FixedEventField.onAfterUpdate)
                            bl.FixedEventField.onAfterUpdate();

                        if(typeof callback != 'undefined')
                            callback();

                        //stupid hack for TFL issue.
                        if ($(".event-tr-unavailable").is(':visible')) {
							$(".event-tr-unavailable").toggle().toggle();
						}

						bl.BookingPage.ShowHideRestrictedEvents($('#toggleRestrictedEvents'));
                    }
                });
            }
        },

        getDate: function(timestamp)
        {
		  var date = new Date(timestamp * 1000);
		  if (date.getTimezoneOffset() < 0) {
			    timestamp = new Date(date.getFullYear(date), date.getMonth(), date.getDate()) / 1000;
		  }

          var luxonDate = luxon.DateTime.fromSeconds(parseInt(timestamp));
          var ldt = (!window.disableAutoEuropeLondon) ?
            luxonDate.setZone('Europe/London').startOf('day').toUnixInteger() :
            luxonDate.startOf('day').toUnixInteger();
          return ldt;
        },

        'AddCalendar' : function(selectedDate, iSelectedEvent) {

            if ($('#calendardatepicker').length) {
				var data = $('#calendardatepicker').data('dates')[0];
                var avDates = new Array();
                var unavDates = new Array();
                var calendarDate = null;
                var calendarDateTimeStamp = null;
                $.each(data.available,function(v,i) {
                    dd = bl.FixedEventField.getDate(i);
                    avDates[dd] = dd;
                    if (calendarDate == null) {
                        var luxonDate = luxon.DateTime.fromSeconds(parseInt(dd));
                        if (!window.disableAutoEuropeLondon)
                          luxonDate = luxonDate.setZone('Europe/London');
                        calendarDate = luxonDate.toFormat('MM/dd/yyyy');
                        calendarDateTimeStamp = dd;
                    }
                });
                $.each(data.unavailable,function(v,i) {
                    dd = bl.FixedEventField.getDate(i);
                    if (dd < calendarDateTimeStamp) {
                        var d = new Date(dd*1000);
                        calendarDate = (d.getMonth() + 1)+'/'+d.getDate()+'/'+d.getFullYear();
                        calendarDateTimeStamp = dd;
                    }
                    unavDates[dd] = dd;
                });

                if (calendarDate != null) {
                    $('#calendardatepicker').attr({'data-default-date': calendarDate});
                    $("#calendardatepicker").datepicker("setDate", calendarDate);
                }

                $("#calendardatepicker").datepicker({
                    dateFormat: 'mm/dd/yy',
                    minDate: calendarDate,
                    beforeShowDay: function(date) {
                        var lDate = luxon.DateTime.fromJSDate(date);
                        if (!window.disableAutoEuropeLondon)
                          lDate = lDate.setZone('Europe/London');
                        var phpDate = lDate.startOf('day').toUnixInteger();


                        if (avDates[phpDate]) {
                            return [true, "HighlightedGreen", phpDate+''];
                        } else if (unavDates[phpDate]) {
                            return [true, "HighlightedRed", phpDate+''];
                        } else {
                            return [false, '', ''];
                        }

                    },
                    onSelect: function (date) {
                        bl.FixedEventField.ChangeListOnCalendarDateSelect(date);
                    },
                    onChangeMonthYear: function (year, month) {
                        let date = new Date($(this).val());
                        if (date.getMonth()+1 == month && date.getFullYear() == year) {
                            bl.FixedEventField.ChangeListOnCalendarDateSelect($(this).val(), 0);
                        } else {
                            $('#EventView').html('');
                        }
                    }
                });

                if(selectedDate){
                    $("#calendardatepicker").datepicker("setDate", selectedDate);
                    bl.FixedEventField.ChangeListOnCalendarDateSelect(selectedDate, iSelectedEvent);
                }
            }
        },

		/**
		 * ChangeListOnCalendarDateSelect
		 *
		 * @param date			mm/dd/yyyy
		 * @param availableDays
		 */
        'ChangeListOnCalendarDateSelect' : function(date, iSelectedEvent) {
            if (!date)
                return;
			var eleEventView = $('#EventView'),
				jsDate = new Date(Date.parse(date)),
				urlDate = jsDate.getFullYear() + '/'
					+ ('0' + (jsDate.getMonth() + 1)).slice(-2) + '/'
					+ ('0' + jsDate.getDate()).slice(-2),
				url = eleEventView.data('link') + '&date=' + urlDate + '&quantity=' + bl.BookingPage.SumOfQuantity() + '&location='+$("#Form_BookingForm_Location").val();

			if (bl.FixedEventField.iSelectedEvent) {
				url += '&EventID=' + bl.FixedEventField.iSelectedEvent;
			} else if (iSelectedEvent) {
				url += '&EventID=' + iSelectedEvent;
			}

			eleEventView.html('<p style="padding: 10px;"><img src="mysite/images/ajax-loader.gif" /> '+bl.TranslateUtil.translate('Loading', 'Loading...')+'</p>').load(url, function() {
                bl.BookingPage.ShowHideRestrictedEvents($('#toggleRestrictedEvents'));
				if (bl.FixedEventField.UpdateSummaryBool == false && (bl.FixedEventField.iSelectedEvent || iSelectedEvent)) {
					bl.BookingPage.UpdateSummary();
				}
			});


        },

		iSelectedEvent : false,
        'EventSelector': function() {
			var iRadioValue = $(this).attr('radio-id');
			var check = $(".Event[value='"+iRadioValue+"']").first();
			if (!check.attr('disabled')) {
				var spanTag = $(this).find('span');
				if (spanTag.hasClass('Scheduleradio')) {
					$('.Scheduleradio-checked').addClass('Scheduleradio');
					$('.Scheduleradio').each(function() {
						$(this).removeClass('Scheduleradio-checked');
					});
					spanTag.addClass('Scheduleradio-checked');
				}
				check.prop('checked', true);
				bl.BookingPage.UpdateSummary();
				$(".Actions").children().show();
			}
			return false;
        },

        'eventUpdateFieldDelayed': function() {
            window.clearTimeout(bl.FixedEventField.updateTimer);
            bl.FixedEventField.updateTimer = window.setTimeout(function(){
                bl.FixedEventField.UpdateField();
            }, 500);
        },

        HandleLocationChange : function() {
            var date = $('.calendar').data("date"),
                location = $(this).val();

            $('.calendar').toggle(location !== '');
            var form = $(this).closest('form');
        },

        'UpdateLocation': function(field) {

            bl.FixedEventField.DoUpdate(function() {
            });
        },

        'init': function(){
			$("#Quantity .QuantitySelectContainer .minus, #Quantity .QuantitySelectContainer .plus").livequery("click", bl.FixedEventField.eventUpdateFieldDelayed);
            $(".EventProductContainer .radio-fx").livequery("click", bl.FixedEventField.EventSelector);

			var calendar = $('#calendardatepicker');
			bl.FixedEventField.iSelectedEvent = calendar.data('selected-event-id');
			bl.FixedEventField.AddCalendar(calendar.data('select-event-date'), calendar.data('selected-event-id'));

            bl.BookingFilter.onUpdateCallback = bl.FixedEventField.UpdateLocation;

			$( document ).on("keypress", ".fixedeventlistview .selectEvent input[type='checkbox']", function(e) {
				if(e.which === 13){
					$(this).prop("checked", !$(this).prop("checked"));
					$(this).trigger('change');
					e.preventDefault();
				}
			});
			
			$( document ).on("change", ".AllEventList .selectEvent input[type='checkbox']", function() {
				var changed = $(this);
                if ($(this).is(':checked')) {
                    bl.FixedEventField.iSelectedEvent = changed.val();
                    bl.FixedEventField.UpdateSummaryBool = true;
                } else {
                    bl.FixedEventField.iSelectedEvent = '';
                    bl.FixedEventField.UpdateSummaryBool = false;
                }

				$(".AllEventList .selectEvent input[type='checkbox']:checked").each(function(){
					if (!$(this).is(changed)) {
                          $(this).prop('checked', false);
                          $(this).parents('.event_raw').removeClass('.event_raw--checked');
                    } else {

                          $(this).parents('.event_raw').addClass('.event_raw--checked');
                    }
				});
				bl.BookingPage.UpdateSummary();
			});

            var selectedDate = null;
            if(document.getElementById('calendardatepicker')){
                selectedDate = $("#calendardatepicker").datepicker('getDate');
                bl.FixedEventField.AddCalendar(selectedDate);
            }
        }
    };

    $(document).ready(bl.FixedEventField.init);

    $(document).on('click', 'label.nonWaitingListLabel, label.waitingListLabel', function() {
        var checkbox = $(this).parent().find(".Event");
        if (checkbox.prop("checked") === false) {
            if ($('.totalSectionContainer').length) {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                    $(".totalSectionContainer").get(0).scrollIntoView({behavior: 'smooth'});
                } else {
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $(".totalSectionContainer").offset().top
                    }, 2000);
                }

            }
        }
    });

})(jQuery);