// import cron from "node-cron";
// import { Sequelize } from 'sequelize';
// import Room from '../models/room.models.js';

// // Reset visitor limits logic
// export const resetVisitorLimits = async () => {
//   try {
//     console.log('Resetting visitor limits...');
//     await Room.update(
//       { visitorLimit: Sequelize.col('originalVisitorLimit') },
//       { where: {} }
//     );
//     console.log('Visitor limits reset to original values.');
//   } catch (error) {
//     console.error('Error resetting visitor limits:', error);
//   }
// };

// cron.schedule('0 0 * * *', resetVisitorLimits);

import cron from "node-cron";
import { Sequelize } from "sequelize";
import Room from "../models/room.models.js";
import Request from "../models/request.models.js"; 

export const resetVisitorLimits = async () => {
  try {
    console.log("Resetting visitor limits...");

    const roomsWithOvernightVisitors = await Request.findAll({
      attributes: ["room_id"],
      where: {
        checkin: true,
        visitType: "overnight", 
      },
      group: ["room_id"],
    });

    const roomIdsToExclude = roomsWithOvernightVisitors.map(
      (request) => request.room_id
    );

    await Room.update(
      { visitorLimit: Sequelize.col("originalVisitorLimit") },
      {
        where: {
          room_id: {
            [Sequelize.Op.notIn]: roomIdsToExclude,
          },
        },
      }
    );

    console.log("Visitor limits reset to original values (excluding overnight visitors).");
  } catch (error) {
    console.error("Error resetting visitor limits:", error);
  }
};

cron.schedule("0 0 * * *", resetVisitorLimits);
