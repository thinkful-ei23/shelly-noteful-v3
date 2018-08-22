const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Folder = require('../models/folder');
const Note = require('../models/note');
const passport = require('passport');

//protect endpoints
router.use(
	'/',
	passport.authenticate('jwt', { session: false, failWithError: true })
);

//get all

router.get('/', (req, res, next) => {
	const userId = req.user.id;
	let filter = { userId };

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
	const userId = req.user.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Id is not valid');
		err.status = 400;
		return next(err);
	}

	Folder.findOne({ _id: id, userId })
		.then(result => {
			res.json(result);
		})
		.catch(err => {
			next(err);
		});
});

router.post('/', (req, res, next) => {
	const { name } = req.body;
	const userId = req.user.id;

	const newFolder = { name, userId };

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
	const userId = req.user.id;
	const { name } = req.body;
	const updateFolder = { name, userId };

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
	const userId = req.user.id;

	Folder.findByIdAndRemove({ _id: id, userId })
		.then(result => {
			return Note.update(
				{ folderId: id },
				{ $unset: { folderId: 1 } },
				{ multi: true }
			);
		})
		.then(result => {
			res.status(204).end();
		})
		.catch(err => {
			next(err);
		});
});

module.exports = router;
