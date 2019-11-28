'use strict';
const Sequelize = require('sequelize');
const moment = require('moment');


module.exports = (sequelize) => {
  class Course extends Sequelize.Model {}
  Course.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '"Title" is required'
        }
      }
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '"Description" is required'
        }
      }
    },
    estimatedTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    materialsNeeded: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, { sequelize });

    Course.associate = (models) => {
      Course.belongsTo(models.User, {
         foreignKey: {
           fieldName: 'userId',
           allowNull: false
         }
       });

     Course.belongsToMany(models.User, {
        through: 'user',
        foreignKey: 'userId',
    });
  };
  return Course;

};
