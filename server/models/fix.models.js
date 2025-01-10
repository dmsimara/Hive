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

const Fix = sequelize.define('Fix', {
    maintenance_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    tenant_id: {
        type: Sequelize.INTEGER,
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
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    urgency: {
        type: DataTypes.ENUM(
            'urgent',
            'scheduled'
        ),
        allowNull: false
    },
    scheduledDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(
            'pending',
            'in progress',
            'completed'
        ),
        allowNull: true,
        defaultValue: 'pending'
    },
    submissionDate: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    resolvedDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    assignedPerson: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, { timestamps: false });

Fix.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Fix.belongsTo(Room, { foreignKey: 'room_id' });
Fix.belongsTo(Establishment, { foreignKey: 'establishment_id' });

sequelize.sync()
  .then(() => {
    console.log('Requests table has been updated.');
  })
  .catch(err => console.error('Error updating table:', err));

export default Fix;