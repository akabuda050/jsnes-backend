const { uuidv4 } = require("./utils");

const StateMachine = require("./stateMachine");

class Room {
  constructor({ name }) {
    this.id = uuidv4();
    this.name = name;
    this.players = [
      {
        id: 1,
        connection: null,
      },
      {
        id: 2,
        connection: null,
      },
    ];
  }

  // This is responsible for games state and communication between clients
  initStateMachine() {
    this.stateMachine = new StateMachine(this);
    this.stateMachine.loadLists("alphabet_list"); // Load lists.
    this.stateMachine.start();
  }

  onKeyPressed(message, connection) {
    this.stateMachine.handleAction(message, connection);
  }

  onSyncVideoBuffer(message, connection) {      
    this.stateMachine.handleAction(message, connection);
  }

  onSyncAudioBuffer(message, connection) {
    this.stateMachine.handleAction(message, connection);
  }

  onSpecialKeyboardEvent(message, connection) {
    this.stateMachine.handleAction(message, connection);
  }

  joinRoom(connection) {
    if (
      this.players.find(
        (p) => p.connection && p.connection.id === connection.id
      )
    ) {
      throw new Error("You are connected already!");
    }

    const player = this.players.find(
      (p) =>
        (p.connection && p.connection.id === connection.id) ||
        p.connection === null
    );
    if (!player) {
      throw new Error("Room is full!");
    }

    this.players = this.players.map((p) => {
      if (p.id === player.id) {
        p.connection = connection;
      }

      return p;
    });

    if (this.stateMachine && connection) {
      this.stateMachine.sendRomLoadedEvent({ playerId: player.id }, connection);
    }
  }
}

module.exports = Room;
