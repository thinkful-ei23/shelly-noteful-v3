const mongoose = require('mongoose');
// const Note = require('./note');

const folderSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true }
});

folderSchema.set('timestamps', true);

folderSchema.set('toObject', {
	virtuals: true,
	versionKey: false,
	transform: (doc, ret) => {
		delete ret._id;
	}
});

// folderSchema.post('remove', function(next) {
// 	console.log(this._id);
// 	Note.remove({ folderId: this._id }).exec();
// 	next();
// });

module.exports = mongoose.model('Folder', folderSchema);
