let alarmAudio = null;
let beepInterval = null;
let audioContext = null;

const startBeepLoop = () => {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(audioContext.currentTime + 0.25);
    };
    playBeep();
    beepInterval = setInterval(playBeep, 700);
  } catch {
    /* silent fallback */
  }
};

export const playAlarmSound = () => {
  stopAlarmSound();
  alarmAudio = new Audio('/alarm.mp3');
  alarmAudio.loop = true;
  alarmAudio.play().catch(() => startBeepLoop());
};

export const stopAlarmSound = () => {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmAudio = null;
  }
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
};
