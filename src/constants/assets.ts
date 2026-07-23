export const AppImages = {
  launchTitle: require('@/assets/images/brand/moji-gacha-launch-logo-v1.png'),
  splashIcon: require('@/assets/images/splash-icon.png'),
  logoGlow: require('@/assets/images/logo-glow.png'),
  completeCertificateFrame: require('@/assets/images/collection/complete-certificate-frame.png'),
} as const;

export const GachaImages = {
  background: {
    light: require('@/assets/images/gacha/gacha-bg-light.png'),
    dark: require('@/assets/images/gacha/gacha-bg-dark.png'),
  },
  machine: {
    body: {
      japanese: require('@/assets/images/gacha/gacha-machine-body-japanese.png'),
      english: require('@/assets/images/gacha/gacha-machine-body-english.png'),
      korean: require('@/assets/images/gacha/gacha-machine-body-korean.png'),
      arabic: require('@/assets/images/gacha/gacha-machine-body-arabic.png'),
      thai: require('@/assets/images/gacha/gacha-machine-body-thai.png'),
      hindi: require('@/assets/images/gacha/gacha-machine-body-hindi.png'),
      greek: require('@/assets/images/gacha/gacha-machine-body-greek.png'),
    },
    handle: require('@/assets/images/gacha/gacha-machine-handle.png'),
  },
  capsule: {
    bottom: require('@/assets/images/gacha/capsule-bottom.png'),
    top: {
      common: require('@/assets/images/gacha/capsule-top-common.png'),
      rare: require('@/assets/images/gacha/capsule-top-rare.png'),
      superRare: require('@/assets/images/gacha/capsule-top-super-rare.png'),
    },
  },
  effects: {
    superRareAura: require('@/assets/images/gacha/super-rare-aura.png'),
    luckyClover: require('@/assets/images/gacha/lucky-clover.png'),
  },
} as const;

export const SoundAssets = {
  gachaSpin: require('@/assets/sounds/gacha-spin.wav'),
  capsuleDrop: require('@/assets/sounds/capsule-drop.wav'),
  capsulePop: require('@/assets/sounds/capsule-pop.wav'),
  superRareSparkle: require('@/assets/sounds/super-rare-sparkle.wav'),
} as const;

export const TabIconImages = {
  gacha: require('@/assets/images/tabIcons/home.png'),
  collection: require('@/assets/images/tabIcons/explore.png'),
} as const;
