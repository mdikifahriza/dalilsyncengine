import React, { useState } from 'react';
import { UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export default function RegisterPage({ onNavigateToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, username);
      setSuccess(true);
      setTimeout(() => {
        onNavigateToLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Daftar</h1>
            <p className="text-gray-600 mt-2">Buat akun baru Anda</p>
          </div>

          {success && (
            <Alert variant="success" className="mb-6">
              <CheckCircle className="w-5 h-5" />
              <AlertDescription>
                <p className="font-medium">Pendaftaran berhasil!</p>
                <p className="text-xs mt-1">Mengalihkan ke halaman login...</p>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Kata Sandi
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-5 h-5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Berhasil!
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Daftar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Atau</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Login di sini
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}