const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tags');
const User = require('../models/user');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');
const seedUser = require('../db/seed/users');

mongoose
	.connect(MONGODB_URI)
	.then(() => mongoose.connection.db.dropDatabase())
	.then(() => {
		return Promise.all([
			Note.insertMany(seedNotes),
			Folder.insertMany(seedFolders),
			Tag.insertMany(seedTags),
			User.insertMany(seedUser),
			Folder.createIndexes(),
			Tag.createIndexes(),
			User.createIndexes()
		]);
	})
	.then(results => {
		console.info(`Inserted ${results.length} Notes`);
	})
	.then(() => mongoose.disconnect())
	.catch(err => {
		console.error(err);
	});
