import express from 'express';
import Notification from '../models/notification.model.js';

const router = express.Router();

// --- ✅ NEW ROUTE ADDED HERE ---
// GET: /api/notifications/unread-count
// Gets the count of all unread notifications in the database.
router.get('/unread-count', async (req, res) => {
  try {
    // This efficiently counts documents where 'read' is false without fetching them.
    const count = await Notification.countDocuments({ read: false });
    // It sends the count back in a simple JSON object, which the frontend expects.
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread notification count' });
  }
});


// --- Your Existing Routes (No changes needed) ---

// GET all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT: mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT: mark all as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;