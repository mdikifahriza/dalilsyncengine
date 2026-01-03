// src/pages/UsePage.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  School, 
  Users, 
  BookOpen, 
  BookMarked, 
  Clock, 
  Sparkles, 
  CheckCircle,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UsePageProps {
  onNavigateToLogin: () => void;
}

interface Step {
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  details: string[];
}

export default function UsePage({ onNavigateToLogin }: UsePageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: 'Register & Login',
      icon: School,
      color: 'from-blue-500 to-indigo-600',
      description: 'Daftar akun baru dan verifikasi email Anda',
      details: [
        'Klik tombol "Daftar" di halaman login',
        'Isi username, email, dan password',
        'Cek email untuk link verifikasi',
        'Login dengan akun yang sudah dibuat'
      ]
    },
    {
      title: 'Profil Sekolah',
      icon: School,
      color: 'from-purple-500 to-pink-600',
      description: 'Lengkapi informasi dasar sekolah Anda',
      details: [
        'Masuk ke menu "Profil Sekolah"',
        'Isi Nama Sekolah dan Jenjang (SD/SMP/SMA/SMK)',
        'Pilih Model Sekolah (Reguler/Boarding)',
        'Simpan perubahan'
      ]
    },
    {
      title: 'Data Master',
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      description: 'Tambahkan guru, kelas, dan mata pelajaran',
      details: [
        'Guru: Masuk menu Guru → Tambah data guru dengan jam maksimal',
        'Kelas: Masuk menu Kelas → Tambah kelas dengan tingkat',
        'Mata Pelajaran: Tambah mapel yang akan diajarkan'
      ]
    },
    {
      title: 'Kurikulum Kelas',
      icon: BookMarked,
      color: 'from-amber-500 to-orange-600',
      description: 'Atur mata pelajaran per kelas',
      details: [
        'Masuk menu "Kurikulum Kelas"',
        'Pilih kelas yang akan diatur',
        'Tambah mapel dengan guru dan jumlah jam/minggu',
        'Sistem otomatis validasi jam guru'
      ]
    },
    {
      title: 'Blok Waktu',
      icon: Clock,
      color: 'from-cyan-500 to-blue-600',
      description: 'Atur struktur waktu harian',
      details: [
        'Masuk menu "Blok Waktu"',
        'Atur hari aktif sekolah',
        'Tambah blok JP (Jam Pelajaran) dan Non-JP (istirahat)',
        'Pastikan total JP ≥ JP kurikulum'
      ]
    },
    {
      title: 'Generate & Export',
      icon: Sparkles,
      color: 'from-rose-500 to-red-600',
      description: 'Buat jadwal otomatis dan cetak',
      details: [
        'Masuk menu "Buat Jadwal"',
        'Klik "Generate Jadwal Otomatis"',
        'Tunggu algoritma selesai (fitness 100 = optimal)',
        'Lihat jadwal → Export PDF untuk cetak'
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${currentStepData.color} p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Cara Menggunakan DalilSync</h1>
              <button
                onClick={onNavigateToLogin}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                aria-label="Kembali ke Login"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    idx <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              {/* Step Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${currentStepData.color} rounded-2xl mb-4`}>
                  <currentStepData.icon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentStep + 1}. {currentStepData.title}
                </h2>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>

              {/* Step Details */}
              <div className="space-y-4 mb-8">
                {currentStepData.details.map((detail, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 flex-1">{detail}</p>
                  </motion.div>
                ))}
              </div>

              {/* Success Message on Last Step */}
              {currentStep === steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900 mb-1">
                        Selamat! Anda sudah siap menggunakan DalilSync
                      </p>
                      <p className="text-sm text-green-700">
                        Sistem akan otomatis membuat jadwal optimal dengan Genetic Algorithm
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Footer */}
          <div className="border-t p-6 flex items-center justify-between bg-gray-50">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya
            </Button>

            <div className="text-sm text-gray-600 font-medium">
              Step {currentStep + 1} dari {steps.length}
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Selanjutnya
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={onNavigateToLogin}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5" />
                Mulai Sekarang
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}