const chai = require('chai');
const chaiHTTP = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const seedData = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('should connect to test URI, seed new list, drop list after each test, and disconnect at the end', function() {
	before(function() {
		return mongoose.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function () {
		return Note.insertMany(seedData);
	});

	this.afterEach(function () {
		return mongoose.connection.db.dropDatabase();
	});

	after(function () {
		return mongoose.disconnect();
	});
});