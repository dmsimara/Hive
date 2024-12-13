import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql', 
});

const Establishment = sequelize.define('Establishment', {
    establishment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    eName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, { timestamps: false });

  sequelize.sync()
    .then(() => {
      console.log('Establishments table has been created.');
    })
    .catch(err => console.error('Error creating table:', err));
  
  export default Establishment;
