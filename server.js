String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
const WebSocket = require("ws");
const Rooms = require("./rooms");
const ServerWrapper = require("./serverWrapper");

const serverWrapper = new ServerWrapper(new WebSocket.Server({ port: 9000 }));
serverWrapper.init(new Rooms());
