const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tag = require('../models/tags');
const Note = require('../models/note');

//Get all documents

router.get('/', (req, res, next) => {
	const { searchTerm } = req.query;
	let filter = {};

	if (searchTerm) {
		filter.name = { $regex: searchTerm, $options: 'i' };
	}

	Tag.find(filter)
		.sort({ name: 'asc' })
		.then(result => {
			res.json(result);
		})
		.catch(err => {
			next(err);
		});
});

//Get document by id

router.get('/:id', (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Id is not valid');
		err.status = 400;
		return next(err);
	}

	Tag.findById(id)
		.then(result => {
			res.json(result);
		})
		.catch(err => {
			next(err);
		});
});

router.post('/', (req, res, next) => {
	const { name } = req.body;
	const newTag = { name };

	if (!newTag.name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}
	Tag.create(newTag)
		.then(result => {
			res
				.status(201)
				.location(`${req.originalUrl}/${result.id}`)
				.json(result);
		})
		.catch(err => {
			if (err.code === 11000) {
				const err = new Error('The tag name already exists');
				err.status = 400;
			}
			next(err);
		});
});

router.put('/:id', (req, res, next) => {
	const { id } = req.params;
	const { name } = req.body;
	const updateTag = { name };

	if (!updateTag.name) {
		const err = new Error('Missing `name` in body request');
		err.status = 400;
		return next(err);
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Id is not valid');
		err.status = 400;
		return next(err);
	}

	Tag.findByIdAndUpdate(id, updateTag, { new: true })
		.then(result => {
			res.json(result);
		})
		.catch(err => {
			if (err.code === 11000) {
				err = new Error('The tag name already exist');
				err.status = 400;
			}
			next(err);
		});
});

router.delete('/:id', (req, res, next) => {
	const { id } = req.params;
	Tag.findByIdAndRemove(id)
		.then(result => {
			return Note.update(
				{ tags: id },
				{ $pull: { tags: id } },
				{ multi: true }
			);
		})
		.then(result => {
			res
				.status(204)
				.json('deleted');
		})
		.catch(err => {
			next(err);
		});
});

module.exports = router;
