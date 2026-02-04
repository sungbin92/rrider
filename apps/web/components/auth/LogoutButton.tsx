'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/auth/login');
  }

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        'px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md'
      }
    >
      Log out
    </button>
  );
}
