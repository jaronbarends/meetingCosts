(function() {

	'use strict';

	//define file wide vars
	var f_numAttendees,
		f_avgRate,
		f_meetingStartMsecs,//initial start timestam
		f_lastNumChangeMsecs,//start timestamp from last attendee count change
		f_calcTimer,
		f_ratePerSecond,
		f_updateDelay = 200,
		f_costsAtLastNumChange = 0;//holds the costs at the time of the last attendee count change

	var f_$setupScreen = $('#setup'),
		f_$feedbackScreen = $('#feedback'),
		f_$currDuration = $('#currDuration'),
		f_$currEuros = $('#currEuros'),
		f_$currCents = $('#currCents'),
		f_$costs = $('#costs'),
		f_$currAttendees = $('#currAttendees'),
		f_$stopBtn = $('#stopBtn'),
		f_$backBtn = $('#backBtn'),
		f_$resumeBtn = $('#resumeBtn');

	var f_lastH,
		f_lastS,
		f_lastL;

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
			meetingDurationMsecs = now - f_meetingStartMsecs,
			meetingDurationSecs = Math.floor(meetingDurationMsecs/1000),
			msecsSinceLastNumChange = now - f_lastNumChangeMsecs,
			currCosts;

		currCosts = f_costsAtLastNumChange + f_ratePerSecond*(msecsSinceLastNumChange/1000);

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
		
		f_$currDuration.html(formatTime(currCT.meetingDurationSecs));
		f_$currEuros.html(getFormattedEuros(currCT.costs));
		f_$currCents.html(','+getFormattedCents(currCT.costs));

		//console.log('f_numAttendees:',f_numAttendees,'f_ratePerSecond:'+f_ratePerSecond);
		changeHSL();

		clearTimeout(f_calcTimer);
		f_calcTimer = setTimeout(updateCosts, f_updateDelay);
	};


	/**
	* 
	* @param {string} varname Description
	* @returns {undefined}
	*/
	var changeHSL = function() {
		f_lastH ++;
		if (f_lastH > 360) {
			f_lastH = 0;
		}

		var hsla = 'hsla('+f_lastH+','+f_lastS+','+f_lastL+',1)';

		//f_$currEuros.css('color', hsl);
		//f_$currCents.css('color', hsl);
		//console.log(hsla);
		f_$costs.css({'color': hsla, 'border-color': hsla});
		//console.log(f_$costs.css('color'));
	};
	


	/**
	* initialize hsl vars
	* @returns {undefined}
	*/
	var initHSL = function() {
		//var rgb = f_$currEuros.css('color');
		var rgb = f_$costs.css('color');

		rgb = rgb.substring(4,rgb.length-1);//strip off 'rgb(' and ')'
		rgb = rgb.replace(' ','','g');
		rgb = rgb.split(',');
		
		var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
		f_lastH = Math.floor(360*hsl[0]);
		f_lastS = Math.floor(100*hsl[1])+'%';
		f_lastL = Math.floor(100*hsl[2])+'%';

		//console.log(f_lastH, f_lastS, f_lastL);
	};
	
	

	/**
	* update the current rate per second
	* @param {string} varname Description
	* @returns {void}
	*/
	var updateRatePerSecond = function() {
		f_ratePerSecond = f_numAttendees*f_avgRate/3600;
	};


	/**
	* update the number of attendees
	* @param {number} numAttendees The new number of attendees
	* @returns {void}
	*/
	var updateNumAttendees = function(numAttendees) {
		f_numAttendees = numAttendees;
		f_$currAttendees.text(f_numAttendees);
	}


	/**
	* start a meeting
	* @param {string} varname Description
	* @returns {void}
	*/
	var startMeeting = function(e) {
		e.preventDefault();

		var numAttendees = parseInt($('input[name="numAttendees"]:checked').val(),10);
		updateNumAttendees(numAttendees);

		f_avgRate = parseInt($('#hourlyRate').val(),10);
		updateRatePerSecond();

		f_meetingStartMsecs = Math.floor(new Date().getTime());
		f_lastNumChangeMsecs = f_meetingStartMsecs;

		f_costsAtLastNumChange = 0;
		updateCosts();

		showFeedbackScreen();

		clearTimeout(f_calcTimer);
		f_calcTimer = setTimeout(updateCosts, f_updateDelay);
	};


	/**
	* end the meeting
	* @param {string} varname Description
	* @returns {void}
	*/
	var endMeeting = function() {
		clearTimeout(f_calcTimer);

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

		f_$setupScreen.fadeIn();
		//f_$feedbackScreen.fadeOut();
	};


	/**
	* 
	* @param {string} varname Description
	* @returns {void}
	*/
	var showFeedbackScreen = function() {
		f_$setupScreen.fadeOut();
		//f_$feedbackScreen.fadeIn();

		f_$stopBtn.show();
		f_$backBtn.hide();
		f_$resumeBtn.hide();
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
		var add = (e.currentTarget.id === 'moreAttendees') ? 1:-1,
			newNumAttendees = f_numAttendees+add;

		if (newNumAttendees > 0) {
			//set costs until now and this change's timestamp
			var currCT = getCurrentCostsAndTime();
			f_lastNumChangeMsecs = currCT.now;
			f_costsAtLastNumChange = currCT.costs;

			//now set new number of attendees
			updateNumAttendees(newNumAttendees);
			updateRatePerSecond();
		}
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
		$('#lessAttendees, #moreAttendees').on('click', changeAttendeeCountHandler);
	};

	jQuery(document).ready(function() {
		init();
	});
})();