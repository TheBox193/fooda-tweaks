'use strict';

console.log('Fooda fooda! Popup');
	chrome.alarms.getAll( function(alarms) {
		console.log('alarms after: ', alarms);
		debugger;
		$('.alarms').append('<div></div>');
	});
