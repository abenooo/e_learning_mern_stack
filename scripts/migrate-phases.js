require('dotenv').config();
const mongoose = require('mongoose');
const Phase = require('../models/Phase');

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
  serverSelectionTimeoutMS: 5000,
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

    // Use the Fullstack Web Application Development course ID
    const courseId = "6847e72272d00a1416dfd5fe";

    // Get all phases
    const phases = await Phase.find({});
    console.log(`Found ${phases.length} phases to migrate`);

    // Update each phase using the native MongoDB driver
    for (const phase of phases) {
      try {
        // Use the native MongoDB driver to update the document
        await mongoose.connection.db.collection('phases').updateOne(
          { _id: phase._id },
          {
            $set: { course: courseId },
            $unset: { batch_course: "" }
          }
        );

        console.log(`Migrated phase ${phase._id}`);
      } catch (error) {
        console.error(`Error migrating phase ${phase._id}:`, error);
      }
    }

    // Perform a final update to ensure all documents have the field removed
    await mongoose.connection.db.collection('phases').updateMany(
      {},
      { $unset: { batch_course: "" } }
    );

    console.log('Phase migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}; 