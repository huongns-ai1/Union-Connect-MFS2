/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Member, User } from '../types';
import { Users, UserCheck, ShieldAlert, Award, ArrowUpRight, TrendingUp, Building2, MapPin, Network } from 'lucide-react';
import { BRANCH_DEPARTMENTS } from '../data';

interface DashboardProps {
  members: Member[];
  currentUser: User;
  branches: string[];
}

export default function Dashboard({ members, currentUser, branches }: DashboardProps) {
  // Filter members that are not deleted
  const activeMembersDatabase = useMemo(() => {
    return members.filter(m => !m.DeletedAt);
  }, [members]);

  // If Branch Admin, narrow the scoped view
  const userBranchFilteredMembers = useMemo(() => {
    if (currentUser.role === 'ADMIN_BRANCH') {
      return activeMembersDatabase.filter(m => m.Branch === currentUser.branch);
    }
    return activeMembersDatabase;
  }, [activeMembersDatabase, currentUser]);

  // Main KPI values
  const totalCount = userBranchFilteredMembers.length;
  
  const activeCount = useMemo(() => {
    return userBranchFilteredMembers.filter(m => m.Status === 'Đang hoạt động').length;
  }, [userBranchFilteredMembers]);

  const suspendedCount = useMemo(() => {
    return userBranchFilteredMembers.filter(m => m.Status === 'Tạm dừng').length;
  }, [userBranchFilteredMembers]);

  const transferredCount = useMemo(() => {
    return userBranchFilteredMembers.filter(m => m.Status === 'Đã chuyển sinh hoạt').length;
  }, [userBranchFilteredMembers]);

  const genderStats = useMemo(() => {
    const male = userBranchFilteredMembers.filter(m => m.Gender === 'Nam').length;
    const female = userBranchFilteredMembers.filter(m => m.Gender === 'Nữ').length;
    const malePct = totalCount > 0 ? Math.round((male / totalCount) * 100) : 0;
    const femalePct = totalCount > 0 ? Math.round((female / totalCount) * 100) : 0;
    return { male, female, malePct, femalePct };
  }, [userBranchFilteredMembers, totalCount]);

  // Calculate statistics per branch
  const branchData = useMemo(() => {
    return branches.map(brName => {
      const brMembers = activeMembersDatabase.filter(m => m.Branch === brName);
      const activeBr = brMembers.filter(m => m.Status === 'Đang hoạt động').length;
      return {
        name: brName,
        total: brMembers.length,
        active: activeBr,
        inactive: brMembers.length - activeBr
      };
    });
  }, [activeMembersDatabase, branches]);

  // Calculate statistics per department for filtered members
  const departmentData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    userBranchFilteredMembers.forEach(m => {
      deptMap[m.Department] = (deptMap[m.Department] || 0) + 1;
    });
    return Object.entries(deptMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);
  }, [userBranchFilteredMembers]);

  // Growth tracker simulation (recent union members joined)
  const recentJoins = useMemo(() => {
    return [...userBranchFilteredMembers]
      .sort((a, b) => b.JoinDate.localeCompare(a.JoinDate))
      .slice(0, 4);
  }, [userBranchFilteredMembers]);

  // Render responsive SVG charts with premium styling
  const maxBrMembers = Math.max(...branchData.map(b => b.total), 1);

  return (
    <div className="space-y-6">
      {/* Scope Alert Badge for Branch Admin */}
      {currentUser.role === 'ADMIN_BRANCH' && (
        <div id="branch-warning-alert" className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-800">
          <Building2 className="w-5 h-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm">
            Bạn đang xem dữ liệu thuộc chi nhánh <strong>{currentUser.branch}</strong>. Một số bảng biểu tổng bộ đã bị ẩn hoặc lọc để bảo mật.
          </div>
        </div>
      )}

      {/* Grid KPI Boxes */}
      <div id="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số đoàn viên</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> 100%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        {/* KPI 2 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang hoạt động</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">{activeCount}</span>
              <span className="text-xs font-medium text-slate-500">
                {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% tỉ lệ
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </motion.div>

        {/* KPI 3 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tạm dừng sinh hoạt</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600 tracking-tight">{suspendedCount}</span>
              <span className="text-xs font-medium text-slate-400">nghỉ thai sản/chờ</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </motion.div>

        {/* KPI 4 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chi chuyển sinh hoạt</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-500 tracking-tight">{transferredCount}</span>
              <span className="text-xs font-medium text-slate-400">chuyển công tác</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Award className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div id="charts-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left chart (Always show/conditional rendering for Super Admin / Branch Admin differences) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Phân bố Đoàn viên theo Chi nhánh</h3>
              <p className="text-xs text-slate-500">Số lượng đoàn viên thực tế cập nhật thời gian thực</p>
            </div>
            {currentUser.role === 'ADMIN_SUPER' && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium"> Toàn hệ thống </span>}
          </div>

          <div className="space-y-4 pt-2">
            {branchData.map((branch, idx) => {
              const percentage = Math.round((branch.total / maxBrMembers) * 100);
              const isCurrentUserBranch = branch.name === currentUser.branch;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <MapPin className={`w-3.5 h-3.5 ${isCurrentUserBranch ? 'text-blue-600' : 'text-slate-400'}`} />
                      {branch.name} {isCurrentUserBranch && <span className="text-[10px] text-blue-500 bg-blue-50 px-1 rounded font-normal">(Chi nhánh của bạn)</span>}
                    </span>
                    <span className="text-slate-900">{branch.total} đoàn viên ({branch.active} Đang hoạt động)</span>
                  </div>
                  <div className="w-full h-8 bg-slate-50 rounded-lg overflow-hidden flex relative items-center px-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                      className={`h-6 rounded-md flex items-center justify-end pr-2 min-w-[20px] ${
                        isCurrentUserBranch 
                          ? 'bg-gradient-to-r from-blue-500 to-sky-400 text-white font-semibold' 
                          : 'bg-gradient-to-r from-slate-300 to-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] select-none">{percentage > 15 ? `${percentage}%` : ''}</span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right card: Gender Distribution & Active Rate status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 font-sans">Chi tiết Nhân học</h3>
            <p className="text-xs text-slate-500">Tỷ lệ giới tính & cơ cấu hoạt động</p>
          </div>

          {/* Gender dynamic Donut representation in beautiful custom SVG */}
          {totalCount === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">Không có dữ liệu hiển thị</div>
          ) : (
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Visual donut using circular stroke dashes */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                  {/* Female stroke */}
                  <motion.circle
                     cx="64"
                     cy="64"
                     r="50"
                     fill="transparent"
                     stroke="#ec4899"
                     strokeWidth="14"
                     strokeDasharray={2 * Math.PI * 50}
                     initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                     animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - genderStats.femalePct / 100) }}
                     transition={{ duration: 1 }}
                  />
                  {/* Male stroke */}
                  <motion.circle
                     cx="64"
                     cy="64"
                     r="50"
                     fill="transparent"
                     stroke="#3b82f6"
                     strokeWidth="14"
                     strokeDasharray={2 * Math.PI * 50}
                     strokeDashoffset={2 * Math.PI * 50 * (1 - genderStats.malePct / 100)}
                     className="transform origin-center rotate-180" // Starts from opposite to clearly split
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.3 }}
                  />
                </svg>
                {/* Center text representing ratio */}
                <div className="absolute text-center">
                  <span className="block text-2xl font-bold text-slate-800">{totalCount}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">T.Số</span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 block"></span>
                  <div>
                    <span className="block text-slate-700">Nam</span>
                    <span className="block text-slate-900 font-bold text-sm">{genderStats.male} ({genderStats.malePct}%)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-pink-500 block"></span>
                  <div>
                    <span className="block text-slate-700">Nữ</span>
                    <span className="block text-slate-900 font-bold text-sm">{genderStats.female} ({genderStats.femalePct}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Status Rate indicator card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-500 block">Mức độ hoạt động tích cực</span>
              <span className="text-sm font-semibold text-slate-800">
                {totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Organizational Chart (Sơ đồ tổ chức thực tế) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 block">
                <Network className="w-4 h-4" />
              </span>
              Sơ đồ Cơ cấu Tổ chức Công đoàn MFS
            </h3>
            <p className="text-xs text-slate-500">Mô hình cây phân cấp nhân sự thực tế, đồng bộ dữ liệu thời gian thực</p>
          </div>
          <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-center">
            <Users className="w-3.5 h-3.5" />
            Tổng cộng: {activeMembersDatabase.filter(m => m.Status === 'Đang hoạt động').length} Đoàn viên Đang hoạt động
          </span>
        </div>

        {/* Tree flow container */}
        <div className="space-y-8">
          {/* Root Level: Tổng Công ty */}
          <div className="flex flex-col items-center relative">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800 text-center w-64 z-10 hover:shadow-lg transition cursor-default">
              <span className="text-[10px] tracking-wider uppercase opacity-75 font-semibold block">Cơ quan điều hành</span>
              <strong className="text-xs font-black block mt-0.5">VĂN PHÒNG TỔNG CÔNG TY MFS</strong>
              <div className="mt-2 text-[10px] bg-slate-800 border border-slate-700 rounded py-1 px-1.5 text-blue-300 font-bold">
                {members.filter(m => m.Branch === 'Văn phòng tổng công ty MFS' && !m.DeletedAt && m.Status === 'Đang hoạt động').length} Đoàn viên hoạt động
              </div>
            </div>
            {/* Downward connector line to branches */}
            <div className="w-0.5 h-8 bg-slate-200 mt-0"></div>
          </div>

          {/* Children: 4 main entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative">
            {/* Horizontal bridge line behind cards in desktop view */}
            <div className="hidden xl:block absolute top-0 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 -mt-8 z-0"></div>

            {/* Văn phòng TCT Departments */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-2xs relative">
              <div className="xl:absolute xl:top-0 xl:left-1/2 xl:-translate-x-1/2 xl:h-8 xl:w-0.5 xl:bg-slate-200 xl:-mt-12 z-0"></div>
              <div className="text-center pb-2 border-b border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Khối cơ quan</span>
                <strong className="text-xs font-extrabold text-slate-800 block">VP TỔNG CÔNG TY</strong>
              </div>
              <div className="space-y-2">
                {BRANCH_DEPARTMENTS['Văn phòng tổng công ty MFS'].map(dept => {
                  const cnt = members.filter(m => m.Branch === 'Văn phòng tổng công ty MFS' && m.Department === dept && !m.DeletedAt && m.Status === 'Đang hoạt động').length;
                  return (
                    <div key={dept} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs hover:border-blue-200 hover:shadow-2xs transition flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{dept}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cnt > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {cnt} ĐV
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chi nhánh Miền Bắc */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-2xs relative">
              <div className="xl:absolute xl:top-0 xl:left-1/2 xl:-translate-x-1/2 xl:h-8 xl:w-0.5 xl:bg-slate-200 xl:-mt-12 z-0"></div>
              <div className="text-center pb-2 border-b border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Miền Bắc</span>
                <strong className="text-xs font-extrabold text-slate-800 block">CHI NHÁNH MIỀN BẮC</strong>
              </div>
              <div className="space-y-2">
                {BRANCH_DEPARTMENTS['Chi nhánh miền Bắc'].map(dept => {
                  const cnt = members.filter(m => m.Branch === 'Chi nhánh miền Bắc' && m.Department === dept && !m.DeletedAt && m.Status === 'Đang hoạt động').length;
                  return (
                    <div key={dept} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs hover:border-blue-200 hover:shadow-2xs transition flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{dept}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cnt > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {cnt} ĐV
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chi nhánh Miền Trung */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-2xs relative">
              <div className="xl:absolute xl:top-0 xl:left-1/2 xl:-translate-x-1/2 xl:h-8 xl:w-0.5 xl:bg-slate-200 xl:-mt-12 z-0"></div>
              <div className="text-center pb-2 border-b border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Miền Trung</span>
                <strong className="text-xs font-extrabold text-slate-800 block">CHI NHÁNH MIỀN TRUNG</strong>
              </div>
              <div className="space-y-2">
                {BRANCH_DEPARTMENTS['Chi nhánh miền Trung'].map(dept => {
                  const cnt = members.filter(m => m.Branch === 'Chi nhánh miền Trung' && m.Department === dept && !m.DeletedAt && m.Status === 'Đang hoạt động').length;
                  return (
                    <div key={dept} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs hover:border-blue-200 hover:shadow-2xs transition flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{dept}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cnt > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {cnt} ĐV
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chi nhánh Miền Nam */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-2xs relative">
              <div className="xl:absolute xl:top-0 xl:left-1/2 xl:-translate-x-1/2 xl:h-8 xl:w-0.5 xl:bg-slate-200 xl:-mt-12 z-0"></div>
              <div className="text-center pb-2 border-b border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Miền Nam</span>
                <strong className="text-xs font-extrabold text-slate-800 block">CHI NHÁNH MIỀN NAM</strong>
              </div>
              <div className="space-y-2">
                {BRANCH_DEPARTMENTS['Chi nhánh miền Nam'].map(dept => {
                  const cnt = members.filter(m => m.Branch === 'Chi nhánh miền Nam' && m.Department === dept && !m.DeletedAt && m.Status === 'Đang hoạt động').length;
                  return (
                    <div key={dept} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs hover:border-blue-200 hover:shadow-2xs transition flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{dept}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cnt > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {cnt} ĐV
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Row 3: Members by Department & Recent Joins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department chart (Vertical stack layout) */}
        <div id="dept-distribution" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Tính cơ cấu theo Phòng ban</h3>
            <p className="text-xs text-slate-500">Mật độ tập trung đoàn viên trẻ tại các bộ phận hành chính, kỹ thuật</p>
          </div>

          {departmentData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">Không có dữ liệu thuộc phạm vi hiển thị</div>
          ) : (
            <div className="space-y-3 pt-2">
              {departmentData.map((dept, idx) => {
                const maxVal = Math.max(...departmentData.map(d => d.value), 1);
                const percent = Math.round((dept.value / maxVal) * 100);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-semibold text-slate-600 truncate" title={dept.name}>
                      {dept.name}
                    </span>
                    <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-slate-800">
                      {dept.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently joined members feed */}
        <div id="recent-joins-feed" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Đoàn viên mới gia nhập</h3>
              <p className="text-xs text-slate-500">Danh sách tiếp nhận sinh hoạt Đảng - Đoàn gần nhất</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Sức trẻ Mobifone
            </span>
          </div>

          {recentJoins.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 text-center py-8">
              Chưa tiếp nhận đoàn viên nào thuộc chi nhánh này
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentJoins.map((member, idx) => (
                <div key={member.MemberID} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 font-bold text-xs text-blue-700 flex items-center justify-center border border-slate-200">
                      {member.FullName.split(' ').pop()?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-800">{member.FullName}</span>
                      <span className="block text-xs text-slate-500">{member.EmployeeCode} • {member.Department}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="block font-medium text-slate-700">{member.JoinDate.split('-').reverse().join('/')}</span>
                    <span className="text-[10px] text-slate-400">Ngày vào đoàn</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
