import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { MessageRotator } from './MessageRotator.js';
import { KeyboardController } from './KeyboardController.js';
import { loadMessages } from './MessageParser.js';
import { MESSAGES } from './constants.js';

document.addEventListener('DOMContentLoaded', async () => {
  const boardContainer = document.getElementById('board-container');
  const soundEngine = new SoundEngine();
  const board = new Board(boardContainer, soundEngine);
  const messages = await loadMessages('messages.md', MESSAGES);
  const rotator = new MessageRotator(board, messages);
  const keyboard = new KeyboardController(rotator, soundEngine);

  // Initialize audio on first user interaction (browser autoplay policy)
  let audioInitialized = false;
  const initAudio = async () => {
    if (audioInitialized) return;
    audioInitialized = true;
    await soundEngine.init();
    soundEngine.resume();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  // Start message rotation
  rotator.start();

  // Resize tiles when entering/exiting fullscreen
  const boardEl = document.querySelector('.board');
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      boardEl.style.setProperty('--tile-size', 'clamp(32px, 10vmin, 82px)');
    } else {
      boardEl.style.removeProperty('--tile-size');
    }
  });

});
