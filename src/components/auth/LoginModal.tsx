/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Role, Student } from '../../types';
import { loginApi } from '../../services/api';
import { Shield, Sparkles, User, Key, School, AlertCircle, X, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: Role, student?: Student) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'author' | 'admin'>('student');
  const [classCode, setClassCode] = useState('6A1');
  const [studentCode, setStudentCode] = useState('HS601');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginApi({
        role: selectedRole,
        password: password.trim(),
        classCode: classCode.trim().toUpperCase(),
        studentCode: studentCode.trim().toUpperCase(),
      });

      if (res.success) {
        onLoginSuccess(res.role, res.student);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: 'student' | 'author' | 'admin') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'student') {
      setClassCode('6A1');
      setStudentCode('HS601');
    } else if (role === 'author') {
      setPassword('biensan2025');
    } else if (role === 'admin') {
      setPassword('quanly2025');
    }
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
              onClick={() => { setSelectedRole('student'); setError(null); }}
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
              onClick={() => { setSelectedRole('author'); setError(null); }}
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
              onClick={() => { setSelectedRole('admin'); setError(null); }}
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
                  <p className="text-emerald-700">Chỉ cần nhập chính xác Mã lớp và Mã học sinh do nhà trường cấp để vào ôn tập và làm bài.</p>
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
                    Mã Học Sinh (ví dụ: HS601, HS602...)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="HS601"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>
              </>
            ) : selectedRole === 'author' ? (
              <>
                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-800 mb-3">
                  <p className="font-semibold mb-0.5">Giáo viên Biên soạn (Author):</p>
                  <p className="text-amber-700">Có quyền tạo/sửa/xóa nội dung ôn tập, ngân hàng câu hỏi, tải tài liệu để AI sinh câu hỏi.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mật khẩu truy cập
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Mật khẩu biên soạn..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Mật khẩu mặc định: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-800 font-mono">biensan2025</code></p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-800 mb-3">
                  <p className="font-semibold mb-0.5">Giáo viên Quản lý (Admin/Controller):</p>
                  <p className="text-indigo-700">Có toàn quyền cấu hình lớp học, danh sách học sinh, cấu hình bài kiểm tra, xem kết quả và thống kê.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mật khẩu quản trị
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Mật khẩu quản trị..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Mật khẩu mặc định: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-800 font-mono">quanly2025</code></p>
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

          {/* Quick Demo Credentials Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">Bấm nhanh để thử nghiệm tài khoản mẫu:</span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-medium transition-colors"
              >
                Học sinh (6A1 - HS601)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('author')}
                className="text-[11px] px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md font-medium transition-colors"
              >
                GV Biên soạn
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium transition-colors"
              >
                GV Quản lý
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
