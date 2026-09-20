#!/usr/bin/env node

const readline = require('readline');
const stations = require('./stations');
const playStream = require('./player');

let currentStation = null;
let isExiting = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function displayMenu() {
  console.log('\n==============================');
  console.log('         CLI RADIO            ');
  console.log('==============================');

  if (stations.length === 0) {
    console.log('No stations available.');
  } else {
    stations.forEach((station, index) => {
      console.log(`  ${index + 1}. ${station.name} [${station.genre}]`);
    });
  }

  console.log('------------------------------');
  if (currentStation) {
    console.log(`Now Playing: ${currentStation.name} [${currentStation.genre}]`);
  } else {
    console.log('Status: Stopped');
  }
  console.log('------------------------------');
  console.log('Options: [1-' + stations.length + '] Play | [s] Stop | [q] Quit');
}

function promptUser() {
  rl.question('\nEnter selection: ', handleInput);
}

function handleInput(rawInput) {
  const input = (rawInput || '').trim().toLowerCase();

  if (input === 'q' || input === 'quit' || input === 'exit') {
    cleanupAndExit();
    return;
  }

  if (input === 's' || input === 'stop') {
    if (currentStation) {
      playStream.stop();
      currentStation = null;
      console.log('\nPlayback stopped.');
    } else {
      console.log('\nNo station is currently playing.');
    }
    displayMenu();
    promptUser();
    return;
  }

  const selectedIndex = parseInt(input, 10) - 1;
  if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < stations.length) {
    const station = stations[selectedIndex];
    currentStation = station;
    console.log(`\nConnecting to: ${station.name} [${station.genre}]...`);

    playStream(station.streamUrl, (err) => {
      console.error(`\nStream Error (${station.name}): ${err.message || 'Unable to connect to stream'}`);
      if (currentStation === station) {
        currentStation = null;
      }
      displayMenu();
      promptUser();
    });

    displayMenu();
    promptUser();
    return;
  }

  console.log('\nInvalid selection. Please enter a valid station number, "s" to stop, or "q" to quit.');
  displayMenu();
  promptUser();
}

function cleanupAndExit() {
  if (isExiting) return;
  isExiting = true;

  playStream.stop();
  rl.close();
  console.log('\nExiting CLI Radio. Goodbye!\n');
  process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
rl.on('close', cleanupAndExit);

// Start application
displayMenu();
promptUser();
