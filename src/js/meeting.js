(function() {

	'use strict';

	//define file wide vars
	var sgNumAttendees,
		sgCurrency,
		sgAvgRate,
		sgMeetingStartMsecs,//initial start timestam
		sgLastNumChangeMsecs,//start timestamp from last attendee count change
		sgCalcTimer,
		sgRatePerSecond,
		sgUpdateDelay = 200,
		sgCostsAtLastNumChange = 0;//holds the costs at the time of the last attendee count change

	var $sgSetupScreen = $('#setup'),
		$sgCurrencyInput = $('#input-currency'),
		$sgMeetingSince = $('#meeting-since');


	const $sgFeedbackScreen = $('#feedback'),
		$sgCurrDuration = $('#currDuration'),
		$sgCurrEuros = $('#currEuros'),
		$sgCurrCents = $('#currCents'),
		$sgCosts = $('#costs'),
		$sgCurrAttendees = $('#curr-attendees__count'),
		$sgStopBtn = $('#stopBtn'),
		$sgBackBtn = $('#backBtn');

	var sgLastH,
		sgLastS,
		sgLastL;

	/**
	* get the current formatted cost in total euros
	* @param {number} currCost Current cost in euros
	* @returns {string} cost in whole euros
	*/
	var getFormattedEuros = function(currCost) {
		var formattedEuros = Math.floor(currCost);

		return formattedEuros;
	};
	


	/**
	* 
	* @param {number} currCost Current cost in euros
	* @returns {string} formatted cost
	*/
	var getFormattedCents = function(currCost) {
		var formattedCents = Math.floor(100*currCost%100);

		return addLeadingZero(formattedCents);
	};


	/**
	* add leading zero if number is < 10
	* @param {num} varname Description
	* @returns {number} the number with optional leading zero
	*/
	var addLeadingZero = function(num) {
		if (num < 10) {
			num = '0'+num;
		}
		return num;
	};
	

	/**
	* 
	* @param {number} secs Current time in seconds
	* @returns {string} Time formatted as [hh:]mm:ss
	*/
	var formatTime = function(secs) {
		var formattedTime = '';
		var h = Math.floor(secs/3600);
		if (h) {
			h = addLeadingZero(h);
			formattedTime += h+':';
		}
		secs = secs%3600;
		var m = addLeadingZero(Math.floor(secs/60));
		secs = addLeadingZero(secs%60);

		formattedTime += m+':'+secs;

		return formattedTime;
	};


	/**
	* calculate the current costs and time
	* @returns {object: {costs:number, meetingDurationSecs:number}} Object containing 
	*/
	var getCurrentCostsAndTime = function() {
		var now = new Date().getTime(),
			meetingDurationMsecs = now - sgMeetingStartMsecs,
			meetingDurationSecs = Math.floor(meetingDurationMsecs/1000),
			msecsSinceLastNumChange = now - sgLastNumChangeMsecs,
			currCosts;

		currCosts = sgCostsAtLastNumChange + sgRatePerSecond*(msecsSinceLastNumChange/1000);

		var currCT = {
			costs: currCosts,
			meetingDurationSecs: meetingDurationSecs,
			now: now
		};

		return currCT;
	};
	

	/**
	* calculate and display current time and costs
	* @returns {void}
	*/
	var updateCosts = function() {
		var currCT = getCurrentCostsAndTime();
		
		$sgCurrDuration.html(formatTime(currCT.meetingDurationSecs));
		$sgCurrEuros.html(getFormattedEuros(currCT.costs));
		$sgCurrCents.html(','+getFormattedCents(currCT.costs));

		//console.log('sgNumAttendees:',sgNumAttendees,'sgRatePerSecond:'+sgRatePerSecond);
		// changeHSL();

		clearTimeout(sgCalcTimer);
		sgCalcTimer = setTimeout(updateCosts, sgUpdateDelay);
	};



	/**
	* update the current rate per second
	* @param {string} varname Description
	* @returns {void}
	*/
	var updateRatePerSecond = function() {
		sgRatePerSecond = sgNumAttendees*sgAvgRate/3600;
	};


	/**
	* update the number of attendees
	* @param {number} numAttendees The new number of attendees
	* @returns {void}
	*/
	var updateNumAttendees = function(numAttendees) {
		sgNumAttendees = numAttendees;
		$sgCurrAttendees.text(sgNumAttendees);
	}

	/**
	* get the start's timestamp in msecs
	* @returns {undefined}
	*/
	const getMeetingStartTimestamp = function() {
		// check which time we need to use
		const since = $sgMeetingSince.val() || '0',
			strlen = since.length;
		let msecsAgo = 0,
			startTime = new Date(),
			timestamp;

		if (strlen > 2) {
			// exact time
			const minutes = parseInt(since.substr(-2,2), 10),
				hours = parseInt(since.substr(0, strlen-2), 10);

			startTime.setHours(hours, minutes, 0, 0);
			timestamp = startTime.getTime();
		} else {
			// minutes ago
			timestamp = startTime.getTime() - 60 * 1000 * since;
		}

		return timestamp;
	};
	


	/**
	* start a meeting
	* @param {string} varname Description
	* @returns {void}
	*/
	var startMeeting = function(e) {
		e.preventDefault();

		//check if input is filled in, or radio
		var numAttendees = parseInt($('#more-attendees-input').val(), 10);

		if (!numAttendees) {
			numAttendees = parseInt($('input[name="numAttendees"]:checked').val(),10);
		}
		updateNumAttendees(numAttendees);

		sgAvgRate = parseInt($('#hourlyRate').val(),10);
		updateRatePerSecond();

		sgMeetingStartMsecs = getMeetingStartTimestamp();
		sgLastNumChangeMsecs = sgMeetingStartMsecs;

		sgCurrency = $sgCurrencyInput.val();
		document.getElementById('counter__currency').textContent = sgCurrency;

		sgCostsAtLastNumChange = 0;
		updateCosts();

		showFeedbackScreen();

		clearTimeout(sgCalcTimer);
		sgCalcTimer = setTimeout(updateCosts, sgUpdateDelay);
	};


	/**
	* end the meeting
	* @param {string} varname Description
	* @returns {void}
	*/
	var endMeeting = function() {
		clearTimeout(sgCalcTimer);

		$('#stopBtn').hide();
		$('#backBtn').show();
	};


	/**
	* 
	* @param {string} varname Description
	* @returns {void}
	*/
	var showStartScreen = function(e) {
		e.preventDefault();

		$sgSetupScreen.fadeIn();
		//$sgFeedbackScreen.fadeOut();
	};


	/**
	* 
	* @param {string} varname Description
	* @returns {void}
	*/
	var showFeedbackScreen = function() {
		$sgSetupScreen.fadeOut();
		//$sgFeedbackScreen.fadeIn();

		$sgStopBtn.show();
		$sgBackBtn.hide();
	}



	/**
	* change the number of attendees
	* @param {string} varname Description
	* @returns {undefined}
	*/
	var changeAttendeeCountHandler = function(e) {
		e.preventDefault();

		//calculate new number of attendees
		var add = (e.currentTarget.id === 'more-attendees') ? 1:-1,
			newNumAttendees = sgNumAttendees+add;

		if (newNumAttendees > 0) {
			//set costs until now and this change's timestamp
			var currCT = getCurrentCostsAndTime();
			sgLastNumChangeMsecs = currCT.now;
			sgCostsAtLastNumChange = currCT.costs;

			//now set new number of attendees
			updateNumAttendees(newNumAttendees);
			updateRatePerSecond();
		}
	};


	/**
	* handle setting num of attendees by input
	* @returns {undefined}
	*/
	var handleAttendeesInput = function(e) {
		var $input = $(e.currentTarget),
			value = parseInt($input.val(), 10);	

		if (value) {
			$('[name="numAttendees"]').prop('checked', false);
			$input.removeClass('is-empty');
		}
	};


	/**
	* reset the attendees input feeld
	* @returns {undefined}
	*/
	var resetAttendeesInput = function(e) {
		$('#more-attendees-input').val('').addClass('is-empty');
	};
	
	
	/**
	* 
	* @param {string} varname Description
	* @returns {undefined}
	*/
	var init = function() {

		//scroll addressbar out of view
		setTimeout(function(){
	    	window.scrollTo(0, 1);
		}, 0);

		$('#startBtn').on('click', startMeeting);
		$('#stopBtn').on('click', endMeeting);
		$('#backBtn').on('click', showStartScreen);
		
		$('.attendees-list').find('input[type="radio"]').on('click', resetAttendeesInput);
		$('#more-attendees-input').on('keyup', handleAttendeesInput);
		$('#less-attendees, #more-attendees').on('click', changeAttendeeCountHandler);
		$('input').on('focus', function() {
			var fld = this;
			setTimeout(() => {
				fld.selectionStart = 0;
				fld.selectionEnd = fld.value.length;
			}, 200);
		});
	};

	jQuery(document).ready(function() {
		init();
	});
})();