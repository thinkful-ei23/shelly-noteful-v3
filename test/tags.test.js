const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tags');
const seedTag = require('../db/seed/tags');
const User = require('../models/user');
const seedUsers = require('../db/seed/users');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Tags', function() {
	before(function() {
		return mongoose
			.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	let token;
	let user;

	beforeEach(function() {
		return Promise.all([
			User.insertMany(seedUsers),
			Tag.insertMany(seedTag),
			Tag.createIndexes()
		]).then(([users]) => {
			user = users[0];
			token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
		});
	});

	this.afterEach(function() {
		return mongoose.connection.db.dropDatabase();
	});

	after(function() {
		return mongoose.disconnect();
	});

	describe.only('POST /api/tags', function() {
		it('should create and return a new item when provided valid data', function() {
			const newTag = { name: 'James Earl Jones' };

			let res;
			return chai
				.request(app)
				.post('/api/tags')
				.set('Authorization', `Bearer ${token}`)
				.send(newTag)
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(201);
					expect(res).to.have.header('location');
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.have.keys(
						'name',
						'createdAt',
						'updatedAt',
						'id',
						'userId'
					);

					return Tag.findById(res.body.id);
				})
				.then(data => {
					expect(res.body.id).to.equal(data.id);
					expect(res.body.name).to.equal(data.name);
					expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
					expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
				});
		});

		it('should return error if no name provided', function() {
			const newFolder = {};

			let res;
			return chai
				.request(app)
				.post('/api/tags')
				.set('Authorization', `Bearer ${token}`)
				.send(newFolder)
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(400);
					expect(res).to.have.be.an('object');
				});
		});
	});

	describe.only('GET /api/tags/:id', function() {
		it('should return correct tag', function() {
			let data;
			return Tag.findOne()
				.then(_data => {
					data = _data;
					return chai
						.request(app)
						.get(`/api/tags/${data.id}`)
						.set('Authorization', `Bearer ${token}`);
				})
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;

					expect(res.body).to.be.an('object');
					expect(res.body).to.have.keys(
						'id',
						'name',
						'createdAt',
						'updatedAt',
						'userId'
					);

					expect(res.body.id).to.equal(data.id);
					expect(res.body.name).to.equal(data.name);
					expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
					expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
				});
		});

		it('should return error when id is not valid', function() {
			return chai
				.request(app)
				.get('/api/tags/not-valid')
				.set('Authorization', `Bearer ${token}`)
				.then(res => {
					expect(res).to.have.status(400);
				});
		});
	});

	describe.only('GET /api/tags', function() {
		it('should return correct number of tags', function() {
			const dbPromise = Tag.find({ userId: user.id });
			const apiPromise = chai
				.request(app)
				.get('/api/tags')
				.set('Authorization', `Bearer ${token}`);

			return Promise.all([dbPromise, apiPromise]).then(([data, res]) => {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('array');
				expect(res.body).to.have.length(data.length);
			});
		});

		it('should return a list with the correct fields', function() {
			const dbPromise = Tag.find({ userId: user.id });
			const apiPromise = chai
				.request(app)
				.get('/api/tags')
				.set('Authorization', `Bearer ${token}`);

			return Promise.all([dbPromise, apiPromise]).then(([data, res]) => {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('array');
				res.body.forEach(function(item) {
					expect(item).to.be.an('object');
					expect(item).to.have.keys(
						'id',
						'name',
						'userId',
						'createdAt',
						'updatedAt'
					);
				});
			});
		});
	});

	describe('PUT /api/tags/:id', function() {
		it('should update and return item with new data when provided valid data', function() {
			const updateTag = {
				name: 'Eurythmics'
			};
			let res;
			let body;
			return Tag.findOne()
				.then(function(folder) {
					updateTag.id = folder.id;

					return chai
						.request(app)
						.put(`/api/tags/${folder.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send(updateTag);
				})
				.then(function(_res) {
					res = _res;
					body = res.body;
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(body).to.be.an('object');
					expect(body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

					return Tag.findById(updateTag.id);
				})
				.then(function(folder) {
					expect(folder.name).to.equal(updateTag.name);
					expect(folder.title).to.equal(updateTag.title);
				});
		});
	});

	describe('DELETE /api/tags/:id', function() {
		it('should delete and return status 204', function() {
			let data;
			let res;
			return Tag.findOne()
				.then(_data => {
					data = _data;

					return chai
						.request(app)
						.delete(`/api/tags/${data.id}`)
						.set('Authorization', `Bearer ${token}`);
				})
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(204);
				});
		});
	});
});
