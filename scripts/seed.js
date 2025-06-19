const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
// const seedWeeks = require('./path/to/your/seedWeeks'); // adjust the path as needed

// Load environment variables
dotenv.config();

// Load models
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const UserRole = require('../models/UserRole');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const BatchCourse = require('../models/BatchCourse');
const Group = require('../models/Group');
const Phase = require('../models/Phase');
const Week = require('../models/Week');
const BatchUser = require('../models/BatchUser');
const GroupUser = require('../models/GroupUser');
const CourseInstructor = require('../models/CourseInstructor');
const BatchInstructor = require('../models/BatchInstructor');
const LiveSession = require('../models/LiveSession');
const GroupSession = require('../models/GroupSession');
const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const ClassComponent = require('../models/ClassComponent');
const Video = require('../models/Video');
const Checklist = require('../models/Checklist');
const ChecklistItem = require('../models/ChecklistItem');
const WeekComponent = require('../models/WeekComponent');
const WeekComponentContent = require('../models/WeekComponentContent');
const ClassTopic = require('../models/ClassTopic');
const ClassComponentContent = require('../models/ClassComponentContent');
const ClassVideoSectionBySection = require('../models/ClassVideoSectionBySection');
const ClassVideoLiveSession = require('../models/ClassVideoLiveSession');

