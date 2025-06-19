console.log('Registering ClassTopic model');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassTopicSchema = new Schema({
  week_id: { type: Schema.Types.ObjectId, ref: 'Week', required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
  hash: { type: String },
  description: { type: String },
  has_checklist: { type: Boolean, default: false },
  class_components: [{ type: Schema.Types.ObjectId, ref: 'ClassComponent' }],
  class_video_section_by_sections: [{ type: Schema.Types.ObjectId, ref: 'ClassVideoSectionBySection' }],
  class_video_live_sessions: [{ type: Schema.Types.ObjectId, ref: 'ClassVideoLiveSession' }]
});

module.exports = mongoose.model('ClassTopic', ClassTopicSchema);
