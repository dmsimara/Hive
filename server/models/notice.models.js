import { Sequelize, DataTypes } from 'sequelize';
import Admin from './admin.models.js';
import Establishment from './establishment.models.js';

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: 'localhost',
  dialect: 'mysql',
});

const Notice = sequelize.define('Notice', {
  notice_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  permanent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Admin,
      key: 'admin_id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
  },
  establishment_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Establishment,
      key: 'establishment_id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
  },
}, {
  timestamps: false,
});

Admin.hasMany(Notice, { foreignKey: 'admin_id' });
Notice.belongsTo(Admin, { foreignKey: 'admin_id' });

Establishment.hasMany(Notice, { foreignKey: 'establishment_id' });
Notice.belongsTo(Establishment, { foreignKey: 'establishment_id' });

sequelize.sync()
  .then(() => {
    console.log('Notices table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Notice;
