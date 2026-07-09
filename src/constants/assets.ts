export const AppImages = {
  splashIcon: require('@/assets/images/splash-icon.png'),
  logoGlow: require('@/assets/images/logo-glow.png'),
} as const;

export const GachaImages = {
  background: {
    light: require('@/assets/images/gacha/gacha-bg-light.png'),
    dark: require('@/assets/images/gacha/gacha-bg-dark.png'),
  },
  machine: {
    body: require('@/assets/images/gacha/gacha-machine-body.png'),
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
  },
} as const;

export const TabIconImages = {
  gacha: require('@/assets/images/tabIcons/home.png'),
  collection: require('@/assets/images/tabIcons/explore.png'),
} as const;