// Connect to MongoDB with options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
})
  .then(() => {
    console.log('MongoDB connected for seeding');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedData = async () => {
  await clearDatabase();

  const roles = await seedRoles();
  const permissions = await seedPermissions();
  await seedRolePermissions(roles, permissions);

  const users = await seedUsers();
  console.log('Users seeded successfully');
  const userRoles = await seedUserRoles(users, roles);
  console.log('User roles seeded successfully');

  const courses = await seedCourses(users);
  console.log('Courses seeded successfully');
  const batches = await seedBatches(users);
  console.log('Batches seeded successfully');
  const batchCourses = await seedBatchCourses(batches, courses);
  console.log('Batch courses seeded successfully');
  const groups = await seedGroups(batches);
  console.log('Groups seeded successfully');

  console.log('Seeding phases...');
  const phases = await seedPhases(courses);
  console.log('Phases seeded successfully');

  console.log('Seeding weeks and nested data...');
  const weeks = await seedWeeksAndNested(phases);
  console.log('Weeks and nested data seeded successfully');

  console.log('Seeding batch users...');
  const batchUsers = await seedBatchUsers(batches, users);
  console.log('Batch users seeded successfully');
  const groupUsers = await seedGroupUsers(groups, users);
  console.log('Group users seeded successfully');

  await seedCourseInstructors(courses, users);
  console.log('Course instructors seeded successfully');
  await seedBatchInstructors(batches, groups, users);
  console.log('Batch instructors seeded successfully');

  const liveSessions = await seedLiveSessions(weeks, batches, users);
  console.log('Live sessions seeded successfully');
  const groupSessions = await seedGroupSessions(weeks, groups, users);
  console.log('Group sessions seeded successfully');

  console.log('Seeding enrollments...');
  const enrollments = await seedEnrollments(batchCourses, users);
  console.log('Inserted enrollments:', enrollments.length);
  await seedAttendance(liveSessions, groupSessions, batches, groups, users);
  console.log('Attendance seeded successfully');

  console.log('=== DATABASE SEEDED SUCCESSFULLY ===');
};

// Clear database
const clearDatabase = async () => {
  try {
    console.log('Clearing all collections...');
    
    // Clear all collections in order
  await User.deleteMany({});
  await Role.deleteMany({});
  await Permission.deleteMany({});
  await RolePermission.deleteMany({});
  await UserRole.deleteMany({});
  await Course.deleteMany({});
  await Batch.deleteMany({});
  await BatchCourse.deleteMany({});
  await Group.deleteMany({});
  await Phase.deleteMany({});
  await Week.deleteMany({});
  await BatchUser.deleteMany({});
  await GroupUser.deleteMany({});
  await CourseInstructor.deleteMany({});
  await BatchInstructor.deleteMany({});
  await LiveSession.deleteMany({});
  await GroupSession.deleteMany({});
  await Attendance.deleteMany({});
  await Enrollment.deleteMany({});
  await Class.deleteMany({});
  await ClassComponent.deleteMany({});
  await Video.deleteMany({});
  await Checklist.deleteMany({});
  await ChecklistItem.deleteMany({});
  await WeekComponent.deleteMany({});
  await WeekComponentContent.deleteMany({});
  await ClassTopic.deleteMany({});
  await ClassComponentContent.deleteMany({});
  await ClassVideoSectionBySection.deleteMany({});
  await ClassVideoLiveSession.deleteMany({});
    
    console.log('All collections cleared successfully');
  } catch (error) {
    console.error('Error clearing collections:', error);
    throw error;
  }
};

// Seed roles
const seedRoles = async () => {
  const roles = [
    {
      name: 'super_admin',
      description: 'Super Administrator with full system access',
      is_system_role: true,
      permission_level: 100
    },
    {
      name: 'admin',
      description: 'Administrator with management access',
      is_system_role: true,
      permission_level: 80
    },
    {
      name: 'instructor',
      description: 'Course instructor',
      is_system_role: true,
      permission_level: 60
    },
    {
      name: 'group_instructor',
      description: 'Group instructor',
      is_system_role: true,
      permission_level: 50
    },
    {
      name: 'team_member',
      description: 'Team member with limited administrative access',
      is_system_role: true,
      permission_level: 40
    },
    {
      name: 'student',
      description: 'Student enrolled in courses',
      is_system_role: true,
      permission_level: 10
    }
  ];
  
  return await Role.insertMany(roles);
};

// Seed permissions
const seedPermissions = async () => {
  const resources = [
    'users', 'roles', 'courses', 'batches', 'groups', 
    'phases', 'weeks', 'sessions', 'attendance', 'enrollments'
  ];
  
  const actions = ['create', 'read', 'update', 'delete', 'manage'];
  
  const permissions = [];
  
  resources.forEach(resource => {
    actions.forEach(action => {
      permissions.push({
        code: `${resource}:${action}`,
        name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
        description: `Permission to ${action} ${resource}`,
        resource_type: resource,
        action: action,
        is_system_permission: true
      });
    });
  });
  
  return await Permission.insertMany(permissions);
};

// Seed role permissions
const seedRolePermissions = async (roles, permissions) => {
  const rolePermissions = [];
  
  // Super Admin gets all permissions
  const superAdminRole = roles.find(r => r.name === 'super_admin');
  permissions.forEach(permission => {
    rolePermissions.push({
      role: superAdminRole._id,
      permission: permission._id,
      is_granted: true
    });
  });
  
  // Admin gets most permissions except some manage permissions
  const adminRole = roles.find(r => r.name === 'admin');
  permissions.forEach(permission => {
    if (permission.action !== 'manage' || 
        !['roles', 'permissions'].includes(permission.resource_type)) {
      rolePermissions.push({
        role: adminRole._id,
        permission: permission._id,
        is_granted: true
      });
    }
  });
  
  // Instructor gets read access to most resources and manage access to their courses
  const instructorRole = roles.find(r => r.name === 'instructor');
  permissions.forEach(permission => {
    if (permission.action === 'read' || 
        (permission.resource_type === 'courses' && ['create', 'update'].includes(permission.action)) ||
        (permission.resource_type === 'sessions' && ['create', 'update'].includes(permission.action)) ||
        (permission.resource_type === 'attendance' && ['create', 'update'].includes(permission.action))) {
      rolePermissions.push({
        role: instructorRole._id,
        permission: permission._id,
        is_granted: true
      });
    }
  });
  
  // Group Instructor gets limited permissions
  const groupInstructorRole = roles.find(r => r.name === 'group_instructor');
  permissions.forEach(permission => {
    if (permission.action === 'read' || 
        (permission.resource_type === 'sessions' && ['create', 'update'].includes(permission.action)) ||
        (permission.resource_type === 'attendance' && ['create', 'update'].includes(permission.action))) {
      rolePermissions.push({
        role: groupInstructorRole._id,
        permission: permission._id,
        is_granted: true
      });
    }
  });
  
  // Student gets very limited permissions
  const studentRole = roles.find(r => r.name === 'student');
  permissions.forEach(permission => {
    if (permission.action === 'read' && 
        ['courses', 'batches', 'phases', 'weeks', 'sessions', 'enrollments'].includes(permission.resource_type)) {
      rolePermissions.push({
        role: studentRole._id,
        permission: permission._id,
        is_granted: true
      });
    }
  });
  
  return await RolePermission.insertMany(rolePermissions);
};

// Seed users
const seedUsers = async () => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  // Hash password for admin users (password: 12345678)
  const adminPassword = await bcrypt.hash('12345678', salt);
  
  const users = [
    {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: hashedPassword,
      phone: '+1234567890',
      user_id_number: '10001',
      is_active: true
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      phone: '+1234567891',
      user_id_number: '10002',
      is_active: true
    },
    {
      name: 'John Instructor',
      email: 'instructor1@example.com',
      password: hashedPassword,
      phone: '+1234567892',
      user_id_number: '10003',
      is_active: true
    },
    {
      name: 'Jane Instructor',
      email: 'instructor2@example.com',
      password: hashedPassword,
      phone: '+1234567893',
      user_id_number: '10004',
      is_active: true
    },
    {
      name: 'Group Instructor 1',
      email: 'groupinstructor1@example.com',
      password: hashedPassword,
      phone: '+1234567894',
      user_id_number: '10005',
      is_active: true
    },
    {
      name: 'Group Instructor 2',
      email: 'groupinstructor2@example.com',
      password: hashedPassword,
      phone: '+1234567895',
      user_id_number: '10006',
      is_active: true
    },
    {
      name: 'Student One',
      email: 'student1@example.com',
      password: hashedPassword,
      phone: '+1234567896',
      user_id_number: '20001',
      is_active: true
    },
    {
      name: 'Student Two',
      email: 'student2@example.com',
      password: hashedPassword,
      phone: '+1234567897',
      user_id_number: '20002',
      is_active: true
    },
    {
      name: 'Student Three',
      email: 'student3@example.com',
      password: hashedPassword,
      phone: '+1234567898',
      user_id_number: '20003',
      is_active: true
    },
    {
      name: 'Student Four',
      email: 'student4@example.com',
      password: hashedPassword,
      phone: '+1234567899',
      user_id_number: '20004',
      is_active: true
    },
    // NEW: Dedicated test student
    {
      name: 'Test Student',
      email: 'teststudent@example.com',
      password: hashedPassword,
      phone: '+1234567900',
      user_id_number: '20005',
      is_active: true
    },
    // NEW: Admin users as requested
    {
      name: 'Abenezer Kifle',
      email: 'abenezerkifle000@gmail.com',
      password: adminPassword,
      phone: '+251912345678',
      user_id_number: '30001',
      is_active: true
    },
    {
      name: 'Shime Techane',
      email: 'shimetechane@gmail.com',
      password: adminPassword,
      phone: '+251912345679',
      user_id_number: '30002',
      is_active: true
    },
    {
      name: 'Kasahun Welela',
      email: 'kasahunwelela1@gmail.com',
      password: adminPassword,
      phone: '+251912345680',
      user_id_number: '30003',
      is_active: true
    }
  ];
  
  return await User.insertMany(users);
};

// Seed user roles
const seedUserRoles = async (users, roles) => {
  const userRoles = [];
  
  // Assign super_admin role to first user
  userRoles.push({
    user: users[0]._id,
    role: roles.find(r => r.name === 'super_admin')._id,
    is_active: true
  });
  
  // Assign admin role to second user
  userRoles.push({
    user: users[1]._id,
    role: roles.find(r => r.name === 'admin')._id,
    is_active: true
  });
  
  // Assign instructor role to users 2-3
  for (let i = 2; i <= 3; i++) {
    userRoles.push({
      user: users[i]._id,
      role: roles.find(r => r.name === 'instructor')._id,
      is_active: true
    });
  }
  
  // Assign group_instructor role to users 4-5
  for (let i = 4; i <= 5; i++) {
    userRoles.push({
      user: users[i]._id,
      role: roles.find(r => r.name === 'group_instructor')._id,
      is_active: true
    });
  }
  
  // Assign student role to users 6-10 (including the test student)
  for (let i = 6; i <= 10; i++) {
    userRoles.push({
      user: users[i]._id,
      role: roles.find(r => r.name === 'student')._id,
      is_active: true
    });
  }
  
  // NEW: Assign admin role to the three new admin users (users 11-13)
  for (let i = 11; i <= 13; i++) {
    userRoles.push({
      user: users[i]._id,
      role: roles.find(r => r.name === 'admin')._id,
      is_active: true
    });
  }
  
  return await UserRole.insertMany(userRoles);
};

// Seed courses
const seedCourses = async (users) => {
  console.log('Seeding courses...');
  console.log('Available users:', users.length);
  
  const courses = [
    {
      title: 'Fullstack Web Application Development',
      description: 'Learn to build a Fullstack Web Application from the ground up, starting with the fundamentals and advancing to the deployment of an enterprise-scale application.',
      thumbnail: '/uploads/courses/fullstack-thumbnail.jpg',
      logo_url: '/uploads/courses/fullstack-logo.png',
      price: 1200,
      creator: users[0]._id,
      difficulty_level: 'intermediate',
      status: 'published',
      duration_months: 6,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    },
    {
      title: 'React.js Advanced Development',
      description: 'Master React.js with advanced concepts including hooks, context, performance optimization, and state management.',
      thumbnail: '/uploads/courses/react-thumbnail.jpg',
      logo_url: '/uploads/courses/react-logo.png',
      price: 800,
      creator: users[0]._id,
      difficulty_level: 'advanced',
      status: 'published',
      duration_months: 4,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    },
    {
      title: 'Node.js Backend Development',
      description: 'Build scalable backend applications with Node.js, Express, and MongoDB. Learn RESTful APIs, authentication, and deployment.',
      thumbnail: '/uploads/courses/nodejs-thumbnail.jpg',
      logo_url: '/uploads/courses/nodejs-logo.png',
      price: 900,
      creator: users[0]._id,
      difficulty_level: 'intermediate',
      status: 'published',
      duration_months: 5,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    },
    {
      title: 'Python Data Science',
      description: 'Learn data science with Python, including pandas, numpy, matplotlib, and machine learning fundamentals.',
      thumbnail: '/uploads/courses/python-thumbnail.jpg',
      logo_url: '/uploads/courses/python-logo.png',
      price: 1000,
      creator: users[0]._id,
      difficulty_level: 'beginner',
      status: 'published',
      duration_months: 3,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    }
  ];
  
  const result = await Course.insertMany(courses);
  console.log(`Created ${result.length} courses:`, result.map(c => ({ id: c._id, title: c.title })));
  
  return result;
};

// Seed batches
const seedBatches = async (users) => {
  const batches = [
    {
      name: 'Mar-2025',
      batch_code: 'MAR25',
      full_name: 'March 2025 Cohort',
      description: 'Fullstack Web Application Development cohort starting March 2025',
      start_date: new Date('2025-03-01'),
      end_date: new Date('2025-09-01'),
      created_by: users[0]._id,
      is_active: true,
      max_students: 50,
      meeting_link: 'https://www.example.com/live/mar2025',
      flyer_url: '/uploads/batches/mar2025-flyer.jpg',
      schedule_url: '/uploads/batches/mar2025-schedule.pdf',
      class_days: 'Sat & Sun',
      class_start_time: '10:00 AM',
      class_end_time: '12:00 PM',
      status: 'upcoming'
    },
    {
      name: 'Jun-2025',
      batch_code: 'JUN25',
      full_name: 'June 2025 Cohort',
      description: 'React.js Advanced Development cohort starting June 2025',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-10-01'),
      created_by: users[0]._id,
      is_active: true,
      max_students: 40,
      meeting_link: 'https://www.example.com/live/jun2025',
      flyer_url: '/uploads/batches/jun2025-flyer.jpg',
      schedule_url: '/uploads/batches/jun2025-schedule.pdf',
      class_days: 'Mon & Wed',
      class_start_time: '2:00 PM',
      class_end_time: '4:00 PM',
      status: 'upcoming'
    },
    {
      name: 'Sep-2025',
      batch_code: 'SEP25',
      full_name: 'September 2025 Cohort',
      description: 'Node.js Backend Development cohort starting September 2025',
      start_date: new Date('2025-09-01'),
      end_date: new Date('2026-02-01'),
      created_by: users[0]._id,
      is_active: true,
      max_students: 35,
      meeting_link: 'https://www.example.com/live/sep2025',
      flyer_url: '/uploads/batches/sep2025-flyer.jpg',
      schedule_url: '/uploads/batches/sep2025-schedule.pdf',
      class_days: 'Tue & Thu',
      class_start_time: '6:00 PM',
      class_end_time: '8:00 PM',
      status: 'upcoming'
    },
    {
      name: 'Dec-2025',
      batch_code: 'DEC25',
      full_name: 'December 2025 Cohort',
      description: 'Python Data Science cohort starting December 2025',
      start_date: new Date('2025-12-01'),
      end_date: new Date('2026-03-01'),
      created_by: users[0]._id,
      is_active: true,
      max_students: 45,
      meeting_link: 'https://www.example.com/live/dec2025',
      flyer_url: '/uploads/batches/dec2025-flyer.jpg',
      schedule_url: '/uploads/batches/dec2025-schedule.pdf',
      class_days: 'Fri & Sat',
      class_start_time: '11:00 AM',
      class_end_time: '1:00 PM',
      status: 'upcoming'
    }
  ];
  
  return await Batch.insertMany(batches);
};

// Seed batch courses
const seedBatchCourses = async (batches, courses) => {
  const batchCourses = [
    {
      batch: batches[0]._id, // Mar-2025
      course: courses[0]._id, // Fullstack Web Development
      start_date: new Date('2025-03-01'),
      end_date: new Date('2025-09-01'),
      is_active: true
    },
    {
      batch: batches[1]._id, // Jun-2025
      course: courses[1]._id, // React.js Advanced
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-10-01'),
      is_active: true
    },
    {
      batch: batches[2]._id, // Sep-2025
      course: courses[2]._id, // Node.js Backend
      start_date: new Date('2025-09-01'),
      end_date: new Date('2026-02-01'),
      is_active: true
    },
    {
      batch: batches[3]._id, // Dec-2025
      course: courses[3]._id, // Python Data Science
      start_date: new Date('2025-12-01'),
      end_date: new Date('2026-03-01'),
      is_active: true
    }
  ];
  
  return await BatchCourse.insertMany(batchCourses);
};

// Seed groups
const seedGroups = async (batches) => {
  const groups = [
    {
      batch: batches[0]._id,
      name: 'Group 1',
      description: 'Group 1 for March 2025 Cohort',
      max_members: 15,
      class_days: 'Tue - Thu',
      class_start_time: '10:00 AM',
      class_end_time: '12:00 PM',
      ethio_start_time: '5:00 PM',
      ethio_end_time: '7:00 PM',
      is_active: true,
      status: 'active'
    },
    {
      batch: batches[0]._id,
      name: 'Group 2',
      description: 'Group 2 for March 2025 Cohort',
      max_members: 15,
      class_days: 'Tue - Thu',
      class_start_time: '1:00 PM',
      class_end_time: '3:00 PM',
      ethio_start_time: '8:00 PM',
      ethio_end_time: '10:00 PM',
      is_active: true,
      status: 'active'
    },
    {
      batch: batches[1]._id,
      name: 'Group 1',
      description: 'Group 1 for June 2025 Cohort',
      max_members: 15,
      class_days: 'Tue - Thu',
      class_start_time: '10:00 AM',
      class_end_time: '12:00 PM',
      ethio_start_time: '5:00 PM',
      ethio_end_time: '7:00 PM',
      is_active: true,
      status: 'active'
    }
  ];
  
  return await Group.insertMany(groups);
};

// Seed phases
const seedPhases = async (courses) => {
  console.log('Seeding phases...');
  console.log('Available courses:', courses.length);
  
  const allPhases = [];
  
  courses.forEach((course, courseIndex) => {
    const coursePhases = [
      {
        course_id: course._id,
        phase_name: `Phase 1: ${course.title.split(' ')[0]} Fundamentals`,
        phase_description: `Introduction and fundamentals of ${course.title}`,
        phase_order: 1,
        created_by: course.creator,
        icon: `/assets/icons/phase-1-${courseIndex + 1}.png`,
        path: `/course-${courseIndex + 1}-phase-1`,
        brief_description: `Brief introduction to ${course.title}`,
        full_description: `Comprehensive introduction to ${course.title} fundamentals`,
        hash: `phase1hash${courseIndex + 1}`
      },
      {
        course_id: course._id,
        phase_name: `Phase 2: ${course.title.split(' ')[0]} Intermediate`,
        phase_description: `Intermediate concepts in ${course.title}`,
        phase_order: 2,
        created_by: course.creator,
        icon: `/assets/icons/phase-2-${courseIndex + 1}.png`,
        path: `/course-${courseIndex + 1}-phase-2`,
        brief_description: `Intermediate concepts in ${course.title}`,
        full_description: `Deep dive into intermediate concepts of ${course.title}`,
        hash: `phase2hash${courseIndex + 1}`
      },
      {
        course_id: course._id,
        phase_name: `Phase 3: ${course.title.split(' ')[0]} Advanced`,
        phase_description: `Advanced topics in ${course.title}`,
        phase_order: 3,
        created_by: course.creator,
        icon: `/assets/icons/phase-3-${courseIndex + 1}.png`,
        path: `/course-${courseIndex + 1}-phase-3`,
        brief_description: `Advanced topics in ${course.title}`,
        full_description: `Advanced concepts and real-world applications of ${course.title}`,
        hash: `phase3hash${courseIndex + 1}`
      },
      {
        course_id: course._id,
        phase_name: `Phase 4: ${course.title.split(' ')[0]} Project`,
        phase_description: `Capstone project for ${course.title}`,
        phase_order: 4,
        created_by: course.creator,
        icon: `/assets/icons/phase-4-${courseIndex + 1}.png`,
        path: `/course-${courseIndex + 1}-phase-4`,
        brief_description: `Capstone project for ${course.title}`,
        full_description: `Final project and deployment for ${course.title}`,
        hash: `phase4hash${courseIndex + 1}`
      }
    ];
    
    allPhases.push(...coursePhases);
  });

  const result = await Phase.insertMany(allPhases);
  console.log(`Created ${result.length} phases for ${courses.length} courses`);
  
  return result;
};

// Seed weeks and nested components
const seedWeeksAndNested = async (phases) => {
  const allWeeks = [];
  for (const phase of phases) {
    for (let w = 1; w <= 4; w++) {
      try {
        console.log(`Creating week ${w} for phase ${phase.phase_name} (${phase._id})`);
        const week = await Week.create({
          phase_id: phase._id,
          week_name: `Week ${w}`,
          title: `Title for Week ${w}`,
          week_description: `Description for Week ${w}`,
          week_order: w,
          hash: `hash${w}_${phase._id}`,
          created_by: phase.created_by
        });
        console.log(`Created week ${week._id}`);

        // 2. Create WeekComponent (TODO list)
        const weekComponent = await WeekComponent.create({
          week_id: week._id,
          title: "TODO list of the week",
          order: 1,
          icon_type_id: 3,
          icon_type: { id: 3, title: "TODO List" },
        });

        // 3. Create WeekComponentContents (PDFs)
        const todoContent = await WeekComponentContent.create({
          week_component_id: weekComponent._id,
          icon_type_id: 2,
          title: `Todo List : Week ${w}`,
          order: 1,
          url: `/assets/documents/week-contents/todo-list-week-${w}.pdf`,
          icon_type: { id: 2, title: "PDF" }
        });
        const practicalContent = await WeekComponentContent.create({
          week_component_id: weekComponent._id,
          icon_type_id: 2,
          title: `Practical Exercises : Week ${w}`,
          order: 2,
          url: `/assets/documents/week-contents/practical-exercises-week-${w}.pdf`,
          icon_type: { id: 2, title: "PDF" }
        });
        weekComponent.week_component_contents = [todoContent._id, practicalContent._id];
        await weekComponent.save();

        // 4. Create 2 ClassTopics
        const classTopics = [];
        for (let t = 1; t <= 2; t++) {
          const classTopic = await ClassTopic.create({
            week_id: week._id,
            title: t === 1 ? "Introduction to Web Services" : "API led connectivity",
            order: t,
            hash: `topic${t}_hash_${week._id}`,
            description: "",
            has_checklist: true,
          });

          // 5. Create 3 ClassComponents (notes, checklist, videos)
          const notesComponent = await ClassComponent.create({
            class_topic_id: classTopic._id,
            title: "Class notes",
            order: 1,
            icon_type_id: 12,
            icon_type: { id: 12, title: "File" }
          });
          const checklistComponent = await ClassComponent.create({
            class_topic_id: classTopic._id,
            title: "Class Checklist",
            order: 2,
            icon_type_id: 4,
            icon_type: { id: 4, title: "Checklist" }
          });
          const videosComponent = await ClassComponent.create({
            class_topic_id: classTopic._id,
            title: "Class Videos",
            order: 3,
            icon_type_id: 1,
            icon_type: { id: 1, title: "Video" }
          });

          // 6. Add ClassComponentContents (PDFs)
          const notesContent = await ClassComponentContent.create({
            class_component_id: notesComponent._id,
            icon_type_id: 2,
            title: "Class Notes PDF",
            order: 1,
            url: `/assets/documents/class-contents/class-notes-week-${w}-topic-${t}.pdf`,
            icon_type: { id: 2, title: "PDF" }
          });
          notesComponent.class_component_contents = [notesContent._id];
          await notesComponent.save();

          // ...repeat for checklistComponent and videosComponent as needed...

          // 7. Create 4 ClassVideoSectionBySection
          const videoSections = [];
          for (let s = 1; s <= 4; s++) {
            const section = await ClassVideoSectionBySection.create({
              class_topic_id: classTopic._id,
              title: `Section ${s} for Topic ${t}`,
              order: s,
              hash: `section${s}_hash_${classTopic._id}`,
              minimum_minutes_required: 10 + s * 2,
              class_video_watched_section_by_section_trackers: []
            });
            videoSections.push(section._id);
          }

          // 8. Create 1 ClassVideoLiveSession
          const liveSession = await ClassVideoLiveSession.create({
            class_topic_id: classTopic._id,
            title: `Live Session for Topic ${t}`,
            hash: `live_hash_${classTopic._id}`,
            minimum_minutes_required: 90,
            video_length_minutes: 120,
            note_html: null,
            class_video_live_session_trackers: [],
            session_type: t % 2 === 0 ? "LS-1" : "LS-2"
          });

          // 9. Link all to classTopic
          classTopic.class_components = [notesComponent._id, checklistComponent._id, videosComponent._id];
          classTopic.class_video_section_by_sections = videoSections;
          classTopic.class_video_live_sessions = [liveSession._id];
          await classTopic.save();

          classTopics.push(classTopic._id);
        }

        // 10. Link weekComponent and classTopics to week
        week.week_components = [weekComponent._id];
        week.class_topics = classTopics;
        await week.save();

        allWeeks.push(week);
      } catch (err) {
        console.error(`Error creating week ${w} for phase ${phase.phase_name}:`, err);
        throw err;
      }
    }
  }
  console.log('Weeks and nested data seeded successfully');
  return allWeeks;
};

// Seed batch users
const seedBatchUsers = async (batches, users) => {
  const batchUsers = [
    // Assign instructors to batches
    {
      batch: batches[0]._id,
      user: users[2]._id,
      role: 'instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      batch: batches[1]._id,
      user: users[3]._id,
      role: 'instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    
    // Assign group instructors to batches
    {
      batch: batches[0]._id,
      user: users[4]._id,
      role: 'group_instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      batch: batches[0]._id,
      user: users[5]._id,
      role: 'group_instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    
    // Assign students to batches
    {
      batch: batches[0]._id,
      user: users[6]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      batch: batches[0]._id,
      user: users[7]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      batch: batches[0]._id,
      user: users[8]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      batch: batches[0]._id,
      user: users[9]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    }
  ];
  
  return await BatchUser.insertMany(batchUsers);
};

// Seed group users
const seedGroupUsers = async (groups, users) => {
  const groupUsers = [
    // Assign group instructors to groups
    {
      group: groups[0]._id,
      user: users[4]._id,
      role: 'group_instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      group: groups[1]._id,
      user: users[5]._id,
      role: 'group_instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    
    // Assign students to groups
    {
      group: groups[0]._id,
      user: users[6]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      group: groups[0]._id,
      user: users[7]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      group: groups[1]._id,
      user: users[8]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      group: groups[1]._id,
      user: users[9]._id,
      role: 'student',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    }
  ];
  
  return await GroupUser.insertMany(groupUsers);
};

// Seed course instructors
const seedCourseInstructors = async (courses, users) => {
  const courseInstructors = [
    {
      course: courses[0]._id,
      user: users[2]._id,
      role: 'lead_instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      course: courses[0]._id,
      user: users[3]._id,
      role: 'assistant_instructor',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    }
  ];
  
  return await CourseInstructor.insertMany(courseInstructors);
};

// Seed batch instructors
const seedBatchInstructors = async (batches, groups, users) => {
  const batchInstructors = [
    // Main class instructors
    {
      batch: batches[0]._id,
      user: users[2]._id,
      class_type: 'main_class',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      batch: batches[1]._id,
      user: users[3]._id,
      class_type: 'main_class',
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    
    // Group instructors
    {
      batch: batches[0]._id,
      user: users[4]._id,
      class_type: 'group',
      group: groups[0]._id,
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    },
    {
      batch: batches[0]._id,
      user: users[5]._id,
      class_type: 'group',
      group: groups[1]._id,
      assigned_at: new Date(),
      assigned_by: users[0]._id,
      is_active: true
    }
  ];
  
  return await BatchInstructor.insertMany(batchInstructors);
};

// Seed live sessions
const seedLiveSessions = async (weeks, batches, users) => {
  const liveSessions = [];
  for (const week of weeks) {
    liveSessions.push({
      week: week._id,
      batch: batches[0]._id,
      instructor: users[2]._id,
      title: `Live Session ${week.week_order}`,
      description: `Live session for Week ${week.week_order}`,
      session_date: new Date(), // or generate a date
      start_time: "09:00",
      end_time: "10:00",
      meeting_link: "https://zoom.us/j/123456789",
      session_type: week.week_order % 2 === 0 ? "LS-1" : "LS-2",
      is_full_class: true,
      is_active: true,
      status: 'scheduled'
    });
  }
  return await LiveSession.insertMany(liveSessions, { ordered: false });
};

// Seed group sessions
const seedGroupSessions = async (weeks, groups, users) => {
  const groupSessions = [];
  for (const week of weeks) {
    groupSessions.push({
      week: week._id,
      group: groups[0]._id,
      instructor: users[4]._id,
      title: `Group Session ${week.week_order}`,
      description: `Group session for Week ${week.week_order}`,
      session_date: new Date(),
      start_time: "13:00",
      end_time: "14:00",
      meeting_link: "https://zoom.us/j/987654321",
      session_type: week.week_order % 2 === 0 ? "GS-1" : "GS-2",
      is_active: true,
      status: 'scheduled'
    });
  }
  return await GroupSession.insertMany(groupSessions, { ordered: false });
};

// Seed enrollments
const seedEnrollments = async (batchCourses, users) => {
  console.log('Inside seedEnrollments, batchCourses:', batchCourses.length, 'users:', users.length);

  const enrollments = [
    // Existing enrollments for other students
    {
      user: users[6]._id, // Student One
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-02-15'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 0
    },
    {
      user: users[7]._id, // Student Two
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-02-16'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 0
    },
    {
      user: users[8]._id, // Student Three
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-02-17'),
      status: 'active',
      enrollment_type: 'scholarship',
      payment_amount: 0,
      payment_status: 'waived',
      enrolled_by: users[0]._id,
      progress_percentage: 0
    },
    {
      user: users[9]._id, // Student Four
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-02-18'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 0
    },
    
    // Test student enrolled in 3 different courses
    {
      user: users[10]._id, // Test Student - Course 1: Fullstack Web Development
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-02-20'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 15
    },
    {
      user: users[10]._id, // Test Student - Course 2: React.js Advanced
      batch_course: batchCourses[1]._id,
      enrollment_date: new Date('2025-05-15'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 800,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 25
    },
    {
      user: users[10]._id, // Test Student - Course 3: Node.js Backend
      batch_course: batchCourses[2]._id,
      enrollment_date: new Date('2025-08-10'),
      status: 'active',
      enrollment_type: 'scholarship',
      payment_amount: 0,
      payment_status: 'waived',
      enrolled_by: users[0]._id,
      progress_percentage: 5
    },
    
    // NEW: Admin users enrolled in courses
    // Abenezer Kifle - enrolled in 3 courses
    {
      user: users[11]._id, // Abenezer Kifle - Course 1: Fullstack Web Development
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-01-15'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 30
    },
    {
      user: users[11]._id, // Abenezer Kifle - Course 2: React.js Advanced
      batch_course: batchCourses[1]._id,
      enrollment_date: new Date('2025-04-10'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 800,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 45
    },
    {
      user: users[11]._id, // Abenezer Kifle - Course 3: Node.js Backend
      batch_course: batchCourses[2]._id,
      enrollment_date: new Date('2025-07-05'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 900,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 20
    },
    
    // Shime Techane - enrolled in 2 courses
    {
      user: users[12]._id, // Shime Techane - Course 1: Fullstack Web Development
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-01-20'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 60
    },
    {
      user: users[12]._id, // Shime Techane - Course 2: React.js Advanced
      batch_course: batchCourses[1]._id,
      enrollment_date: new Date('2025-04-15'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 800,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 75
    },
    
    // Kasahun Welela - enrolled in 2 courses
    {
      user: users[13]._id, // Kasahun Welela - Course 1: Fullstack Web Development
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-01-25'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 40
    },
    {
      user: users[13]._id, // Kasahun Welela - Course 3: Node.js Backend
      batch_course: batchCourses[2]._id,
      enrollment_date: new Date('2025-07-10'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 900,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 35
    }
  ];
  
  const result = await Enrollment.insertMany(enrollments);
  console.log('Inserted enrollments:', result.length);
  
  return result;
};

// Seed attendance
const seedAttendance = async (liveSessions, groupSessions, batches, groups, users) => {
  const attendance = [];
  
  // Live session attendance
  for (const session of liveSessions) {
    // Get students in this batch
    const batchUsers = await BatchUser.find({
      batch: session.batch,
      role: 'student',
      is_active: true
    });
    
    for (const batchUser of batchUsers) {
      // Randomly determine if present
      const isPresent = Math.random() > 0.2; // 80% chance of being present
      
      attendance.push({
        user: batchUser.user,
        batch: session.batch,
        live_session: session._id,
        is_present: isPresent,
        class_date: session.session_date,
        check_in_time: isPresent ? session.start_time : null,
        check_out_time: isPresent ? session.end_time : null,
        status: isPresent ? 'present' : 'absent',
        recorded_by: session.instructor
      });
    }
  }
  
  // Group session attendance
  for (const session of groupSessions) {
    // Get students in this group
    const groupUsers = await GroupUser.find({
      group: session.group,
      role: 'student',
      is_active: true
    });
    
    for (const groupUser of groupUsers) {
      // Randomly determine if present
      const isPresent = Math.random() > 0.2; // 80% chance of being present
      
      // Get batch for this group
      const group = await Group.findById(session.group);
      
      attendance.push({
        user: groupUser.user,
        batch: group.batch,
        group: session.group,
        group_session: session._id,
        is_present: isPresent,
        class_date: session.session_date,
        check_in_time: isPresent ? session.start_time : null,
        check_out_time: isPresent ? session.end_time : null,
        status: isPresent ? 'present' : 'absent',
        recorded_by: session.instructor
      });
    }
  }
  
  return await Attendance.insertMany(attendance);
};

// Run the seed function
seedData();