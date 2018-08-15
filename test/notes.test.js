const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const seedData = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('reset DB', function() {
	before(function() {
		return mongoose
			.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function() {
		return Note.insertMany(seedData);
	});

	this.afterEach(function() {
		return mongoose.connection.db.dropDatabase();
	});

	after(function() {
		return mongoose.disconnect();
	});

	describe('POST /api/notes', function() {
		it('should create and return a new item when provided valid data', function() {
			const newItem = {
				title: 'The best article about cats ever!',
				content:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
			};

			let res;
			let body;
			return chai
				.request(app)
				.post('/api/notes')
				.send(newItem)
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
						'updatedAt'
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
	});

	describe('GET /api/notes/:id', function() {
		it('should return correct note', function() {
			let data;
			return Note.findOne()
				.then(_data => {
					data = _data;

					return chai.request(app).get(`/api/notes/${data.id}`);
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
						'updatedAt'
					);

					expect(res.body.id).to.equal(data.id);
					expect(res.body.title).to.equal(data.title);
					expect(res.body.content).to.equal(data.content);
					expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
					expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
				});
		});
	});

	describe('GET /api/notes', function() {
		return Promise.all([Note.find(), chai.request(app).get('/api/notes')]).then(
			([data, res]) => {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.a('array');
				expect(res.body).to.have.length(data.length);
			}
		);
	});

	describe('PUT /api/notes/:id', function() {
		it('should update and return item with new data when provided valid data', function() {
			const updateItem = {
				title: 'This has been changed',
				content: 'Oh, the modification'
			};
			let res;
			let body;
			return Note.findOne()
				.then(function(note) {
					updateItem.id = note.id;

					return chai
						.request(app)
						.put(`/api/notes/${note.id}`)
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
						'updatedAt'
					);

					return Note.findById(updateItem.id);
				})
				.then(function(note) {
					expect(note.title).to.equal(updateItem.title);
					expect(note.content).to.equal(updateItem.content);
				});
		});
	});
});
