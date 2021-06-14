const { uuidv4 } = require("./utils");

class ServerWrapper {
  constructor(server) {
    this.server = server;
  }

  initRooms(rooms) {
    this.server.rooms = rooms;
  }

  init(rooms) {
    this.initRooms(rooms);
    this.setupConnection();
  }

  setupConnection() {
    this.server.on("connection", (connection) => {
      connection.id = uuidv4();

      // Allow clients to broadcast all other(including self).
      connection.broadcastAll = this.broadcastAll.bind(this);

      // Continuously updated info about rooms.
      //this.startRoomsListUpdate();

      this.sendConnectionMeesage(connection)

      // Rooms are responsible for messages.
      connection.on("message", (message) => {
        try {
          this.server.rooms.handleMeesage(message, connection);
        } catch (e) {
          if (connection) {
            let event = {
              event: "error",
              data: {
                error: e.message,
              },
            };

            connection.send(JSON.stringify(event));
          }
        }
      });

      // Rooms are responsible for handling clients close.
      connection.on("close", () => {
        try {
          this.server.rooms.handleClose(connection);
        } catch (e) {
          if (connection) {
            let event = {
              event: "error",
              data: {
                error: e.message,
              },
            };

            connection.send(JSON.stringify(event));
          }
        }
      });

      // Rooms are responsible for handling any errors.
      connection.on("error", () => {
        try {
          this.server.rooms.handleError(connection);
        } catch (e) {
          if (connection) {
            let event = {
              event: "error",
              data: {
                error: e.message,
              },
            };

            connection.send(JSON.stringify(event));
          }
        }
      });
    });
  }

  broadcastAll(data) {
    this.server.clients.forEach((client) => {
      client.send(data);
    });
  }

  startRoomsListUpdate() {
    setInterval(() => {
      const rooms = this.server.rooms
        .list()
        .map((r) => ({ id: r.id, name: r.name }));

      const event = {
        event: "roomsList",
        data: {
          rooms,
        },
      };
      this.broadcastAll(JSON.stringify(event));
    }, 5000);
  }

  sendConnectionMeesage(connection) {
    try {
      connection.send(
        JSON.stringify({
          event: "connected",
          data: {
            id: connection.id,
            rooms: this.server.rooms
              .list()
              .map((r) => ({ id: r.id, name: r.name })),
          },
        })
      );
    } catch (e) {
      console.log({ e, connection });
    }
  }
}

module.exports = ServerWrapper;
