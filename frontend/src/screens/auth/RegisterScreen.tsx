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
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

import { registerSchema, RegisterFormData } from '@/utils/validators';
import { authApi } from '@/services';
import { useAuthStore } from '@/store';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const { colors, fonts, spacing, typeScale } = useTheme();
  const toast = useToast();
  const navigation = useNavigation<NavigationProp>();
  const { setDriver, setLoading, setError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      setDriver(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur d'inscription";
      toast.error(message, 'Inscription impossible');
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
        {/* Back link */}
        <Pressable
          onPress={() => navigation.navigate('Login')}
          hitSlop={12}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            marginBottom: spacing.xl,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ChevronLeft size={18} color={colors.inkMuted} strokeWidth={2} />
          <Text
            style={{
              ...typeScale.bodyMd,
              color: colors.inkMuted,
              marginLeft: 4,
            }}
          >
            Se connecter
          </Text>
        </Pressable>

        <FadeSlideIn duration={420} style={{ marginBottom: spacing.xxl }}>
          <View style={[styles.brandMark, { backgroundColor: colors.accent }]} />
          <Text
            style={{
              ...typeScale.caption,
              color: colors.inkMuted,
              marginTop: spacing.md,
            }}
          >
            Nouveau compte
          </Text>
          <Text
            style={{
              fontFamily: fonts.displayItalic,
              fontSize: 38,
              lineHeight: 46,
              color: colors.ink,
              marginTop: spacing.xs,
              letterSpacing: -0.5,
            }}
          >
            On commence ?
          </Text>
          <Text
            style={{
              ...typeScale.bodyLg,
              color: colors.inkMuted,
              marginTop: spacing.sm,
              maxWidth: 320,
            }}
          >
            Trois champs, et vous êtes sur la route.
          </Text>
        </FadeSlideIn>

        <FadeSlideIn fromY={12} duration={420} delay={100}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nom d'utilisateur"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.username?.message}
                autoCapitalize="none"
              />
            )}
          />

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
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                rightIcon={
                  <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                    {showPassword
                      ? <EyeOff size={18} color={colors.inkSubtle} strokeWidth={1.8} />
                      : <Eye size={18} color={colors.inkSubtle} strokeWidth={1.8} />
                    }
                  </Pressable>
                }
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
              {isLoading ? 'Création en cours' : 'Créer mon compte'}
            </Button>
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
