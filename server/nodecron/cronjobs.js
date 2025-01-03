import cron from "node-cron";
import { Sequelize } from 'sequelize';
import Room from '../models/room.models.js';

// Reset visitor limits logic
export const resetVisitorLimits = async () => {
  try {
    console.log('Resetting visitor limits...');
    await Room.update(
      { visitorLimit: Sequelize.col('originalVisitorLimit') },
      { where: {} }
    );
    console.log('Visitor limits reset to original values.');
  } catch (error) {
    console.error('Error resetting visitor limits:', error);
  }
};

// Schedule the cron job to run at midnight every day
cron.schedule('0 0 * * *', resetVisitorLimits);
