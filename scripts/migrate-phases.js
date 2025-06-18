require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Phase = require('../models/Phase');
const User = require('../models/User');

// Set strictQuery to false to prepare for Mongoose 7
mongoose.set('strictQuery', false);

// Get environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

console.log(`Environment: ${NODE_ENV}`);
console.log(`Port: ${PORT}`);
console.log('Connecting to MongoDB...');

// Connect to MongoDB with options
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
  .then(() => {
    console.log('MongoDB connected for migration');
    return migratePhases();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const migratePhases = async () => {
  try {
    console.log('Starting phase migration...');

    // Find an admin user to set as created_by for existing phases
    const adminUser = await User.findOne({ 'roles.name': 'admin' });
    let createdByUserId = null;
    if (adminUser) {
      createdByUserId = adminUser._id;
    } else {
      console.warn('No admin user found. created_by field might not be set for existing phases.');
    }

    // Update existing documents: rename fields and add new ones
    const result = await Phase.updateMany(
      {},
      {
        $rename: {
          title: "phase_name",
          display_title: "phase_title",
          description: "phase_description",
          icon_url: "phase_icon_path",
          order_number: "phase_order",
        },
        $set: {
          ...(createdByUserId && { created_by: createdByUserId }),
        },
        $unset: {
          start_date: "",
          end_date: "",
          is_active: "",
          is_required: ""
        }
      }
    );

    console.log(`${result.nModified} phases updated.`);

    console.log('Phase migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}; 