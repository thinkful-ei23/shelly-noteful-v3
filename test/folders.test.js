const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');
const seedFolder = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Folders', function() {
	before(function() {
		return mongoose
			.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function() {
		return Folder.insertMany(seedFolder);
	});

	this.afterEach(function() {
		return mongoose.connection.db.dropDatabase();
	});

	after(function() {
		return mongoose.disconnect();
	});

	describe('POST /folders', function() {
		it('should create and return a new item when provided valid data', function() {
			const newFolder = { name: 'Aretha Franklin' };

			let res;
			return chai
				.request(app)
				.post('/folders')
				.send(newFolder)
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(201);
					expect(res).to.have.header('location');
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.have.keys('name', 'createdAt', 'updatedAt', 'id');

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
				.post('/folders')
				.send(newFolder)
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(400);
					expect(res).to.have.be.an('object');
				});
		});
	});

	describe('GET /folders/:id', function() {
		it('should return correct folder', function() {
			let data;
			return Folder.findOne()
				.then(_data => {
					data = _data;

					return chai.request(app).get(`/folders/${data.id}`);
				})
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;

					expect(res.body).to.be.an('object');
					expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

					expect(res.body.id).to.equal(data.id);
					expect(res.body.name).to.equal(data.name);
					expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
					expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
				});
		});

		it('should return error when id is not valid', function() {
			return chai
				.request(app)
				.get(`/folders/not-valid`)
				.then(res => {
					expect(res).to.have.status(400);
				});
		});
	});
});
