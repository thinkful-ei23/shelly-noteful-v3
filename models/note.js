const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
	title: { type: String, required: true },
	content: String,
	folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
	tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }]
});

//create takes current timestamp & when updated, takes the newer timestamp
noteSchema.set('timestamps', true);

noteSchema.set('toObject', {
	virtuals: true,
	//mongo's internal control (controlled by mongo); whether the document was updated or not; it's own way of managing information
	versionKey: false,
	transform: (doc, ret) => {
		delete ret._id;
	}
});

module.exports = mongoose.model('Note', noteSchema);
