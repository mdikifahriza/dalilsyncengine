// src/components/TeacherHoursBox.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { curriculumService } from '@/services/curriculumService';
import { useAuth } from '@/context/AuthContext';
import type { Teacher } from '@/types/database.types';

interface TeacherHoursBoxProps {
  teachers: Teacher[];
}

export default function TeacherHoursBox({ teachers }: TeacherHoursBoxProps) {
  const { user } = useAuth();
  const [hoursUsed, setHoursUsed] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadHoursUsed = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const hours = await curriculumService.getTeacherHoursUsed(user.id);
        setHoursUsed(hours);
      } catch (error) {
        console.error('Error loading teacher hours:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHoursUsed();
  }, [user, teachers]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Beban Mengajar Guru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Beban Mengajar Guru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Belum ada data guru</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showToggle = teachers.length > 2;
  const displayedTeachers = showToggle && !isExpanded ? teachers.slice(0, 2) : teachers;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          Beban Mengajar Guru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {displayedTeachers.map((teacher, index) => {
              const used = hoursUsed[teacher.id] || 0;
              const max = teacher.jam_maks;
              const percentage = max > 0 ? (used / max) * 100 : 0;
              const remaining = max - used;
              const isOverload = used > max;
              const isNearFull = percentage >= 80 && !isOverload;

              return (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {teacher.nama}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {used} / {max} jam per minggu
                      </p>
                    </div>
                    {isOverload && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                    )}
                    {isNearFull && (
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 ml-2" />
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverload
                          ? 'bg-red-500'
                          : isNearFull
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-600">
                      {isOverload ? (
                        <span className="text-red-600 font-medium">Overload!</span>
                      ) : remaining === 0 ? (
                        <span className="text-amber-600 font-medium">Penuh</span>
                      ) : (
                        <span>Sisa: {remaining} jam</span>
                      )}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Toggle Button */}
          {showToggle && (
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Tampilkan Lebih Sedikit
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Tampilkan {teachers.length - 2} Guru Lainnya
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}