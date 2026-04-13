import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { colors, spacing, radius, font } from '../src/theme';

export default function CheckEmail() {
  const webRedirector = 'https://getsovrn.com/supabase-redirect';

  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Text style={s.icon}>✉</Text>
      </View>

      <Text style={s.title}>Check your email</Text>
      <Text style={s.subtitle}>
        Tap the magic link we sent you to finish signing in.
      </Text>

      <Pressable
        onPress={() => Linking.openURL('mailto:')}
        style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={s.primaryBtnText}>Open Email App</Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL(webRedirector)}
        style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={s.secondaryBtnText}>Open in Browser</Text>
      </Pressable>

      <Text style={s.hint}>
        If the link doesn't work, open the email in your device's browser instead of the in-app mail preview.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  icon: { fontSize: 36 },
  title: {
    color: colors.white,
    fontSize: font.xxl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: font.md,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  primaryBtnText: { color: colors.bg, fontSize: font.md, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: { color: colors.white, fontSize: font.md, fontWeight: '600' },
  hint: {
    color: colors.textMuted,
    fontSize: font.xs,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 16,
  },
});
