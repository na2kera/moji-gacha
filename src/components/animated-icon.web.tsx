import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeOut, Keyframe } from 'react-native-reanimated';

import classes from './animated-icon.module.css';

import { AppImages } from '@/constants/assets';

const DURATION = 300;
const SPLASH_DURATION = 900;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(DURATION)}
      style={styles.splashOverlay}
      accessibilityElementsHidden>
      <Animated.View entering={keyframe.duration(DURATION)} style={styles.splashBackground} />
      <Animated.View entering={logoKeyframe.duration(DURATION)} style={styles.splashImageContainer}>
        <Image style={styles.splashImage} source={AppImages.splashIcon} />
      </Animated.View>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: 0 }],
  },
  60: {
    transform: [{ scale: 1.2 }],
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(1.2),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '-180deg' }, { scale: 0.8 }],
    opacity: 0,
  },
  [DURATION / 1000]: {
    transform: [{ rotateZ: '0deg' }, { scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={AppImages.logoGlow} />
      </Animated.View>

      <Animated.View style={styles.background} entering={keyframe.duration(DURATION)}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={AppImages.splashIcon} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashBackground: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5484D',
    borderRadius: 40,
    borderWidth: 3,
    height: 128,
    position: 'absolute',
    width: 128,
  },
  splashImage: {
    height: 71,
    width: 76,
  },
  splashImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
