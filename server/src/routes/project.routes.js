const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');
const projectController = require('../controllers/project.controller');

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Dashboard statistics
router.get('/stats', projectController.getProjectStats);

// Calendar data (for all accessible projects)
router.get('/calendar', projectController.getCalendar);

// Project CRUD
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.post('/:id/archive', projectController.archiveProject);
router.delete('/:id', requireAdmin, projectController.deleteProject);

// ═══════════════════════════════════════════════════════════════════════════════
// TASK ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/:id/tasks', projectController.getTasks);
router.post('/:id/tasks', projectController.createTask);
router.put('/tasks/reorder', projectController.reorderTasks);
router.get('/tasks/:taskId', projectController.getTask);
router.put('/tasks/:taskId', projectController.updateTask);
router.put('/tasks/:taskId/status', projectController.updateTaskStatus);
router.delete('/tasks/:taskId', projectController.deleteTask);

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/:id/members', projectController.getMembers);
router.post('/:id/members', projectController.addMember);
router.put('/:id/members/:userId', projectController.updateMember);
router.delete('/:id/members/:userId', projectController.removeMember);

// ═══════════════════════════════════════════════════════════════════════════════
// FILE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/:id/files', projectController.getFiles);
router.post('/:id/files', projectController.uploadFile);
router.delete('/files/:fileId', projectController.deleteFile);

// ═══════════════════════════════════════════════════════════════════════════════
// COMMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/tasks/:taskId/comments', projectController.getComments);
router.post('/tasks/:taskId/comments', projectController.addComment);
router.put('/comments/:commentId', projectController.updateComment);
router.delete('/comments/:commentId', projectController.deleteComment);

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY & TIMELINE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/:id/activity', projectController.getActivity);
router.get('/:id/timeline', projectController.getTimeline);

module.exports = router;
