import { useAuthContext } from '@/contexts/AuthContext';
import { useDepots } from '@/hooks/useDepots';
import { depotService } from '@/services/depot.service';
import { useAppStore } from '@/stores/app.store';
import { useQuery } from '@tanstack/react-query';

/** Resolves the active tenant membership once so screens use the backend's store roles. */
export function useStoreAccess() {
  const user = useAuthContext().user;
  const selectedDepotId = useAppStore((state) => state.selectedDepotId);
  const depotsQuery = useDepots();
  const store = depotsQuery.data?.data.find((item) => item.id === selectedDepotId);
  const membership = store?.users?.find((item) => item.userId === user?.id && item.isActive);
  const isOwner = !!user?.id && store?.ownerId === user.id;
  const memberRole = membership?.role;
  const canManageStore = isOwner || ['ADMINISTRATEUR', 'GERANT'].includes(memberRole || '');
  const canManageMembers = isOwner;
  const canManageInventory = canManageStore || memberRole === 'MAGASINIER';
  const canSell = canManageStore || ['CAISSIER', 'VENDEUR'].includes(memberRole || '');
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', selectedDepotId],
    queryFn: () => depotService.getSubscription(selectedDepotId as string),
    enabled: !!selectedDepotId,
  });
  const subscription = subscriptionQuery.data;
  const isSubscriptionWritable = !!subscription && ['TRIAL', 'ACTIVE'].includes(subscription.status) && new Date(subscription.currentPeriodEnd).getTime() > Date.now();
  const daysRemaining = subscription ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000)) : 0;
  return { store, membership, memberRole, isOwner, canManageStore, canManageMembers, canManageInventory, canSell, subscription, subscriptionQuery, isSubscriptionWritable, daysRemaining };
}
