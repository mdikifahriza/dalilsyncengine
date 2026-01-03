// src/pages/SchoolSettingsPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { schoolProfileService } from '@/services/schoolProfileService';
import type { SchoolProfile, Jenjang, ModelSekolah } from '@/types/database.types';
import { JENJANG_OPTIONS, MODEL_SEKOLAH_OPTIONS } from '@/types/database.types';

export default function SchoolSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [formData, setFormData] = useState({
    nama_sekolah: '',
    jenjang: '' as Jenjang,
    model_sekolah: 'Reguler' as ModelSekolah,
    zona_waktu: 'Asia/Jakarta',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await schoolProfileService.get(user.id);
      if (data) {
        setProfile(data);
        setFormData({
          nama_sekolah: data.nama_sekolah,
          jenjang: data.jenjang,
          model_sekolah: data.model_sekolah || 'Reguler',
          zona_waktu: data.zona_waktu,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat profil sekolah');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (profile) {
        await schoolProfileService.update(user.id, formData);
      } else {
        await schoolProfileService.create(user.id, formData);
      }
      setSuccess(true);
      await loadProfile();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil sekolah');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-indigo-600" />
          Profil Sekolah
        </h1>
        <p className="text-gray-500 mt-1">Kelola informasi sekolah Anda</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Profil sekolah berhasil disimpan!</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Informasi Sekolah</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Sekolah <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.nama_sekolah}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_sekolah: e.target.value })
                  }
                  placeholder="Contoh: SD Negeri 1 Jakarta"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenjang Pendidikan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jenjang}
                    onChange={(e) =>
                      setFormData({ ...formData, jenjang: e.target.value as Jenjang })
                    }
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
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
                    value={formData.model_sekolah}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona Waktu
                </label>
                <select
                  value={formData.zona_waktu}
                  onChange={(e) =>
                    setFormData({ ...formData, zona_waktu: e.target.value })
                  }
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Asia/Jakarta">WIB (Jakarta)</option>
                  <option value="Asia/Makassar">WITA (Makassar)</option>
                  <option value="Asia/Jayapura">WIT (Jayapura)</option>
                </select>
              </div>

              {/* Preview */}
              {formData.nama_sekolah && formData.jenjang && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs font-medium text-indigo-900 mb-2">Preview:</p>
                  <div className="space-y-1">
                    <p className="font-semibold text-indigo-700 text-lg">
                      {formData.nama_sekolah}
                    </p>
                    <p className="text-sm text-indigo-600">
                      {JENJANG_OPTIONS.find((j) => j.value === formData.jenjang)?.label} •{' '}
                      {formData.model_sekolah}
                    </p>
                    <p className="text-xs text-indigo-500">
                      Zona Waktu: {formData.zona_waktu}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Box */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Informasi</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • <strong>Jenjang:</strong> Menentukan template blok waktu dan struktur kurikulum
            </li>
            <li>
              • <strong>Model Sekolah:</strong> Mempengaruhi template default (misal: Boarding
              School ada waktu asrama)
            </li>
            <li>
              • <strong>Zona Waktu:</strong> Penting untuk penjadwalan yang akurat
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}