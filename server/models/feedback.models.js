import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Establishment from './establishment.models.js';
import Admin from './admin.models.js';
import Tenant from './tenant.models.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql', 
});

const Feedback = sequelize.define('Feedback', {
  feedback_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  establishment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  feedback_level: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW // This automatically sets the current timestamp
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, { timestamps: false });

/* Associations */
Feedback.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Feedback.belongsTo(Admin, { foreignKey: 'admin_id' });
Feedback.belongsTo(Establishment, { foreignKey: 'establishment_id' });

sequelize.sync()
  .then(() => {
    console.log('Feedbacks table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Feedback;
