'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Note = require('../models/note');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
	const { searchTerm, folderId, tagId } = req.query;
	// console.log(req.query);
	let filter = {};

	if (searchTerm) {
		filter.title = { $regex: searchTerm, $options: 'i' };
	}

	if (folderId) {
		filter.folderId = folderId;
	}

	if (tagId) {
		filter.tagId = tagId;
	}

	Note.find(filter)
		.populate('tags')
		.sort({ updatedAt: 'desc' })
		.then(results => {
			res.json(results);
		})
		.catch(err => {
			next(err);
		});
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
	const { id } = req.params;
	// console.log(id);
	// parseInt() = if NaN, means not able to parse
	// console.log(typeof id);

	// javascript = loose type
	// if (typeof id !== 'number') {
	// 	const err = new Error('Id is not a number');
	// 	err.status = 422;
	// 	return next(err);
	//}

	Note.findById(id)
		.populate('tags')
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
	const { title, content, folderId, tags } = req.body;

	const newObj = {
		title,
		content,
		folderId,
		tags
	};

	if (!newObj.title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	if (!mongoose.Types.ObjectId.isValid(folderId)) {
		const err = new Error('Folder Id not valid');
		err.status = 400;
		return next(err);
	}

	if (tags) {
		tags.forEach(tag => {
			if (!mongoose.Types.ObjectId.isValid(tag)) {
				const err = new Error('Tag Id not valid');
				err.status = 400;
				return next(err);
			}
		});
	}

	Note.create(newObj)
		.then(result => {
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			next(err);
		});
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
	const { title, content, folderId, tags } = req.body;
	const { id } = req.params;

	const newObj = {
		title,
		content,
		folderId,
		tags
	};

	if (!newObj.title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	if (!mongoose.Types.ObjectId.isValid(folderId)) {
		const err = new Error('Folder Id is not valid');
		err.status = 400;
		return next(err);
	}

	if (tags) {
		tags.forEach(tag => {
			if (!mongoose.Types.ObjectId.isValid(tag)) {
				const err = new Error('Tag Id is not valid');
				err.status = 400;
				return next(err);
			}
		});
	}

	Note.findByIdAndUpdate(id, newObj, { new: true })
		.then(result => {
			res.json(result);
		})
		.catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
	const { id } = req.params;

	return Note.findByIdAndRemove(id)
		.then(result => {
			res.status(204).json(result);
		})
		.catch(err => next(err));
});

module.exports = router;
