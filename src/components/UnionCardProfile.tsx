/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Member } from '../types';
import { Award, ShieldCheck, Mail, Phone, Calendar, Flag, QrCode, FileText, CheckCircle2, ChevronRight, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UnionCardProfileProps {
  currentUser: User;
  members: Member[];
  onUpdateMember: (member: Member) => void;
}

export default function UnionCardProfile({ currentUser, members, onUpdateMember }: UnionCardProfileProps) {
  // Try to find the matching member record based on employeeCode or email matches
  const memberRecord = members.find(
    m => m.EmployeeCode === currentUser.employeeCode || m.Email === currentUser.email
  );

  // Correction request form state for testing
  const [requestCorrOpen, setRequestCorrOpen] = useState(false);
  const [wrongField, setWrongField] = useState('FullName');
  const [correctedValue, setCorrectedValue] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctedValue.trim()) return;

    if (memberRecord) {
      // Simulate applying correct value immediately for the demo to feel satisfying, or dispatching
      const updatedMockMember = { ...memberRecord };
      if (wrongField === 'FullName') updatedMockMember.FullName = correctedValue;
      if (wrongField === 'Phone') updatedMockMember.Phone = correctedValue;
      if (wrongField === 'Email') updatedMockMember.Email = correctedValue;
      if (wrongField === 'DOB') updatedMockMember.DOB = correctedValue;
      
      onUpdateMember(updatedMockMember);
    }

    setFeedbackSuccess(`Đã gửi yêu cầu hiệu chỉnh thông tin tới BCH Công đoàn hệ thống. Hệ thống đã cập nhật tức thời để Demo!`);
    setCorrectedValue('');
    setRequestCorrOpen(false);
    setTimeout(() => setFeedbackSuccess(''), 4500);
  };

  if (!memberRecord) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center max-w-md mx-auto space-y-4">
        <Award className="w-12 h-12 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-bold text-slate-800">Không tìm thấy thông tin Thẻ đoàn viên</h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Tài khoản hiện tại ({currentUser.email}) chưa được liên kết với một hồ sơ nhân viên khả dụng trên Union Connect. Vui lòng phản hồi admin để cập nhật.
          </p>
        </div>
      </div>
    );
  }

  // Calculate age based on current year 2026
  const birthYear = new Date(memberRecord.DOB).getFullYear();
  const calculatedAge = 2026 - birthYear;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Toast alert indicator */}
      <AnimatePresence>
        {feedbackSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-55 bg-emerald-600 font-semibold border border-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{feedbackSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Card: 3D Aesthetic Virtual Union Card */}
      <div className="lg:col-span-1 space-y-4">
        
        <div className="relative bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-900 rounded-3xl p-6 text-white overflow-hidden shadow-xl border border-blue-400/20 aspect-[1.58/1] flex flex-col justify-between">
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-400/10 rounded-full blur-2xl" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-200">MOBIFONESERVICE</span>
              <span className="block text-[8px] uppercase font-semibold text-slate-300">HỘI ĐỒNG BAN CHẤP HÀNH CÔNG ĐOÀN</span>
            </div>
            {/* Visual simulation of digital chip inside standard security credit card */}
            <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-300/45 flex flex-col gap-1 px-1 justify-center">
              <div className="h-0.5 bg-slate-800/20 rounded"></div>
              <div className="h-0.5 bg-slate-800/20 rounded"></div>
              <div className="h-0.5 bg-slate-800/20 rounded"></div>
            </div>
          </div>

          {/* Member Name Info */}
          <div className="py-2.5 space-y-1.5 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center font-bold text-base shadow-sm ${
              memberRecord.Gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {memberRecord.FullName.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <strong className="text-base font-bold tracking-tight block">{memberRecord.FullName}</strong>
              <span className="text-[10px] text-blue-200 font-semibold tracking-wider font-mono">CODE: {memberRecord.EmployeeCode}</span>
            </div>
          </div>

          {/* Info details foot */}
          <div className="flex items-center justify-between text-[10px] border-t border-white/10 pt-2.5">
            <div>
              <span className="text-blue-200 block text-[8px] uppercase">Chức vụ Đoàn</span>
              <span className="font-bold text-amber-300">{memberRecord.UnionPosition}</span>
            </div>
            <div className="text-right">
              <span className="text-blue-200 block text-[8px] uppercase">Vào Đoàn ngày</span>
              <span className="font-mono">{memberRecord.JoinDate.split('-').reverse().join('/')}</span>
            </div>
          </div>
        </div>

        {/* Digital Verification Certificate Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
          <div className="flex items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded-xl max-w-[120px] mx-auto">
            <QrCode className="w-16 h-16 text-slate-800" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-800 block">Mã số thẻ ĐK: {memberRecord.MemberID.substring(0, 8)}</span>
            <p className="text-[10px] text-slate-400 mt-1">Sử dụng QR này để quét điểm danh trực tiếp tại các sự kiện học tập và đại hội của MobifoneService.</p>
          </div>
        </div>

      </div>

      {/* Middle & Right Column: Details & correction requests */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Profile metadata */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Chi tiết Hồ sơ Công đoàn</h3>
              <p className="text-xs text-slate-500">Tra cứu thông tin cá nhân hiện đại được lưu trên hệ thống</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Tài khoản Đạt chuẩn
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-medium text-slate-600">
            <div className="space-y-1">
              <span className="text-slate-400 block font-medium">Họ và tên đầy đủ</span>
              <strong className="text-slate-900 text-sm block">{memberRecord.FullName}</strong>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">Giới tính - Tuổi tác</span>
              <strong className="text-slate-900 text-sm block">{memberRecord.Gender} • {calculatedAge} tuổi</strong>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-medium">Chi nhánh trực thuộc</span>
              <strong className="text-slate-900 text-sm block">{memberRecord.Branch}</strong>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-medium">Bộ phận chuyên môn</span>
              <strong className="text-slate-900 text-sm block">{memberRecord.Department}</strong>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-medium">Vị trí chức hiệu</span>
              <strong className="text-slate-900 text-sm block">{memberRecord.Title}</strong>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block font-medium">Trạng thái sinh hoạt</span>
              <strong className="text-emerald-700 text-sm block">{memberRecord.Status}</strong>
            </div>

            <div className="space-y-1 sm:col-span-2 border-t border-slate-50 pt-3">
              <span className="text-slate-400 block font-medium">Hòm thư điện tử</span>
              <strong className="text-slate-900 text-sm block font-mono select-all">{memberRecord.Email}</strong>
            </div>

            <div className="space-y-1 sm:col-span-2 border-t border-slate-50 pt-3">
              <span className="text-slate-400 block font-medium">Số điện thoại liên lạc</span>
              <strong className="text-slate-900 text-sm block select-all">{memberRecord.Phone}</strong>
            </div>
          </div>

          {/* Quick CTA to prompt feedback submission */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setRequestCorrOpen(true)}
              className="px-4 py-2 border border-slate-200 hover:border-slate-35 border-blue-600 hover:bg-blue-50 text-blue-600 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Yêu cầu hiệu chỉnh thông tin sai lệch
            </button>
          </div>
        </div>

        {/* Form request modal correction */}
        <AnimatePresence>
          {requestCorrOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Yêu cầu báo cáo sai lệch hồ sơ</h4>
                  <p className="text-[10px] text-slate-500">Hệ thống sẽ cập nhật thông tin và báo cáo gửi về Tổng phòng Công nghệ số xử lý</p>
                </div>
                <button
                  onClick={() => setRequestCorrOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  Bỏ qua
                </button>
              </div>

              <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Mục dữ liệu sai sót</label>
                    <select
                      value={wrongField}
                      onChange={(e) => setWrongField(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none"
                    >
                      <option value="FullName">Họ và tên của tôi</option>
                      <option value="Phone">Số điện thoại liên hệ</option>
                      <option value="Email">Email hòm thư cá nhân</option>
                      <option value="DOB">Thông tin ngày sinh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Dữ liệu chính xác thay thế *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập giá trị đúng chính xác tại đây..."
                      value={correctedValue}
                      onChange={(e) => setCorrectedValue(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
