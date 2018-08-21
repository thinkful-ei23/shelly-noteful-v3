const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/users', (req, res, next) => {
	const { fullName, username, password } = req.body;

	const requiredFields = ['username', 'password'];
	const missingField = requiredFields.find(field => !(field in req.body));

	if (missingField) {
		const err = new Error(`Missing '${missingField}' in request body`);
		err.status = 422;
		return next(err);
	}

	const stringField = ['fullName', 'username', 'password'];
	const notStringField = stringField.find(
		field => field in req.body && typeof req.body[field] !== 'string'
	);

	if (notStringField) {
		const err = new Error(`Invalid '${notStringField}' entered`);
		err.status = 422;
		return next(err);
	}

	const trimmedField = ['username', 'password'];
	const nonTrimmedField = trimmedField.find(
		field => req.body[field].trim() !== req.body[field]
	);

	if (nonTrimmedField) {
		const err = new Error('There is whitespace at beginning or end');
		err.status = 422;
		return next(err);
	}

	const minMaxChar = {
		username: { min: 3 },
		password: { min: 8, max: 72 }
	};

	const notEnoughChar = Object.keys(minMaxChar).find(
		field =>
			'min' in minMaxChar[field] &&
			req.body[field].trim().length < minMaxChar[field].min
	);

	const tooManyChar = Object.keys(minMaxChar).find(
		field =>
			'max' in minMaxChar[field] &&
			req.body[field].trim().length > minMaxChar[field].max
	);

	if (notEnoughChar || tooManyChar) {
		return res.status(422).json({
			code: 422,
			reason: 'Validation Error',
			message: notEnoughChar
				? `Must be at least ${minMaxChar[notEnoughChar].min} characters long`
				: `Must be less than ${minMaxChar[tooManyChar].max} characters long`,
			location: notEnoughChar || tooManyChar
		});
	}

	return User.hashPassword(password)
		.then(digest => {
			const newUser = {
				fullName,
				username,
				password: digest
			};
			return User.create(newUser);
		})
		.then(result => {
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			if (err.code === 11000) {
				err = new Error('The username already exists');
				err.status = 400;
			}
			next(err);
		});
});

module.exports = router;
