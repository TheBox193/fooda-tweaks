'use strict';

window.console.log('Fooda fooda! Popup');
chrome.alarms.getAll(function (alarms) {
	$('.alarms').append('<p>Nothing order for these days yet..</p>');
	alarms.forEach(function (alarm) {
		var date = moment(alarm.name, 'YYYY-MM-DD');
		if (date) {
			var text = date.format('ll');
			$('.alarms').append('<li><a href=https://app.fooda.com/my?date=' + alarm.name + '>' + text + '</a></li>');
		}
	});
});

document.addEventListener('DOMSubtreeModified', function () {
	var links = document.getElementsByTagName('a');
	for (var i = 0; i < links.length; i++) {
		(function () {
			var ln = links[i];
			var location = ln.href;
			ln.onclick = function () {
				chrome.tabs.create({ active: true, url: location });
			};
		})();
	}
});