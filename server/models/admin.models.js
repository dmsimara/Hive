import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: 'localhost',
  dialect: 'mysql', // Specify MySQL as the database
});

// Define your model (schema)
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
  eName: {
    type: DataTypes.STRING,
    allowNull: false
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
}, { timestamps: true });

sequelize.sync().then(() => {
    console.log('Admin table has been created.');
}).catch(err => console.error('Error creating table:', err));

export default Admin;
 