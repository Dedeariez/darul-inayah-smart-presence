
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const icons = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  students: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  attendance: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
  ),
  reports: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V21c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V6.5L15.5 2z"/><path d="M15 2v5h5"/><path d="M10 16s-1.5-2-4-2"/><path d="m14 10-4 4 4 4"/></svg>
  ),
};

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
    const commonClasses = "flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group";
    const activeClasses = "bg-gray-200 dark:bg-gray-700";

    return (
        <li>
            <NavLink 
                to={to} 
                className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : ''}`}
            >
                {icon}
                <span className="ms-3">{label}</span>
            </NavLink>
        </li>
    );
}

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    
    return (
        <aside id="logo-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <a href="#" className="flex items-center ps-2.5 mb-5">
                    <img src="favicon.svg" className="h-8 me-3" alt="MA Darul Inayah Logo" />
                    <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">MA Darul Inayah</span>
                </a>
                <ul className="space-y-2 font-medium">
                    <SidebarLink to="/" icon={icons.dashboard} label="Dashboard" />
                    {user?.role === 'teacher' && (
                        <>
                            <SidebarLink to="/students" icon={icons.students} label="Data Siswa" />
                            <SidebarLink to="/attendance" icon={icons.attendance} label="Absensi" />
                            <SidebarLink to="/reports" icon={icons.reports} label="Laporan" />
                        </>
                    )}
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;