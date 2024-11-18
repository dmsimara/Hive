import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Establishment from './establishment.models.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: 'localhost',
  dialect: 'mysql', 
});

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
    onDelete: 'CASCADE'
  },
  adminProfile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
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
}, { timestamps: false });

Establishment.hasMany(Admin, { foreignKey: 'establishment_id' });
Admin.belongsTo(Establishment, { foreignKey: 'establishment_id' });

sequelize.sync().then(() => {
    console.log('Admin table has been created.');
}).catch(err => console.error('Error creating table:', err));

export default Admin;
 