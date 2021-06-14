const { resolve, join } = require("path");
const fs = require("fs");
const WebSocket = require("ws");

class StateMachine {
  constructor(room) {
    this.room = room;

    this.currentList = [];
    this.listContent = [];
    this.currentListItem = null;
  }

  start() {
    this.setCurrentList();

    this.room.players.map((p) => {
      if (p.connection && p.connection.readyState === WebSocket.OPEN) {
        this.sendRomLoadedEvent({ playerId: p.id }, p.connection);
      }
    });
  }

  sendRomLoadedEvent({ playerId }, connection) {
    connection.send(
      JSON.stringify({
        event: "romLoaded",
        data: {
          romData: this.romData,
          romName: this.currentListItem.slug,
          playerId: playerId,
          roomId: this.room.id,
        },
      })
    );
  }

  handleAction({ eventListener, data }, connection) {
    if (typeof this[eventListener] === "function") {
      this[eventListener](data, connection);
    }
  }

  onKeyPressed(data, connection) {
    this.room.players.forEach((p) => {
      if (
        p.connection &&
        p.connection.id !== connection.id &&
        p.connection.readyState === WebSocket.OPEN
      ) {
        // console.log('sending player two key press')
        p.connection.send(
          JSON.stringify({
            event: "playerTwoPressKey",
            data: {
              direction: data.direction,
              key: data.key,
            },
          })
        );
      }
    });
  }

  onSyncVideoBuffer(data, connection) {
    this.room.players.forEach((p) => {
      if (
        p.connection &&
        p.connection.id !== connection.id &&
        p.connection.readyState === WebSocket.OPEN
      ) {
       // console.log("syncVideoBuffer");
        // console.log('sending video')
        p.connection.send(
          JSON.stringify({
            event: "syncVideoBuffer",
            data: {
              buffer: data.buffer,
            },
          })
        );
      }
    });
  }

  onSyncAudioBuffer(data, connection) {
    this.room.players.forEach((p) => {
      if (
        p.connection &&
        p.connection.id !== connection.id &&
        p.connection.readyState === WebSocket.OPEN
      ) {
        //console.log('sending audio')
        p.connection.send(
          JSON.stringify({
            event: "syncAudioBuffer",
            data: {
              buffer: data.buffer,
            },
          })
        );
      }
    });
  }

  onSpecialKeyboardEvent(data, connection) {
    console.log("specialKeyboardEvent");

    switch (data.keyPressed) {
      case "Insert":
        this.saveScreenshot({ imageData: data.imageData }, connection);
        break;
      case "Delete":
        this.setCurrentListItemStatus({ processed: true, corrupt: true });
        this.setCurrentList();
        break;
      case "End":
        this.setCurrentListItemStatus({ processed: true, corrupt: false });
        this.setCurrentList();
        break;
      case "Home":
        break;
    }

    this.room.players.forEach((p) => {
      if (p.connection) {
        this.sendRomLoadedEvent({ playerId: p.id }, p.connection);
      }
    });
  }

  saveScreenshot({ imageData }, connection) {
    console.log("image saved");
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    if (!fs.existsSync(resolve(`./images/`))) {
      fs.mkdirSync(resolve(`./images/`), { recursive: true });
    }
    fs.writeFileSync(
      resolve(`./images/${Date.now()}_${this.currentListItem.slug}.png`),
      base64Data,
      "base64"
    );
  }

  loadLists(path) {
    this.path = resolve(path);
    this.lists = fs
      .readdirSync(path)
      .map((l) => ({ path: join(path, l), processed: false }));
  }

  setCurrentList() {
    this.currentList = this.lists.find((l) => !l.processed);
    if (this.currentList) {
      if (!this.listContent.length) {
        this.listContent = JSON.parse(fs.readFileSync(this.currentList.path));
      }

      this.setCurrentListItem();
    }
  }

  markCurrentListAsProcessed() {
    console.log("markCurrentListAsProcessed");
    this.lists = this.lists.map((l) => {
      if (l.path === this.currentList.path) {
        l.processed = true;
      }
      return l;
    });

    this.currentList = [];
    this.listContent = [];
    this.currentListItem = null;
  }

  setCurrentListItem() {
    console.log("setCurrentListItem");
    if (this.currentList && this.listContent.length) {
      this.currentListItem = this.listContent.find(
        (lci) => !lci.processed && !lci.corrupt
      );
      if (!this.currentListItem) {
        this.markCurrentListAsProcessed();
        this.setCurrentList();
      }

      if (this.currentListItem) {
        try {
          this.romData = fs.readFileSync(
            `./roms/${this.currentListItem.slug}/${this.currentListItem.slug}.nes`,
            {
              encoding: "binary",
            }
          );
        } catch (e) {
          this.romData = null;
          this.setCurrentListItemStatus({ processed: true, corrupt: true });
          this.setCurrentListItem();
          console.log(e);
        }
      }
    }
  }

  setCurrentListItemStatus({ processed, corrupt }) {
    console.log("setCurrentListItemStatus");
    this.listContent = this.listContent.map((lci) => {
      if (lci.slug === this.currentListItem.slug) {
        lci = { ...lci, ...{ processed, corrupt } };
      }
      return lci;
    });
  }
}

module.exports = StateMachine;
