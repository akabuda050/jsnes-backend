const Room = require("./room");

class Rooms {
  constructor() {
    this.rooms = [];
  }

  handleMeesage(message, connection) {
    if (typeof message === "string") {
      const { event, data } = JSON.parse(message);
      const eventListener = `on${
        event.charAt(0).toUpperCase() + event.slice(1)
      }`;

      if (typeof this[eventListener] === "function") {
        this[eventListener](data, connection);
      }

      // Also call event if it exists in room.
      this.rooms.forEach((r) => {
        if (
          data.room &&
          data.room.id === r.id &&
          typeof r[eventListener] === "function"
        ) {
          r[eventListener]({ eventListener, data }, connection);
        }
      });
    }
  }

  handleClose(connection) {
   this.onDisconnect(connection)
  }

  handleError(connection) {
    console.log("error");
  }

  onCreateRoom({ name }, connection) {
    if (this.rooms.find((r) => r.name === name)) {
      throw new Error(`Room with name ${name} is exists!`);
    }
    const room = new Room({ name });
    // Init Games State Machine
    room.initStateMachine();
    room.joinRoom(connection);

    this.rooms = [...this.rooms, room];
  }

  onJoinRoom({ id }, connection) {
    this.isRoomExists({ id });

    this.rooms = this.rooms.map((r) => {
      if (r.id === id) {
        r.joinRoom(connection);
      }
      return r;
    });
  }

  onDisconnect(connection) {
    console.log({
      status: "disconnected",
      id: connection.id,
    });
    this.rooms = this.rooms.map((r) => {
      r.players = r.players.map((p) => {
        if (p.connection && p.connection.id === connection.id) {
          p.connection = null;
        }
        return p;
      });

      return r;
    });
  }

  isRoomExists({ id }) {
    if (!this.rooms.find((r) => r.id === id)) {
      throw new Error("Room not found!");
    }
  }

  list() {
    return this.rooms;
  }
}

module.exports = Rooms;
