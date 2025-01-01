import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import Admin from './admin.models.js';

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

const Activity = sequelize.define(
  'Activity',
  {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Admin,
        key: 'admin_id',
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

Admin.hasMany(Activity, { foreignKey: 'admin_id' });
Activity.belongsTo(Admin, { foreignKey: 'admin_id' });

sequelize
  .sync()
  .then(() => {
    console.log('Activities table has been created');
  })
  .catch((err) => console.error('Error creating table:', err));

export default Activity;
