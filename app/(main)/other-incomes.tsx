import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function OtherIncomesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finance/other-incomes');
  }, [router]);

  return null;
}
