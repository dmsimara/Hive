import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Tenant from './tenant.models.js';
import Room from './room.models.js';
import Establishment from './establishment.models.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql', 
});

const Request = sequelize.define('Request', {
    request_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    tenant_id: {
        type: DataTypes.INTEGER,
        field: 'tenant_id',
        allowNull: false,
        references: {
            model: Tenant,
            key: 'tenant_id'
        },
        onDelete: 'CASCADE'
    },
    room_id: {
        type: DataTypes.INTEGER,
        field: 'room_id',
        allowNull: false,
        references: {
            model: Room,
            key: 'room_id'
        },
        onDelete: 'CASCADE'
    },
    visitorName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contactInfo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    purpose: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    visitDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM(
            'pending',
            'approved',
            'rejected',
            'cancelled'
        ),
        allowNull: false,
        defaultValue: 'pending'
    },
    adminComments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    requestDate: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
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

Request.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Request.belongsTo(Room, { foreignKey: 'room_id' });
Request.belongsTo(Establishment, { foreignKey: 'establishment_id' });

sequelize.sync()
  .then(() => {
    console.log('Requests table has been created.');
  })
  .catch(err => console.error('Error creating table:', err));

export default Request;
