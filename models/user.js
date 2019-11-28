'use strict';
const Sequelize = require('sequelize');
const moment = require('moment');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '"First Name" is required'
        }
      }
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '"LastName" is required'
        }
      }
    },
    emailAddress: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '"Email Address" is required'
        }
      },
      unique: {
      args: true,
      msg: 'Email address already in use!'
  }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '"Password" is required'
        }
      }
    },
}, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
      foreignKey: 'userId',
        allowNull: false,
    });

    User.belongsToMany(models.Course, {
      through: 'users',
      foreignKey: 'userId',
    });
  };

  return User;
};
