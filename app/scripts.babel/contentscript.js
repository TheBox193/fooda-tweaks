'use strict';
var loc = window.location.pathname.split('/');
var isMenu = (loc[3] === 'select_events' && loc[5] === 'items' && loc[6] === undefined);
var isItem = (loc[6]);
var isCheckout = (loc[5] === 'checkout');
var isRestuarants = (loc[1] === 'my');

var TAX = 0.105;
var api = 'https://jstassen-01.jstassen.com/apps/chromeextensions/fooda-tweaks/';

var css = chrome.extension.getURL('styles/fooda.css');
$('<link rel="stylesheet" type="text/css" href="' + css + '" >').appendTo('head');

// Oh snap
// if (_.isEmpty(localStorage.getItem('USER_ID'))) {
// 	const USER_ID = $('body').html().match(/"dimension1" ?: ?"(\w{1,})"/)[1];
// 	localStorage.setItem('USER_ID', USER_ID);
// }

// Get & Store Email
if (_.isEmpty(localStorage.getItem('email')) || _.isEmpty(localStorage.getItem('USER_ID'))) {
	$.get('https://app.fooda.com/settings/profile').done((resp) => {
		const $doc = $(resp);
		const email = $doc.find('input#user_email').val();
		const USER_ID = $doc.find('.edit_user').attr('id').replace('edit_user_', '');
		localStorage.setItem('email', email);
		localStorage.setItem('USER_ID', USER_ID);
	});
}

if (isMenu) {
	var moneyString = $('.marketing__item').text();
	const $items = $('.item');
	if (moneyString) {
		moneyString = moneyString.match(/\$[0-9]?[0-9]\.[0-9][0-9]/)[0].substr(1).replace('.', '');
		var moneyAvailable = Number(moneyString);

		const option1 = $('*[data-selection-option="Below $7"]')[0];
		option1.dataset.selectionOption = 'Below $' + moneyAvailable;
		$(option1).find('a').text('Below $' + moneyAvailable/100);

		const option2 = $('*[data-selection-option="$7 - $9"]')[0];
		option2.dataset.selectionOption = '$' + moneyAvailable + ' - $' + (moneyAvailable + 200);
		$(option2).find('a').text('$' + moneyAvailable/100 + ' - $' + ((moneyAvailable + 200) / 100));

		const option3 = $('*[data-selection-option="Above $9"]')[0];
		option3.dataset.selectionOption = 'Above $' + (moneyAvailable + 200);
		$(option3).find('a').text('Above $' + ((moneyAvailable + 200) / 100));

		$items.each(function (index, item) {
			var $item = $(item);
			var price = (Number($item.find('.item__price').text().substr(1).replace('.', '')) * (1 + TAX) );

			if (price < moneyAvailable) {
				item.dataset.price = 'Below $' + moneyAvailable;
			} else if (price < moneyAvailable + 200) {
				item.dataset.price = '$' + moneyAvailable + ' - $' + (moneyAvailable + 200);
			} else {
				item.dataset.price = 'Above $' + (moneyAvailable + 200);
			}
		});
	}

	$items.each(function (index, item) {
		// const itemId = item.children[0].href.split('/').pop();
		const $item = $(item);
		const itemName = $item.find('.item__name').text();
		const itemId = $item.find('.item__photo__img').attr('src').split('/').pop().split('.')[0];
		item.dataset.itemName = itemName;
		item.dataset.itemScope = item.dataset.vendor_name + '::' + itemName;
		item.dataset.itemId = itemId;
	});

	$('.item-group__category').on('click', function(ev) {
		$(ev.currentTarget).siblings('div').toggle();
	});

	/** Shorten the top banner*/
	$('.jumbotron').height(220);

	$items.append('<div class="hide-item">X</div>')
		.find('.hide-item')
		.on('click', (ev) => {
			$(ev.target.parentNode).remove();
		});

	$items.append('<div class="vote-item"><div class="vote-item-up" data-vote-type="up">👍<div class="vote-item-up-count" /></div><div class="vote-item-down" data-vote-type="down">👎<div class="vote-item-down-count" /></div></div>')
		.find('.vote-item-up, .vote-item-down')
		.on('click', (ev) => {
			const itemId = $(ev.target).closest('.item').data('itemId');
			const previouseVote = getItemVote(itemId);
			let vote = $(ev.target).closest('.vote-item > div').data('voteType');

			if (previouseVote === vote) vote = 'none';
			if (vote !== 'up' && vote !== 'down' && vote !== 'none') return;

			setItemVote(itemId, vote);
			decrementVoteCount(itemId, previouseVote);
			incrementVoteCount(itemId, vote);

			var payload = {
				userId: getUserId(),
				email: getEmail(),
				vendorName: getVendorName(itemId),
				itemScope: getItemScope(itemId),
				itemId: itemId,
				vote: vote
			};

			$.post(api + 'votes', payload);
		});

	$.get(api + 'votes').then((data) => {
		data.forEach( (itemVote) => {
			const {itemId, vote, userId} = itemVote;

			if (getItem(itemId).length === 0) return;

			if (userId === getUserId())
				setItemVote(itemId, vote);

			incrementVoteCount(itemId, vote);
		});
	});
}

