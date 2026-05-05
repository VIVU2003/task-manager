const Project = require("../models/Project");

const getMembership = (project, userId) =>
  project.members.find((member) => member.userId.toString() === userId);

const requireProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    return { error: "Project not found", status: 404 };
  }

  const membership = getMembership(project, userId);
  if (!membership) {
    return { error: "Forbidden", status: 403 };
  }

  return { project, membership };
};

module.exports = { requireProjectMember };
