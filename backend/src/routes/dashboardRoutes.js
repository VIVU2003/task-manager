const express = require("express");
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const Task = require("../models/Task");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({ "members.userId": req.user.id }).select("_id name");
    const projectIds = projects.map((project) => project._id);

    const tasks = await Task.find({ projectId: { $in: projectIds } })
      .populate("projectId", "name")
      .populate("assignedTo", "name email")
      .sort({ dueDate: 1 });

    const counts = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      TOTAL: tasks.length,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = [];
    tasks.forEach((task) => {
      counts[task.status] += 1;
      if (task.dueDate && task.dueDate < today && task.status !== "DONE") {
        overdueTasks.push(task);
      }
    });

    return res.json({
      projectCount: projects.length,
      taskCounts: counts,
      overdueTasks,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
});

module.exports = router;
