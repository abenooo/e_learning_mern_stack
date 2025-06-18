const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassVideoSectionBySectionSchema = new Schema({
  class_topic_id: { type: Schema.Types.ObjectId, ref: 'ClassTopic', required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
  hash: { type: String },
  minimum_minutes_required: { type: Number },
  class_video_watched_section_by_section_trackers: { type: Array, default: [] }
});

module.exports = mongoose.model('ClassVideoSectionBySection', ClassVideoSectionBySectionSchema);
