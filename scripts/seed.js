const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await clearDatabase();
    
    console.log('Database cleared. Starting to seed data...');
    
    // Seed roles
    const roles = await seedRoles();
    console.log('Roles seeded successfully');
    
    // Seed permissions
    const permissions = await seedPermissions();
    console.log('Permissions seeded successfully');
    
    // Seed role permissions
    await seedRolePermissions(roles, permissions);
    console.log('Role permissions seeded successfully');
    
    // Seed users
    const users = await seedUsers();
    console.log('Users seeded successfully');
    
    // Seed user roles
    await seedUserRoles(users, roles);
    console.log('User roles seeded successfully');
    
    // Seed courses
    const courses = await seedCourses(users);
    console.log('Courses seeded successfully');
    
    // Seed batches
    const batches = await seedBatches(users);
    console.log('Batches seeded successfully');
    
    // Seed batch courses
    const batchCourses = await seedBatchCourses(batches, courses);
    console.log('Batch courses seeded successfully');
    
    // Seed groups
    const groups = await seedGroups(batches);
    console.log('Groups seeded successfully');
    
    // Seed phases
    const phases = await seedPhases(batchCourses);
    console.log('Phases seeded successfully');
    
    // Seed weeks
    const weeks = await seedWeeks(phases);
    console.log('Weeks seeded successfully');
    
    // Seed batch users
    await seedBatchUsers(batches, users);
    console.log('Batch users seeded successfully');
    
    // Seed group users
    await seedGroupUsers(groups, users);
    console.log('Group users seeded successfully');
    
    // Seed course instructors
    await seedCourseInstructors(courses, users);
    console.log('Course instructors seeded successfully');
    
    // Seed batch instructors
    await seedBatchInstructors(batches, groups, users);
    console.log('Batch instructors seeded successfully');
    
    // Seed live sessions
    const liveSessions = await seedLiveSessions(weeks, batches, users);
    console.log('Live sessions seeded successfully');
    
    // Seed group sessions
    const groupSessions = await seedGroupSessions(weeks, groups, users);
    console.log('Group sessions seeded successfully');
    
    // Seed enrollments
    await seedEnrollments(batchCourses, users);
    console.log('Enrollments seeded successfully');
    
    // Seed attendance
    await seedAttendance(liveSessions, groupSessions, batches, groups, users);
    console.log('Attendance seeded successfully');
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Clear database
const clearDatabase = async () => {
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
        ['courses', 'batches', 'phases', 'weeks', 'sessions'].includes(permission.resource_type)) {
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
  
  // Assign student role to users 6-9
  for (let i = 6; i <= 9; i++) {
    userRoles.push({
      user: users[i]._id,
      role: roles.find(r => r.name === 'student')._id,
      is_active: true
    });
  }
  
  return await UserRole.insertMany(userRoles);
};

