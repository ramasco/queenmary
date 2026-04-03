
/**
* Availability.js
* file javascript
* @copyright 2010 - 2015 BookingLive Software Limited
*/
// todo - handle quota exceeded error http://diveintohtml5.info/storage.html
// native json doc - https://developer.mozilla.org/en-US/docs/Using_native_JSON

if (typeof bl === 'undefined') {var bl = {};}

bl.Availability = {

	// Cached schedules
	'Cache_Schedules'		: {},

	// Controls how long results are valid for default 300 seconds = 5 min
	'CacheValidFor'			: 60 * 5 * 1000,

	'LocalCacheSupported'	: false,

	/**
	 * init
	 */
	'init' : function () {
		var bLocalStorageSupport	= (typeof(localStorage)	!= 'undefined');
		var bJSONSupport			= (typeof(JSON)			!= 'undefined' && typeof(JSON.parse)	!= 'undefined');

		if (bLocalStorageSupport && bJSONSupport) {
			bl.Availability.LocalCacheSupported = true;
			bl.Availability.UpdateCacheWithLocalStorage();
			bl.Availability.ValidateCache();// added to fix
			bl.Availability.ClearLocalStorageSchedules();

		}
	},

	
	'ClearBasketItemCount' : function(){
		localStorage.removeItem('BasketItemCount')
	},
	
	'GetBasketItemCount' : function(){
		var name = localStorage.getItem('BasketItemCount');
		if (name != null) {
			var item = localStorage.getItem('BasketItemCount');
			jQuery('.basket_count').html(item)
		}
		else{
			jQuery.ajax({
				url: bl.RequestUtil.getAbsolutePath('Page_Controller/GetSumOfItemsForPending'),
				success: function(iCount){
					localStorage.setItem('BasketItemCount', iCount);
					jQuery('.basket_count').html(iCount)
				}
			});
		}
	},
	/**
	 * UpdateCacheWithLocalStorage
	 *
	 * Populates bl.Availability.Cache_Schedules with data from localStorage
	 *
	 * todo - handle error from exceeding storage quota and disable localStorage caching
	 */
	'UpdateCacheWithLocalStorage' : function() {
		if (localStorage.Cache_Schedules != null) {
			bl.Availability.Cache_Schedules = JSON.parse(localStorage.Cache_Schedules);
		}
	},


	/**
	 * SaveCacheToLocalStorage
	 *
	 * Saves data in the bl.Availability.Cache_Schedules to localStorage to allow cache
	 * persists across page loads
	 */
	'SaveCacheToLocalStorage' : function() {
		localStorage.Cache_Schedules = JSON.stringify(bl.Availability.Cache_Schedules);
	},


	/**
	 * ClearLocalStorageSchedules
	 *
	 * Deleted any schedule data from localStorage
	 */
	'ClearLocalStorageSchedules' : function() {
		delete localStorage.Cache_Schedules;
	},


	/**
	 * Removes any expired data from the cache
	 */
	'ValidateCache' : function () {
		for (var key in bl.Availability.Cache_Schedules) {
			var obj = bl.Availability.Cache_Schedules[key];
			if (obj.expires < bl.Availability.TimeStamp()) {
				delete bl.Availability.Cache_Schedules[key];
			}
		}
		bl.Availability.SaveCacheToLocalStorage();
	},


	/**
	 * TimeStamp
	 *
	 * @returns {number}
	 */
	'TimeStamp' : function() {
		return new Date().getTime();
	},


	/**
	 * Returns schedules matching the query, will first try to load data from
	 * cache or perform an ajax request for missing data
	 *
	 * var queryData = {
	 * 		location_select	: 1,
	 * 		activity_select	: 1,
	 * 		start_date		: '10-5-2013',
	 * 		end_date		: '24-6-2013'
	 * 	};
	 *
	 * @param queryData
	 * @param callback
	 */
	'GetEvents' : function (queryData, callback) {
		var bUseCache = bl.Availability.LocalCacheSupported;

		if (bUseCache) {
			bl.Availability.ValidateCache();
		}

		// The end date has been set so we need to get the availability for
		// all months in the date range
		var startDate	= bl.DateUtil.UKDateToArray(queryData.start_date);
		if (!queryData.end_date) {queryData.end_date = queryData.start_date;}

		var endDate		= bl.DateUtil.UKDateToArray(queryData.end_date);
		var loopMonth	= startDate.month;
		var loopYear	= startDate.year;
		var arrQueries	= [];

		while (
			loopYear <= endDate.year ||
			(loopMonth <= endDate.month && loopYear <= endDate.year)
		) {
			var iDaysInMonth	= bl.DateUtil.DaysInMonth(loopMonth, loopYear);
			var queryHash		= bl.Availability.GenerateEventHash(queryData.location,loopYear,loopMonth);

			// If query not in cache add it to the array of queries to perform
			if (typeof bl.Availability.Cache_Schedules[queryHash] == 'undefined') {
				arrQueries.push({
					start_date		: '1-' + loopMonth + '-' +loopYear,
					end_date		: iDaysInMonth + '-' + loopMonth + '-' + loopYear,
					location		: queryData.location,
					products		: queryData.products
				});
			}

			loopMonth++;
			if (loopMonth == 13) {
				loopMonth = 1;
				loopYear++;
			}
		}


		if (arrQueries.length > 0) {
			jQuery.post('BookingPage_Controller/EventsInMonths', {'AvailabilityRequests':arrQueries}, function(data) {
				// add months to schedule cache
				for (var month in data) {
					if(data.hasOwnProperty(month)) {
						bl.Availability.Cache_Schedules[month] = {
							schedules	: data[month],
							expires		: bl.Availability.CacheValidFor + bl.Availability.TimeStamp()
						};
					}
				}
				if (bUseCache) {
					bl.Availability.SaveCacheToLocalStorage();
				}
				bl.Availability.GetSchedulesForDatePeriodFromCache(queryData, callback);
			}, "json");
		} else {
			bl.Availability.GetSchedulesForDatePeriodFromCache(queryData, callback);
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
		var startDate		= bl.DateUtil.UKDateToArray(queryData.start_date);
		var objStartDate	= new Date(startDate.year, (startDate.month-1), startDate.day);
		var endDate			= bl.DateUtil.UKDateToArray(queryData.end_date);
		var objEndDate		= new Date(endDate.year, (endDate.month-1), endDate.day);

		var arrReturnSchedules	= [];
		var loopMonth			= startDate.month;
		var loopYear			= startDate.year;
		while (
			loopYear <= endDate.year ||
			(loopMonth <= endDate.month && loopYear <= endDate.year)
		) {
			var queryHash = bl.Availability.GenerateEventHash(queryData.location,loopYear,loopMonth);
			// If schedule data is in the cache
			if (typeof bl.Availability.Cache_Schedules[queryHash] != 'undefined') {
				// todo - change schedule references to events
				var arrSchedules = bl.Availability.Cache_Schedules[queryHash].schedules;
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
	 * GenerateEventHash
	 *
	 * Generates hash for storing events in the cache
	 *
	 * @param iLocation
	 * @param year
	 * @param month
	 * @returns {string}
	 */
	'GenerateEventHash' : function(iLocation,year,month) {
		return 'location=' + iLocation + '&year=' + year + '&month=' + month;
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
				if (jQuery.inArray(schedules[iScheduleIndex].Status, arrStatus) == -1) {
					arrStatus.push(schedules[iScheduleIndex].Status);
				}
			}
		}
		return arrStatus;
	},


	/**
	 * Clear
	 *
	 * Clears the event data from Cached_Schedules and localStorage
	 */
	'Clear' : function() {

	}
};
bl.Availability.init();
bl.Availability.GetBasketItemCount();

$("a[href*='#']").on('click', function(e) {

  href = $(this).attr('href');
  arrHref = href.split('#');
  if (arrHref.length == 2) {
    e.preventDefault();
    scrollToAnchor(arrHref[1]);
  }
});

function scrollToAnchor(aid){
  var aTag = $("a[name='"+ aid +"']");
  offset = aTag.offset().top;
  if (aid == 'top') {
    offset = 0;
  }

  $('html,body').animate({scrollTop: offset},'slow');
}
