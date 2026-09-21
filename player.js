// player.js
// Lightweight audio playback module using Node's child_process.spawn.
// Automatically detects and uses 'mpv' or 'ffplay' with volume and error handling.

const { spawn, execSync } = require('child_process');

let currentProcess = null;
let detectedPlayer;

// Check once whether mpv or ffplay is installed on the system
function getPlayer() {
  if (detectedPlayer !== undefined) return detectedPlayer;

  try {
    execSync('which mpv', { stdio: 'ignore' });
    detectedPlayer = 'mpv';
    return detectedPlayer;
  } catch {}

  try {
    execSync('which ffplay', { stdio: 'ignore' });
    detectedPlayer = 'ffplay';
    return detectedPlayer;
  } catch {}

  detectedPlayer = null;
  return null;
}

// Stop any currently running audio playback process
function stopStream() {
  if (currentProcess) {
    try {
      currentProcess.kill('SIGTERM');
    } catch {}
    currentProcess = null;
  }
}

// Play an audio stream URL with optional volume (0-100) and error callback
function playStream(url, options = {}, onError) {
  // Support calling playStream(url, onError) directly
  if (typeof options === 'function') {
    onError = options;
    options = {};
  }

  // Stop any active stream before starting a new one
  stopStream();

  if (!url) {
    return null;
  }

  const player = getPlayer();
  if (!player) {
    const err = new Error('No audio player found. Please install mpv or ffmpeg/ffplay.');
    if (typeof onError === 'function') {
      onError(err);
    } else {
      console.error(err.message);
    }
    return null;
  }

  // Clamp volume between 0 and 100 (default: 100)
  const volume = typeof options.volume === 'number'
    ? Math.max(0, Math.min(100, Math.round(options.volume)))
    : 100;

  // Build command-line arguments based on detected player
  const args = player === 'mpv'
    ? ['--no-video', `--volume=${volume}`, url]
    : ['-nodisp', '-autoexit', '-loglevel', 'error', '-volume', String(volume), url];

  // Spawn the audio player process
  const proc = spawn(player, args, {
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  currentProcess = proc;

  // Capture error output from stderr
  let stderr = '';
  if (proc.stderr) {
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
  }

  // Handle spawn failure
  proc.on('error', (err) => {
    if (proc === currentProcess) {
      currentProcess = null;
    }
    if (typeof onError === 'function') {
      onError(err);
    } else {
      console.error(`Playback error: ${err.message}`);
    }
  });

  // Handle unexpected exit
  proc.on('exit', (code, signal) => {
    if (proc === currentProcess) {
      currentProcess = null;
    }
    // Only report error if exit was not triggered by manual stop/kill
    if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGKILL') {
      const err = new Error(stderr.trim() || `Player exited with code ${code}`);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  });

  return proc;
}

// Attach stopStream to playStream for easy access
playStream.stop = stopStream;

module.exports = playStream;
