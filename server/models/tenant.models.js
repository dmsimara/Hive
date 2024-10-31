import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

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
    room_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Room', // References the Room model
        key: 'room_id'
      },
      onDelete: 'SET NULL'
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
      defaultValue: 'active', 
    }
  }, { timestamps: false });
  
  sequelize.sync()
    .then(() => {
      console.log('Tenants table has been created.');
    })
    .catch(err => console.error('Error creating table:', err));
  
  export default Tenant;