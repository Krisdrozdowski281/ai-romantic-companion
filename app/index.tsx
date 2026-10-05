import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? <Redirect href="/home" /> : <Redirect href="/sign-in" />;
}
