import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Establishment from './establishment.models.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: 'localhost',
  dialect: 'mysql', 
});

const Room = sequelize.define('Room', {
  room_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
  },
  roomNumber: {
      type: DataTypes.STRING(10),
      allowNull: false
  },
  roomType: {
      type: DataTypes.STRING(50),
      allowNull: false
  },
  roomTotalSlot: {
      type: DataTypes.INTEGER,
      allowNull: false
  },
  roomRemainingSlot: {
      type: DataTypes.INTEGER,
      allowNull: false
  },
  floorNumber: {
      type: DataTypes.INTEGER,
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
    onDelete: 'CASCADE'
  }
}, { timestamps: false });

Room.belongsTo(Establishment, { foreignKey: 'establishment_id' });
Establishment.hasMany(Room, { foreignKey: 'establishment_id' });
  
  sequelize.sync()
    .then(() => {
      console.log('Rooms table has been created.');
    })
    .catch(err => console.error('Error creating table:', err));
  
  export default Room;