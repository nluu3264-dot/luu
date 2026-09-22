/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Role, Student } from '../../types';
import { loginApi } from '../../services/api';
import { Shield, Sparkles, User, Key, School, AlertCircle, X, Check, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: Role, student?: Student, requiresPasswordSetup?: boolean) => void;
  initialRole?: 'student' | 'author' | 'admin';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'student',
}) => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'author' | 'admin'>(initialRole);
  const [classCode, setClassCode] = useState('6A1');
  const [studentCode, setStudentCode] = useState('HS601');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Student password states
  const [studentHasPassword, setStudentHasPassword] = useState(false);
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role: 'student' | 'author' | 'admin') => {
    setSelectedRole(role);
    setError(null);
    setPassword('');
    setStudentPassword('');
    setShowPassword(false);
    setShowStudentPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if ((selectedRole === 'author' || selectedRole === 'admin') && !password.trim()) {
      setError('Vui lòng nhập mật khẩu!');
      return;
    }

    if (selectedRole === 'student' && studentHasPassword && !studentPassword.trim()) {
      setError('Vui lòng nhập mật khẩu học sinh!');
      return;
    }

    setLoading(true);

    try {
      const res = await loginApi({
        role: selectedRole,
        password: selectedRole === 'student' ? studentPassword.trim() : password.trim(),
        classCode: classCode.trim().toUpperCase(),
        studentCode: studentCode.trim().toUpperCase(),
      });

      if (res.requiresPassword) {
        setStudentHasPassword(true);
        setError(res.error || 'Học sinh này đã đặt mật khẩu. Vui lòng nhập mật khẩu để đăng nhập!');
        return;
      }

      if (res.success) {
        onLoginSuccess(res.role, res.student, res.requiresPasswordSetup);
        setPassword('');
        setStudentPassword('');
        setStudentHasPassword(false);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoStudent = () => {
    setSelectedRole('student');
    setError(null);
    setClassCode('6A1');
    setStudentCode('HS601');
    setStudentHasPassword(false);
    setStudentPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Đăng nhập hệ thống</h3>
            <p className="text-xs text-slate-500">Chọn vai trò phù hợp để truy cập</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tab Selector */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`flex flex-col items-center gap-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'student'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Học sinh</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('author')}
              className={`flex flex-col items-center gap-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'author'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>GV Biên soạn</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`flex flex-col items-center gap-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'admin'
                  ? 'bg-white text-indigo-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>GV Quản lý</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedRole === 'student' ? (
              <>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 mb-3">
                  <p className="font-semibold mb-0.5">Dành cho Học sinh:</p>
                  <p className="text-emerald-700">Nhập Mã lớp và Mã học sinh (hoặc Họ tên) để vào ôn tập và làm bài. Hệ thống cho phép toàn bộ học sinh trong lớp làm bài không giới hạn sĩ số.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mã Lớp (ví dụ: 6A1, 7A1, 8A1...)
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="6A1"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mã Học Sinh hoặc Họ và Tên (ví dụ: HS601, HS636, Nguyễn Văn A...)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="HS601 hoặc Họ và tên..."
                      value={studentCode}
                      onChange={(e) => {
                        setStudentCode(e.target.value);
                        setStudentHasPassword(false);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {studentHasPassword && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mật khẩu học sinh <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        placeholder="Nhập mật khẩu của em..."
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 text-sm border border-emerald-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono bg-emerald-50/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        title={showStudentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Học sinh đã đặt mật khẩu. Vui lòng nhập mật khẩu để vào ôn tập.
                    </p>
                  </div>
                )}
              </>
            ) : selectedRole === 'author' ? (
              <>
                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-800 mb-3">
                  <p className="font-semibold mb-0.5">Giáo viên Biên soạn (Author):</p>
                  <p className="text-amber-700">Có quyền tạo/sửa/xóa nội dung ôn tập, ngân hàng câu hỏi, tải tài liệu để AI sinh câu hỏi.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mật khẩu truy cập biên soạn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu GV Biên soạn..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bắt buộc nhập mật khẩu chính xác được cấp bởi Giáo viên Quản lý.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-800 mb-3">
                  <p className="font-semibold mb-0.5">Giáo viên Quản lý (Admin/Controller):</p>
                  <p className="text-indigo-700">Có toàn quyền cấu hình lớp học, danh sách học sinh, bài kiểm tra, xem kết quả và đổi mật khẩu.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mật khẩu quản trị cấp cao <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu quản trị..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bắt buộc nhập đúng mật khẩu quản trị để vào hệ thống quản lý.
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Xác nhận đăng nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper (Học sinh only, no password bypass for teachers) */}
          {selectedRole === 'student' && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleFillDemoStudent}
                className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <span>Điền nhanh thông tin HS mẫu (Lớp 6A1 - Mã HS601)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
