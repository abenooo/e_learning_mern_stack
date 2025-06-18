const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassVideoLiveSessionSchema = new Schema({
  class_topic_id: { type: Schema.Types.ObjectId, ref: 'ClassTopic', required: true },
  title: { type: String, required: true },
  hash: { type: String },
  minimum_minutes_required: { type: Number },
  video_length_minutes: { type: Number },
  note_html: { type: String },
  class_video_live_session_trackers: { type: Array, default: [] }
});

module.exports = mongoose.model('ClassVideoLiveSession', ClassVideoLiveSessionSchema);
