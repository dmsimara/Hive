import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Admin from './admin.models.js';
import Establishment from './establishment.models.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql', 
});

const Calendar = sequelize.define('Calendar', {
  event_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  event_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start: { 
    type: DataTypes.DATE,
    allowNull: false
  },
  end: { 
    type: DataTypes.DATE,
    allowNull: true
  },
  event_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {  
    type: DataTypes.ENUM(
      'Not Started',
      'Working in Progress',
      'On Hold',
      'Done'
    ),
    allowNull: false,
    defaultValue: 'Not Started' 
  },
  admin_id: {  
    type: DataTypes.INTEGER,
    references: {
      model: Admin, 
      key: 'admin_id'
    },
    allowNull: false,
    onDelete: 'CASCADE'
  },
  establishment_id: {  
    type: DataTypes.INTEGER,
    references: {
      model: Establishment,  
      key: 'establishment_id'
    },
    allowNull: false,
    onDelete: 'CASCADE'
  }
}, { 
  timestamps: false 
});

Admin.hasMany(Calendar, { foreignKey: 'admin_id' });
Calendar.belongsTo(Admin, { foreignKey: 'admin_id' });

Establishment.hasMany(Calendar, { foreignKey: 'establishment_id' });
Calendar.belongsTo(Establishment, { foreignKey: 'establishment_id' });

sequelize.sync()
  .then(() => {
    console.log('Calendar table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Calendar;
