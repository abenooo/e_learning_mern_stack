const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WeekComponentContentSchema = new Schema({
  week_component_id: { type: Schema.Types.ObjectId, ref: 'WeekComponent', required: true },
  icon_type_id: { type: Number, required: true },
  title: { type: String, required: true },
  note_html: { type: String },
  order: { type: Number, required: true },
  url: { type: String },
  icon_type: { type: Object }
});

module.exports = mongoose.model('WeekComponentContent', WeekComponentContentSchema);
