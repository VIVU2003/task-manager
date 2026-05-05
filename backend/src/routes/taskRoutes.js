const express = require("express");
const auth = require("../middleware/auth");
const Task = require("../models/Task");
const { requireProjectMember } = require("../utils/projectAccess");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { projectId, title, description, assignedTo, dueDate } = req.body;
    if (!projectId || !title) {
      return res
        .status(400)
        .json({ message: "projectId and title are required" });
    }

    const access = await requireProjectMember(projectId, req.user.id);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const memberRole = access.membership.role;
    if (memberRole !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can create tasks" });
    }

    const task = await Task.create({
      projectId,
      title,
      description: description || "",
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      createdBy: req.user.id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    return res.status(201).json(populatedTask);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create task" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ message: "projectId query is required" });
    }

    const access = await requireProjectMember(projectId, req.user.id);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const tasks = await Task.find({ projectId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const { status, assignedTo, title, description, dueDate } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const access = await requireProjectMember(task.projectId, req.user.id);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const isAdmin = access.membership.role === "ADMIN";

    if (assignedTo && !isAdmin) {
      return res.status(403).json({ message: "Only admin can reassign tasks" });
    }

    if (!isAdmin && (title !== undefined || description !== undefined || dueDate !== undefined)) {
      return res.status(403).json({
        message: "Members can only update task status",
      });
    }

    if (!isAdmin && assignedTo !== undefined) {
      return res
        .status(403)
        .json({ message: "Members cannot change task assignee" });
    }

    if (status && !["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (status) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task" });
  }
});

module.exports = router;