// Seed courses
const seedCourses = async (users) => {
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
      title: 'AWS Cloud Computing',
      description: 'Master Amazon Web Services (AWS) and learn to deploy scalable cloud applications.',
      thumbnail: '/uploads/courses/aws-thumbnail.jpg',
      logo_url: '/uploads/courses/aws-logo.png',
      price: 800,
      creator: users[0]._id,
      difficulty_level: 'intermediate',
      status: 'published',
      duration_months: 3,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    },
    {
      title: 'React Native Mobile Development',
      description: 'Learn to build cross-platform mobile applications using React Native.',
      thumbnail: '/uploads/courses/react-native-thumbnail.jpg',
      logo_url: '/uploads/courses/react-native-logo.png',
      price: 900,
      creator: users[1]._id,
      difficulty_level: 'intermediate',
      status: 'published',
      duration_months: 4,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    },
    {
      title: 'Python for Data Science',
      description: 'Master Python programming for data analysis and machine learning.',
      thumbnail: '/uploads/courses/python-thumbnail.jpg',
      logo_url: '/uploads/courses/python-logo.png',
      price: 1000,
      creator: users[1]._id,
      difficulty_level: 'intermediate',
      status: 'draft',
      duration_months: 5,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    },
    {
      title: 'UI/UX Design Fundamentals',
      description: 'Learn the principles of user interface and user experience design.',
      thumbnail: '/uploads/courses/uiux-thumbnail.jpg',
      logo_url: '/uploads/courses/uiux-logo.png',
      price: 700,
      creator: users[2]._id,
      difficulty_level: 'beginner',
      status: 'published',
      duration_months: 3,
      course_type: 'paid',
      delivery_method: 'online',
      is_active: true
    }
  ];
  
  return await Course.insertMany(courses);
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
      description: 'Fullstack Web Application Development cohort starting June 2025',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-12-01'),
      created_by: users[0]._id,
      is_active: true,
      max_students: 50,
      meeting_link: 'https://www.example.com/live/jun2025',
      flyer_url: '/uploads/batches/jun2025-flyer.jpg',
      schedule_url: '/uploads/batches/jun2025-schedule.pdf',
      class_days: 'Sat & Sun',
      class_start_time: '10:00 AM',
      class_end_time: '12:00 PM',
      status: 'upcoming'
    },
    {
      name: 'Dec-2024',
      batch_code: 'DEC24',
      full_name: 'December 2024 Cohort',
      description: 'AWS Cloud Computing cohort starting December 2024',
      start_date: new Date('2024-12-01'),
      end_date: new Date('2025-03-01'),
      created_by: users[1]._id,
      is_active: true,
      max_students: 40,
      meeting_link: 'https://www.example.com/live/dec2024',
      flyer_url: '/uploads/batches/dec2024-flyer.jpg',
      schedule_url: '/uploads/batches/dec2024-schedule.pdf',
      class_days: 'Sat & Sun',
      class_start_time: '10:00 AM',
      class_end_time: '12:00 PM',
      status: 'upcoming'
    }
  ];
  
  return await Batch.insertMany(batches);
};

