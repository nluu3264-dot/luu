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
import { FirstTimePasswordModal } from './components/auth/FirstTimePasswordModal';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
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
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Navigation Filter
  const [currentSubject, setCurrentSubject] = useState<SubjectType | 'all'>('all');
  const [currentGrade, setCurrentGrade] = useState<GradeLevel | 'all'>('all');

  // Active Sub-views
  const [authorView, setAuthorView] = useState<'curriculum' | 'questions' | 'ai-generator'>('curriculum');
  const [adminView, setAdminView] = useState<'classes' | 'exams' | 'results' | 'settings'>('classes');

  // Load server state on mount & restore tab session if valid
  useEffect(() => {
    async function loadData() {
      try {
        const remoteStore = await getStoreApi();
        if (remoteStore && remoteStore.lessons) {
          setStore(remoteStore);
          
          // Check for existing valid session in this browser tab
          let hasSession = false;
          try {
            const rawSession = sessionStorage.getItem('on_tap_thcs_session');
            if (rawSession) {
              const session = JSON.parse(rawSession);
              const age = Date.now() - (session.timestamp || 0);
              // Max session duration 8 hours, tab-scoped
              if (session && session.role && age < 8 * 60 * 60 * 1000) {
                setRole(session.role);
                if (session.student) {
                  // Re-fetch latest student info from remoteStore if available
                  const foundStd = remoteStore.students?.find((s: Student) => s.id === session.student.id) || session.student;
                  setCurrentStudent(foundStd);
                  setCurrentGrade(foundStd.grade);
                  if (foundStd && !foundStd.hasSetPassword) {
                    setShowFirstTimeSetup(true);
                  }
                }
                hasSession = true;
              } else {
                sessionStorage.removeItem('on_tap_thcs_session');
              }
            }
          } catch (e) {
            console.warn('Could not read session', e);
          }

          if (!hasSession && remoteStore.students && remoteStore.students.length > 0) {
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

  const handleLoginSuccess = (newRole: Role, student?: Student, requiresPasswordSetup?: boolean) => {
    setRole(newRole);
    if (student) {
      setCurrentStudent(student);
      setCurrentGrade(student.grade);
      if (requiresPasswordSetup || !student.hasSetPassword) {
        setShowFirstTimeSetup(true);
      }
    } else {
      setCurrentStudent(null);
    }

    // Save session strictly to current browser tab
    try {
      sessionStorage.setItem('on_tap_thcs_session', JSON.stringify({
        role: newRole,
        student: student || null,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Could not save session', e);
    }
  };

  const handleFirstTimePasswordSuccess = (updatedStudent: Student) => {
    setCurrentStudent(updatedStudent);
    setShowFirstTimeSetup(false);

    // Update student in store
    const updatedStudents = store.students.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    handleUpdateStore({ students: updatedStudents });

    try {
      sessionStorage.setItem('on_tap_thcs_session', JSON.stringify({
        role: 'student',
        student: updatedStudent,
        timestamp: Date.now(),
      }));
    } catch (e) {}
  };

  const handleChangePasswordSuccess = (updatedStudent: Student) => {
    setCurrentStudent(updatedStudent);

    // Update student in store
    const updatedStudents = store.students.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    handleUpdateStore({ students: updatedStudents });

    try {
      sessionStorage.setItem('on_tap_thcs_session', JSON.stringify({
        role: 'student',
        student: updatedStudent,
        timestamp: Date.now(),
      }));
    } catch (e) {}
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('on_tap_thcs_session');
    } catch (e) {}
    setRole('student');
    setShowFirstTimeSetup(false);
    setShowChangePasswordModal(false);
    if (store.students && store.students.length > 0) {
      setCurrentStudent(store.students[0]);
    } else {
      setCurrentStudent(null);
    }
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
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* First Time Password Setup Modal (Mandatory, blocks app access until set) */}
      {showFirstTimeSetup && currentStudent && (
        <FirstTimePasswordModal
          isOpen={showFirstTimeSetup}
          student={currentStudent}
          onSuccess={handleFirstTimePasswordSuccess}
        />
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && currentStudent && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          student={currentStudent}
          onSuccess={handleChangePasswordSuccess}
        />
      )}
    </div>
  );
}
