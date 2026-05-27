const sequelize = require('../config/db');
const User = require('./user.model');
const UserTablePermission = require('./userTablePermission.model');
const TableAccessRule = require('./tableAccessRule.model');
const CustomTable = require('./customTable.model');
const CustomField = require('./customField.model');
const CustomTableData = require('./customTableData.model');
const FieldRelation = require('./fieldRelation.model');

// Project Management Models
const Project = require('./project.model');
const ProjectTask = require('./projectTask.model');
const ProjectMember = require('./projectMember.model');
const ProjectFile = require('./projectFile.model');
const ProjectComment = require('./projectComment.model');
const ProjectActivity = require('./projectActivity.model');

const models = {
  User: User(sequelize),
  UserTablePermission: UserTablePermission(sequelize),
  TableAccessRule: TableAccessRule(sequelize),
  CustomTable: CustomTable(sequelize),
  CustomField: CustomField(sequelize),
  CustomTableData: CustomTableData(sequelize),
  FieldRelation: FieldRelation(sequelize),
  // Project Management
  Project: Project(sequelize),
  ProjectTask: ProjectTask(sequelize),
  ProjectMember: ProjectMember(sequelize),
  ProjectFile: ProjectFile(sequelize),
  ProjectComment: ProjectComment(sequelize),
  ProjectActivity: ProjectActivity(sequelize),
};

// Set up associations for CustomTable
models.CustomTable.hasMany(models.CustomField, {
  foreignKey: 'table_id',
  as: 'fields',
  onDelete: 'CASCADE',
});

models.CustomField.belongsTo(models.CustomTable, {
  foreignKey: 'table_id',
  as: 'table',
});

models.CustomTable.hasMany(models.CustomTableData, {
  foreignKey: 'table_id',
  as: 'records',
  onDelete: 'CASCADE',
});

models.CustomTableData.belongsTo(models.CustomTable, {
  foreignKey: 'table_id',
  as: 'table',
});

// Set up associations for FieldRelation
models.FieldRelation.belongsTo(models.CustomField, {
  foreignKey: 'source_field_id',
  as: 'sourceField',
});

models.FieldRelation.belongsTo(models.CustomTable, {
  foreignKey: 'source_table_id',
  as: 'sourceTable',
});

models.FieldRelation.belongsTo(models.CustomTable, {
  foreignKey: 'target_table_id',
  as: 'targetTable',
});

models.FieldRelation.belongsTo(models.CustomField, {
  foreignKey: 'target_field_id',
  as: 'targetField',
});

models.FieldRelation.belongsTo(models.CustomField, {
  foreignKey: 'display_field_id',
  as: 'displayField',
});

// CustomField can have one FieldRelation (for relation/sync types)
models.CustomField.hasOne(models.FieldRelation, {
  foreignKey: 'source_field_id',
  as: 'relation',
  onDelete: 'CASCADE',
});

// CustomTable can be referenced by many fields (as target)
models.CustomTable.hasMany(models.FieldRelation, {
  foreignKey: 'target_table_id',
  as: 'incomingRelations',
});

// Set up associations for User and UserTablePermission
models.User.hasMany(models.UserTablePermission, {
  foreignKey: 'userId',
  as: 'tablePermissions',
  onDelete: 'CASCADE',
});

models.UserTablePermission.belongsTo(models.User, {
  foreignKey: 'userId',
  as: 'user',
});

// Set up associations for TableAccessRule
models.UserTablePermission.hasMany(models.TableAccessRule, {
  foreignKey: 'permission_id',
  as: 'accessRules',
  onDelete: 'CASCADE',
});

models.TableAccessRule.belongsTo(models.UserTablePermission, {
  foreignKey: 'permission_id',
  as: 'permission',
});

