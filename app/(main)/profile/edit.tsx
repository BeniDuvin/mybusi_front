import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { isValidEmail, isStrongPassword } from '@/utils/validation';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, refreshUser } = useAuthContext();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      setError('Le prénom et le nom sont obligatoires');
      return;
    }
    if (!formData.email?.trim()) {
      setError('L\'email est obligatoire');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError('Email invalide');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await authService.updateProfile(user!.id, formData);
      await refreshUser();
      setSuccess('Profil mis à jour');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/profile');
        }
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const PASSWORD_HINT = 'Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre';

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      setError('Veuillez entrer votre mot de passe actuel');
      return;
    }
    if (!passwordData.newPassword || !passwordData.confirmNewPassword) {
      setError('Veuillez remplir tous les champs du mot de passe');
      return;
    }
    if (!isStrongPassword(passwordData.newPassword)) {
      setError(PASSWORD_HINT);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    try {
      setPasswordLoading(true);
      setError('');
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mot de passe actuel incorrect ou erreur');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Modifier mon profil
            </Text>
          </View>

          <TextInput
            label="Prénom *"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Nom *"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Téléphone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            placeholder="+242 XX XXX XX XX"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={passwordLoading}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            Enregistrer
          </Button>

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Modifier le mot de passe
          </Text>
          <Text variant="bodySmall" style={styles.sectionHint}>
            Entrez d'abord votre mot de passe actuel pour le modifier
          </Text>

          <TextInput
            label="Mot de passe actuel *"
            value={passwordData.currentPassword}
            onChangeText={(text) =>
              setPasswordData({ ...passwordData, currentPassword: text })
            }
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <TextInput
            label="Nouveau mot de passe *"
            value={passwordData.newPassword}
            onChangeText={(text) =>
              setPasswordData({ ...passwordData, newPassword: text })
            }
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            placeholder={PASSWORD_HINT}
            style={styles.input}
            left={<TextInput.Icon icon="lock-plus" />}
          />

          <TextInput
            label="Confirmer le nouveau mot de passe *"
            value={passwordData.confirmNewPassword}
            onChangeText={(text) =>
              setPasswordData({ ...passwordData, confirmNewPassword: text })
            }
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Button
            mode="outlined"
            onPress={handleChangePassword}
            loading={passwordLoading}
            disabled={loading || passwordLoading}
            style={styles.passwordButton}
          >
            Modifier le mot de passe
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={3000}>
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.xs,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  input: {
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  divider: {
    marginVertical: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  passwordButton: {
    marginTop: Spacing.sm,
  },
});
