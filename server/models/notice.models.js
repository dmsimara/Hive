import { Sequelize, DataTypes } from 'sequelize';
import Admin from './admin.models.js';
import Establishment from './establishment.models.js';

// Connect Sequelize to the database using environment variables
const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql',
});

// Define the Notice model
const Notice = sequelize.define('Notice', {
  notice_id: {  // Unique ID for each notice
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  title: {  // Title of the notice
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {  // Content of the notice
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pinned: {  // Whether the notice is pinned
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  permanent: {  // Whether the notice is permanent
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {  // Timestamp for when the notice was created
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {  // Timestamp for when the notice was last updated
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  admin_id: {  // ID of the admin who created the notice
    type: DataTypes.INTEGER,
    references: {
      model: Admin,
      key: 'admin_id',
    },
    allowNull: false,
    onDelete: 'CASCADE',  // Delete notice if admin is deleted
  },
  establishment_id: {  // ID of the establishment the notice belongs to
    type: DataTypes.INTEGER,
    references: {
      model: Establishment,
      key: 'establishment_id',
    },
    allowNull: false,
    onDelete: 'CASCADE',  // Delete notice if establishment is deleted
  },
}, {
  timestamps: false,  // Disable automatic timestamp fields
});

// Set up the relationships between Admin, Establishment, and Notice
Admin.hasMany(Notice, { foreignKey: 'admin_id' });
Notice.belongsTo(Admin, { foreignKey: 'admin_id' });

Establishment.hasMany(Notice, { foreignKey: 'establishment_id' });
Notice.belongsTo(Establishment, { foreignKey: 'establishment_id' });

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Notices table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Notice;
