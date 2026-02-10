import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('../assets/images/logo_app.png');

export default function Index() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthContext();

  const scale = useRef(new Animated.Value(0.9)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.95,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 2800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (user) {
        router.replace('/(main)/dashboard');
      } else {
        router.replace('/login');
      }
    }, 1600);

    return () => clearTimeout(timeout);
  }, [user, router]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.logoWrapper, { opacity: fade, transform: [{ scale }] }]}>
        <Animated.Image
          source={logo}
          style={[styles.logo, { transform: [{ rotate: spin }] }]}
          resizeMode="contain"
        />
      </Animated.View>
      <View style={styles.textBlock}>
        <Text variant="titleLarge" style={styles.title}>
          MyDepot
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Gestion de dépôt de boissons
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  logoWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
});
