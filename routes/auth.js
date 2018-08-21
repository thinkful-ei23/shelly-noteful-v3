const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const options = { session: false, failWithError: true };

const localAuth = passport.authenticate('local', options);

function createAuthToken(user) {
	return jwt.sigh({ user }, JWT_SECRET, {
		subject: user.username,
		expiresIn: JWT_EXPIRY
	});
}

router.post('/login', localAuth, function (req, res) {
	const authToken = createAuthToken(req.user);
	return res.json({authToken});
});

module.exports = router;
