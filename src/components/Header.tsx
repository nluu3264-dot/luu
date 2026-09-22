/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SubjectType, GradeLevel, Role, Student } from '../types';
import { BookOpen, Compass, Shield, User, LogOut, Award, Sparkles, School, KeyRound, Key } from 'lucide-react';

interface HeaderProps {
  currentSubject: SubjectType | 'all';
  onSubjectChange: (sub: SubjectType | 'all') => void;
  currentGrade: GradeLevel | 'all';
  onGradeChange: (grade: GradeLevel | 'all') => void;
  role: Role;
  currentStudent: Student | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSubject,
  onSubjectChange,
  currentGrade,
  onGradeChange,
  role,
  currentStudent,
  onOpenLogin,
  onLogout,
  onOpenChangePassword,
  activeView,
  onViewChange,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Bar with Brand & Author */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Mandatory Title & Author */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  ÔN TẬP VÀ KIỂM TRA LỊCH SỬ – ĐỊA LÍ THCS
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                  Lớp 6–9
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                Tác giả: Trương Hiền Lưu
              </p>
            </div>
          </div>

          {/* User Role Badge & Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {role === 'student' && currentStudent ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-emerald-900 text-xs sm:text-sm">
                <User className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold">{currentStudent.fullName}</span>
                <span className="text-emerald-700 font-mono bg-emerald-100/70 px-1.5 py-0.5 rounded text-xs">
                  {currentStudent.classCode} • {currentStudent.studentCode}
                </span>

                {/* Change Password Button */}
                {onOpenChangePassword && (
                  <button
                    onClick={onOpenChangePassword}
                    title="Đổi mật khẩu tài khoản học sinh"
                    className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Key className="w-3 h-3 text-amber-600" />
                    <span className="hidden sm:inline">Đổi mật khẩu</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="ml-1 p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/50 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : role === 'author' ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-lg text-amber-900 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="font-semibold">Giáo viên Biên soạn</span>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="ml-1 p-1 text-amber-700 hover:text-amber-950 hover:bg-amber-200/50 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : role === 'admin' ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-lg text-indigo-900 text-xs sm:text-sm">
                <Shield className="w-4 h-4 text-indigo-700" />
                <span className="font-semibold">Giáo viên Quản lý</span>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="ml-1 p-1 text-indigo-700 hover:text-indigo-950 hover:bg-indigo-200/50 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập hệ thống</span>
              </button>
            )}

            {/* Quick Switch Button (allows logging in as teacher or switching account anytime) */}
            <button
              onClick={onOpenLogin}
              className="text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 border border-slate-200/80 shadow-2xs"
              title="Đổi vai trò hoặc đăng nhập giáo viên"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>{role === 'student' ? 'Đổi vai trò / Đăng nhập GV' : 'Đổi vai trò'}</span>
            </button>
          </div>
        </div>

        {/* Navigation & Filter Ribbon */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Subject Pills (Distinct Amber/Terracotta for Lịch sử, Emerald/Teal for Địa lí) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => onSubjectChange('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentSubject === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả môn
            </button>
            <button
              onClick={() => onSubjectChange('lich-su')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentSubject === 'lich-su'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Lịch sử
            </button>
            <button
              onClick={() => onSubjectChange('dia-li')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentSubject === 'dia-li'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Địa lí
            </button>
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-slate-500 mr-1.5 shrink-0">Khối lớp:</span>
            {(['all', 6, 7, 8, 9] as const).map((grade) => (
              <button
                key={grade}
                onClick={() => onGradeChange(grade)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  currentGrade === grade
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grade === 'all' ? 'Tất cả' : `Lớp ${grade}`}
              </button>
            ))}
          </div>

          {/* Role Navigation View Tabs */}
          {role === 'author' && (
            <div className="flex items-center gap-1 border-l sm:pl-3 border-slate-200">
              <button
                onClick={() => onViewChange('curriculum')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  activeView === 'curriculum' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Nội dung ôn tập
              </button>
              <button
                onClick={() => onViewChange('questions')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  activeView === 'questions' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Ngân hàng câu hỏi
              </button>
              <button
                onClick={() => onViewChange('ai-generator')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md ${
                  activeView === 'ai-generator' ? 'bg-amber-600 text-white font-semibold' : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                AI Biên soạn
              </button>
            </div>
          )}

          {role === 'admin' && (
            <div className="flex items-center gap-1 border-l sm:pl-3 border-slate-200">
              <button
                onClick={() => onViewChange('classes')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  activeView === 'classes' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Lớp & Học sinh
              </button>
              <button
                onClick={() => onViewChange('exams')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  activeView === 'exams' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Đề kiểm tra
              </button>
              <button
                onClick={() => onViewChange('results')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  activeView === 'results' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Thống kê kết quả
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
