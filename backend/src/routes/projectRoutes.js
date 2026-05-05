const express = require("express");
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const User = require("../models/User");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const isAdminInAnyProject = await Project.exists({
      members: {
        $elemMatch: { userId: req.user.id, role: "ADMIN" },
      },
    });
    if (!isAdminInAnyProject) {
      return res
        .status(403)
        .json({ message: "Only admins can create projects" });
    }

    const project = await Project.create({
      name,
      description: description || "",
      createdBy: req.user.id,
      members: [{ userId: req.user.id, role: "ADMIN" }],
    });

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create project" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({ "members.userId": req.user.id })
      .populate("createdBy", "name email")
      .populate("members.userId", "name email")
      .sort({ createdAt: -1 });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch projects" });
  }
});

router.patch("/:id/add-member", auth, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Member email is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const actingMember = project.members.find(
      (member) => member.userId.toString() === req.user.id
    );
    if (!actingMember || actingMember.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found. Ask them to signup first." });
    }

    const existing = project.members.find(
      (member) => member.userId.toString() === user._id.toString()
    );
    if (existing) {
      return res.status(400).json({ message: "User is already a member" });
    }

    project.members.push({
      userId: user._id,
      role: role === "ADMIN" ? "ADMIN" : "MEMBER",
    });

    await project.save();
    await project.populate("members.userId", "name email");
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add member" });
  }
});

module.exports = router;
