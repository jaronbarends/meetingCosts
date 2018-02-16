(function() {

	'use strict';

	//define file wide vars
	var sgNumAttendees,
		sgAvgRate,
		sgMeetingStartMsecs,//initial start timestam
		sgLastNumChangeMsecs,//start timestamp from last attendee count change
		sgCalcTimer,
		sgRatePerSecond,
		sgUpdateDelay = 200,
		sgCostsAtLastNumChange = 0;//holds the costs at the time of the last attendee count change

	var $sgSetupScreen = $('#setup'),
		$sgFeedbackScreen = $('#feedback'),
		$sgCurrDuration = $('#currDuration'),
		$sgCurrEuros = $('#currEuros'),
		$sgCurrCents = $('#currCents'),
		$sgCosts = $('#costs'),
		$sgCurrAttendees = $('#currAttendees'),
		$sgStopBtn = $('#stopBtn'),
		$sgBackBtn = $('#backBtn'),
		$sgResumeBtn = $('#resumeBtn');

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
		changeHSL();

		clearTimeout(sgCalcTimer);
		sgCalcTimer = setTimeout(updateCosts, sgUpdateDelay);
	};


	/**
	* 
	* @param {string} varname Description
	* @returns {undefined}
	*/
	var changeHSL = function() {
		sgLastH ++;
		if (sgLastH > 360) {
			sgLastH = 0;
		}

		var hsla = 'hsla('+sgLastH+','+sgLastS+','+sgLastL+',1)';

		//$sgCurrEuros.css('color', hsl);
		//$sgCurrCents.css('color', hsl);
		//console.log(hsla);
		$sgCosts.css({'color': hsla, 'border-color': hsla});
		//console.log($sgCosts.css('color'));
	};
	


	/**
	* initialize hsl vars
	* @returns {undefined}
	*/
	var initHSL = function() {
		//var rgb = $sgCurrEuros.css('color');
		var rgb = $sgCosts.css('color');

		rgb = rgb.substring(4,rgb.length-1);//strip off 'rgb(' and ')'
		rgb = rgb.replace(' ','','g');
		rgb = rgb.split(',');
		
		var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
		sgLastH = Math.floor(360*hsl[0]);
		sgLastS = Math.floor(100*hsl[1])+'%';
		sgLastL = Math.floor(100*hsl[2])+'%';

		//console.log(sgLastH, sgLastS, sgLastL);
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
		console.log(numAttendees);

		sgAvgRate = parseInt($('#hourlyRate').val(),10);
		updateRatePerSecond();

		sgMeetingStartMsecs = Math.floor(new Date().getTime());
		sgLastNumChangeMsecs = sgMeetingStartMsecs;

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
		//$('#resumeBtn').show();
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
		$sgResumeBtn.hide();
	}



	/**
	* 
	* @param {string} varname Description
	* @returns {void}
	*/
	var resumeMeeting = function(e) {
		
	}



	/**
	* Converts an RGB color value to HSL. Conversion formula
	* adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	* Assumes r, g, and b are contained in the set [0, 255] and
	* returns h, s, and l in the set [0, 1].
	* from http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
	*
	* @param   Number  r       The red color value
	* @param   Number  g       The green color value
	* @param   Number  b       The blue color value
	* @return  Array           The HSL representation
	*/
	var rgbToHsl = function(r, g, b){
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if(max == min){
			h = s = 0; // achromatic
		}else{
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return [h, s, l];
	};


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
		$('#resumeBtn').on('click', resumeMeeting);
		initHSL();
		$('.attendees-list').find('input[type="radio"]').on('click', resetAttendeesInput);
		$('#more-attendees-input').on('keyup', handleAttendeesInput);
		$('#less-attendees, #more-attendees').on('click', changeAttendeeCountHandler);
	};

	jQuery(document).ready(function() {
		init();
	});
})();