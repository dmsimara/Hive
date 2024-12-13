import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Establishment from './establishment.models.js';
import Room from './room.models.js';

// Load environment variables for database connection
dotenv.config();

// Set up Sequelize to connect to the database using environment credentials
const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql', 
});

// Define the Tenant model with necessary fields
const Tenant = sequelize.define('Tenant', {
  tenant_id: {  // Unique ID for each tenant
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  tenantFirstName: {  // Tenant's first name
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tenantLastName: {  // Tenant's last name
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tenantEmail: {  // Tenant's email address
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true
  },
  tenantPassword: {  // Tenant's password
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gender: {  // Tenant's gender
    type: DataTypes.ENUM('M', 'F', 'Other'),
    allowNull: false
  },
  mobileNum: {  // Tenant's mobile number
    type: DataTypes.STRING(15)
  },
  tenantProfile: {  // Tenant's profile picture 
    type: DataTypes.STRING,
    allowNull: true
  },
  room_id: {  // Room the tenant is assigned to 
    type: DataTypes.INTEGER,
    references: {
      model: 'Room',  // Reference to the Room model
      key: 'room_id'  // Use the 'room_id' from the Room table
    },
    onDelete: 'SET NULL'  // Set room_id to null if the room is deleted
  },
  establishmentId: {  // ID of the establishment the tenant belongs to
    type: DataTypes.INTEGER,
    field: 'establishment_id',  // Use 'establishment_id' in the database
    references: {
      model: 'Establishment',  // Reference to the Establishment model
      key: 'establishment_id'  // Use the 'establishment_id' from the Establishment table
    },
    allowNull: false,
    onDelete: 'CASCADE'  // Delete tenant if the establishment is deleted
  },
  stayFrom: {  // Start date of the tenant's stay
    type: DataTypes.DATE,
    allowNull: true
  },
  stayTo: {  // End date of the tenant's stay
    type: DataTypes.DATE,
    allowNull: true
  },
  periodRemaining: {  // Remaining period of the tenant's stay (e.g., number of days)
    type: DataTypes.INTEGER
  },
  status: {  // Tenant's current status (active or expired)
    type: DataTypes.ENUM('active', 'expired'),
    allowNull: false,
    defaultValue: 'active'  // Default status is 'active'
  },
  dateJoined: {  // Date the tenant joined
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW  // Default to current date and time
  },
  tenantGuardianName: {  // Tenant's guardian name (optional)
    type: DataTypes.STRING(200),
    allowNull: true
  },
  tenantAddress: {  // Tenant's address (optional)
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tenantGuardianNum: {  // Tenant's guardian contact number (optional)
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, { timestamps: false });  // Disable automatic timestamp fields

// Set up the relationship between Tenant and Establishment
Establishment.hasMany(Tenant, { foreignKey: 'establishment_id' });
Tenant.belongsTo(Establishment, { foreignKey: 'establishment_id' });

// Set up the relationship between Tenant and Room
Room.hasMany(Tenant, { foreignKey: 'room_id' });
Tenant.belongsTo(Room, { foreignKey: 'room_id' });

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Tenants table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Tenant;
