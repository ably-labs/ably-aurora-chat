const Ably = require("ably");
const { Sequelize, Model, DataTypes } = require("sequelize");
const mysql2 = require('mysql2');
const express = require("express");
const app = express();

require('dotenv').config();

/* Aurora */
let dbName = process.env.DB_NAME;
let dbUsername = process.env.DB_USERNAME;
let dbPassword = process.env.DB_PASSWORD;
let dbHost = process.env.DB_HOST;
let dbPort = process.env.DB_PORT;

// Ably
const FROM_CLIENT_CHANNEL_NAME = "chat:from-clients";
const TO_CLIENT_CHANNEL_NAME = "chat:to-clients";

const API_KEY = process.env.ABLY_API_KEY;

const BANNED_WORDS = /(potato)|(cheese)/g;

// Use Ably to listen and send updates to users, as well as save messages to Aurora
const realtime = new Ably.Realtime({ key: API_KEY });
realtime.channels.get(FROM_CLIENT_CHANNEL_NAME).subscribe(async (msg) => {
  let filteredMsg = msg.data.replaceAll(BANNED_WORDS, (substring, offset, string) => {
    console.log(substring);
    return '*'.repeat(substring.length);
  });
  console.log(filteredMsg);
  createNewMessageInAurora(filteredMsg, FROM_CLIENT_CHANNEL_NAME);
  new Ably.Rest({ key: API_KEY, clientId: msg.clientId }).channels.get(TO_CLIENT_CHANNEL_NAME).publish(msg.name, filteredMsg);
});

/* Express */
const port = 3000;

/* Sequelize */
let sequelize;

if (dbName) {
 sequelize = new Sequelize.Sequelize(
  dbName,
  dbUsername,
  dbPassword,
  {
    dialect: 'mysql',
    dialectModule: mysql2,
    host: dbHost,
    logging: console.log,
    port: Number.parseInt(dbPort),
  }
  );
} else {
  // For testing locally
  console.log("Running DB in memory");
  sequelize = new Sequelize.Sequelize('sqlite::memory:')
}

const Message = sequelize.define('Message', {
  clientId: DataTypes.STRING,
  message: DataTypes.STRING,
  room: DataTypes.STRING
});

sequelize.sync();

async function createNewMessageInAurora(message, chatRoomName) {
  const response = await Message.create({
    clientId: message.clientId,
    message: message.data,
    room: chatRoomName
  });

  console.log(response);
};

async function getMessages() {
  let messages = await Message.findAll();
  console.log(messages.every(message => message instanceof Message));
  console.log("All messages:", JSON.stringify(messages, null, 2));
}

/* Server */
app.use(express.static('public'));


// Issue token requests to clients sending a request to the /auth endpoint
app.get("/auth", async (req, res) => {
  let tokenParams = {
    capability: { },
    clientId: uuidv4()
  };
  tokenParams.capability[`${FROM_CLIENT_CHANNEL_NAME}`] = ["publish"];
  tokenParams.capability[`${TO_CLIENT_CHANNEL_NAME}`] = ["subscribe"];

  console.log("Sending signed token request:", JSON.stringify(tokenParams));

  realtime.auth.createTokenRequest(tokenParams, (err, tokenRequest) => {
    if (err) {
      res.status(500).send(`Error requesting token: ${JSON.stringify(err)}`);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(tokenRequest));
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});

function uuidv4() {
    return "comp-" + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}