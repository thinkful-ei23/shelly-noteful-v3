const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const User = require('../models/user');
const Folder = require('../models/folder');
const Tag = require('../models/tags');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedUsers = require('../db/seed/users');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Notes', function() {
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
			Note.insertMany(seedNotes),
			Tag.insertMany(seedTags),
			Folder.insertMany(seedFolders),
			Note.createIndexes()
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

	describe.only('POST /api/notes', function() {
		it('should create and return a new item when provided valid data', function() {
			const newItem = {
				title: 'The best article about cats ever!',
				content:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
				folderId: '222222222222222222222201',
				tags: ['333333333333333333333301']
			};

			let res;
			let body;
			return chai
				.request(app)
				.post('/api/notes')
				.set('Authorization', `Bearer ${token}`)
				.send(newItem)
				.then(function(_res) {
					res = _res;
					body = res.body;
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(body).to.be.a('object');
					expect(body).to.have.keys(
						'id',
						'title',
						'content',
						'folderId',
						'createdAt',
						'updatedAt',
						'tags',
						'userId'
					);
					return Note.findById(body.id);
				})
				.then(data => {
					expect(body.id).to.equal(data.id);
					expect(body.title).to.equal(data.title);
					expect(body.content).to.equal(data.content);
					expect(new Date(body.createdAt)).to.eql(data.createdAt);
					expect(new Date(body.updatedAt)).to.eql(data.updatedAt);
				});
		});
		it('should return error if no title provided', function() {
			const newItem = {
				content: 'There is content'
			};
			let res;
			return chai
				.request(app)
				.post('/api/notes')
				.set('Authorization', `Bearer ${token}`)
				.send(newItem)
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(400);
				});
		});
	});

	describe.only('GET /api/notes/:id', function() {
		it('should return correct note', function() {
			let data;
			return Note.findOne()
				.then(_data => {
					data = _data;

					return chai
						.request(app)
						.get(`/api/notes/${data.id}`)
						.set('Authorization', `Bearer ${token}`);
				})
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;

					expect(res.body).to.be.an('object');
					expect(res.body).to.have.keys(
						'id',
						'title',
						'content',
						'createdAt',
						'updatedAt',
						'tags',
						'userId'
					);

					expect(res.body.id).to.equal(data.id);
					expect(res.body.title).to.equal(data.title);
					expect(res.body.content).to.equal(data.content);
					expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
					expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
				});
		});
		it('should error when id is not valid', function() {
			let id = '000000000000000000000040';
			return chai
				.request(app)
				.get(`/api/notes/${id}`)
				.set('Authorization', `Bearer ${token}`)
				.then(res => {
					expect(res).to.have.status(404);
				});
		});
	});

	describe.only('GET /api/notes', function() {
		it('should return correct notes', function() {
			const dbPromise = Note.find({ userId: user.id });
			const apiPromise = chai
				.request(app)
				.get('/api/notes')
				.set('Authorization', `Bearer ${token}`);

			return Promise.all([dbPromise, apiPromise]).then(([data, res]) => {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.a('array');
				expect(res.body).to.have.length(data.length);
			});
		});
	});

	describe.only('PUT /api/notes/:id', function() {
		it('should update and return item with new data when provided valid data', function() {
			const updateItem = {
				title: 'This has been changed',
				content: 'Oh, the modification'
			};
			let res;
			let body;
			return Note.findOne({ userId: user.id })
				.then(function(note) {
					updateItem.id = note.id;

					return chai
						.request(app)
						.put(`/api/notes/${note.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send(updateItem);
				})
				.then(function(_res) {
					res = _res;
					body = res.body;
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(body).to.be.a('object');
					expect(body).to.have.keys(
						'id',
						'title',
						'content',
						'createdAt',
						'updatedAt',
						'tags',
						'userId'
					);

					return Note.findById(updateItem.id);
				})
				.then(function(note) {
					expect(note.id).to.equal(updateItem.id);
					expect(note.title).to.equal(updateItem.title);
					expect(note.content).to.equal(updateItem.content);
				});
		});
	});

	describe.only('DELETE /api/notes/:id', function() {
		it('should delete and return status 204', function() {
			let data;
			let res;
			return Note.findOne()
				.then(_data => {
					data = _data;

					return chai
						.request(app)
						.delete(`/api/notes/${data.id}`)
						.set('Authorization', `Bearer ${token}`);
				})
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(204);
				});
		});
	});
});
