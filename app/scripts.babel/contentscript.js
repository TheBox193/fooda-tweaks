'use strict';
var loc = window.location.pathname.split('/');
var isMenu = (loc[3] === 'select_events' && loc[5] === 'items' && loc[6] === undefined);
var isItem = (loc[6]);
var isCheckout = (loc[5] === 'checkout');
var isRestuarants = (loc[1] === 'my');

var TAX = 0.105;

var css = chrome.extension.getURL('styles/fooda.css');
$('<link rel="stylesheet" type="text/css" href="' + css + '" >').appendTo('head');

if (isMenu) {
	var moneyString = $('.marketing__item').text();
	if (moneyString) {
		var moneyAvailable = Number(moneyString.match(/\$[0-9]?[0-9]\.[0-9][0-9]/)[0].substr(1));


		const option1 = $('*[data-selection-option="Below $7"]')[0];
		option1.dataset.selectionOption = 'Below $' + moneyAvailable;
		$(option1).find('a').text('Below $' + moneyAvailable);

		const option2 = $('*[data-selection-option="$7 - $9"]')[0];
		option2.dataset.selectionOption = '$' + moneyAvailable + ' - $' + (moneyAvailable + 2);
		$(option2).find('a').text('$' + moneyAvailable + ' - $' + (moneyAvailable + 2));

		const option3 = $('*[data-selection-option="Above $9"]')[0];
		option3.dataset.selectionOption = 'Above $' + (moneyAvailable + 2);
		$(option3).find('a').text('Above $' + (moneyAvailable + 2));

		var $items = $('.item');

		$items.each(function (index, item) {
			var $item = $(item);

			var price = (Number($item.find('.item__price').text().substr(1)) * (1 + TAX) );

			if (price < moneyAvailable) {
				item.dataset.price = 'Below $' + moneyAvailable;
			} else if (price < moneyAvailable + 2) {
				item.dataset.price = '$' + moneyAvailable + ' - $' + (moneyAvailable + 2);
			} else {
				item.dataset.price = 'Above $' + (moneyAvailable + 2);
			}
		});
	}

	$('.item-group__category').on('click', function(ev) {
		$(ev.currentTarget).siblings('div').toggle();
	});

	/** Shorten the top banner*/
	$('.jumbotron').height(220);
}

/** An items page */
if (isItem) {
	/** Fix 'buy now' verbiage to 'add to card' */
	$('.btn.buy-now').each(function(i, btn) {
		btn.value = 'Add to Cart';
	});

	/** Track back to restaurant button */
	$('.btn.buy-now').on('click', function() {
		var href = $('.return-menu a').attr('href');
		chrome.storage.local.set({'lastRestaurant': href});
	});
}

if (isCheckout) {
	chrome.storage.local.get({ordered: [], lastRestaurant: ''}, function (result) {
		/** Restore back button to go to restaurant */
		if (result.lastRestaurant !== '') {
			$('.return-menu a').attr('href', result.lastRestaurant);
		}

		var dateArray = $('.delivery-by').text().match(/, ([A-Za-z]{3}) ([0-9]{1,2})/);
		var date = moment(dateArray[1] + dateArray[2], 'MMMD').toISOString();

		// the input argument is ALWAYS an object containing the queried keys
		// so we select the key we need
		var ordered = result.ordered;
		ordered.push(date);
		ordered = _.uniq(ordered);
		// set the new array value to the same key
		chrome.storage.local.set({ordered: ordered}, function () {
			// you can use strings instead of objects
			// if you don't  want to define default values
			chrome.storage.local.get('ordered', function (result) {
				console.log(result.ordered);
			});
		});
	});
}

/** Main restaurant selection page */
if (isRestuarants) {
	/** Extracting dates that have and don't have orders */
	var dates = $('.cal__day--active, .cal__day');
	var checked = ':has(.cal__day__inner__box--checked)';

	var extractDate = function(i, item) {
		return item.href.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
	};

	var datesEmpty = dates.not(checked).map(extractDate).toArray();
	var datesOrdered = dates.has(checked).map(extractDate).toArray();

	chrome.runtime.sendMessage({
		action: 'createAlarms',
		dates: _.uniq(datesEmpty)
	});

	chrome.runtime.sendMessage({
		action: 'cancelAlarms',
		dates: _.uniq(datesOrdered)
	});
}
