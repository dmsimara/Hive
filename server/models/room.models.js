import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Establishment from './establishment.models.js';

// Load environment variables
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql', 
});

// Define the Room model with necessary fields
const Room = sequelize.define('Room', {
  room_id: {  // Unique ID for each room
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
  },
  roomNumber: {  // Room number
      type: DataTypes.STRING(10),
      allowNull: false
  },
  roomType: {  // Type of the room 
      type: DataTypes.STRING(50),
      allowNull: false
  },
  roomTotalSlot: {  // Total number of available slots in the room
      type: DataTypes.INTEGER,
      allowNull: false
  },
  roomRemainingSlot: {  // Remaining slots in the room
      type: DataTypes.INTEGER,
      allowNull: false
  },
  floorNumber: {  // Floor number where the room is located
      type: DataTypes.INTEGER,
      allowNull: false
  },
  establishmentId: {  // ID of the establishment the room belongs to
    type: DataTypes.INTEGER,
    field: 'establishment_id',  // Use 'establishment_id' in the database
    references: {
        model: 'Establishment',  // Reference to the Establishment model
        key: 'establishment_id'  // Use the 'establishment_id' from the Establishment table
    },
    allowNull: false,
    onDelete: 'CASCADE'  // Delete room if the establishment is deleted
  }
}, { timestamps: false }); 

// Set up the relationship between Room and Establishment
Room.belongsTo(Establishment, { foreignKey: 'establishment_id' });
Establishment.hasMany(Room, { foreignKey: 'establishment_id' });

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Rooms table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Room;
