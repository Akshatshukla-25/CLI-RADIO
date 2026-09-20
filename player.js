const { spawn, execSync } = require('child_process');

let currentProcess = null;
let detectedPlayer;

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

function stopStream() {
  if (currentProcess) {
    try {
      currentProcess.kill('SIGTERM');
    } catch {}
    currentProcess = null;
  }
}

function playStream(url, onError) {
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

  const args = player === 'mpv'
    ? ['--no-video', url]
    : ['-nodisp', '-autoexit', '-loglevel', 'error', url];

  const proc = spawn(player, args, {
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  currentProcess = proc;

  let stderr = '';
  if (proc.stderr) {
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
  }

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

  proc.on('exit', (code, signal) => {
    if (proc === currentProcess) {
      currentProcess = null;
    }
    if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGKILL') {
      const err = new Error(stderr.trim() || `Player exited with code ${code}`);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  });

  return proc;
}

playStream.stop = stopStream;

module.exports = playStream;
