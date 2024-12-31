import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Tenant from './tenant.models.js';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
  }
);

const History = sequelize.define(
  'History',
  {
    history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Tenant,
        key: 'tenant_id',
      },
      onDelete: 'CASCADE',
    },
    actionType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actionDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    timestamps: true,  
  }
);

Tenant.hasMany(History, { foreignKey: 'tenant_id' });
History.belongsTo(Tenant, { foreignKey: 'tenant_id' });

sequelize
  .sync()
  .then(() => {
    console.log('Histories table has been created');
  })
  .catch((err) => console.error('Error creating table:', err));

export default History;
