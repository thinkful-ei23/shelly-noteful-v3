const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');
const seedFolder = require('../db/seed/folders');
const User = require('../models/user');
const seedUsers = require('../db/seed/users');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Folders', function() {
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
			Folder.insertMany(seedFolder),
			Folder.createIndexes()
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

	describe.only('POST /api/folders', function() {
		it('should create and return a new item when provided valid data', function() {
			const newFolder = { name: 'Aretha Franklin' };

			let res;
			return chai
				.request(app)
				.post('/api/folders')
				.set('Authorization', `Bearer ${token}`)
				.send(newFolder)
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

					return Folder.findById(res.body.id);
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
				.post('/api/folders')
				.set('Authorization', `Bearer ${token}`)
				.send(newFolder)
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(400);
					expect(res).to.have.be.an('object');
				});
		});
	});

	describe.only('GET /api/folders/:id', function() {
		it('should return correct folder', function() {
			let data;

			return Folder.findOne()
				.then(_data => {
					data = _data;
					return chai
						.request(app)
						.get(`/api/folders/${data.id}`)
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
				.get('/api/folders/not-valid')
				.set('Authorization', `Bearer ${token}`)
				.then(res => {
					expect(res).to.have.status(400);
				});
		});
	});

	describe.only('GET /api/folders/', function() {
		it('should return the correct number of folders', function() {
			const dbPromise = Folder.find({ userId: user.id });
			const apiPromise = chai
				.request(app)
				.get('/api/folders')
				.set('Authorization', `Bearer ${token}`);

			return Promise.all([dbPromise, apiPromise]).then(([data, res]) => {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('array');
				expect(res.body).to.have.length(data.length);
			});
		});

		it('should return a list with the correct right fields', function() {
			const dbPromise = Folder.find({ userId: user.id });
			const apiPromise = chai
				.request(app)
				.get('/api/folders')
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

		it('should return correct list of results with searchTerm', function() {
			const searchTerm = 'Archive';

			const dbPromise = Folder.find({
				name: { $regex: searchTerm, $options: 'i' }
			});
			const apiPromise = chai
				.request(app)
				.get(`/api/folders?searchTerm=${searchTerm}`)
				.set('Authorization', `Bearer ${token}`);

			return Promise.all([dbPromise, apiPromise]).then(([data, res]) => {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('array');
				res.body.forEach((item, i) => {
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

	describe.only('PUT /api/folders/:id', function() {
		it('should update and return item with new data when provided valid data', function() {
			const updateFolder = {
				name: 'Annie Lennox'
			};
			let res;
			let body;
			return Folder.findOne()
				.then(function(folder) {
					updateFolder.id = folder.id;

					return chai
						.request(app)
						.put(`/api/folders/${folder.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send(updateFolder);
				})
				.then(function(_res) {
					res = _res;
					body = res.body;
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(body).to.be.an('object');
					expect(body).to.have.keys(
						'id',
						'name',
						'createdAt',
						'updatedAt',
						'userId'
					);

					return Folder.findById(updateFolder.id);
				})
				.then(function(folder) {
					expect(folder.name).to.equal(updateFolder.name);
					expect(folder.title).to.equal(updateFolder.title);
				});
		});
	});

	describe('DELETE /api/folders/:id', function() {
		it('should delete and return status 204', function() {
			let data;
			let res;
			return Folder.findOne()
				.then(_data => {
					data = _data;

					return chai
						.request(app)
						.delete(`/api/folders/${data.id}`)
						.set('Authorization', `Bearer ${token}`);
				})
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(204);
				});
		});
	});
});
