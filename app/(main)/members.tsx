import { Spacing } from '@/constants/theme';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { depotService } from '@/services/depot.service';
import { isValidEmail } from '@/utils/validation';
import type { StoreMemberRole } from '@/types';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Menu, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const roles: StoreMemberRole[] = ['GERANT', 'CAISSIER', 'VENDEUR', 'MAGASINIER'];
const labels: Record<StoreMemberRole, string> = {
  ADMINISTRATEUR: 'Administrateur',
  GERANT: 'Gérant',
  CAISSIER: 'Caissier',
  VENDEUR: 'Vendeur',
  MAGASINIER: 'Magasinier',
};

/** Manages a store team while the API remains responsible for owner authorization. */
export default function MembersScreen() {
  const theme = useTheme();
  const client = useQueryClient();
  const { store, isOwner, canManageMembers } = useStoreAccess();
  const depotId = store?.id;
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<StoreMemberRole>('VENDEUR');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [menuUser, setMenuUser] = useState<string | null>(null);
  const members = useQuery({
    queryKey: ['store-members', depotId],
    queryFn: () => depotService.getMembers(depotId as string),
    enabled: !!depotId,
  });
  const refreshMembers = () => client.invalidateQueries({ queryKey: ['store-members', depotId] });
  const invite = useMutation({
    mutationFn: () => depotService.inviteMember({
      depotId: depotId as string,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      role,
    }),
    onSuccess: (result) => {
      setEmail('');
      setFirstName('');
      setLastName('');
      setNotice(result.message);
      void refreshMembers();
    },
  });
  const changeRole = useMutation({
    mutationFn: ({ id, nextRole }: { id: string; nextRole: StoreMemberRole }) =>
      depotService.updateMemberRole(depotId as string, id, nextRole),
    onSuccess: () => { setNotice('Rôle mis à jour.'); void refreshMembers(); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => depotService.removeUser(depotId as string, id),
    onSuccess: () => { setNotice('Accès retiré.'); void refreshMembers(); },
  });

  const submitInvite = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) return setError('Saisissez une adresse e-mail valide.');
    invite.mutate(undefined, { onError: () => setError('Impossible d’envoyer cette invitation. Vérifiez l’adresse et vos droits.') });
  };

  if (!depotId) return <SafeAreaView style={styles.center}><Text>Sélectionnez une boutique.</Text></SafeAreaView>;
  if (members.isLoading) return <SafeAreaView style={styles.center}><Text>Chargement des membres…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>Équipe · {store?.name}</Text>
        {!canManageMembers && <Text style={styles.note}>Seul le propriétaire peut modifier les accès de l’équipe.</Text>}
        {canManageMembers && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Inviter par e-mail</Text>
              <Text style={styles.note}>La personne recevra ses accès et devra changer son mot de passe temporaire.</Text>
              <TextInput label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={styles.input} />
              <TextInput label="Prénom (facultatif)" value={firstName} onChangeText={setFirstName} mode="outlined" style={styles.input} />
              <TextInput label="Nom (facultatif)" value={lastName} onChangeText={setLastName} mode="outlined" style={styles.input} />
              <Text variant="labelLarge" style={styles.roleLabel}>Rôle dans cette boutique</Text>
              <View style={styles.roles}>{roles.map((item) => <Button key={item} mode={role === item ? 'contained' : 'outlined'} compact onPress={() => setRole(item)}>{labels[item]}</Button>)}</View>
              <Button mode="contained" onPress={submitInvite} loading={invite.isPending} disabled={invite.isPending}>Envoyer l’invitation</Button>
            </Card.Content>
          </Card>
        )}
        {members.data?.map((member) => (
          <Card key={member.userId} style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <View style={styles.identity}>
                  <Text variant="titleMedium">{member.user.firstName} {member.user.lastName}</Text>
                  <Text>{member.user.email || member.user.phone}</Text>
                  <Text>Rôle : {labels[member.role]}</Text>
                  {!member.user.emailVerified && <Text style={styles.status}>Invitation en attente de vérification</Text>}
                  {!!member.user.mustChangePassword && <Text style={styles.status}>Changement du mot de passe requis</Text>}
                </View>
                {canManageMembers && member.role !== 'ADMINISTRATEUR' && (
                  <Menu visible={menuUser === member.userId} onDismiss={() => setMenuUser(null)} anchor={<Button compact onPress={() => setMenuUser(member.userId)}>Options</Button>}>
                    {roles.map((item) => <Menu.Item key={item} title={`Définir : ${labels[item]}`} onPress={() => { setMenuUser(null); changeRole.mutate({ id: member.userId, nextRole: item }, { onError: () => setError('Impossible de modifier ce rôle.') }); }} />)}
                    <Menu.Item title="Retirer de la boutique" onPress={() => { setMenuUser(null); remove.mutate(member.userId, { onError: () => setError('Impossible de retirer ce membre.') }); }} />
                  </Menu>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
        {isOwner && !members.data?.length && <Text>Aucun autre membre dans cette boutique.</Text>}
      </ScrollView>
      <Snackbar visible={!!error} onDismiss={() => setError('')}>{error}</Snackbar>
      <Snackbar visible={!!notice} onDismiss={() => setNotice('')}>{notice}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, paddingBottom: 48 },
  title: { fontWeight: 'bold', marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.md },
  input: { marginVertical: Spacing.xs },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginVertical: Spacing.md },
  roleLabel: { marginTop: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { flex: 1 },
  note: { marginVertical: Spacing.sm, opacity: 0.75 },
  status: { marginTop: Spacing.xs, color: '#9A6700' },
});
