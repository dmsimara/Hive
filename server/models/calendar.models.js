import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Admin from './admin.models.js';
import Establishment from './establishment.models.js';

dotenv.config();

// Connect Sequelize to the database using environment variables
const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql',
});

// Define the Calendar model
const Calendar = sequelize.define('Calendar', {
  event_id: { // Unique event ID
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  event_name: { // Event name
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start: {  // Start date and time
    type: DataTypes.DATE,
    allowNull: false
  },
  end: {  // End date and time 
    type: DataTypes.DATE,
    allowNull: true
  },
  event_description: {  // Event description 
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {  
    type: DataTypes.ENUM(
      'Not Started',
      'In Progress',
      'On Hold',
      'Completed'
    ),
    allowNull: false,
    defaultValue: 'Not Started'
  },
  admin_id: {  // Reference to the Admin who created the event
    type: DataTypes.INTEGER,
    references: {
      model: Admin, 
      key: 'admin_id'
    },
    allowNull: false,
    onDelete: 'CASCADE'
  },
  establishment_id: {  // Reference to the Establishment where the event occurs
    type: DataTypes.INTEGER,
    references: {
      model: Establishment,  
      key: 'establishment_id'
    },
    allowNull: false,
    onDelete: 'CASCADE'
  }
}, { 
  timestamps: false  // Disable automatic timestamp fields
});

// Define relationships between models
Admin.hasMany(Calendar, { foreignKey: 'admin_id' });
Calendar.belongsTo(Admin, { foreignKey: 'admin_id' });

Establishment.hasMany(Calendar, { foreignKey: 'establishment_id' });
Calendar.belongsTo(Establishment, { foreignKey: 'establishment_id' });

// Synchronize the model with the database
sequelize.sync()
  .then(() => {
    console.log('Calendar table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Calendar;
