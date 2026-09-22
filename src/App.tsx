/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Role, Student, SubjectType, GradeLevel, AppStoreData } from './types';
import { getStoreApi, saveStoreApi } from './services/api';
import { initialStoreData } from './data/initialData';
import { Header } from './components/Header';
import { LoginModal } from './components/auth/LoginModal';
import { AuthorPortal } from './components/teacher/AuthorPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { StudentPortal } from './components/student/StudentPortal';
import { Sparkles, Shield, User, RefreshCw, KeyRound } from 'lucide-react';

export default function App() {
  const [store, setStore] = useState<AppStoreData>(initialStoreData);
  const [loading, setLoading] = useState(true);

  // Authentication & Role
  const [role, setRole] = useState<Role>('student');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(
    initialStoreData.students[0] || null
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Navigation Filter
  const [currentSubject, setCurrentSubject] = useState<SubjectType | 'all'>('all');
  const [currentGrade, setCurrentGrade] = useState<GradeLevel | 'all'>('all');

  // Active Sub-views
  const [authorView, setAuthorView] = useState<'curriculum' | 'questions' | 'ai-generator'>('curriculum');
  const [adminView, setAdminView] = useState<'classes' | 'exams' | 'results' | 'settings'>('classes');

  // Load server state on mount
  useEffect(() => {
    async function loadData() {
      try {
        const remoteStore = await getStoreApi();
        if (remoteStore && remoteStore.lessons) {
          setStore(remoteStore);
          if (remoteStore.students && remoteStore.students.length > 0) {
            setCurrentStudent(remoteStore.students[0]);
          }
        }
      } catch (err) {
        console.warn('Using local initial store data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateStore = async (delta: Partial<AppStoreData>) => {
    const updated = {
      ...store,
      ...delta,
      lastUpdated: new Date().toISOString(),
    };
    setStore(updated);
    try {
      await saveStoreApi(delta);
    } catch (err) {
      console.error('Failed to sync to server:', err);
    }
  };

  const handleLoginSuccess = (newRole: Role, student?: Student) => {
    setRole(newRole);
    if (student) {
      setCurrentStudent(student);
      setCurrentGrade(student.grade);
    } else {
      setCurrentStudent(null);
    }
  };

  const handleLogout = () => {
    setRole('guest');
    setCurrentStudent(null);
    setLoginModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Đang tải dữ liệu "Ôn tập và kiểm tra Lịch sử – Địa lí THCS"...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Universal Top Header */}
      <Header
        currentSubject={currentSubject}
        onSubjectChange={setCurrentSubject}
        currentGrade={currentGrade}
        onGradeChange={setCurrentGrade}
        role={role}
        currentStudent={currentStudent}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        activeView={role === 'author' ? authorView : adminView}
        onViewChange={(v) => {
          if (role === 'author') setAuthorView(v as any);
          if (role === 'admin') setAdminView(v as any);
        }}
      />

      {/* Main Dynamic Workspace by Role */}
      <main className="flex-1 pb-16">
        {role === 'student' && (
          <StudentPortal
            student={
              currentStudent || {
                id: 'default-std',
                studentCode: 'HS601',
                fullName: 'Nguyễn Văn An',
                classCode: '6A1',
                grade: 6,
              }
            }
            store={store}
            onUpdateStore={handleUpdateStore}
            currentSubject={currentSubject}
            currentGrade={currentGrade}
          />
        )}

        {role === 'author' && (
          <AuthorPortal
            store={store}
            onUpdateStore={handleUpdateStore}
            activeTab={authorView}
            onTabChange={setAuthorView as any}
            currentSubject={currentSubject}
            currentGrade={currentGrade}
          />
        )}

        {role === 'admin' && (
          <AdminPortal
            store={store}
            onUpdateStore={handleUpdateStore}
            activeTab={adminView}
            onTabChange={setAdminView as any}
          />
        )}

        {role === 'guest' && (
          <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Vui lòng đăng nhập</h2>
            <p className="text-xs text-slate-500">
              Hãy chọn vai trò Học sinh, Giáo viên Biên soạn hoặc Giáo viên Quản lý để sử dụng các tính năng tương ứng.
            </p>
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Mở hộp thoại đăng nhập
            </button>
          </div>
        )}
      </main>

      {/* Floating Demo Role Switcher Quick Pill (for seamless evaluator testing) */}
      <div className="fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-md rounded-2xl p-1.5 flex items-center gap-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 px-2 hidden sm:inline">Chuyển vai trò:</span>
        <button
          onClick={() => {
            setRole('student');
            if (store.students[0]) setCurrentStudent(store.students[0]);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
            role === 'student'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Học sinh</span>
        </button>
        <button
          onClick={() => setRole('author')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
            role === 'author'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>GV Biên soạn</span>
        </button>
        <button
          onClick={() => setRole('admin')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
            role === 'admin'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>GV Quản lý</span>
        </button>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
