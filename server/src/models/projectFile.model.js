const { DataTypes } = require('sequelize');

// File types
const FILE_TYPES = ['document', 'image', 'video', 'audio', 'archive', 'other'];

module.exports = (sequelize) => {
  const ProjectFile = sequelize.define(
    'ProjectFile',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'project_tasks',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fileType: {
        type: DataTypes.ENUM(...FILE_TYPES),
        defaultValue: 'other',
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      thumbnailUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cloudinaryId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      folder: {
        type: DataTypes.STRING(255),
        defaultValue: 'root',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      tableName: 'project_files',
      timestamps: true,
      indexes: [
        { fields: ['projectId'] },
        { fields: ['taskId'] },
        { fields: ['uploadedBy'] },
        { fields: ['fileType'] },
        { fields: ['folder'] },
      ],
    }
  );

  // Static properties
  ProjectFile.FILE_TYPES = FILE_TYPES;

  // Helper to determine file type from mime type
  ProjectFile.getFileType = (mimeType) => {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || 
        mimeType.includes('spreadsheet') || mimeType.includes('presentation') ||
        mimeType.includes('text/')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || 
        mimeType.includes('tar') || mimeType.includes('gzip')) return 'archive';
    return 'other';
  };

  return ProjectFile;
};
