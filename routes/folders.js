const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Folder = require('../models/folder');

//get all

router.get('/', (req, res, next) => {
	let filter = {};

	Folder.find(filter)
		.sort({ name: 'asc' })
		.then(result => {
			res.json(result);
		})
		.catch(err => {
			next(err);
		});
});

router.get('/:id', (req, res, next) => {
	const { id } = req.params;

	Folder.findById(id)
		.then(result => {
			res.json(result);
		})
		.catch(err => {
			next(err);
		});
});

router.post('/', (req, res, next) => {
	const { name } = req.body;
	const newFolder = { name };

	if (!newFolder.name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}

	Folder.create(newFolder)
		.then(result => {
			res
				.status(201)
				.location(`${req.originalUrl}/${result.id}`)
				.json(result);
		})
		.catch(err => {
			if (err.code === 11000) {
				err = new Error('The folder name already exists');
				err.status = 400;
			}
			next(err);
		});
});

router.put('/:id', (req, res, next) => {
	const { id } = req.params;
	const { name } = req.body;
	const updateFolder = { name };

	if (!updateFolder.name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Id is not valid');
		err.status = 400;
		return next(err);
	}

	Folder.findByIdAndUpdate(id, updateFolder, { new: true })
		.then(result => {
			res.json(result);
		})
		.catch(err => {
			if (err.code === 11000) {
				err = new Error('The folder name already exists');
				err.status = 400;
			}
			next(err);
		});
});

router.delete('/:id', (req, res, next) => {
	const { id } = req.params;

	Folder.findByIdAndRemove(id)
		.then(result => {
			res.status(204).end();
		})
		.catch(err => {
			next(err);
		});
});

module.exports = router;
