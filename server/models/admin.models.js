import { Sequelize, DataTypes } from 'sequelize';  // Import Sequelize and DataTypes
import dotenv from 'dotenv';  // Import dotenv to use environment variables
import Establishment from './establishment.models.js';  // Import the Establishment model

dotenv.config();  // Load environment variables

// Connect Sequelize to the database using environment variables
const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql', 
});

// Define the Admin model
const Admin = sequelize.define('Admin', {
  admin_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  adminEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true  
  },
  adminPassword: {
    type: DataTypes.STRING,
    allowNull: false
  },
  adminFirstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  adminLastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  establishmentId: { 
    type: DataTypes.INTEGER,
    field: 'establishment_id', 
    references: {
        model: 'Establishment',  
        key: 'establishment_id'
    },
    allowNull: false,
    onDelete: 'CASCADE'  // Delete admin if the related establishment is deleted
  },
  adminProfile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false  // Default value is false
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW  // Set default value as the current time
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpiresAt: {
    type: DataTypes.DATE
  },
  verificationToken: {
    type: DataTypes.STRING
  },
  verificationTokenExpiresAt: {
    type: DataTypes.DATE
  }
}, { timestamps: false });  // Don't use timestamps 

// Set up the relationship between Admin and Establishment models
Establishment.hasMany(Admin, { foreignKey: 'establishment_id' });
Admin.belongsTo(Establishment, { foreignKey: 'establishment_id' });

// Sync the model with the database and log success or error
sequelize.sync().then(() => {
    console.log('Admin table has been created.');
}).catch(err => console.error('Error creating table:', err));

export default Admin;  // Export the Admin model for use in other files
