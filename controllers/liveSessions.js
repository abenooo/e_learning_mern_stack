const LiveSession = require('../models/LiveSession');

/**
 * @swagger
 * /live-sessions:
 *   get:
 *     summary: Get all live sessions
 *     tags: [Live Sessions]
 *     responses:
 *       200:
 *         description: List of live sessions
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
 *                     $ref: '#/components/schemas/LiveSession'
 *       500:
 *         description: Server error
 */
exports.getLiveSessions = async (req, res, next) => {
  try {
    const liveSessions = await LiveSession.find({})
      .populate('week', 'title')
      .populate('batch', 'name')
      .populate('instructor', 'name email');

    res.status(200).json({
      success: true,
      count: liveSessions.length,
      data: liveSessions
    });
  } catch (error) {
    console.error('Get live sessions error:', error);
    next(error);
  }
}; 