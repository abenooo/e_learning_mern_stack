const ClassComponent = require('../models/ClassComponent');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassComponent:
 *       type: object
 *       required:
 *         - class
 *         - title
 *         - component_type
 *         - order_number
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the component
 *         class:
 *           type: string
 *           description: Reference to the class
 *         title:
 *           type: string
 *           description: Title of the component
 *         content:
 *           type: string
 *           description: Content of the component
 *         component_type:
 *           type: string
 *           enum: [video, document, quiz, assignment]
 *           description: Type of the component
 *         icon_type:
 *           type: string
 *           description: Icon type for the component
 *         order_number:
 *           type: integer
 *           description: Order number of the component
 *         is_active:
 *           type: boolean
 *           description: Whether the component is active
 *           default: true
 *         is_required:
 *           type: boolean
 *           description: Whether the component is required
 *           default: true
 */

/**
 * @swagger
 * /class-components:
 *   get:
 *     summary: Get all class components with filtering and pagination
 *     tags: [Class Components]
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: component_type
 *         schema:
 *           type: string
 *           enum: [video, document, quiz, assignment]
 *         description: Filter by component type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [order_number, created_at]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of class components
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClassComponent'
 */
exports.getClassComponents = async (req, res, next) => {
  try {
    console.log('Get all class components request received');
    
    const query = {};
    
    if (req.query.class) {
      query.class = req.query.class;
    }
    
    if (req.query.component_type) {
      query.component_type = req.query.component_type;
    }
    
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const sortField = req.query.sort || 'order_number';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    
    const components = await ClassComponent.find(query)
      .populate('class', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await ClassComponent.countDocuments(query);
    
    console.log(`Found ${components.length} components out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: components.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: components
    });
  } catch (error) {
    console.error('Get class components error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /class-components/{id}:
 *   get:
 *     summary: Get a single class component
 *     tags: [Class Components]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     responses:
 *       200:
 *         description: Component details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClassComponent'
 *       404:
 *         description: Component not found
 */
exports.getClassComponent = async (req, res, next) => {
  try {
    console.log(`Get class component request received for ID: ${req.params.id}`);
    
    const component = await ClassComponent.findById(req.params.id)
      .populate('class', 'title');
    
    if (!component) {
      console.log(`Component not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Component not found'
      });
    }
    
    console.log(`Found component: ${component.title}`);
    
    res.status(200).json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Get class component error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /class-components:
 *   post:
 *     summary: Create a new class component
 *     tags: [Class Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class
 *               - title
 *               - component_type
 *               - order_number
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID of the class
 *               title:
 *                 type: string
 *                 description: Title of the component
 *               content:
 *                 type: string
 *                 description: Content of the component
 *               component_type:
 *                 type: string
 *                 enum: [video, document, quiz, assignment]
 *                 description: Type of the component
 *               icon_type:
 *                 type: string
 *                 description: Icon type for the component
 *               order_number:
 *                 type: integer
 *                 description: Order number of the component
 *               is_active:
 *                 type: boolean
 *                 description: Whether the component is active
 *               is_required:
 *                 type: boolean
 *                 description: Whether the component is required
 *     responses:
 *       201:
 *         description: Component created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClassComponent'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
exports.createClassComponent = async (req, res, next) => {
  try {
    console.log('Create class component request received');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.body.class) {
      return res.status(400).json({
        success: false,
        error: 'Class ID is required'
      });
    }
    
    const component = await ClassComponent.create(req.body);
    const populatedComponent = await ClassComponent.findById(component._id)
      .populate('class', 'title');
    
    console.log(`Component created with ID: ${component._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedComponent
    });
  } catch (error) {
    console.error('Create class component error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /class-components/{id}:
 *   put:
 *     summary: Update a class component
 *     tags: [Class Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the component
 *               content:
 *                 type: string
 *                 description: Content of the component
 *               component_type:
 *                 type: string
 *                 enum: [video, document, quiz, assignment]
 *                 description: Type of the component
 *               icon_type:
 *                 type: string
 *                 description: Icon type for the component
 *               order_number:
 *                 type: integer
 *                 description: Order number of the component
 *               is_active:
 *                 type: boolean
 *                 description: Whether the component is active
 *               is_required:
 *                 type: boolean
 *                 description: Whether the component is required
 *     responses:
 *       200:
 *         description: Component updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClassComponent'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Component not found
 */
exports.updateClassComponent = async (req, res, next) => {
  try {
    console.log(`Update class component request received for ID: ${req.params.id}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let component = await ClassComponent.findById(req.params.id);
    
    if (!component) {
      console.log(`Component not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Component not found'
      });
    }
    
    component = await ClassComponent.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('class', 'title');
    
    console.log(`Component updated: ${component.title}`);
    
    res.status(200).json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Update class component error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /class-components/{id}:
 *   delete:
 *     summary: Delete a class component
 *     tags: [Class Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Component ID
 *     responses:
 *       200:
 *         description: Component deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Component not found
 */
exports.deleteClassComponent = async (req, res, next) => {
  try {
    console.log(`Delete class component request received for ID: ${req.params.id}`);
    
    const component = await ClassComponent.findById(req.params.id);
    
    if (!component) {
      console.log(`Component not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Component not found'
      });
    }
    
    await ClassComponent.findByIdAndDelete(req.params.id);
    console.log(`Component deleted: ${component.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete class component error:', error);
    next(error);
  }
}; 