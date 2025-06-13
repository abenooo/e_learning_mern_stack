const GroupSession = require('../models/GroupSession');

/**
 * @swagger
 * /group-sessions:
 *   get:
 *     summary: Get all group sessions
 *     tags: [Group Sessions]
 *     responses:
 *       200:
 *         description: List of group sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GroupSession'
 *       500:
 *         description: Server error
 */
exports.getGroupSessions = async (req, res, next) => {
  try {
    const groupSessions = await GroupSession.find({})
      .populate('week', 'title')
      .populate('group', 'name')
      .populate('instructor', 'name email');

    res.status(200).json({
      success: true,
      count: groupSessions.length,
      data: groupSessions
    });
  } catch (error) {
    console.error('Get group sessions error:', error);
    next(error);
  }
}; 