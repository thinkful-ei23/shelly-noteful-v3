'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tags');

//protect endpoints
router.use(
	'/',
	passport.authenticate('jwt', { session: false, failWithError: true })
);

function validateFolderId(folderId, userId) {
	if (folderId === undefined) {
		return Promise.resolve();
	}

	if (!mongoose.Types.ObjectId.isValid(folderId)) {
		const err = new Error('The `folderId` is not valid');
		err.status = 400;
		return Promise.reject(err);
	}
	return Folder.count({ _id: folderId, userId }).then(count => {
		if (count === 0) {
			const err = new Error('The `folderId` is not valid');
			err.status = 400;
			return Promise.reject(err);
		}
	});
}

function validateTagIds(tags, userId) {
	if (tags === undefined) {
		return Promise.resolve();
	}
	if (!Array.isArray(tags)) {
		const err = new Error('The `tags` must be an array');
		err.status = 400;
		return Promise.reject(err);
	}
	return Tag.find({ $and: [{ _id: { $in: tags }, userId }] }).then(results => {
		if (tags.length !== results.length) {
			const err = new Error('The `tags` array contains an invalid id');
			err.status = 400;
			return Promise.reject(err);
		}
	});
}

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
	const { searchTerm, folderId, tagId } = req.query;
	const userId = req.user.id;
	let filter = { userId };

	if (searchTerm) {
		const re = new RegExp(searchTerm, 'i');
		filter.$or = [{ title: re }, { content: re }];
	}

	if (folderId) {
		filter.folderId = folderId;
	}

	if (tagId) {
		filter.tagId = tagId;
	}

	Note.find(filter)
		.populate('tags')
		.sort({ updatedAt: 'asc' })
		.then(results => {
			res.json(results);
		})
		.catch(err => {
			next(err);
		});
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
	// console.log(id);
	// parseInt() = if NaN, means not able to parse
	// console.log(typeof id);

	// javascript = loose type
	// if (typeof id !== 'number') {
	// 	const err = new Error('Id is not a number');
	// 	err.status = 422;
	// 	return next(err);
	//}
	const { id } = req.params;
	const userId = req.user.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('The `id` is not valid');
		err.status = 400;
		return next(err);
	}

	Note.findOne({ _id: id, userId })
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
	const userId = req.user.id;

	const newObj = {
		title,
		content,
		folderId,
		tags,
		userId
	};

	if (!newObj.title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	if (newObj.folderId === '') {
		delete newObj.folderId;
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

	Promise.all([
		validateFolderId(newObj.folderId, userId),
		validateTagIds(newObj.tags, userId)
	])
		.then(() => Note.create(newObj))
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
	const userId = req.user.id;

	const newObj = {
		title,
		content,
		folderId,
		tags,
		userId
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

	Promise.all([
		validateFolderId(newObj.folderId, userId),
		validateTagIds(newObj.tags, userId)
	])
		.then(() => {
			return Note.findByIdAndUpdate({ _id: id, userId }, newObj, {
				new: true
			}).populate('tags');
		})
		.then(result => {
			res.json(result);
		})
		.catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
	const { id } = req.params;
	const userId = req.user.id;

	return Note.findByIdAndRemove({ _id: id, userId })
		.then(result => {
			res.status(204).json(result);
		})
		.catch(err => next(err));
});

module.exports = router;
