const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassComponentSchema = new Schema({
  class_topic_id: { type: Schema.Types.ObjectId, ref: 'ClassTopic', required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
  icon_type_id: { type: Number, required: true },
  icon_type: { type: Object, required: true },
  class_component_contents: [{ type: Schema.Types.ObjectId, ref: 'ClassComponentContent' }]
});

module.exports = mongoose.model('ClassComponent', ClassComponentSchema); 