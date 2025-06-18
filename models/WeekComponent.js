const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WeekComponentSchema = new Schema({
  week_id: { type: Schema.Types.ObjectId, ref: 'Week', required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
  icon_type_id: { type: Number, required: true },
  icon_type: { type: Object, required: true },
  week_component_contents: [{ type: Schema.Types.ObjectId, ref: 'WeekComponentContent' }]
});

module.exports = mongoose.model('WeekComponent', WeekComponentSchema);
