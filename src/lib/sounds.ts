import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@/store/settings';

/**
 * ガチャの効果音。haptics と同じく「呼ぶだけ」のAPIにして、
 * 再生の可否 (設定・読み込み失敗) はこのモジュール内で吸収する。
 */

const sources = {
  /** ハンドル回転の「ガリガリ」 */
  spin: require('@/assets/sounds/gacha-spin.wav'),
  /** カプセル落下の「コトン」 */
  drop: require('@/assets/sounds/capsule-drop.wav'),
  /** 開封の「ポンッ」 */
  pop: require('@/assets/sounds/capsule-pop.wav'),
  /** 超レアの「キラーン」 */
  sparkle: require('@/assets/sounds/super-rare-sparkle.wav'),
} as const;

type SoundName = keyof typeof sources;

const players = new Map<SoundName, AudioPlayer>();
let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  audioModeReady = true;
  try {
    // マナーモードでも短い効果音は鳴らしたい。他アプリのBGMは止めない
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
  } catch {
    // 効果音は必須機能ではないので、失敗してもアプリは続行する
  }
}

function play(name: SoundName) {
  if (!useSettingsStore.getState().soundEnabled) return;
  try {
    void ensureAudioMode();
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(sources[name]);
      players.set(name, player);
    }
    void player.seekTo(0);
    player.play();
  } catch {
    // 音が出ないだけで壊さない
  }
}

export const sounds = {
  spin: () => play('spin'),
  drop: () => play('drop'),
  pop: () => play('pop'),
  sparkle: () => play('sparkle'),
};
