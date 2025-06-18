require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Week = require('../models/Week'); // Ensure this path is correct
const Phase = require('../models/Phase'); // Ensure this path is correct for populating course
const User = require('../models/User'); // Assuming you have a User model

async function migrateWeeks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        });
        console.log('MongoDB connected for week migration.');

        // Find an admin user to set as created_by for existing weeks
        const adminUser = await User.findOne({ 'roles.name': 'admin' }); // Adjust role query as per your User model structure
        let createdByUserId = null;
        if (adminUser) {
            createdByUserId = adminUser._id;
        } else {
            console.warn('No admin user found. \'created_by\' field might not be set for existing weeks.');
            // Optionally, create a default user or handle this case as needed
        }

        const weeksToMigrate = await Week.find({}).populate({
            path: 'phase',
            select: 'course'
        });

        for (const week of weeksToMigrate) {
            const updateQuery = {};
            if (week.phase && week.phase.course) {
                updateQuery.course = week.phase.course;
            }

            // Rename fields
            if (week.title !== undefined) {
                updateQuery.$rename = { title: "week_name" };
            }
            if (week.order_number !== undefined) {
                updateQuery.$rename = { ...updateQuery.$rename, order_number: "week_order" };
            }
            if (week.group_session !== undefined) {
                updateQuery.$rename = { ...updateQuery.$rename, group_session: "group_sessions" };
                updateQuery.group_sessions = String(week.group_session); // Convert to String type
            }
            if (week.live_session !== undefined) {
                updateQuery.$rename = { ...updateQuery.$rename, live_session: "live_sessions" };
                updateQuery.live_sessions = String(week.live_session); // Convert to String type
            }

            // Add new fields
            updateQuery.$set = {
                ...updateQuery.$set,
                week_title: week.display_title || '', // Use existing display_title if present, else empty string
                ...(createdByUserId && { created_by: createdByUserId }),
            };

            // Unset old fields
            updateQuery.$unset = {
                ...(week.display_title !== undefined && { display_title: "" }), // Unset if it was present and not renamed
                start_date: "",
                end_date: "",
                is_active: "",
                is_required: ""
            };
            
            if (Object.keys(updateQuery.$rename || {}).length > 0 || Object.keys(updateQuery.$set || {}).length > 0 || Object.keys(updateQuery.$unset || {}).length > 0) {
                await Week.updateOne({ _id: week._id }, updateQuery);
                console.log(`Migrated week ${week._id}`);
            }
        }

        console.log('Week migration completed successfully!');

    } catch (error) {
        console.error('Error during week migration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

migrateWeeks(); 