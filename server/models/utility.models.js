import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Tenant from './tenant.models.js';
import Establishment from './establishment.models.js';
import Room from './room.models.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql',
});

const Utility = sequelize.define('Utility', {
  utility_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Room,
      key: 'room_id',
    },
    onDelete: 'CASCADE',
  },
  establishment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Establishment,
      key: 'establishment_id',
    },
    onDelete: 'CASCADE',
  },
  utilityType: {
    type: DataTypes.ENUM(
      'unit rental',
      'electricity consumption',
      'water usage',
      'internet connection',
      'maintenance fees',
      'dorm amenities'
    ),
    allowNull: false,
  },
  charge: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  statementDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'overdue', 'partial', 'cancelled'),
    allowNull: false,
    defaultValue: 'unpaid',
  },
  perTenant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  month: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  totalBalance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  sharedBalance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, { timestamps: false });

// Correctly set up associations
Room.hasMany(Utility, { foreignKey: 'room_id' });
Utility.belongsTo(Room, { foreignKey: 'room_id' });

Establishment.hasMany(Utility, { foreignKey: 'establishment_id' });
Utility.belongsTo(Establishment, { foreignKey: 'establishment_id' });

sequelize.sync()
  .then(() => {
    console.log('Utilities table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Utility;
