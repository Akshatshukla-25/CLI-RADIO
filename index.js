#!/usr/bin/env node

// index.js
// Interactive CLI menu for CLI Radio with full playback and volume controls.
// Uses Node's built-in 'readline' module (zero external dependencies).

const readline = require('readline');
const stations = require('./stations');
const playStream = require('./player');

// Playback state variables
let currentIndex = -1;       // Index of currently selected station (-1 if none)
let isPlaying = false;       // True if audio is actively playing
let isPaused = false;        // True if audio was paused
let volume = 80;             // Default volume (0 - 100)
let isMuted = false;         // Mute toggle flag
let previousVolume = 80;     // Stored volume before muting
let isExiting = false;       // Guard against duplicate cleanup on exit

// Initialize readline interface for terminal input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper: get the effective volume level (0 if muted)
function getEffectiveVolume() {
  return isMuted ? 0 : volume;
}

// Helper: get active stream URL from a station object (supports both 'url' and 'streamUrl')
function getStationUrl(station) {
  return station.url || station.streamUrl;
}

// Start playing a station by index
function playStation(index) {
  if (index < 0 || index >= stations.length) return;

  currentIndex = index;
  const station = stations[currentIndex];
  const url = getStationUrl(station);

  isPlaying = true;
  isPaused = false;

  console.log(`\nConnecting to: ${station.name} [${station.genre}]...`);

  playStream(url, { volume: getEffectiveVolume() }, (err) => {
    console.error(`\nStream Error (${station.name}): ${err.message || 'Unable to connect to stream'}`);
    if (currentIndex === index) {
      isPlaying = false;
      isPaused = false;
    }
    displayMenu();
    promptUser();
  });

  displayMenu();
  promptUser();
}

// Display the terminal menu and current playback controls
function displayMenu() {
  console.log('\n========================================');
  console.log('               CLI RADIO                ');
  console.log('========================================');

  // List all available radio stations
  if (stations.length === 0) {
    console.log('  No stations available.');
  } else {
    stations.forEach((station, idx) => {
      const activeMarker = (idx === currentIndex && isPlaying) ? '▶ ' : '  ';
      console.log(`${activeMarker}${idx + 1}. ${station.name} [${station.genre}]`);
    });
  }

  console.log('----------------------------------------');

  // Status & volume display
  const currentStation = stations[currentIndex];
  if (isPlaying && currentStation) {
    console.log(`Now Playing : ${currentStation.name} [${currentStation.genre}]`);
  } else if (isPaused && currentStation) {
    console.log(`Status      : Paused (${currentStation.name})`);
  } else {
    console.log('Status      : Stopped');
  }

  const volumeDisplay = isMuted ? 'MUTED (0%)' : `${volume}%`;
  console.log(`Volume      : ${volumeDisplay}`);
  console.log('----------------------------------------');

  // Available controls
  console.log('Controls:');
  console.log('  [1-' + stations.length + '] Play station     [s] Stop playback');
  console.log('  [p]   Pause / Resume   [n] Next station');
  console.log('  [b]   Previous station [m] Mute / Unmute');
  console.log('  [+]   Volume up (+10%) [-] Volume down (-10%)');
  console.log('  [v N] Set volume (0-100, e.g. "v 75")');
  console.log('  [q]   Quit application');
}

// Prompt the user for input
function promptUser() {
  rl.question('\nEnter command: ', handleInput);
}

// Handle user terminal input
function handleInput(rawInput) {
  const input = (rawInput || '').trim();
  const lower = input.toLowerCase();

  // Quit application
  if (lower === 'q' || lower === 'quit' || lower === 'exit') {
    cleanupAndExit();
    return;
  }

  // Stop playback
  if (lower === 's' || lower === 'stop') {
    if (isPlaying || isPaused) {
      playStream.stop();
      isPlaying = false;
      isPaused = false;
      console.log('\nPlayback stopped.');
    } else {
      console.log('\nNo station is currently playing.');
    }
    displayMenu();
    promptUser();
    return;
  }

  // Pause / Resume playback
  if (lower === 'p' || lower === 'pause') {
    if (isPlaying) {
      playStream.stop();
      isPlaying = false;
      isPaused = true;
      console.log('\nPlayback paused.');
    } else if (isPaused && currentIndex >= 0) {
      // Resume current station
      playStation(currentIndex);
      return;
    } else {
      console.log('\nNo station to pause or resume.');
    }
    displayMenu();
    promptUser();
    return;
  }

  // Next station
  if (lower === 'n' || lower === 'next') {
    if (stations.length === 0) return;
    const nextIndex = (currentIndex + 1) % stations.length;
    playStation(nextIndex);
    return;
  }

  // Previous station
  if (lower === 'b' || lower === 'prev' || lower === 'back') {
    if (stations.length === 0) return;
    const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
    playStation(prevIndex);
    return;
  }

  // Volume Up (+10%)
  if (lower === '+' || lower === 'vol+' || lower === 'up') {
    if (isMuted) isMuted = false;
    volume = Math.min(100, volume + 10);
    console.log(`\nVolume increased to ${volume}%.`);
    applyVolumeChange();
    return;
  }

  // Volume Down (-10%)
  if (lower === '-' || lower === 'vol-' || lower === 'down') {
    if (isMuted) isMuted = false;
    volume = Math.max(0, volume - 10);
    console.log(`\nVolume decreased to ${volume}%.`);
    applyVolumeChange();
    return;
  }

  // Mute / Unmute toggle
  if (lower === 'm' || lower === 'mute') {
    if (isMuted) {
      isMuted = false;
      volume = previousVolume || 80;
      console.log(`\nUnmuted. Volume restored to ${volume}%.`);
    } else {
      previousVolume = volume;
      isMuted = true;
      console.log('\nMuted.');
    }
    applyVolumeChange();
    return;
  }

  // Set Volume directly (e.g., "v 50" or "volume 50")
  if (lower.startsWith('v ') || lower.startsWith('vol ') || lower.startsWith('volume ')) {
    const parts = lower.split(/\s+/);
    const target = parseInt(parts[1], 10);
    if (!isNaN(target) && target >= 0 && target <= 100) {
      isMuted = false;
      volume = target;
      console.log(`\nVolume set to ${volume}%.`);
      applyVolumeChange();
      return;
    } else {
      console.log('\nInvalid volume level. Please enter a value between 0 and 100.');
      displayMenu();
      promptUser();
      return;
    }
  }

  // Numeric selection (1 - N)
  const selectedIndex = parseInt(input, 10) - 1;
  if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < stations.length) {
    playStation(selectedIndex);
    return;
  }

  // Invalid input fallback
  console.log('\nUnknown command. Type a station number, volume control (+/-), "s" to stop, or "q" to quit.');
  displayMenu();
  promptUser();
}

// Re-apply volume to the running stream if currently playing
function applyVolumeChange() {
  if (isPlaying && currentIndex >= 0) {
    const station = stations[currentIndex];
    const url = getStationUrl(station);
    playStream(url, { volume: getEffectiveVolume() }, (err) => {
      console.error(`\nStream Error: ${err.message}`);
    });
  }
  displayMenu();
  promptUser();
}

// Clean up child process and exit gracefully
function cleanupAndExit() {
  if (isExiting) return;
  isExiting = true;

  playStream.stop();
  rl.close();
  console.log('\nExiting CLI Radio. Goodbye!\n');
  process.exit(0);
}

// Listen for process termination signals
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
rl.on('close', cleanupAndExit);

// Start the CLI application
displayMenu();
promptUser();
