import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect Sequelize to the database using environment variables
const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql',
});

// Define the Establishment model
const Establishment = sequelize.define('Establishment', {
  establishment_id: {  // Unique ID for each establishment
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  eName: {  // Name of the establishment
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, { 
  timestamps: false  // Disable automatic timestamp fields
});

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Establishments table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Establishment;
