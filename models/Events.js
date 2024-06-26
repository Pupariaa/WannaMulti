const { DataTypes } = require('sequelize');
const{db_wannamulti, db_bellafiora} = require('../sequelize')
const events = db_wannamulti.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    player_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    tags: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    discord_userid: {
        type: DataTypes.STRING(128),
        allowNull: true,
        defaultValue: null
    },
    date_ts: {
        type: DataTypes.STRING(128),
        allowNull: true,
        defaultValue: null
    },
    hours: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    gamemode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    gamename: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    rolename: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    participants: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
}, {
    tableName: 'events',
    timestamps: false,
    freezeTableName: true
});

const clients = db_bellafiora.define('clients', {
    client_id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        autoIncrement: true
    },
    osu_token: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'client',
    timestamps: false,
    freezeTableName: true
});
const osuLink = db_wannamulti.define('osulink', {
    discord_id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        autoIncrement: true
    },
    osu_username: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    osu_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    }, 
    date: {
        type: DataTypes.STRING(128),
        allowNull: true,
        defaultValue: null
    },
    wait: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },

}, {
    tableName: 'osulink',
    timestamps: false,
    freezeTableName: true
});

module.exports = {events, clients, osuLink} 