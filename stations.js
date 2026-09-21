// stations.js
// List of verified internet radio stations with genres and direct stream URLs.
// Both 'url' and 'streamUrl' are provided for flexibility across modules.

const stations = [
  {
    name: "Lofi Study",
    genre: "lofi",
    url: "https://stream.laut.fm/lofi",
    streamUrl: "https://stream.laut.fm/lofi"
  },
  {
    name: "Lofi Radio",
    genre: "lofi",
    url: "https://stream.laut.fm/lofi-radio",
    streamUrl: "https://stream.laut.fm/lofi-radio"
  },
  {
    name: "FluxFM ChillHop",
    genre: "chillhop",
    // Cleaned up trailing path typo from original URL
    url: "https://streams.fluxfm.de/Chillhop/mp3-128/",
    streamUrl: "https://streams.fluxfm.de/Chillhop/mp3-128/"
  },
  {
    name: "Chillsynth FM",
    genre: "synthwave",
    url: "https://stream.nightride.fm/chillsynth.mp3",
    streamUrl: "https://stream.nightride.fm/chillsynth.mp3"
  },
  {
    name: "SomaFM Groove Salad",
    genre: "ambient",
    // Replaced inactive ice5 server with stable official ice.somafm.com endpoint
    url: "https://ice.somafm.com/groovesalad",
    streamUrl: "https://ice.somafm.com/groovesalad"
  },
  {
    name: "Radio Paradise Mellow",
    genre: "mellow",
    url: "https://stream.radioparadise.com/mellow-flac",
    streamUrl: "https://stream.radioparadise.com/mellow-flac"
  }
];

module.exports = stations;
