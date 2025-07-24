
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import * as api from '../services/api';
import { ActivityLog } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Spinner from '../components/common/Spinner';

const ActivityLogComponent = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const initialLogs = await api.getLatestActivityLogs(10);
                setLogs(initialLogs);
            } catch (error: any) {
                console.error('Error fetching logs:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();

        const channel = api.subscribeToActivityLogs((newLog) => {
            setLogs(currentLogs => [newLog, ...currentLogs].slice(0, 10));
        });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-40"><Spinner /></div>;
    }

    return (
      <div className="flow-root">
        <ul role="list" className="-mb-8">
            {logs.length > 0 ? logs.map((log, logIdx) => (
                <li key={log.id}>
                    <div className="relative pb-8">
                        {logIdx !== logs.length - 1 ? (
                            <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                            <div>
                                <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center ring-8 ring-white">
                                    <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium text-gray-900">{log.profiles?.full_name || 'Sistem'}</span> {log.action_description}
                                    </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                    <time dateTime={log.created_at}>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}</time>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            )) : <p className="text-gray-500 text-center py-4">Belum ada aktivitas.</p>}
        </ul>
      </div>
    );
};


const DashboardPage = () => {
  const { profile } = useAuth();
  const today = format(new Date(), 'eeee, d MMMM yyyy', { locale: id });

  return (
    <div>
      <div className="pb-8 border-b border-gray-200 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Selamat datang kembali, {profile?.full_name || 'Guru'}.</p>
        <p className="mt-1 text-sm text-gray-500">{today}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">Log Aktivitas Terbaru</h2>
          <ActivityLogComponent />
      </div>
    </div>
  );
};

export default DashboardPage;
