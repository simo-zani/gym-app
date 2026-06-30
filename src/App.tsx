import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';
import { ScrollProvider } from '@/lib/ScrollContext';
import '@/i18n';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScrollProvider>
          <AppRoutes />
        </ScrollProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
