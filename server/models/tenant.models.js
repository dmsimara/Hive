import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Establishment from './establishment.models.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: 'localhost',
  dialect: 'mysql', 
});

const Tenant = sequelize.define('Tenant', {
  tenant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  tenantFirstName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tenantLastName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tenantEmail: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true
  },
  tenantPassword: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('M', 'F', 'Other'),
    allowNull: false
  },
  mobileNum: {
    type: DataTypes.STRING(15)
  },
  tenantProfile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  room_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Room',
      key: 'room_id'
    },
    onDelete: 'SET NULL'
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
  stayFrom: {
    type: DataTypes.DATE,
    allowNull: true
  },
  stayTo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  periodRemaining: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('active', 'expired'),
    allowNull: false,
    defaultValue: 'active'
  },
  dateJoined: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW 
  },
  tenantGuardianName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  tenantAddress: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tenantGuardianNum: {
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, { timestamps: false });

Establishment.hasMany(Tenant, { foreignKey: 'establishment_id' });
Tenant.belongsTo(Establishment, { foreignKey: 'establishment_id' });

  
  sequelize.sync()
    .then(() => {
      console.log('Tenants table has been created.');
    })
    .catch(err => console.error('Error creating table:', err));
  
  export default Tenant;