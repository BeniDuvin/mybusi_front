import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function ExpensesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finance/expenses');
  }, [router]);

  return null;
}
