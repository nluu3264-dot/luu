/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student } from '../../types';
import { setupStudentPasswordApi } from '../../services/api';
import { ShieldCheck, Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface FirstTimePasswordModalProps {
  isOpen: boolean;
  student: Student;
  onSuccess: (updatedStudent: Student) => void;
}

export const FirstTimePasswordModal: React.FC<FirstTimePasswordModalProps> = ({
  isOpen,
  student,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      setError('Vui lòng nhập mật khẩu mới!');
      return;
    }

    if (trimmedNew.length < 4) {
      setError('Mật khẩu phải có độ dài tối thiểu 4 ký tự!');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setError('Mật khẩu xác nhận không trùng khớp với mật khẩu mới!');
      return;
    }

    setLoading(true);

    try {
      let updatedStudent: Student = {
        ...student,
        password: trimmedNew,
        hasSetPassword: true,
      };

      try {
        const res = await setupStudentPasswordApi(student.id, trimmedNew);
        if (res.student) {
          updatedStudent = { ...updatedStudent, ...res.student, hasSetPassword: true };
        }
      } catch (apiErr) {
        console.warn('API setup password fallback to local state', apiErr);
      }

      onSuccess(updatedStudent);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo mật khẩu, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 mb-1.5 uppercase tracking-wider">
            Yêu cầu bắt buộc
          </span>
          <h2 className="text-xl font-bold text-slate-900">Tạo mật khẩu lần đầu</h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Chào mừng em <strong className="text-slate-900 font-semibold">{student.fullName}</strong> ({student.studentCode} - Lớp {student.classCode}). Vì lý do an toàn tài khoản, em hãy tạo mật khẩu riêng trước khi vào ôn tập.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mật khẩu mới:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nhập lại mật khẩu mới:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại chính xác mật khẩu trên..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle className={`w-3.5 h-3.5 ${newPassword.length >= 4 ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Độ dài tối thiểu 4 ký tự</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle className={`w-3.5 h-3.5 ${confirmPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Hai ô mật khẩu trùng khớp</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Xác nhận tạo mật khẩu và bắt đầu</span>
          </button>
        </form>
      </div>
    </div>
  );
};
