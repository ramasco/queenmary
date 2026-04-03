
/**
* BookingPage.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/
// Most BL code should now be in the single global bl variable
if (typeof bl === 'undefined') {var bl = {};}

bl.BookingPage = {

	// Holds the activity bing booked
	'ProductGroup'				: false,

    'NetworkCall'           : null,

	// Schedule selector type									- DEPRECIATED
	'ScheduleSelectorType'	: 'List',

	// Holds the current bookings current target destination
	'LocationID'			: -1,

	// Holds the current selected start date for availability view
	'CurrentSelectedDate'	: '',

	// Allow selection of multiple schedules
	'AllowMultipleScheduleSelect' : false,

	// Stores the selected schedules for the booking
	'SelectedSchedules'		: [],

	// Stores the current date selected, used for the calendar view
	'SelectedDate'			: null,

	// Used to hold a reference to the Quantity setInterval object
	'QuantityTimeoutID'		: null,

	// Stores the starting date for the schedule selector - format: d-m-y
	'StartDate'				: false,

	// Cached schedules
	'Cache_Schedules'		: [],

	// Cached extras
	'Cache_Extras'			: [],

    'PlusMinusAdded'        : false,
	// Minimum number of months to request
	//	todo - when performing an ajax request for schedules we should be able to configure it to
	//	get x months worth of data minimum so the calendar view doesn't have to hit the server
	//	each time a user clicks next
	'MinimumNumberOfMonthsToRequest' : 1,
    'ISDisableRequiredResourceProductInput' : false,


	/**
	 * This is the init for the booking page, its called when the page
	 * first loaded
	 */
	'init' : function (config) {
		// Handle multi select, selector types
		var strSelectorType = config.ScheduleSelectorType;
		if (strSelectorType == '7DayViewMultiSelect') {
			strSelectorType = '7DayViewSingleSelect';
			bl.BookingPage.AllowMultipleScheduleSelect = true;
		} else if (strSelectorType == '3WeekViewMultiSelect') {
			strSelectorType = '3WeekViewSingleSelect';
			bl.BookingPage.AllowMultipleScheduleSelect = true;
		}

		// Set pages data, activity, location....
		bl.BookingPage.LocationID			= config.LocationID;
		bl.BookingPage.ProductGroup			= config.ProductGroup;
		bl.BookingPage.ScheduleSelectorType	= config.ProductGroup.BookingView;

		// todo - The start date should be passed in via php to support testing with fake dates
		var d = new Date();
		bl.BookingPage.StartDate			= d.getDate() + '-' + (d.getMonth()+1) + '-' +  d.getFullYear();

		// Apply click handlers to the price category quantity fields
		jQuery('img.QuantityDecrease').on('click', function(){
			bl.BookingPage.RemoveQuantityErrors();
			var eleQuantityInput	= jQuery(this).parent().find('input');
			var iNewQuantity		= parseInt(eleQuantityInput.val()) - parseInt(bl.BookingPage.ProductGroup.BookingMultiple);
			if (bl.BookingPage.IsValidQuantity(iNewQuantity)) {
				eleQuantityInput.val(iNewQuantity);
				bl.BookingPage.OnQuantityChange();
			} else {
				bl.BookingPage.RegisterQuantityError(bl.TranslateUtil.translate('QuantityCannotBeNegative', 'Quantity cannot be negative'), false);
			}
		});
		jQuery('img.QuantityIncrease').on('click', function(){
			bl.BookingPage.RemoveQuantityErrors();
			var eleQuantityInput	= jQuery(this).parent().find('input');
			var iNewQuantity		= parseInt(eleQuantityInput.val()) + parseInt(bl.BookingPage.ProductGroup.BookingMultiple);
			if (bl.BookingPage.IsValidQuantity(iNewQuantity)) {
				eleQuantityInput.val(iNewQuantity);
				bl.BookingPage.OnQuantityChange();
			} else {
				bl.BookingPage.RegisterQuantityError(bl.TranslateUtil.translate('PleaseSelectQuantity', 'Please select a quantity'), false);
			}
		});

		jQuery('input.Quantity').on('focus', function(){
			bl.BookingPage.RemoveQuantityErrors();
			jQuery(this).attr('data-onfocus-value', jQuery(this).val());
		}).on('change', function(){
			bl.BookingPage.RemoveQuantityErrors();
			if (jQuery(this).val() % parseInt(bl.BookingPage.ProductGroup.BookingMultiple) != 0) {
				jQuery(this).val(jQuery(this).attr('data-onfocus-value'));
				bl.BookingPage.RegisterQuantityError(bl.TranslateUtil.translate('QuantityMustBeMultipleOf', 'Quantity must be a multiple of')+' ' + parseInt(bl.BookingPage.ProductGroup.BookingMultiple), false);
			} else if (bl.BookingPage.IsValidQuantity(jQuery(this).val())) {
				bl.BookingPage.OnQuantityChange();
			} else {
				// reset value to value before change
				jQuery(this).val(jQuery(this).attr('data-onfocus-value'));
				bl.BookingPage.RegisterQuantityError(bl.TranslateUtil.translate('QuantityMustBeNumber', 'Quantity must be a number'), false);
			}
		});

		// Draw the initial schedule selector
		bl.BookingPage.UpdateScheduleSelector();

		// Draw the initial summary
		bl.BookingPage.UpdateSummary();
	},

	'ShowReasonForUnavailability' : function(element) {
		if (typeof bl.BookingPageLiveBasket == 'object' && typeof bl.BookingPageLiveBasket.ShowMask == 'function')
			bl.BookingPageLiveBasket.ShowMask();

		var iEventID = jQuery(element).attr('data-info');
		var iQuantity = 0;
		jQuery('input[id^="Form_BookingForm_Quantity"]').each(function (index) {
			iQuantity += parseInt(jQuery(this).val());
		});

		jQuery.ajax({
			url: bl.RequestUtil.getAbsolutePath('BookingPage_Controller/CheckTriggeredRestrictions?eventID=' + iEventID + '&quantity=' + iQuantity),
			type: "GET",
			dataType :"text",
			success: function(message){
				var popup = $('<div>' + message.replace(/(?:\r\n|\r|\n)/g, '<br />') + '</div>');
				popup.BLPopUp({
					height: 500,
					width: 800,
					title: 'Unavailable event details',
					modal: true,
					buttons: [
						{
							text : 'Close',
							click: function () {
								popup.dialog('close');
							},
							'class' : 'blpopup-btn-grey'
						}
					]
				});
				if (typeof bl.BookingPageLiveBasket == 'object' && typeof bl.BookingPageLiveBasket.HideMask == 'function')
					bl.BookingPageLiveBasket.HideMask();
			}
		});
	},

	'ShowHideRestrictedEvents': function(element) {
		if (jQuery(element).prop('checked') == true) {
			jQuery("tr.event-tr-unavailable").show();
			jQuery("tr.event-tr-unavailable").next().show();
			//jQuery("tr[data-restricted='1']").show();
			//jQuery("tr[data-restricted='1']").next().show();
			jQuery("#events_message").hide();
		} else {
			jQuery("tr.event-tr-unavailable").hide();
			jQuery("tr.event-tr-unavailable").next().hide();
			//jQuery("tr[data-restricted='1']").hide();
			//jQuery("tr[data-restricted='1']").next().hide();
			if (jQuery("tr.event-tr-available").length == 0 && jQuery("tr.event-tr-unavailable").length > 0) {
				jQuery("#events_message").html(bl.TranslateUtil.translate('NoAvailableEventNotification', 'No available events. To see unavailable events check "Show unavailable events".'));
				jQuery("#events_message").show();
			}
		}
	},


	/**
	 * Check value is a valid quantity
	 *
	 * @param iValue
	 * @returns {boolean}
	 */
	'IsValidQuantity' : function (iValue) {
		// Check its a valid number
		var bRet = ((parseFloat(iValue) == parseInt(iValue)) && !isNaN(iValue) && iValue >= 0);

		// Check its a multiple of Activity->BookingMultiple
		if (iValue % parseInt(bl.BookingPage.ProductGroup.BookingMultiple) != 0) {
			bRet = false
		}

		return bRet;
	},


	/**
	 * OnQuantityChange
	 */
	'OnQuantityChange' : function () {
		// Delete any existing quantity timeout
		if (typeof bl.BookingPage.QuantityTimeoutID == 'number') {
			window.clearTimeout(bl.BookingPage.QuantityTimeoutID);
		}

		// Apply quantity update timeout
		bl.BookingPage.QuantityTimeoutID = window.setTimeout(function(){
			// Actually perform the update quantity task
			bl.BookingPage.UpdateScheduleSelector();

			bl.BookingPage.SummaryLoadingMessage();
			bl.BookingPage.UpdateSummary();
		}, 1000);
	},


	/**
	 * SumOfQuantity
	 *
	 * Returns the sum of all the quantity fields
	 *
	 * @returns {number}
	 */
	'SumOfQuantity' : function () {
		var iTotalSlotsRequired = 0;
		var arrBits = [];
        var iMultiplier = 1;
		jQuery('input[name="Quantity"], input[name*="Quantity__"]').each(function(){
            arrBits = this.name.split('_');
            if (arrBits[2] == 'GroupPrice') {
                iMultiplier = parseInt(arrBits[3]);
            }
            iTotalSlotsRequired += parseInt(jQuery(this).val())*iMultiplier;
            iMultiplier = 1;
		});
		return iTotalSlotsRequired;
	},


	/**
	 * Add a quantity error
	 *
	 * @param strErrorMessage		The error message
	 * @param bScrollToQuantity		If true screen will scroll to show the message
	 */
	'RegisterQuantityError' : function (strErrorMessage, bScrollToQuantity) {
		bl.BookingPage.RemoveQuantityErrors();
		jQuery('div.Quantity_Container').append('<div class="Error">' + strErrorMessage + '</div>');
		if (bScrollToQuantity) {
			jQuery('html, body').animate({scrollTop: jQuery("div.PriceContainer").offset().top});
		}
	},


	/**
	 * Removes any quantity error messages
	 */
	'RemoveQuantityErrors' : function () {
		jQuery('div.Quantity_Container div.Error').fadeTo('slow', 0).slideUp(400, function() {
			jQuery(this).remove();
		});
	},


	/**
	 * ObjectToString
	 *
	 * Takes one dimensional object and turns it into a string in the following format
	 * prop1=val1&prop2=val2
	 *
	 * @param obj
	 * @returns {string}
	 */
	'ObjectToString' : function (obj) {
		var hashArray = [];
		for (var property in obj) {
			if (obj.hasOwnProperty(property)) {
				hashArray.push(property + '=' + obj[property]);
			}
		}
		return hashArray.join('&');
	},


	/**
	 * Returns schedules matching the query, will first try to load data from
	 * cache or perform an ajax request for missing data
	 *
	 * var queryData = {
	 * 		location_select : bl.BookingPage.LocationID,
	 * 		activity_select : bl.BookingPage.Activity.ID,
	 * 		start_date: '10-5-2013',
	 * 		end_date: '24-6-2013'
	 * 	};
	 *
	 * @param queryData
	 * @param callback
	 */
	'GetSchedules' : function (queryData, callback) {

		// The end date has been set so we need to get the availability for
		// all months in the date range
		var startDate	= bl.Util.UKDateToArray(queryData.start_date);
		if (!queryData.end_date) {queryData.end_date = queryData.start_date;}
		var endDate		= bl.Util.UKDateToArray(queryData.end_date);
		var loopMonth	= startDate.month;
		var loopYear	= startDate.year;
		var arrQueries	= [];

		// todo - This should respect the min month property
		while (loopMonth <= endDate.month && loopYear <= endDate.year) {
			var iDaysInMonth	= bl.Util.DaysInMonth(loopMonth, loopYear);
			var queryHash		= bl.BookingPage.CreateActivityScheduleHash(queryData.location_select, queryData.ProductGroup_select,loopYear,loopMonth);

			// If query not in cache add it to the array of queries to perform
			if (typeof bl.BookingPage.Cache_Schedules[queryHash] == 'undefined') {
				arrQueries.push({
					start_date		: '1-' + loopMonth + '-' +loopYear,
					end_date		: iDaysInMonth + '-' + loopMonth + '-' + loopYear,
					location_select	: queryData.location_select,
					ProductGroup_select	: queryData.ProductGroup_select
				});
			}

			loopMonth++;
			if (loopMonth == 13) {
				loopMonth = 1;
				loopYear++;
			}
		}

		if (arrQueries.length > 0) {
			jQuery.post('BookingPage_Controller/AvailabilityForMonths', {'AvailabilityRequests':arrQueries}, function(data) {
				// add months to schedule cache
				for (var month in data) {
					if(data.hasOwnProperty(month)) {
						bl.BookingPage.Cache_Schedules[month] = data[month];
					}
				}
				bl.BookingPage.GetSchedulesForDatePeriodFromCache(queryData, callback);
			}, "json");
		} else {
			bl.BookingPage.GetSchedulesForDatePeriodFromCache(queryData, callback);
		}
	},


	/**
	 * Searches Cache_Schedules and returns an array containing schedule
	 * matching the queryData provided
	 *
	 * ### IMPORTANT ###
	 * DO NOT DIRECTLY CALL THIS FUNCTION TO RETRIEVE SCHEDULES
	 * USE GetSchedules TO ENSURE A COMPLETE DATA SET
	 *
	 * @param queryData
	 * @param callback
	 */
	'GetSchedulesForDatePeriodFromCache' : function (queryData, callback) {

		var startDate		= bl.Util.UKDateToArray(queryData.start_date);
		var objStartDate	= new Date(startDate.year, (startDate.month-1), startDate.day);
		var endDate			= bl.Util.UKDateToArray(queryData.end_date);
		var objEndDate		= new Date(endDate.year, (endDate.month-1), endDate.day);

		var arrReturnSchedules	= [];
		var loopMonth			= startDate.month;
		var loopYear			= startDate.year;
		while (loopMonth <= endDate.month && loopYear <= endDate.year) {
			var queryHash = bl.BookingPage.CreateActivityScheduleHash(queryData.location_select, queryData.ProductGroup_select,loopYear,loopMonth);
			// If schedule data is in the cache
			if (typeof bl.BookingPage.Cache_Schedules[queryHash] != 'undefined') {
				var arrSchedules = bl.BookingPage.Cache_Schedules[queryHash];
				for (var iScheduleIndex=0; iScheduleIndex<arrSchedules.length; iScheduleIndex++) {
					var arrScheduleStartDate = arrSchedules[iScheduleIndex].StartDate.split('-');
					var objScheduleStartDate = new Date(arrScheduleStartDate[0], (arrScheduleStartDate[1]-1), arrScheduleStartDate[2]);
					if(objScheduleStartDate >= objStartDate && objScheduleStartDate <= objEndDate) {
						arrReturnSchedules.push(arrSchedules[iScheduleIndex]);
					}
				}
			}
			loopMonth++;
			if (loopMonth == 13) {
				loopMonth = 1;
				loopYear++;
			}
		}

		callback(arrReturnSchedules);
	},


	/**
	 * CreateActivityScheduleHash
	 *
	 * Creates the hash used for storing schedules in the cache
	 *
	 * @param iLocation
	 * @param iActivity
	 * @param year
	 * @param month
	 * @returns {string}
	 */
	'CreateActivityScheduleHash' : function (iLocation,iProductGroup,year,month) {
		var queryHash = 'location_select=' + iLocation;
		queryHash += '&ProductGroup_select=' + iProductGroup;
		queryHash += '&year=' + year + '&month=' + month;
		return queryHash;
	},


	/**
	 * Update schedule selector
	 */
	'UpdateScheduleSelector' : function () {

		// Display the loading message
		bl.BookingPage.ScheduleSelectorLoadingMessage();

		// Calculate the start and end date for the schedule selector
		var startDate, strStartDate, strEndDate, endDate;
		if (bl.BookingPage.ScheduleSelectorType == 'Calendar') {
			startDate		= bl.Util.UKDateToArray(bl.BookingPage.StartDate);
			strStartDate	= 1 + '-' + startDate.month + '-' + startDate.year;
			strEndDate			= bl.Util.DaysInMonth(startDate.month, startDate.year) +'-' + startDate.month + '-' + startDate.year
		} else if (bl.BookingPage.ScheduleSelectorType == 'List') {
			startDate		= bl.Util.UKDateToArray(bl.BookingPage.StartDate);
			strStartDate	= 1 + '-' + startDate.month + '-' + startDate.year;
			endDate	= bl.Util.UKDateToArray(bl.Util.AddMonthsToDate(strStartDate,6));
			strEndDate	= bl.Util.DaysInMonth(endDate.month, endDate.year) +'-' + endDate.month + '-' + endDate.year
		} else if (bl.BookingPage.ScheduleSelectorType == '7DayViewSingleSelect') {
			strStartDate	= bl.BookingPage.StartDate;
			strEndDate		= bl.Util.AddDaysToDate(strStartDate,7);
		}

		var queryData = {
			location_select : bl.BookingPage.LocationID,
			ProductGroup_select : bl.BookingPage.ProductGroup.ID,
			start_date		: strStartDate,
			end_date		: strEndDate
		};

		// Calls the function that returns all the schedules for the criteria
		// these schedules are then passed to the callback function bl.BookingPage.RenderScheduleSelector
		bl.BookingPage.GetSchedules(queryData, bl.BookingPage.RenderScheduleSelector);
	},


	/**
	 * RenderScheduleSelector
	 *
	 * Decides which schedule selector is need and calls its renderer method
	 */
	'RenderScheduleSelector' : function (scheduleData) {
		// Get the shopping cart data
		var iTotalSlotsRequired = bl.BookingPage.SumOfQuantity();

		// Loop through schedules to be listed, mark if there selected or not
		for (var iScheduleIndex=0; iScheduleIndex<scheduleData.length; iScheduleIndex++)	{
			scheduleData[iScheduleIndex].Selected = bl.BookingPage.IsScheduleSelected(scheduleData[iScheduleIndex].ID);
		}

		var data = {
			schedules		: scheduleData,
			slotsRequired	: iTotalSlotsRequired
		};

		if (bl.BookingPage.ScheduleSelectorType == 'List') {
			bl.BookingPage.RenderListView(data);
		} else if (bl.BookingPage.ScheduleSelectorType == 'Calendar') {
			bl.BookingPage.RenderCalendarView(data);
		} else if (bl.BookingPage.ScheduleSelectorType == '7DayViewSingleSelect') {
			bl.BookingPage.RenderSevenDayViewSelect(data);
		}
	},


	/**
	 * IsScheduleSelected
	 *
	 * Checks if the schedule is currently selected
	 *
	 * @param iScheduleId
	 * @returns {boolean}
	 */
	'IsScheduleSelected' : function(iScheduleId) {
		return !!(bl.BookingPage.SelectedSchedules.indexOf(iScheduleId) > -1 );
	},


	/**
	 * UnSelectSchedule
	 *
	 * Checks if the given schedule is in the SelectedSchedules array and removes it
	 *
	 * @param iScheduleId
	 */
	'UnSelectSchedule' : function (iScheduleId) {
		if (bl.BookingPage.IsScheduleSelected(iScheduleId)) {
			bl.BookingPage.SelectedSchedules.splice(	bl.BookingPage.SelectedSchedules.indexOf(iScheduleId), 1 );
		}
	},


	/**
	 * Returns the selected schedules IDs in CSV format
	 *
	 * @returns {*|string}
	 */
	'SelectedScheduleAsCSV' : function () {
		return bl.BookingPage.SelectedSchedules.join(',');
	},


	/**
	 * ScheduleSelectorClickHandler
	 *
	 * Handles the onclick event for schedule selectors, should be able to
	 * be used for all schedule selector types
	 *
	 * @param eleScheduleSelector
	 */
	'ScheduleSelectorClickHandler' : function (eleScheduleSelector) {
		// If invalid quantity report error and don't perform schedule action
		if (bl.BookingPage.SumOfQuantity() <= 0) {
			bl.BookingPage.RegisterQuantityError(bl.TranslateUtil.translate('SelectQuantityBeforeSelectDate', 'Please select a quantity before selecting a date.'), true);
			return;
		}

		var iScheduleID = jQuery(eleScheduleSelector).attr('data-schedule-id');

		if (bl.BookingPage.IsScheduleSelected(iScheduleID)) {
			bl.BookingPage.UnSelectSchedule(iScheduleID);
		} else {
			// If multiple schedule select is disable remove existing selected schedules
			if (!bl.BookingPage.AllowMultipleScheduleSelect) {
				bl.BookingPage.SelectedSchedules = [];
			}
			bl.BookingPage.SelectedSchedules.push(iScheduleID);
		}

		bl.BookingPage.UpdateScheduleSelector();
		bl.BookingPage.SummaryLoadingMessage();
		bl.BookingPage.UpdateSummary();
	},


	/**
	 * Renders the list view (aka course schedule selector)
	 */
	'RenderListView' : function (data) {

		var t = '<ul class="ScheduleListView_List">' +
					'{foreach $schedules as $i => $schedule}' +
						'<li class="{if $schedule.Selected > 0}Selected{/if}">'+
							'<div class="Availability_Radio">'+
								'{if $schedule.Slots >= $slotsRequired}'+
									'<div class="ScheduleSelector" data-schedule-id="{$schedule.ID}"></div>'+
								'{/if}'+
							'</div>'+
							'<div class="Availability_Tick">'+
								'{if $schedule.Slots >= $slotsRequired}'+
									'<img src="mysite/images/booking/ico_book_tick.png">'+
								'{else}'+
									'<img src="mysite/images/booking/ico_book_cross.png">'+
								'{/if}'+
							'</div>'+
							'<div class="Availability_Date">{$schedule.DateFromAndTo}</div>'+
							'<div class="Availability_Duration">{$schedule.DurationDays} '+bl.TranslateUtil.translate('Days', 'days')+'</div>'+
							'<div class="Availability_SpacesLeft">{$schedule.Slots} '+bl.TranslateUtil.translate('SpacesLeft', 'spaces left')+ '</div>'+
						'</li>' +
					'{foreachelse}'+
						'<li>'+bl.TranslateUtil.translate('NoAvailableSchedule', 'No Available schedule')+ 's</li>' +
					'{/foreach}' +
				'</ul>';
		var tpl = new jSmart( t );

		document.getElementById('BookingPage_ScheduleSelector').innerHTML =  tpl.fetch( data );

		jQuery('div.ScheduleSelector').on('click', function(){
			bl.BookingPage.ScheduleSelectorClickHandler(this);
		});
	},


	/**
	 * RenderCalendarView
	 *
	 * Renders the calendar view
	 *
	 * @param data
	 */
	'RenderCalendarView' : function (data) {
		// Get a day object set to first day of the month
		var startDate		= bl.Util.UKDateToArray(bl.BookingPage.StartDate);
		var month			= parseInt(startDate.month);
		var year			= startDate.year;

		var iDaysInMonth	= bl.Util.DaysInMonth(month, year);
		var leadingDays		= bl.Util.DayOfWeekNumeric(year, month, 1);
		var trailingDays	= 6 - parseInt(bl.Util.DayOfWeekNumeric(year, month, iDaysInMonth));

		// Loop through all the days in the month building up an array of day data
		var iDayNum = 1;
		var arrDays = [];
		while(iDayNum<=iDaysInMonth) {
			// Max slots available on a single schedule

			// Calculate which status the day should have, available, fully booked...
			var dayScheduleStartDate	= year +'-'+ bl.Util.PadWithLeadingZeros(month,2) +'-'+ bl.Util.PadWithLeadingZeros(iDayNum,2);
			var arrDayStatuses			= bl.BookingPage.StatusesForDay(data.schedules, dayScheduleStartDate);
			var dayStatus				= 'None';
			if (arrDayStatuses.indexOf('AvailableVariable') > -1) {
				dayStatus = 'AvailableVariable';
			} else if (arrDayStatuses.indexOf('Available') > -1) {
				dayStatus = 'Available';
			} else if (arrDayStatuses.indexOf('FullyBooked') > -1) {
				dayStatus = 'FullyBooked';
			}

			// Calculate day of week
			var currentDayDay	= bl.Util.DayOfWeekNumeric(year, month, iDayNum); // 0 = sunday, 6 = saturday

			arrDays[iDayNum] = {
				'Status'	: dayStatus,
				'DayOfWeek'	: currentDayDay,
				'Date'		: dayScheduleStartDate
			};

			iDayNum++;
		}
		data.Days = arrDays;

		// Generate an array containing the selected days schedules
		data.SelectedDaysSchedules = [];
		if (bl.BookingPage.SelectedDate) {
			for (var iScheduleIndex=0; iScheduleIndex<data.schedules.length; iScheduleIndex++)	{
				if (data.schedules[iScheduleIndex].StartDate == bl.BookingPage.SelectedDate){
					data.SelectedDaysSchedules.push(data.schedules[iScheduleIndex]);
				}
			}
		}

		data.Month		= bl.Util.MonthName(month);
		data.NextMonth	= bl.Util.NextMonth(bl.BookingPage.StartDate);
		data.PrevMonth	= bl.Util.PrevMonth(bl.BookingPage.StartDate);
		data.Year		= year;

		var t = 	'<div class="ScheduleCalendarView">';
			t +=		'<div class="ScheduleCalendarView_Calendar">';
			t +=			'<p id="nextmonthlabel" style="display:none;">'+bl.TranslateUtil.translate('NextMonth', 'Next Month')+'</p>';
			t +=			'<p id="prevmonthlabel" style="display:none;">'+bl.TranslateUtil.translate('PrevMonth', 'Prev Month')+'</p>';
			t +=			'<table>';
			t += 				'<caption>';
			t +=					'<span class="prev" data-date="{$PrevMonth}"></span>';
			t +=					'<span class="month-name">{$Month} {$Year}</span>';
			t +=					'<span class="next" data-date="{$NextMonth}"></span>';
			t +=				'</caption>';
			t +=				'<thead>';
			t +=					'<tr>';
			t +=						'<th><abbr title="Sunday">Su</abbr></th>';
			t +=						'<th><abbr title="Monday">Mo</abbr></th>';
			t +=						'<th><abbr title="Tuesday">Tu</abbr></th>';
			t +=						'<th><abbr title="Wednesday">We</abbr></th>';
			t +=						'<th><abbr title="Thursday">Th</abbr></th>';
			t +=						'<th><abbr title="Friday">Fr</abbr></th>';
			t +=						'<th><abbr title="Saturday">Sa</abbr></th>';
			t +=					'</tr>';
			t +=				'</thead>';
			t +=				'<tbody>';
			t +=					'<tr>';

			t +=						'{for $i=1 to '+leadingDays+'}';
			t +=							'<td class="leadingDay">&nbsp;</td>';
			t +=						'{/for}';

										// Loop through the calendar days
			t +=						'{foreach $Days as $i => $day}';
			t +=							'{if $day.DayOfWeek == 0}';
			t +=								'</tr><tr>';
			t +=							'{/if}';
			t +=							'<td data-date="{$day.Date}" class="status_{$day.Status}">{$i}</td>';
			t +=						'{/foreach}';

										// Trailing days-trailingDays
			t +=						'{for $i=1 to '+trailingDays+'}';
			t +=							'<td class="trailingDay">&nbsp;</td>';
			t +=						'{/for}';

			t +=					'</tr>';
			t +=				'</tbody>';
			t +=			'</table>';
			t +=		'</div>';
			t +=		'<div class="ScheduleCalendarView_Schedules">';

			t +=			'<ul>{foreach $SelectedDaysSchedules as $i => $schedule}';
			t +=				'<li class="{if $schedule.Status == \'Available\'}status_Available{/if}{if $schedule.Status == \'AvailableVariable\'}status_AvailableVariable{/if}{if $schedule.Selected > 0} Selected{/if}">';
			t +=					'<div class="Availability_Radio">';
			t +=						'{if $schedule.Slots >= $slotsRequired}';
			t +=							'<div class="ScheduleSelector" data-schedule-id="{$schedule.ID}"></div>';
			t +=						'{/if}';
			t +=					'</div>';
			t +=					'<div class="Availability_Date">{$schedule.DateFromAndTo}</div>';
			t +=					'<div class="Availability_SpacesLeft">{$schedule.Slots} '+bl.TranslateUtil.translate('SpacesLeft', 'spaces left')+'</div>';
			t +=				'</li>';
			t +=			'{/foreach}</ul>';

			t +=		'</div>';
			t +=	'</div>';

		var tpl = new jSmart( t );
		document.getElementById('BookingPage_ScheduleSelector').innerHTML =  tpl.fetch( data );

		// Apply the calendar click handlers
		jQuery('td.status_Available, td.status_AvailableVariable').on('click', function(){
			bl.BookingPage.SelectedDate = jQuery(this).attr('data-date');
			bl.BookingPage.UpdateScheduleSelector();
		});

		// Apply the schedule click handlers
		jQuery('div.ScheduleSelector').on('click', function(){
			bl.BookingPage.ScheduleSelectorClickHandler(this);
		});

		jQuery('span.next, span.prev').on('click', function(){
			bl.BookingPage.SelectedDate = null;
			bl.BookingPage.StartDate = jQuery(this).attr('data-date');
			bl.BookingPage.UpdateScheduleSelector();
		});
	},


	/**
	 * RenderSevenDayViewSelect
	 */
	'RenderSevenDayViewSelect' : function (data) {

		data.prevDay	= bl.Util.SubtractDaysFromDate(bl.BookingPage.StartDate, 1);
		data.prevWeek	= bl.Util.SubtractDaysFromDate(bl.BookingPage.StartDate, 7);
		data.nextDay	= bl.Util.AddDaysToDate(bl.BookingPage.StartDate, 1);
		data.nextWeek	= bl.Util.AddDaysToDate(bl.BookingPage.StartDate, 7);

		var iDayNum = 1;
		var strDate	= bl.BookingPage.StartDate;
		var iMaxSchedule = 0;
		data.arrDays	= [];
		data.Headers	= [];
		while(iDayNum<=7) {
			var dayData = {
				schedules : []
			};

			// Loop through schedules
			for (var iScheduleIndex=0; iScheduleIndex<data.schedules.length; iScheduleIndex++)	{
				if (data.schedules[iScheduleIndex].StartDate == bl.Util.UKDateToMYSqlDate(strDate)) {
					dayData.schedules.push(data.schedules[iScheduleIndex]);
				}
			}

			var arrDate = bl.Util.UKDateToArray(strDate);
			var dayHeader = bl.Util.DayOfWeekTextual(arrDate.year, arrDate.month, arrDate.day, true) + ' ' + arrDate.day;
			dayHeader += bl.Util.DayOrdinal(arrDate.day);
			dayHeader += ' ' + bl.Util.MonthName(arrDate.month, true);
			data.Headers.push(dayHeader);

			strDate = bl.Util.AddDaysToDate(strDate, 1);
			data.arrDays.push(dayData);
			iDayNum++;

			// Log max num of schedules per day
			if (dayData.schedules.length > iMaxSchedule) {
				iMaxSchedule = dayData.schedules.length;
			}
		}

		var t	=	'<table class="seven-day-calendar">' +
						'<caption>' +
							'<span class="prev-week" data-date="{$prevWeek}" title="'+bl.TranslateUtil.translate('ShowPreviousWeek', 'Show previous week')+'"></span>' +
							'<span class="prev-day"  data-date="{$prevDay}" title="'+bl.TranslateUtil.translate('ShowPreviousDay', 'Show previous day')+'"></span>' +
							'<span class="next-week" data-date="{$nextWeek}" title="'+bl.TranslateUtil.translate('ShowNextWeek', 'Show next week')+'"></span>' +
							'<span class="next-day"  data-date="{$nextDay}" title="'+bl.TranslateUtil.translate('ShowNextDay', 'Show next day')+'"></span>' +
						'</caption>' +
						'<thead>' +
							'<tr>' +
								'{foreach $Headers as $iHeader => $header}' +
									'<th>{$header}</th>' +
								'{/foreach}' +
							'</tr>' +
						'</thead>' +
						'<tbody>' +
							'<tr>' +
								'{foreach $arrDays as $iDay => $day}' +
									'<td>' +
										'{foreach $day.schedules as $iSchedule => $schedules}' +
											'<div class="slot Status_{$schedules.Status} ScheduleSelector {if $schedules.Selected > 0}Selected{/if}" data-schedule-id="{$schedules.ID}">' +
												'<div class="time">{$schedules.StartTime} {$schedules.AMPM}</div>' +
												'<div class="status">{$schedules.Status}</div>' +
												'<div class="slots">{$schedules.Slots} '+bl.TranslateUtil.translate('Slots', 'slots')+'</div>' +
											'</div>' +
										'{foreachelse}'+
											'<div class="slot">'+bl.TranslateUtil.translate('NoAvailability', 'No Availability')+'</div>' +
										'{/foreach}' +
									'</td>' +
								'{/foreach}' +
							'</tr>' +
						'</tbody>' +
					'</table>';

		var tpl = new jSmart( t );
		document.getElementById('BookingPage_ScheduleSelector').innerHTML =  tpl.fetch( data );

		// Apply next/prev actions
		jQuery('span.prev-day, span.prev-week, span.next-day, span.next-week').on('click', function(){
			bl.BookingPage.StartDate = jQuery(this).attr('data-date');
			bl.BookingPage.UpdateScheduleSelector();
		});

		// Apply the schedule click handlers
		jQuery('div.ScheduleSelector').on('click', function(){
			bl.BookingPage.ScheduleSelectorClickHandler(this);
		});
	},


	/**
	 * StatusesForDay
	 *
	 * @param schedules - array of schedules
	 * @param strDate - Expects date in yyyy-mm-dd
	 * Returns an array of status for the day
	 */
	'StatusesForDay' : function (schedules, strDate) {
		var arrStatus = [];

		for (var iScheduleIndex=0; iScheduleIndex<schedules.length; iScheduleIndex++)	{
			if (schedules[iScheduleIndex].StartDate == strDate) {
				// If status is not already in array, add it
				if(arrStatus.indexOf(schedules[iScheduleIndex].Status) == -1) {
					arrStatus.push(schedules[iScheduleIndex].Status);
				}
			}
		}

		return arrStatus;
	},


	/**
	 * Adds a spinning gif loading message in the summary area
	 */
	'ScheduleSelectorLoadingMessage' : function() {
		jQuery('#BookingPage_ScheduleSelector').html('<img src="mysite/images/network-save.gif" /> '+bl.TranslateUtil.translate('UpdatingScheduleSelector', 'Updating schedule selector'));
	},


	/**
	 * Adds a spinning gif loading message in the summary area
	 */
	'SummaryLoadingMessage' : function() {
		jQuery('#BookingPage_Summary').html('<img src="mysite/images/network-save.gif" /> '+bl.TranslateUtil.translate('UpdatingSummary', 'Updating summary'));
	},

    'UpdateSummaryAjax' : function(dataArray) {
        bl.BookingPage.NetworkCall = jQuery.ajax({
            url: bl.RequestUtil.getAbsolutePath('book/gettotalforbooking'),
            type: "POST",
            dataType :"json",
            data: dataArray,
            success: function(data){
                bl.BookingPage.SetUpBookingSummaryFromJSON(data);
				if (typeof initOrderSummary === "function")
					initOrderSummary();

            }
        });

    },

	 getFormData: function(formSelector) {
		// Create an empty object to store form data
		var formData = {};

		// Select all input, textarea, and select elements within the form
		 $(formSelector).find('input, textarea, select').each(function() {
			 var $this = $(this);
			 var name = $this.attr('name');
			 var type = $this.attr('type');
			 var value = $this.val();

			 // Skip elements without a name attribute or disabled elements
			 if (name && !this.disabled) {
				 if (type === 'checkbox' || type == 'radio') {
					 // For checkbox and radio, include the value only if checked.
					 if ($this.is(':checked')) {
						 formData[name] = value;
					 }
				 } else {
					 // For other input types, directly assign the value
					 formData[name] = value;
				 }
			 }
		 });

		 return formData;
	},

    'UpdateSummaryInternal' : function() {
        jQuery("#BookingSummaryHolder").html('');
        if(document.getElementById("Form_BookingForm")){
            var dataArray = jQuery("#Form_BookingForm").serializeArray();
			var DataIsSet = bl.BookingPage.AllInformationSetToGetSummary(dataArray);
			var dataNotSeralized = bl.BookingPage.getFormData('#Form_BookingForm');
            if(DataIsSet){
                $("#BookingSummaryHolder").addClass("pleasewait");
                if(bl.BookingPage.NetworkCall)
                    bl.BookingPage.NetworkCall.abort();
                if ((typeof bl.RequiredResourceProductField != 'undefined') && bl.BookingPage.ISDisableRequiredResourceProductInput==false) {
                    bl.RequiredResourceProductField.UpdateSource(dataArray);
                } else {
                    bl.BookingPage.UpdateSummaryAjax(dataNotSeralized);
                }
            }
            else{
                $("#BookingSummaryHolder").html("");

                //bl.BookingPage.UpdateSummaryAjax(dataArray);
            }

            bl.BookingPage.ShowHideRestrictedEvents(jQuery('#toggleRestrictedEvents'));

        }else{
            // If either a quantity or schedule is not selected return false
            if (bl.BookingPage.SumOfQuantity() == 0 || bl.BookingPage.SelectedSchedules.length == 0) {
                jQuery('div#BookingPage_Summary').html('<p>'+bl.TranslateUtil.translate('SelectQuantityAndScheduleNotification', 'Please select a quantity and schedule before continuing...')+'</p>');
                return;
            }

            // Start building query data
            var data = {
                'extras'        : '',
                'ProductGroup_id': bl.BookingPage.ProductGroup.ID,
                'location_id'   : bl.BookingPage.LocationID,
                'schedule_id'   : bl.BookingPage.SelectedScheduleAsCSV(),
                'day'           : 0,
                'month'         : 0,
                'year'          : 0
            };

            // add the required slots
            jQuery('.Quantity').each(function(){
                var index = 'slots_required_' + jQuery(this).attr('data-price-category');
                data[index] = jQuery(this).val();
            });

            // Get the summary and update page
            jQuery.ajax({
                type: "POST",
                url: bl.RequestUtil.getAbsolutePath("NewBookingPage_Controller/gettotalforbooking"),
                data: data,
                success: function( response ) {
                    var btnHTML = '<button class="action-btn" id="BookingPage_ContinueButton">'+bl.TranslateUtil.translate('Continue', 'Continue')+'</button>';
                    jQuery('div#BookingPage_Summary').html(response + btnHTML);
                    document.getElementById('BookingPage_ContinueButton').onclick = bl.BookingPage.AddBookingItem;
                    bl.BookingPage.ShowHideRestrictedEvents(jQuery('#toggleRestrictedEvents'));
                }
            });
        }

    },

    /**
     * Updates the booking summary to match current pages selected items
     */
	'UpdateSummary' : function() {
		if(typeof bl.RoomLayoutField != 'undefined') {
			bl.RoomLayoutField.DrawTable(function () {
				bl.BookingPage.UpdateSummaryInternal();
			});
		}
		if(typeof bl.ProductEventUpsellField != 'undefined') {

			bl.ProductEventUpsellField.DrawTable(function () {
				bl.BookingPage.UpdateSummaryInternal();
			});
		} else {
			bl.BookingPage.UpdateSummaryInternal();
		}
	},


    SetUpBookingSummaryFromJSON: function(data){
        if(data.BookingSummary){
            jQuery("#BookingSummaryHolder").html(data.BookingSummary);
            if (document.getElementById("ErrorMessage")) {
				jQuery("#Form_BookingForm").find(".Actions").hide();
            }
            else{
                $(".Actions").children().show();
            }
        }else{
            jQuery("#BookingSummaryHolder").html("");
        }

		jQuery('.inline-error').remove();
		jQuery("#Form_BookingForm_action_doBookingForm").prop('disabled', false);

		if (data.DisableContinueButton) {
			jQuery("#Form_BookingForm_action_doBookingForm").prop('disabled', true);
			if (data.DisableContinueMessages) {
				jQuery('<span class="inline-error">' + data.DisableContinueMessages + '</span>').insertBefore("#Form_BookingForm_action_doBookingForm");
			}
		}

        if (jQuery("div.Actions input.CompleteEditOrder").length > 0) {
            if (jQuery("div.Actions input.CompleteEditOrder").data("orderitemquantity") < data.Quantity || data.DisableContinueButton) {
				jQuery("div.Actions input.CompleteEditOrder").hide();
				if (data.DisableContinueMessages) {
					jQuery('<span class="inline-error">' + data.DisableContinueMessages + '</span>').insertAfter("#BookingSummaryHolder");
				}
            } else {
                jQuery("div.Actions input.CompleteEditOrder").show();
				jQuery("div.Actions input.CompleteEditOrder").on('click', function() {
					$("#Form_BookingForm").append('<input type="hidden" name="CompleteBooking" value="1">');
					loadingScreen('start');
				});
            }
        }
        $("#BookingSummaryHolder").removeClass("pleasewait");
    },

    IsExpandedPricingScheme: function() {
        return $('#Quantity').hasClass('expanded_pricing_scheme');
    },

    GetMainProductQuantity: function(){
        if(bl.BookingPage.IsExpandedPricingScheme()){
            var iRet = 0;
            var inputs = $('input.productquantity');
            $.each(inputs, function(){
                var strName = $(this).attr('name');
                if(strName.indexOf('Quantity') == 0)
                    iRet += parseInt($(this).val());
            });
            return iRet;
        }
        else{
            return $('#Form_BookingForm_Quantity').val();
        }
    },

    AllInformationSetToGetSummary: function(dataArray){
        var bRet = true;
        if(document.getElementById("Form_BookingForm_BookingType_TemplateEvents") ||
        	document.getElementById("Form_BookingForm_BookingType_ProductTemplateEvents")
        	){

            var options = $("#RequiredProduct_SelectedOptions").val();
            if(document.getElementById("RequiredProduct_SelectedOptions") && options == ""){
                bRet = false;
            }

            // check whether the date and time dropdown is updated
			if ($('#PDE_Availabilities').length) {
				if (!$('#PDE_Availabilities').val())
					bRet = false;
			} else {
				var dateValue = $("#Availability-StartTime").val();
				if (dateValue == null) {
					bRet = false;
				} else {
					var exp = '^[0-9]{2}:[0-9]{2}';
					if (dateValue == "" || dateValue.match(exp) == null) {
						bRet = false;
					}
				}
			}
        }

        var neededInputs = [];
		if($('#Form_BookingForm_ProductGroupID').val()) {
			neededInputs.push('ProductGroupID');
		} else if($('#Form_BookingForm_ProductID').val()) {
			neededInputs.push('ProductID');
		}

        if(document.getElementById('Form_BookingForm_ProductClassName')){
            var strClassName = $('#Form_BookingForm_ProductClassName').val();
            if(strClassName == 'ProductAppointmentEvent'){
                neededInputs.push('Appointment')
            }
            if(strClassName == 'ProductFixedEvent'){
				if($('#Form_BookingForm_ProductGroupID').val() > 0) {
					neededInputs.push('ProductGroupID');
				} else {
					if($('#EventSeriesID').length > 0 && $('#EventSeriesID').val() != '') {
						neededInputs.push('EventSeriesID');
					} else {
						neededInputs.push('EventID');
					}
				}

                if(bl.BookingPage.IsExpandedPricingScheme()){
                    if(bl.BookingPage.GetMainProductQuantity() <= 0)
                        bRet = false;
                } else{
                    neededInputs.push('Quantity');
                }

            }
        }

        for(var i = 0; i < neededInputs.length; i++){
            var strKey = neededInputs[i];
            var bValidValue = false;
            $.each(dataArray, function(){

				//stupid hack for calendar multi select
				if(typeof this.name != 'undefined') {
					this.name = this.name.replace('[', '').replace(']', '');
				}

                if(typeof this.name != 'undefined'
                    && typeof this.value != 'undefined'
                    && this.name == strKey
                    && this.value != ''
                    && this.value != 0
				) {
					bValidValue = true;
				}
            });
            bRet = bRet && bValidValue;
        }

        return bRet;
    },


	/**
	 * AddBookingItem
	 *
	 * Adds the selected booking item to the shopping basket
	 */
	'AddBookingItem' : function() {
		var data = {
			'destination'	: 'BookingPage_Controller/AddBookingItem',
			'fields'	: {
				'schedule_id'	: bl.BookingPage.SelectedScheduleAsCSV(),
				'ProductGroup_id'	: bl.BookingPage.ProductGroup.ID,
				'destination'	: 'basketpage'
			}
		};

		jQuery('.Quantity').each(function(){
			var value		= jQuery(this).val();
			var iCategoryID	= jQuery(this).attr('data-price-category');
			if (value > 0) {
				data.fields['quantity_ProductGroup_'+iCategoryID] = value;
			}
		});

		bl.Util.PostToURL(data);
	},


	/**
	 * UpdateExtras
	 */
	'UpdateExtras' : function () {
		// If we have extras data
			// call render extras
		// else
			// Call GetExtras with call back set to RenderExtras
	},


	/**
	 * RenderExtras
	 */
	'RenderExtras' : function () {

	},


	/**
	 * GetExtras
	 */
	'GetExtras' : function () {
		jQuery.getJSON(
			'BookingPage_Controller/ExtrasForBookingJSON',
			{
				'ProductGroup_select' : bl.BookingPage.ProductGroup.ID
			},
			function (data) {
			}
		);
	},

    'ScanInputChanges' : function(){
        jQuery('select:not(.no-effect-on-booking)').on('change', bl.BookingPage.UpdateSummary);

        jQuery( document ).on("click", "input[type='radio']:not(.RelatedProducts)", function() {
			if (jQuery(this).hasClass("RequiredResourceProductInput")) {
				bl.BookingPage.ISDisableRequiredResourceProductInput = true;
			}
			bl.BookingPage.UpdateSummary();
			bl.BookingPage.ISDisableRequiredResourceProductInput = false;
        });
    }

};