// Self-referential association for createdBy
models.User.belongsTo(models.User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT MANAGEMENT ASSOCIATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Project -> User (creator)
models.Project.belongsTo(models.User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

models.User.hasMany(models.Project, {
  foreignKey: 'createdBy',
  as: 'createdProjects',
});

// Project -> ProjectTask
models.Project.hasMany(models.ProjectTask, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE',
});

models.ProjectTask.belongsTo(models.Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// ProjectTask -> User (assignee)
models.ProjectTask.belongsTo(models.User, {
  foreignKey: 'assigneeId',
  as: 'assignee',
});

models.User.hasMany(models.ProjectTask, {
  foreignKey: 'assigneeId',
  as: 'assignedTasks',
});

// ProjectTask -> User (reporter)
models.ProjectTask.belongsTo(models.User, {
  foreignKey: 'reporterId',
  as: 'reporter',
});

// ProjectTask -> User (creator)
models.ProjectTask.belongsTo(models.User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// ProjectTask self-reference (subtasks)
models.ProjectTask.belongsTo(models.ProjectTask, {
  foreignKey: 'parentTaskId',
  as: 'parentTask',
});

models.ProjectTask.hasMany(models.ProjectTask, {
  foreignKey: 'parentTaskId',
  as: 'subtasks',
});

// Project -> ProjectMember
models.Project.hasMany(models.ProjectMember, {
  foreignKey: 'projectId',
  as: 'members',
  onDelete: 'CASCADE',
});

models.ProjectMember.belongsTo(models.Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// ProjectMember -> User
models.ProjectMember.belongsTo(models.User, {
  foreignKey: 'userId',
  as: 'user',
});

models.User.hasMany(models.ProjectMember, {
  foreignKey: 'userId',
  as: 'projectMemberships',
});

// ProjectMember -> User (addedBy)
models.ProjectMember.belongsTo(models.User, {
  foreignKey: 'addedBy',
  as: 'addedByUser',
});

// Project -> ProjectFile
models.Project.hasMany(models.ProjectFile, {
  foreignKey: 'projectId',
  as: 'files',
  onDelete: 'CASCADE',
});

models.ProjectFile.belongsTo(models.Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// ProjectFile -> ProjectTask
models.ProjectTask.hasMany(models.ProjectFile, {
  foreignKey: 'taskId',
  as: 'attachments',
});

models.ProjectFile.belongsTo(models.ProjectTask, {
  foreignKey: 'taskId',
  as: 'task',
});

// ProjectFile -> User
models.ProjectFile.belongsTo(models.User, {
  foreignKey: 'uploadedBy',
  as: 'uploader',
});

// Project -> ProjectComment
models.Project.hasMany(models.ProjectComment, {
  foreignKey: 'projectId',
  as: 'comments',
  onDelete: 'CASCADE',
});

models.ProjectComment.belongsTo(models.Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// ProjectComment -> ProjectTask
models.ProjectTask.hasMany(models.ProjectComment, {
  foreignKey: 'taskId',
  as: 'comments',
});

models.ProjectComment.belongsTo(models.ProjectTask, {
  foreignKey: 'taskId',
  as: 'task',
});

// ProjectComment -> User
models.ProjectComment.belongsTo(models.User, {
  foreignKey: 'authorId',
  as: 'author',
});

// ProjectComment self-reference (replies)
models.ProjectComment.belongsTo(models.ProjectComment, {
  foreignKey: 'parentId',
  as: 'parent',
});

models.ProjectComment.hasMany(models.ProjectComment, {
  foreignKey: 'parentId',
  as: 'replies',
});

// Project -> ProjectActivity
models.Project.hasMany(models.ProjectActivity, {
  foreignKey: 'projectId',
  as: 'activities',
  onDelete: 'CASCADE',
});

models.ProjectActivity.belongsTo(models.Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// ProjectActivity -> ProjectTask
models.ProjectActivity.belongsTo(models.ProjectTask, {
  foreignKey: 'taskId',
  as: 'task',
});

// ProjectActivity -> User
models.ProjectActivity.belongsTo(models.User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = {
  sequelize,
  ...models,
};
