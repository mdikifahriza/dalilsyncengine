import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, DoorOpen, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalRooms: 0,
    totalGARuns: 0,
    lastRunDate: 'Belum ada',
    successfulRuns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch counts dari setiap tabel
      const [teachers, classes, subjects, rooms, gaRuns] = await Promise.all([
        supabase.from('guru').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('kelas').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('mapel').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ruang').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ga_run').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      // Get last run
      const { data: lastRun } = await supabase
        .from('ga_run')
        .select('timestamp_start')
        .eq('user_id', user.id)
        .order('timestamp_start', { ascending: false })
        .limit(1)
        .single();

      // Get successful runs
      const { count: successfulCount } = await supabase
        .from('ga_run')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      setStats({
        totalTeachers: teachers.count || 0,
        totalClasses: classes.count || 0,
        totalSubjects: subjects.count || 0,
        totalRooms: rooms.count || 0,
        totalGARuns: gaRuns.count || 0,
        lastRunDate: lastRun?.timestamp_start
          ? new Date(lastRun.timestamp_start).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Belum ada',
        successfulRuns: successfulCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Guru',
      value: stats.totalTeachers,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      title: 'Total Kelas',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'bg-emerald-500',
      trend: '+8%',
    },
    {
      title: 'Mata Pelajaran',
      value: stats.totalSubjects,
      icon: Calendar,
      color: 'bg-purple-500',
      trend: '+5%',
    },
    {
      title: 'Ruangan',
      value: stats.totalRooms,
      icon: DoorOpen,
      color: 'bg-orange-500',
      trend: '+3%',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Selamat datang kembali, {user?.email || 'User'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    {stat.trend}
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">{stat.title}</h3>
                <p className="text-4xl font-bold text-gray-900">
                  {loading ? '...' : stat.value}
                </p>
                <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`${stat.color} h-full rounded-full transition-all duration-700`}
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* GA Runs Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Genetic Algorithm Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Runs</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.totalGARuns}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Berhasil</span>
                  <span className="text-2xl font-bold text-green-600">
                    {loading ? '...' : stats.successfulRuns}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Run Terakhir</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.lastRunDate}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}