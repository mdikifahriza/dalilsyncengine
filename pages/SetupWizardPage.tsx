// src/pages/SetupWizardPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Clock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { schoolProfileService } from '@/services/schoolProfileService';
import { timeBlockService } from '@/services/timeBlockService';
import type { Jenjang, ModelSekolah } from '@/types/database.types';
import { JENJANG_OPTIONS, MODEL_SEKOLAH_OPTIONS, HARI_OPTIONS } from '@/types/database.types';

interface SetupWizardPageProps {
  onComplete: () => void;
}

export default function SetupWizardPage({ onComplete }: SetupWizardPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: School Profile
  const [profileData, setProfileData] = useState({
    nama_sekolah: '',
    jenjang: '' as Jenjang,
    model_sekolah: 'Reguler' as ModelSekolah,
  });

  // Step 2: Operating Hours
  const [operatingData, setOperatingData] = useState({
    hari_aktif: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    jam_mulai: '07:00',
    jam_selesai: '15:00',
  });

  // Step 3: Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<'default' | 'custom'>('default');

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 1. Create school profile
      await schoolProfileService.create(user.id, {
        nama_sekolah: profileData.nama_sekolah,
        jenjang: profileData.jenjang,
        model_sekolah: profileData.model_sekolah,
      });

      // 2. Generate and save time blocks
      if (selectedTemplate === 'default') {
        const template = timeBlockService.generateTemplate(profileData.jenjang);
        await timeBlockService.createBulk(user.id, template);
      }

      onComplete();
    } catch (err: any) {
      console.error('Setup error:', err);
      alert(err.message || 'Terjadi kesalahan saat setup');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return profileData.nama_sekolah.trim() !== '' && profileData.jenjang !== '';
    }
    if (step === 2) {
      return operatingData.hari_aktif.length > 0;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      s < step
                        ? 'bg-green-500 text-white'
                        : s === step
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-1 w-16 mx-2 ${
                        s < step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600">
              Langkah {step} dari {totalSteps}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: School Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <School className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900">Profil Sekolah</h2>
                  <p className="text-gray-600 mt-2">
                    Mari kita mulai dengan informasi dasar sekolah Anda
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Sekolah <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={profileData.nama_sekolah}
                    onChange={(e) =>
                      setProfileData({ ...profileData, nama_sekolah: e.target.value })
                    }
                    placeholder="Contoh: SD Negeri 1 Jakarta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenjang Pendidikan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileData.jenjang}
                    onChange={(e) =>
                      setProfileData({ ...profileData, jenjang: e.target.value as Jenjang })
                    }
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Pilih Jenjang</option>
                    {JENJANG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Sekolah
                  </label>
                  <select
                    value={profileData.model_sekolah}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        model_sekolah: e.target.value as ModelSekolah,
                      })
                    }
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {MODEL_SEKOLAH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Operating Hours */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Clock className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900">Waktu Operasional</h2>
                  <p className="text-gray-600 mt-2">
                    Atur hari dan jam sekolah beroperasi
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari Aktif <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {HARI_OPTIONS.map((hari) => (
                      <label
                        key={hari}
                        className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition ${
                          operatingData.hari_aktif.includes(hari)
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={operatingData.hari_aktif.includes(hari)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOperatingData({
                                ...operatingData,
                                hari_aktif: [...operatingData.hari_aktif, hari],
                              });
                            } else {
                              setOperatingData({
                                ...operatingData,
                                hari_aktif: operatingData.hari_aktif.filter((h) => h !== hari),
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">{hari}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Mulai
                    </label>
                    <Input
                      type="time"
                      value={operatingData.jam_mulai}
                      onChange={(e) =>
                        setOperatingData({ ...operatingData, jam_mulai: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Selesai
                    </label>
                    <Input
                      type="time"
                      value={operatingData.jam_selesai}
                      onChange={(e) =>
                        setOperatingData({ ...operatingData, jam_selesai: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> Sekolah beroperasi pada{' '}
                    {operatingData.hari_aktif.join(', ')} dari {operatingData.jam_mulai} sampai{' '}
                    {operatingData.jam_selesai}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Template */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900">Template Jadwal</h2>
                  <p className="text-gray-600 mt-2">
                    Pilih template struktur waktu untuk {profileData.jenjang}
                  </p>
                </div>

                <div className="space-y-4">
                  <label
                    className={`block p-6 border-2 rounded-lg cursor-pointer transition ${
                      selectedTemplate === 'default'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value="default"
                      checked={selectedTemplate === 'default'}
                      onChange={() => setSelectedTemplate('default')}
                      className="mr-3"
                    />
                    <span className="font-semibold text-gray-900">
                      Template Standar {profileData.jenjang}
                    </span>
                    <p className="text-sm text-gray-600 mt-2 ml-6">
                      Gunakan template jadwal default yang sudah disesuaikan untuk jenjang{' '}
                      {profileData.jenjang}. Termasuk jam pelajaran, istirahat, dan waktu ibadah
                      (jika ada).
                    </p>
                  </label>

                  <label
                    className={`block p-6 border-2 rounded-lg cursor-pointer transition ${
                      selectedTemplate === 'custom'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value="custom"
                      checked={selectedTemplate === 'custom'}
                      onChange={() => setSelectedTemplate('custom')}
                      className="mr-3"
                    />
                    <span className="font-semibold text-gray-900">Kustomisasi Sendiri</span>
                    <p className="text-sm text-gray-600 mt-2 ml-6">
                      Buat struktur waktu sendiri sesuai kebutuhan sekolah. Anda akan diarahkan ke
                      halaman pengaturan blok waktu setelah setup.
                    </p>
                  </label>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Info:</strong> Anda dapat mengubah template kapan saja di menu
                    Pengaturan → Blok Waktu
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Lanjut
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Selesai
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}