const getItem = (itemId) => $('*[data-item-id="'+itemId+'"]');

const getItemData = (itemId, key) => getItem(itemId)[0].dataset[key];
const setItemData = (itemId, key, value) => getItem(itemId)[0].dataset[key] = value;

const getUserId = () => localStorage.getItem('USER_ID');
const getEmail = () => localStorage.getItem('email');
const getItemVote = (itemId) => getItemData(itemId, 'vote');
const getVendorName = (itemId) => getItemData(itemId, 'vendor_name');
const getItemScope = (itemId) => getItemData(itemId, 'itemScope');
function getItemVoteCount(itemId, vote) {
	const count = Number(getItemData(itemId, 'vote'+vote+'s'));
	return (_.isFinite(count)) ? count : 0;
}

const incrementVoteCount = (itemId, vote) => setItemVoteCount(itemId, vote, getItemVoteCount(itemId, vote) + 1);
const decrementVoteCount = (itemId, vote) => setItemVoteCount(itemId, vote, getItemVoteCount(itemId, vote) - 1);

const setItemVote = (itemId, vote) => setItemData(itemId, 'vote', vote);
function setItemVoteCount(itemId, vote, count) {
	const $item = getItem(itemId);
	setItemData(itemId, 'vote'+vote+'s', count);
	$item.find('.vote-item-'+vote+'-count').text(String(count));
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
				window.console.log(result.ordered);
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

/** Any order modal */
var orderModal = $('#js-receipt-modal');
if (orderModal.length === 1) {
	// We have an order on this day! Woo!
	var date = orderModal.find('.receipt__delivery-section .receipt__info').text();
	var receiptNumber = orderModal.find('.receipt__body-label').text() || '';
	var venue = $('.secondary-bar__event-text').text() || '';
	var url = 'https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&source=mailto&su=Cancel+Order: '+venue+'&to=info@fooda.com&body=Please+cancel+my+order+'+receiptNumber+'+for+'+date+'.++Thanks+so+much!';
	// $('.receipt__body').append('<a target="_blank" href="mailto:info@fooda.com?subject=[Sprout Social] Cancel Order&body=Please cancel my order '+receiptNumber+' for '+date+'. \n\n Thanks so much!">Cancel Order</a>');
	$('.receipt__body').append('<a target="_blank" href="'+url.replace('#', '')+'">Cancel Order</a>');
}

// $items= $('.order_item .order_star_blue');
// votes = [];
// item = $items.each((index, item) => {
//  const $item = $(item);debugger;
//  const starval = String($item.data('rating'));
//  const id = $item.data('index');
//  let voteval = '';
//  if (starval === '1' || starval === '2') voteval = 'down';
//  if (starval === '3' || starval === '4' || starval === '5') voteval = 'up';
//  if (voteval !== '')
//   votes.push({id, starval, voteval});
// });
// votes;