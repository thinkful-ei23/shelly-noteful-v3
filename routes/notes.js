'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Note = require('../models/note');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
	const { searchTerm } = req.query;
	let filter = {};
		
	if (searchTerm) {
		filter.title = {$regex: searchTerm, $options: 'i'};
	}

	Note.find(filter)
		.sort({updatedAt: 'desc'})
		.then(results => {
			res.json(results);
		}).catch(err => {
			next(err);
		});

});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
	const { id } = req.params;

	Note.findById(id)
		.then(result => {
			if (result) {
				res.json(result);
			} else {
				next();
			}
		})
		.catch(err => {
			next(err);
		});
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
	const {title, content} = req.body;

	const newObj = {
		title: title,
		content: content
	};

	if(!newObj.title){
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	Note.create(newObj)
		.then(result => {
			res.json(result);
		}).catch(err => {
			next(err);
		});
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
	const {title, content} = req.body;
	const {id} = req.params;

	const newObj = {
		title: title,
		content: content
	};

	if(!newObj.title){
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	Note.findByIdAndUpdate(id, newObj, {new: true})
		.then(result => {
			res.json(result);
		}).catch(err => next(err));

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
	const {id} = req.params;

	return Note.findByIdAndRemove(id).then(() => {
		res.json('deleted');
	}).catch(err => next(err));
});

module.exports = router;