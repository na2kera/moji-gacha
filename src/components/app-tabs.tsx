import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { TabIconImages } from '@/constants/assets';
import { Accent, Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={Accent.soft}
      tintColor={Accent.primary}
      iconColor={{ default: colors.textSecondary, selected: Accent.primary }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: Accent.primary },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>ガチャ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={TabIconImages.gacha}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="collection">
        <NativeTabs.Trigger.Label>コレクション</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={TabIconImages.collection}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
