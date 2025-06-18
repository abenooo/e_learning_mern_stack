require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Course = require('../models/Course'); // Ensure this path is correct

async function migrateCourses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        });
        console.log('MongoDB connected for course migration.');

        // Update existing documents: add new fields with default values and remove old ones
        const result = await Course.updateMany(
            {},
            {
                $rename: {
                    thumbnail: "course_icon_path",
                    logo_url: "course_url_path"
                },
                $set: {
                    payment_status: "pending" // Set default payment_status
                }
            }
        );

        console.log(`${result.nModified} courses updated.`);

        // If you need to unset fields that are not renamed but completely removed
        // For now, thumbnail and logo_url are renamed, so no explicit $unset needed unless they are completely gone.
        // If they were completely removed and not renamed, you would do:
        // await Course.updateMany({}, { $unset: { thumbnail: "", logo_url: "" } });


    } catch (error) {
        console.error('Error during course migration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

migrateCourses(); 