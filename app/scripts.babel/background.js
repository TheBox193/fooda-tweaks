'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
	console.log('previousVersion', details.previousVersion);
});

// chrome.browserAction.setBadgeText({ text: '\'Allo' });

console.log('\'Allo \'Allo! Event Page for Browser Action');

chrome.alarms.getAll( function(alarms) {
	console.log('boot alarms: ', alarms);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	chrome.alarms.getAll( function(alarms) {
		console.log('alarms before: ', alarms);
	});
	console.log(request);
	if(request.action == 'createAlarms')
	{
		const alarms = request.dates.map(function(date) {
			return {
				name: date,
				alarm: moment(date, 'YYYY-MM-DD').hour(9).minute(30).unix() * 1000
			};
		});
		moment('2017-01-24', 'YYYY-MM-DD');

		alarms.forEach(function(item) {
			chrome.alarms.create(item.name, {
				when: item.alarm
			});
		});
	} else if (request.action == 'cancelAlarms') {
		request.dates.map(function(date) {
			chrome.alarms.clear(date);
		});
	}

	chrome.alarms.getAll( function(alarms) {
		console.log('alarms after: ', alarms);
	});
});

chrome.alarms.onAlarm.addListener(function(alarm) {
	chrome.notifications.create({
		type: 'basic',
		iconUrl: 'images/icon-128.png',
		title: 'Fooda Tweaks',
		message: 'Don\'t forget to order!'
	});
});

chrome.notifications.onClicked.addListener(function(id) {
	var newURL = 'https://app.fooda.com/';
	chrome.notifications.clear(id);

	chrome.tabs.query({url: '*://app.fooda.com/*'}, function (tabs) {
		if (tabs.length) {
			chrome.tabs.update(tabs[0].id, {selected: true});
		} else {
			chrome.tabs.create({ url: newURL });
		}
	});
});