(function($){
    $(document).ready(function(){
        bl.BookingPage.ScanInputChanges();

        eventIds = $("input[name='EventID']");
        if(eventIds.length ||
            document.getElementById("Form_BookingForm_BookingType_Voucher") ||
            document.getElementById("Form_BookingForm_BookingType_Event") ||
				$('#Form_BookingForm_ProductClassName').val() == 'ProductPhysicalItem' ||
				$('#Form_BookingForm_ProductClassName').val() == 'ProductVoucher'
            ){
           bl.BookingPage.UpdateSummary();
        }

		jQuery( document ).on('click', 'button.nonWaitingListLabel[data-info]', function(){
			bl.BookingPage.ShowReasonForUnavailability(this);
			return false;
		});
		jQuery( document ).on('keypress', 'button[data-info], label[data-info]', function(e){
			if(e.which === 13){
				bl.BookingPage.ShowReasonForUnavailability(this);
				return false;
			}
		});

		jQuery( document ).on('click', '#toggleRestrictedEvents', function(){
			bl.BookingPage.ShowHideRestrictedEvents(this);
		});
		bl.BookingPage.ShowHideRestrictedEvents(jQuery('#toggleRestrictedEvents'));

		$(document).on('keyup', 'input.date', function(e) {
			$(this).attr('autocomplete', "off");
			if (e.which == 40)
				$(this).click();
		});

		$('#Form_BookingForm').on('submit', function() {
		    $(this).find('.Actions :submit').prop('disabled', true).addClass('disabled');
		    return true;
		});
        if (isiPad()) {
            $('body,html').css({'height': '100%', 'overflow': 'auto', '-webkit-overflow-scrolling': 'auto'});
            $('body,html').append("<style>.dhx_mini_calendar .dhx_month_head {padding: 10px !important; } .dhx_minical_popup { width:299px !important; }</style>");
        }

        $("div.Accordion").accordion({
            icons:false,
            active: false,
            collapsible: true,
            heightStyle: 'content'
        });
    });
})(jQuery);

function isiPad(){
    return (navigator.platform.indexOf("iPad") != -1 || navigator.platform.indexOf("iPhone") != -1);
}
