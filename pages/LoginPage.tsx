import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      const message = err.message?.includes('Invalid login credentials')
        ? 'Email atau Kata Sandi salah. Silakan coba lagi.'
        : err.message || 'Terjadi kesalahan otentikasi.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0, 0, 0.2, 1],
      },
    },
  };

  const buttonVariants: Variants = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100"
          whileHover={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              className="text-3xl font-bold text-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Login
            </motion.h1>
            <motion.p
              className="text-gray-600 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              DalilSync Engine - Sistem Penjadwalan
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
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
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Daftar sekarang
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}