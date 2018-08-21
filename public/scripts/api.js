/* global $ */
'use strict';

const api = (function() {
	const search = function(path, query) {
		return $.ajax({
			headers: { Authorization: `Bearer ${store.authToken}` },
			type: 'GET',
			url: path,
			dataType: 'json',
			data: query
		});
	};
	const details = function(path) {
		return $.ajax({
			headers: { Authorization: `Bearer ${store.authToken}` },
			type: 'GET',
			dataType: 'json',
			url: path
		});
	};
	const update = function(path, obj) {
		return $.ajax({
			headers: { Authorization: `Bearer ${store.authToken}` },
			type: 'PUT',
			url: path,
			contentType: 'application/json',
			dataType: 'json',
			data: JSON.stringify(obj)
		});
	};
	const create = function(path, obj) {
		return $.ajax({
			headers: { Authorization: `Bearer ${store.authToken}` },
			type: 'POST',
			url: path,
			contentType: 'application/json',
			dataType: 'json',
			processData: false,
			data: JSON.stringify(obj)
		});
	};
	const remove = function(path) {
		return $.ajax({
			headers: { Authorization: `Bearer ${store.authToken}` },
			type: 'DELETE',
			dataType: 'json',
			url: path
		});
	};
	return {
		create,
		search,
		details,
		update,
		remove
	};
})();
