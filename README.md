# jsnes-backend

Works with https://github.com/akabuda050/jsnes-web

# Install

Create folders `roms/myrom/myrom.nes` and `alphabet_list/games.json` in project folder

Put games info to `alphabet_list/games.json` like in example below:

```javascript
[
  // ...
  {
    name: "My Rom",
    description: <span>This is my own homebrew NES rom</span>,
    slug: "myrom",
  },
  {
    name: "My Rom 2",
    description: <span>This is my own homebrew NES rom 2</span>,
    slug: "myrom2",
  },
  // ...
];
```

Run `npm install`
Run `node server`