// Seed batch courses
const seedBatchCourses = async (batches, courses) => {
  const batchCourses = [
    {
      batch: batches[0]._id,
      course: courses[0]._id,
      start_date: new Date('2025-03-01'),
      end_date: new Date('2025-09-01'),
      is_active: true
    },
    {
      batch: batches[1]._id,
      course: courses[0]._id,
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-12-01'),
      is_active: true
    },
    {
      batch: batches[2]._id,
      course: courses[1]._id,
      start_date: new Date('2024-12-01'),
      end_date: new Date('2025-03-01'),
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
const seedPhases = async (batchCourses) => {
  const phases = [
    {
      batch_course: batchCourses[0]._id,
      title: 'Phase 1: Building static websites using HTML, CSS & Bootstrap',
      description: 'Learn the fundamentals of web development with HTML, CSS, and Bootstrap',
      icon_url: '/uploads/phases/phase1-icon.png',
      order_number: 1,
      start_date: new Date('2025-03-01'),
      end_date: new Date('2025-04-01'),
      is_active: true,
      is_required: true
    },
    {
      batch_course: batchCourses[0]._id,
      title: 'Phase 2: JavaScript Programming',
      description: 'Master JavaScript programming for web development',
      icon_url: '/uploads/phases/phase2-icon.png',
      order_number: 2,
      start_date: new Date('2025-04-01'),
      end_date: new Date('2025-05-01'),
      is_active: true,
      is_required: true
    },
    {
      batch_course: batchCourses[0]._id,
      title: 'Phase 3: React Frontend Development',
      description: 'Build modern user interfaces with React',
      icon_url: '/uploads/phases/phase3-icon.png',
      order_number: 3,
      start_date: new Date('2025-05-01'),
      end_date: new Date('2025-06-01'),
      is_active: true,
      is_required: true
    }
  ];
  
  return await Phase.insertMany(phases);
};

// Seed weeks
const seedWeeks = async (phases) => {
  const weeks = [
    {
      phase: phases[0]._id,
      title: 'Week 1: HTML Fundamentals',
      description: 'Learn the basics of HTML markup language',
      order_number: 1,
      start_date: new Date('2025-03-01'),
      end_date: new Date('2025-03-08'),
      is_active: true,
      is_required: true,
      icon_url: '/uploads/weeks/html-icon.png'
    },
    {
      phase: phases[0]._id,
      title: 'Week 2: CSS Styling',
      description: 'Master cascading style sheets for web design',
      order_number: 2,
      start_date: new Date('2025-03-08'),
      end_date: new Date('2025-03-15'),
      is_active: true,
      is_required: true,
      icon_url: '/uploads/weeks/css-icon.png'
    },
    {
      phase: phases[1]._id,
      title: 'Week 5: JavaScript Basics',
      description: 'Introduction to JavaScript programming',
      order_number: 1,
      start_date: new Date('2025-04-01'),
      end_date: new Date('2025-04-08'),
      is_active: true,
      is_required: true,
      icon_url: '/uploads/weeks/js-icon.png'
    }
  ];
  
  return await Week.insertMany(weeks);
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
    },
    {
      course: courses[1]._id,
      user: users[3]._id,
      role: 'lead_instructor',
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
  const liveSessions = [
    {
      week: weeks[0]._id,
      batch: batches[0]._id,
      instructor: users[2]._id,
      title: 'HTML Fundamentals - Part 1',
      description: 'Introduction to HTML structure and basic elements',
      session_date: new Date('2025-03-01'),
      start_time: '10:00 AM',
      end_time: '12:00 PM',
      meeting_link: 'https://www.example.com/live/mar2025/ls-1',
      session_type: 'LS-1',
      is_full_class: true,
      is_active: true,
      status: 'scheduled'
    },
    {
      week: weeks[0]._id,
      batch: batches[0]._id,
      instructor: users[2]._id,
      title: 'HTML Fundamentals - Part 2',
      description: 'Advanced HTML elements and forms',
      session_date: new Date('2025-03-02'),
      start_time: '10:00 AM',
      end_time: '12:00 PM',
      meeting_link: 'https://www.example.com/live/mar2025/ls-2',
      session_type: 'LS-2',
      is_full_class: true,
      is_active: true,
      status: 'scheduled'
    }
  ];
  
  return await LiveSession.insertMany(liveSessions);
};

// Seed group sessions
const seedGroupSessions = async (weeks, groups, users) => {
  const groupSessions = [
    {
      week: weeks[0]._id,
      group: groups[0]._id,
      instructor: users[4]._id,
      title: 'HTML Practice Session - Group 1',
      description: 'Practice session for HTML fundamentals',
      session_date: new Date('2025-03-03'),
      start_time: '10:00 AM',
      end_time: '12:00 PM',
      meeting_link: 'https://www.example.com/group/mar2025/g1/gs-1',
      session_type: 'GS-1',
      is_active: true,
      status: 'scheduled'
    },
    {
      week: weeks[0]._id,
      group: groups[1]._id,
      instructor: users[5]._id,
      title: 'HTML Practice Session - Group 2',
      description: 'Practice session for HTML fundamentals',
      session_date: new Date('2025-03-03'),
      start_time: '1:00 PM',
      end_time: '3:00 PM',
      meeting_link: 'https://www.example.com/group/mar2025/g2/gs-1',
      session_type: 'GS-1',
      is_active: true,
      status: 'scheduled'
    }
  ];
  
  return await GroupSession.insertMany(groupSessions);
};

// Seed enrollments
const seedEnrollments = async (batchCourses, users) => {
  const enrollments = [
    {
      user: users[6]._id,
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
      user: users[7]._id,
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
      user: users[8]._id,
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
      user: users[9]._id,
      batch_course: batchCourses[0]._id,
      enrollment_date: new Date('2025-02-18'),
      status: 'active',
      enrollment_type: 'paid',
      payment_amount: 1200,
      payment_status: 'completed',
      enrolled_by: users[0]._id,
      progress_percentage: 0
    }
  ];
  
  return await Enrollment.insertMany(enrollments);
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