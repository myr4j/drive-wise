import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FadeSlideIn from '@/components/ui/FadeSlideIn';

import { loginSchema, LoginFormData } from '@/utils/validators';
import { authApi } from '@/services';
import { useAuthStore } from '@/store';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { RootStackParamList } from '@/types/navigation';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export default function LoginScreen() {
  const { colors, fonts, spacing, typeScale } = useTheme();
  const toast = useToast();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setDriver, setLoading, setError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      setDriver(response.driver);
    } catch (err: any) {
      const message = err?.message || 'Erreur de connexion';
      toast.error(message, 'Connexion impossible');
      setError(message);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxxl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand block — large editorial header */}
        <FadeSlideIn duration={420} style={{ marginBottom: spacing.xxxl }}>
          <View style={[styles.brandMark, { backgroundColor: colors.accent }]} />
          <Text
            style={{
              ...typeScale.caption,
              color: colors.inkMuted,
              marginTop: spacing.md,
            }}
          >
            DriveWise
          </Text>
          <Text
            style={{
              fontFamily: fonts.displayItalic,
              fontSize: 44,
              lineHeight: 52,
              color: colors.ink,
              marginTop: spacing.xs,
              letterSpacing: -0.5,
            }}
          >
            Bon retour.
          </Text>
          <Text
            style={{
              ...typeScale.bodyLg,
              color: colors.inkMuted,
              marginTop: spacing.sm,
              maxWidth: 320,
            }}
          >
            Connectez-vous pour reprendre le suivi de fatigue.
          </Text>
        </FadeSlideIn>

        {/* Form */}
        <FadeSlideIn fromY={12} duration={420} delay={100}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Adresse email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
          />

          <View style={{ marginTop: spacing.xl }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
            >
              {isLoading ? 'Connexion en cours' : 'Se connecter'}
            </Button>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: spacing.xxl,
              gap: spacing.xs,
            }}
          >
            <Text
              style={{ ...typeScale.bodyMd, color: colors.inkMuted }}
            >
              Pas encore de compte ?
            </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text
                style={{
                  ...typeScale.bodyMd,
                  color: colors.accent,
                  fontFamily: fonts.bodySemibold,
                }}
              >
                Créer un compte
              </Text>
            </Pressable>
          </View>
        </FadeSlideIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brandMark: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
