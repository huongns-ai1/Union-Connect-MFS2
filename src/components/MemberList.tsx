/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Member, User,Gender, MemberStatus } from '../types';
import { 
  Search, Filter, UserPlus, Download, Upload, Trash2, Edit2, Eye, 
  X, Check, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BRANCH_DEPARTMENTS } from '../data';

interface MemberListProps {
  members: Member[];
  currentUser: User;
  branches: string[];
  departments: string[];
  unionPositions: string[];
  onAddMember: (member: Omit<Member, 'MemberID'>) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onRestoreMember: (id: string) => void;
  onTriggerImportView: () => void;
}

export default function MemberList({
  members,
  currentUser,
  branches,
  departments,
  unionPositions,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onRestoreMember,
  onTriggerImportView
}: MemberListProps) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>(
    currentUser.role !== 'ADMIN_SUPER' ? currentUser.branch : 'All'
  );
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('All'); // 'under25', '25_35', 'over35'
  const [showTrash, setShowTrash] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Masking helpers for security/privacy checks
  const maskPhone = (phone: string) => {
    if (!phone) return '';
    if (phone.length < 7) return '***';
    return phone.slice(0, 4) + '***' + phone.slice(-3);
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***';
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 3) return '***@' + domain;
    return name.slice(0, 2) + '***' + name.slice(-1) + '@' + domain;
  };

  // Modals state
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states (Create form)
  const [newEmployeeCode, setNewEmployeeCode] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('Nam');
  const [newDOB, setNewDOB] = useState('1998-01-01');
  const initialBranch = currentUser.role === 'ADMIN_BRANCH' ? currentUser.branch : branches[0];
  const [newBranch, setNewBranch] = useState(initialBranch);
  const [newDept, setNewDept] = useState(() => {
    const depts = BRANCH_DEPARTMENTS[initialBranch] || departments;
    return depts[0];
  });
  const [newJoinDate, setNewJoinDate] = useState('2022-01-01');
  const [newStatus, setNewStatus] = useState<MemberStatus>('Đang hoạt động');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUnionPosition, setNewUnionPosition] = useState('Đoàn viên');
  const [newTitle, setNewTitle] = useState('');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Sửa form states (Edit form mapped on opening)
  const [editForm, setEditForm] = useState<Member | null>(null);
  const [editError, setEditError] = useState('');

  // States for Premium Export Options Modal (Criteria-driven)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportIncludeHeaders, setExportIncludeHeaders] = useState(true);
  const [exportFilename, setExportFilename] = useState('');
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    EmployeeCode: true,
    FullName: true,
    Gender: true,
    DOB: true,
    Branch: true,
    Department: true,
    UnionPosition: true,
    Title: true,
    JoinDate: true,
    Status: true,
    Phone: true,
    Email: true
  });

  // Helper: calculate age based on 2026 current year
  const calculateAge = (dob: string) => {
    try {
      const birthYear = new Date(dob).getFullYear();
      return 2026 - birthYear;
    } catch {
      return 28;
    }
  };

  // Filter members list based on state controls
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // 1. Soft Delete filter
      if (showTrash) {
        if (!member.DeletedAt) return false;
      } else {
        if (member.DeletedAt) return false;
      }

      // 2. Branch separation
      if (currentUser.role !== 'ADMIN_SUPER') {
        if (member.Branch !== currentUser.branch) return false;
      } else if (selectedBranch !== 'All') {
        if (member.Branch !== selectedBranch) return false;
      }

      // 3. Search text (Name, Code, Phone, Email)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = member.FullName.toLowerCase().includes(term);
        const codeMatch = member.EmployeeCode.toLowerCase().includes(term);
        const phoneMatch = member.Phone.includes(term);
        const emailMatch = member.Email.toLowerCase().includes(term);
        if (!nameMatch && !codeMatch && !phoneMatch && !emailMatch) return false;
      }

      // 4. Department
      if (selectedDept !== 'All' && member.Department !== selectedDept) return false;

      // 5. Gender
      if (selectedGender !== 'All' && member.Gender !== selectedGender) return false;

      // 6. Status
      if (selectedStatus !== 'All' && member.Status !== selectedStatus) return false;

      // 7. Age categorization
      if (selectedAgeRange !== 'All') {
        const age = calculateAge(member.DOB);
        if (selectedAgeRange === 'youth' && age >= 25) return false;
        if (selectedAgeRange === 'mid' && (age < 25 || age > 35)) return false;
        if (selectedAgeRange === 'senior' && age <= 35) return false;
      }

      return true;
    });
  }, [members, searchTerm, selectedBranch, selectedDept, selectedGender, selectedStatus, selectedAgeRange, showTrash, currentUser]);

  // Pagination calculation
  const totalItems = filteredMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Generate descriptive filename based on selected criteria
  const openExportSetupModal = () => {
    let parts = ['CongDoan_DS'];
    if (selectedBranch !== 'All') {
      const cleanBr = selectedBranch.replace(/mfs/i, '').replace(/chi nhanh/i, '').replace(/trung tam/i, '').trim().replace(/\s+/g, '_');
      parts.push(`CN_${cleanBr}`);
    }
    if (selectedDept !== 'All') {
      const cleanDept = selectedDept.replace(/to cd/i, '').replace(/phong/i, '').trim().replace(/\s+/g, '_');
      parts.push(`To_${cleanDept}`);
    }
    if (selectedStatus !== 'All') {
      parts.push(selectedStatus.replace(/\s+/g, '_'));
    }
    if (selectedGender !== 'All') {
      parts.push(selectedGender);
    }
    const today = new Date().toISOString().slice(0, 10);
    parts.push(today);
    
    const rawFilename = parts.join('_') + '.csv';
    const sanitizedFilename = rawFilename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9_\-\.]/g, '');

    setExportFilename(sanitizedFilename);
    setIsExportModalOpen(true);
  };

  // CSV Export utility with column choice and criteria header block
  const executeCustomExport = () => {
    // Columns Configuration mapping
    const colPairs = [
      { key: 'EmployeeCode', header: 'EmployeeCode' },
      { key: 'FullName', header: 'FullName' },
      { key: 'Gender', header: 'Gender' },
      { key: 'DOB', header: 'DOB' },
      { key: 'Branch', header: 'Branch' },
      { key: 'Department', header: 'Department' },
      { key: 'UnionPosition', header: 'UnionPosition' },
      { key: 'Title', header: 'Title' },
      { key: 'JoinDate', header: 'JoinDate' },
      { key: 'Status', header: 'Status' },
      { key: 'Phone', header: 'Phone' },
      { key: 'Email', header: 'Email' }
    ];

    const activePairs = colPairs.filter(p => exportColumns[p.key]);
    
    if (activePairs.length === 0) {
      alert('Vui lòng chọn ít nhất một cột cần xuất dữ liệu!');
      return;
    }

    const csvHeaders = activePairs.map(p => p.header);

    // Prepare rows with cell value wrapping
    const csvRows = filteredMembers.map(m => {
      return activePairs.map(p => {
        let val = '';
        if (p.key === 'EmployeeCode') val = m.EmployeeCode;
        else if (p.key === 'FullName') val = m.FullName;
        else if (p.key === 'Gender') val = m.Gender;
        else if (p.key === 'DOB') val = m.DOB;
        else if (p.key === 'Branch') val = m.Branch;
        else if (p.key === 'Department') val = m.Department;
        else if (p.key === 'UnionPosition') val = m.UnionPosition;
        else if (p.key === 'Title') val = m.Title;
        else if (p.key === 'JoinDate') val = m.JoinDate;
        else if (p.key === 'Status') val = m.Status;
        else if (p.key === 'Phone') val = m.Phone;
        else if (p.key === 'Email') val = m.Email;

        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });

    const fileRows: string[] = [];

    // Optional metadata report block
    if (exportIncludeHeaders) {
      fileRows.push('BÁO CÁO DANH SÁCH ĐOÀN VIÊN CÔNG ĐOÀN CƠ SỞ MOBIFONE SERVICE');
      fileRows.push(`Bộ lọc áp dụng - Chi nhánh: ${selectedBranch}, Tổ công đoàn: ${selectedDept}, Sinh hoạt: ${selectedStatus}, Giới tính: ${selectedGender}, Phân nhóm tuổi: ${selectedAgeRange === 'youth' ? 'Dưới 25 tuổi' : selectedAgeRange === 'mid' ? '25 - 35 tuổi' : selectedAgeRange === 'senior' ? 'Trên 35 tuổi' : 'Mọi lứa tuổi'}`);
      fileRows.push(`Ngày xuất file: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')} - Tổng cộng: ${filteredMembers.length} kết quả`);
      fileRows.push(`Người lập báo cáo: ${currentUser.fullName} (${currentUser.role === 'ADMIN_SUPER' ? 'Admin Tổng Công ty' : currentUser.role === 'ADMIN_BRANCH' ? 'Admin Chi nhánh' : 'Quản trị viên'})`);
      fileRows.push('------------------------------------------------------------------------');
    }

    // Append headers and content
    fileRows.push(csvHeaders.join(','));
    csvRows.forEach(row => fileRows.push(row));

    const csvContent = "\uFEFF" + fileRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    let secureFilename = exportFilename.trim();
    if (!secureFilename.endsWith('.csv')) secureFilename += '.csv';
    
    link.setAttribute("download", secureFilename || 'danh_sach_cong_doan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
    showNotification('Đã xuất báo cáo theo tiêu chí (' + filteredMembers.length + ' đoàn viên) thành công!');
  };

  // UI Notification Helper
  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Form submit add new
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Form validations
    if (!newEmployeeCode.trim() || !newFullName.trim() || !newPhone.trim() || !newEmail.trim()) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setFormError('Email không hợp lệ.');
      return;
    }

    // Phone simple check
    if (newPhone.length < 8) {
      setFormError('Số điện thoại không hợp lệ.');
      return;
    }

    // Check duplicate code
    const isDuplicate = members.some(m => m.EmployeeCode.toUpperCase() === newEmployeeCode.toUpperCase() && !m.DeletedAt);
    if (isDuplicate) {
      setFormError(`Mã nhân viên ${newEmployeeCode} đã tồn tại trong hệ thống.`);
      return;
    }

    onAddMember({
      EmployeeCode: newEmployeeCode.toUpperCase(),
      FullName: newFullName,
      Gender: newGender,
      DOB: newDOB,
      Branch: newBranch,
      Department: newDept,
      JoinDate: newJoinDate,
      Status: newStatus,
      Phone: newPhone,
      Email: newEmail,
      UnionPosition: newUnionPosition,
      Title: newTitle || 'Chuyên viên'
    });

    // Reset create state
    setNewEmployeeCode('');
    setNewFullName('');
    setNewPhone('');
    setNewEmail('');
    setNewTitle('');
    setIsCreateOpen(false);
    showNotification('Đã thêm đoàn viên mới thành công!');
    setCurrentPage(1);
  };

  // Open edit modal and load active data
  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setEditForm({ ...m });
    setEditError('');
  };

  // Form submit edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    if (!editForm.FullName.trim() || !editForm.Phone.trim() || !editForm.Email.trim()) {
      setEditError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.Email)) {
      setEditError('Email không hợp lệ.');
      return;
    }

    onUpdateMember(editForm);
    setEditingMember(null);
    setEditForm(null);
    showNotification('Đã cập nhật thông tin đoàn viên thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Toast Success banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-emerald-500 font-medium"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header operations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>Danh sách Đoàn viên</span>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {filteredMembers.length} kết quả
            </span>
          </h2>
          <p className="text-xs text-slate-500">Tìm kiếm, cập nhật hồ sơ, phân tích độ tuổi, vị trí đoàn viên</p>
        </div>

        {/* Buttons: Add / Import / Export / View Trash Bin */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role !== 'MEMBER' && (
            <button
              id="toggle-trash-btn"
              onClick={() => { setShowTrash(!showTrash); setCurrentPage(1); }}
              className={`px-3 py-2 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showTrash 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {showTrash ? 'Quay lại danh sách' : 'Thùng rác'}
            </button>
          )}

          {currentUser.role !== 'MEMBER' && (
            <button
              id="export-excel-btn"
              onClick={openExportSetupModal}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Xuất danh sách lọc ra file Excel CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Excel
            </button>
          )}

          {/* Import option only for admin */}
          {currentUser.role !== 'MEMBER' && (
            <button
              id="import-excel-btn"
              onClick={onTriggerImportView}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Nhập Excel
            </button>
          )}

          {currentUser.role !== 'MEMBER' && (
            <button
              id="open-create-modal"
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Đoàn viên mới
            </button>
          )}
        </div>
      </div>

      {/* Info Banner for Standard Members */}
      {currentUser.role === 'MEMBER' && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-blue-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
          <div className="text-xs space-y-0.5 leading-relaxed">
            <span className="font-bold">Chế độ phân quyền Đoàn viên (Bảo mật & Giới hạn chi nhánh)</span>
            <p className="text-slate-650">Bạn có quyền tra cứu danh sách Đoàn viên trực thuộc <span className="font-semibold text-blue-700">{currentUser.branch}</span>. Để bảo vệ dữ liệu cá nhân theo Quy định Bảo mật, bạn không thể xem Đoàn viên thuộc các chi nhánh khác, đồng thời thông tin SĐT và Email của các Đoàn viên khác đã được mã hóa ẩn. Bạn có thể tự hiệu chỉnh thông tin của chính mình tại mục <span className="font-semibold text-blue-700">"Thẻ đoàn viên cá nhân"</span>.</p>
          </div>
        </div>
      )}

      {/* Advanced Filter Panel */}
      <div id="filter-panel" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* 1. Bar Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tên, mã đoàn viên, SĐT..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          {/* 2. Branch Dropdown Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => { 
                const nextBranch = e.target.value;
                setSelectedBranch(nextBranch); 
                setCurrentPage(1); 
                if (nextBranch !== 'All' && selectedDept !== 'All') {
                  const allowedDepts = BRANCH_DEPARTMENTS[nextBranch] || [];
                  if (!allowedDepts.includes(selectedDept)) {
                    setSelectedDept('All');
                  }
                }
              }}
              disabled={currentUser.role !== 'ADMIN_SUPER'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700 disabled:opacity-75 disabled:bg-slate-100"
            >
              <option value="All">Tất cả chi nhánh</option>
              {branches.map(br => (
                <option key={br} value={br}>{br}</option>
              ))}
            </select>
          </div>

          {/* 3. Department Dropdown Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700"
            >
              <option value="All">Tất cả phòng ban</option>
              {(selectedBranch === 'All' ? departments : (BRANCH_DEPARTMENTS[selectedBranch] || [])).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* 4. Gender Filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700"
            >
              <option value="All">Giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          {/* 5. Age Category Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700"
            >
              <option value="All">Trạng thái sinh hoạt</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Tạm dừng">Tạm dừng</option>
              <option value="Đã chuyển sinh hoạt">Đã chuyển sinh hoạt</option>
            </select>
          </div>

        </div>

        {/* Secondary filters row (e.g. detailed demographics) */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-slate-600 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Bộ phân nhóm độ tuổi:
            </span>
            <div className="flex gap-1.5">
              {[
                { id: 'All', val: 'Tất cả độ tuổi' },
                { id: 'youth', val: 'Dưới 25 tuổi (Trẻ)' },
                { id: 'mid', val: '25 – 35 tuổi (Chủ chốt)' },
                { id: 'senior', val: 'Trên 35 tuổi (Kinh nghiệm)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSelectedAgeRange(opt.id); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                    selectedAgeRange === opt.id 
                      ? 'bg-blue-100 text-blue-700 font-semibold' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt.val}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filter Indicator */}
          {(searchTerm || selectedBranch !== (currentUser.role !== 'ADMIN_SUPER' ? currentUser.branch : 'All') || selectedDept !== 'All' || selectedGender !== 'All' || selectedStatus !== 'All' || selectedAgeRange !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch(currentUser.role !== 'ADMIN_SUPER' ? currentUser.branch : 'All');
                setSelectedDept('All');
                setSelectedGender('All');
                setSelectedStatus('All');
                setSelectedAgeRange('All');
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div id="members-table-container" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {totalItems === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-medium">Không tìm thấy đoàn viên phù hợp</p>
            <p className="text-xs">Hãy thử đổi từ khóa tìm kiếm hoặc điều chỉnh điều kiện lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Đoàn viên</th>
                  <th className="py-3 px-4">Mã NV</th>
                  <th className="py-3 px-4">Cơ cấu tổ chức</th>
                  <th className="py-3 px-4">Chức vụ đoàn / CV</th>
                  <th className="py-3 px-4">Thông tin liên hệ</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMembers.map((member, idx) => {
                  const age = calculateAge(member.DOB);
                  return (
                    <motion.tr
                      key={member.MemberID}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 text-xs transition h-14"
                    >
                      {/* Name of employee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center border text-[11px] ${
                            member.Gender === 'Nữ' 
                              ? 'bg-pink-50 border-pink-100 text-pink-600' 
                              : 'bg-blue-50 border-blue-100 text-blue-600'
                          }`}>
                            {member.FullName.split(' ').pop()?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{member.FullName}</span>
                            <span className="text-[10px] text-slate-400">
                              {member.Gender} • Tuổi: {age} ({member.DOB.split('-').reverse().slice(0, 2).join('/')})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono text-slate-700 font-bold">
                        {member.EmployeeCode}
                      </td>

                      {/* Organization info */}
                      <td className="py-3 px-4 text-slate-700">
                        <span className="block font-medium">{member.Branch}</span>
                        <span className="block font-normal text-[10px] text-slate-400">{member.Department}</span>
                      </td>

                      {/* Position in union */}
                      <td className="py-3 px-4">
                        <span className={`block font-medium ${member.UnionPosition !== 'Đoàn viên' ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
                          {member.UnionPosition}
                        </span>
                        <span className="block font-normal text-[10px] text-slate-400 line-clamp-1">{member.Title}</span>
                      </td>

                      {/* Contact values */}
                      <td className="py-3 px-4">
                        <span className="block text-slate-600 font-medium select-all">
                          {currentUser.role === 'MEMBER' && member.EmployeeCode !== currentUser.employeeCode
                            ? maskPhone(member.Phone)
                            : member.Phone}
                        </span>
                        <span className="block text-[10px] text-slate-400 select-all">
                          {currentUser.role === 'MEMBER' && member.EmployeeCode !== currentUser.employeeCode
                            ? maskEmail(member.Email)
                            : member.Email}
                        </span>
                      </td>

                      {/* Status indicator colors */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                          member.Status === 'Đang hoạt động' 
                            ? 'bg-emerald-55 bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : member.Status === 'Tạm dừng'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {member.Status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Xem thẻ đoàn viên"
                            onClick={() => setViewingMember(member)}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Controls lock for Member role */}
                          {currentUser.role !== 'MEMBER' && !member.DeletedAt && (
                            <>
                              <button
                                title="Chỉnh sửa thông tin"
                                onClick={() => handleOpenEdit(member)}
                                className="w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 flex items-center justify-center transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                title="Xóa soft-delete"
                                onClick={() => {
                                  if (confirm(`Bạn chắc chắn muốn xóa đoàn viên ${member.FullName} khỏi danh sách?`)) {
                                    onDeleteMember(member.MemberID);
                                    showNotification(`Đã tạm chuyển ${member.FullName} vào Thùng rác!`);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 flex items-center justify-center transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {member.DeletedAt && (
                            <button
                              title="Khôi phục thông tin"
                              onClick={() => {
                                onRestoreMember(member.MemberID);
                                showNotification(`Đã khôi phục thành công hồ sơ của ${member.FullName}`);
                              }}
                              className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-1 text-[11px] font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                            >
                              Khôi phục
                            </button>
                          )}
                        </div>
                      </td>

                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with Pagination controls */}
        {totalItems > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Đang hiển thị <strong className="text-slate-800">{(currentPage-1)*itemsPerPage + 1}</strong> - <strong className="text-slate-800">{Math.min(currentPage*itemsPerPage, totalItems)}</strong> trong số <strong>{totalItems}</strong> kết quả thanh tra
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 select-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg font-medium cursor-pointer ${
                    currentPage === p 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'hover:bg-slate-250 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 select-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* --- EXTRA ADVANCED MODAL: EXPORT OPTIONS OVERLAY (CRITERIA DRIVEN) --- */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-100" />
                  <div>
                    <h3 className="text-sm font-bold">Xuất Báo Cáo Excel Theo Tiêu Chí</h3>
                    <p className="text-[10.5px] text-emerald-100/95 font-medium">Tùy biến cấu trúc và xuất {filteredMembers.length} đoàn viên đã lọc</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Active Criteria Display */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-2">
                  <span className="font-bold text-slate-700 block">Tiêu chí lọc hiện áp dụng:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-600">
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <strong>Chi nhánh:</strong> {selectedBranch === 'All' ? 'Tất cả' : selectedBranch}
                    </div>
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <strong>Tổ CĐ:</strong> {selectedDept === 'All' ? 'Tất cả' : selectedDept}
                    </div>
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <strong>Trạng thái:</strong> {selectedStatus === 'All' ? 'Tất cả' : selectedStatus}
                    </div>
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <strong>Giới tính:</strong> {selectedGender === 'All' ? 'Tất cả' : selectedGender}
                    </div>
                  </div>
                </div>

                {/* Smart Filename */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Tên file xuất (.csv)</label>
                  <input
                    type="text"
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    placeholder="Ten_file_bao_cao.csv"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700"
                  />
                </div>

                {/* Include header option */}
                <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="pr-2">
                    <span className="font-bold text-slate-750 text-[11px] block">Khối tiêu đề Báo cáo Công đoàn</span>
                    <span className="text-[10px] text-slate-400 block max-w-[280px]">Thêm thông tin thuyết minh bộ lọc, ngày giờ và người xuất ở 5 dòng đầu file sheet</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportIncludeHeaders}
                    onChange={(e) => setExportIncludeHeaders(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Select columns matrix */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Tùy biến cột dữ liệu xuất bản:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allTrue = Object.keys(exportColumns).every(k => exportColumns[k]);
                        const updated = { ...exportColumns };
                        Object.keys(updated).forEach(k => { updated[k] = !allTrue; });
                        setExportColumns(updated);
                      }}
                      className="text-[10.5px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      {Object.keys(exportColumns).every(k => exportColumns[k]) ? 'Bỏ chọn hết' : 'Chọn hết'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 p-2 max-h-40 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/20 text-[11px] text-slate-755">
                    {[
                      { key: 'EmployeeCode', label: 'EmployeeCode (Mã NV)' },
                      { key: 'FullName', label: 'FullName (Họ và Tên)' },
                      { key: 'Gender', label: 'Gender (Giới tính)' },
                      { key: 'DOB', label: 'DOB (Ngày sinh)' },
                      { key: 'Branch', label: 'Branch (Chi nhánh)' },
                      { key: 'Department', label: 'Department (Tổ CĐ)' },
                      { key: 'UnionPosition', label: 'UnionPosition' },
                      { key: 'Title', label: 'Title (Chuyên môn)' },
                      { key: 'JoinDate', label: 'JoinDate (Vào đoàn)' },
                      { key: 'Status', label: 'Status (Trạng thái)' },
                      { key: 'Phone', label: 'Phone (SĐT)' },
                      { key: 'Email', label: 'Email' }
                    ].map(col => (
                      <label key={col.key} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-100 rounded px-1 transition-colors">
                        <input
                          type="checkbox"
                          checked={exportColumns[col.key]}
                          onChange={() => setExportColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                          className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={executeCustomExport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tiến hành Tải Xuống
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 1: CREATE NEW MEMBER --- */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Thêm Đoàn Viên Mới</h3>
                  <p className="text-xs text-blue-100">Khai báo hồ sơ đoàn viên công đoàn trực thuộc Mobifone Service</p>
                </div>
                <button 
                  onClick={() => setIsCreateOpen(false)} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form body container */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* General Row 1 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Mã nhân viên (Bắt buộc) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: MFS452"
                      value={newEmployeeCode}
                      onChange={(e) => setNewEmployeeCode(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Họ tên đoàn viên (Bắt buộc) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Thị Hoài Lâm"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Giới tính</label>
                    <div className="flex gap-4 p-2 border border-slate-100 rounded-lg">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="gender"
                          checked={newGender === 'Nam'}
                          onChange={() => setNewGender('Nam')}
                        />
                        Nam
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="gender"
                          checked={newGender === 'Nữ'}
                          onChange={() => setNewGender('Nữ')}
                        />
                        Nữ
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={newDOB}
                      onChange={(e) => setNewDOB(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Chi nhánh trực thuộc</label>
                    <select
                      value={newBranch}
                      onChange={(e) => {
                        const nextBranch = e.target.value;
                        setNewBranch(nextBranch);
                        const nextDepts = BRANCH_DEPARTMENTS[nextBranch] || [];
                        if (nextDepts.length > 0) {
                          setNewDept(nextDepts[0]);
                        }
                      }}
                      disabled={currentUser.role === 'ADMIN_BRANCH'}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none disabled:bg-slate-50 disabled:opacity-75"
                    >
                      {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Phòng ban</label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    >
                      {(BRANCH_DEPARTMENTS[newBranch] || departments).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Chức vụ Đoàn</label>
                    <select
                      value={newUnionPosition}
                      onChange={(e) => setNewUnionPosition(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    >
                      {unionPositions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Chức danh / Vị trí chuyên môn</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Kỹ sư Chuyển động / Chuyên viên"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                  {/* Row 5 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ngày vào Đoàn</label>
                    <input
                      type="date"
                      value={newJoinDate}
                      onChange={(e) => setNewJoinDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Trạng thái sinh hoạt</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as MemberStatus)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    >
                      <option value="Đang hoạt động">Đang hoạt động</option>
                      <option value="Tạm dừng">Tạm dừng</option>
                      <option value="Đã chuyển sinh hoạt">Đã chuyển sinh hoạt</option>
                    </select>
                  </div>

                  {/* Row 6 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Số điện thoại cá nhân"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Email liên lạc *</label>
                    <input
                      type="email"
                      required
                      placeholder="Email nội bộ hoặc cá nhân"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                </div>

                {/* Footer buttons on modal close */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium rounded-lg cursor-pointer transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white rounded-lg cursor-pointer transition"
                  >
                    Thêm đoàn viên
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: EDIT EXISTING MEMBER --- */}
      <AnimatePresence>
        {editingMember && editForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Cập Nhật Hồ Sơ Đoàn Viên</h3>
                  <p className="text-xs text-blue-100">Cập nhật hồ sơ của {editingMember.FullName} ({editingMember.EmployeeCode})</p>
                </div>
                <button 
                  onClick={() => setEditingMember(null)} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Row 1 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Mã nhân viên (Bất biến)</label>
                    <input
                      type="text"
                      disabled
                      value={editForm.EmployeeCode}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 opacity-75 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Họ tên đoàn viên (Bắt buộc) *</label>
                    <input
                      type="text"
                      required
                      value={editForm.FullName}
                      onChange={(e) => setEditForm({ ...editForm, FullName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Giới tính</label>
                    <div className="flex gap-4 p-2 border border-slate-100 rounded-lg">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="edit-gender"
                          checked={editForm.Gender === 'Nam'}
                          onChange={() => setEditForm({ ...editForm, Gender: 'Nam' })}
                        />
                        Nam
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="edit-gender"
                          checked={editForm.Gender === 'Nữ'}
                          onChange={() => setEditForm({ ...editForm, Gender: 'Nữ' })}
                        />
                        Nữ
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={editForm.DOB}
                      onChange={(e) => setEditForm({ ...editForm, DOB: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Chi nhánh trực thuộc</label>
                    <select
                      value={editForm.Branch}
                      onChange={(e) => {
                        const nextBranch = e.target.value;
                        const nextDepts = BRANCH_DEPARTMENTS[nextBranch] || [];
                        const defaultDept = nextDepts.length > 0 ? nextDepts[0] : '';
                        setEditForm({ 
                          ...editForm, 
                          Branch: nextBranch,
                          Department: defaultDept 
                        });
                      }}
                      disabled={currentUser.role === 'ADMIN_BRANCH'}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none disabled:bg-slate-50 disabled:opacity-75"
                    >
                      {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Phòng ban</label>
                    <select
                      value={editForm.Department}
                      onChange={(e) => setEditForm({ ...editForm, Department: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    >
                      {(BRANCH_DEPARTMENTS[editForm.Branch] || departments).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Chức vụ Đoàn</label>
                    <select
                      value={editForm.UnionPosition}
                      onChange={(e) => setEditForm({ ...editForm, UnionPosition: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    >
                      {unionPositions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Chức danh chuyên môn</label>
                    <input
                      type="text"
                      value={editForm.Title}
                      onChange={(e) => setEditForm({ ...editForm, Title: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                  {/* Row 5 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ngày vào Đoàn</label>
                    <input
                      type="date"
                      value={editForm.JoinDate}
                      onChange={(e) => setEditForm({ ...editForm, JoinDate: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Trạng thái sinh hoạt</label>
                    <select
                      value={editForm.Status}
                      onChange={(e) => setEditForm({ ...editForm, Status: e.target.value as MemberStatus })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    >
                      <option value="Đang hoạt động">Đang hoạt động</option>
                      <option value="Tạm dừng">Tạm dừng</option>
                      <option value="Đã chuyển sinh hoạt">Đã chuyển sinh hoạt</option>
                    </select>
                  </div>

                  {/* Row 6 */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.Phone}
                      onChange={(e) => setEditForm({ ...editForm, Phone: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Email liên lạc *</label>
                    <input
                      type="email"
                      required
                      value={editForm.Email}
                      onChange={(e) => setEditForm({ ...editForm, Email: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium rounded-lg cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white rounded-lg cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: VIEW DETAILED MEMBER / UNION CARD --- */}
      <AnimatePresence>
        {viewingMember && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col"
            >
              {/* Virtual Union Card design heading */}
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-6 text-white text-center relative overflow-hidden flex flex-col items-center">
                
                {/* Background decorative elements */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-white/5 rounded-full" />

                {/* Card Title Header with Mobifone info */}
                <span className="text-[10px] tracking-widest font-semibold uppercase text-blue-200">
                  CÔNG ĐOÀN CÔNG TY CP DỊCH VỤ KỸ THUẬT MOBIFONE
                </span>
                <h4 className="text-sm font-bold tracking-tight uppercase text-amber-300 mt-1">
                  THẺ ĐOÀN VIÊN KTS
                </h4>
                
                {/* Avatar avatar block within badge card */}
                <div className="mt-5 relative">
                  <div className={`w-20 h-20 rounded-full border-4 border-white font-bold flex items-center justify-center text-xl shadow-md ${
                    viewingMember.Gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {viewingMember.FullName.split(' ').pop()?.substring(0, 2).toUpperCase()}
                  </div>
                  {/* Status Indicator inside avatar badge */}
                  <span className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-white ${
                    viewingMember.Status === 'Đang hoạt động' ? 'bg-emerald-500' : 'bg-amber-55 bg-amber-500'
                  }`} />
                </div>

                <h3 className="mt-3 text-lg font-bold tracking-tight">{viewingMember.FullName}</h3>
                <span className="text-xs text-blue-200 font-mono tracking-wider font-bold">Code: {viewingMember.EmployeeCode}</span>
              </div>

              {/* Card Meta Content Info */}
              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 divide-y divide-slate-50">
                  
                  <div className="pt-2">
                    <span className="block text-slate-400 font-medium">Giới tính / Tuổi</span>
                    <strong className="text-slate-800 text-sm mt-0.5 block">
                      {viewingMember.Gender} • {calculateAge(viewingMember.DOB)} tuổi
                    </strong>
                  </div>

                  <div className="pt-2">
                    <span className="block text-slate-400 font-medium">Chi nhánh sinh hoạt</span>
                    <strong className="text-slate-800 font-bold block whitespace-nowrap overflow-hidden text-ellipsis">
                      {viewingMember.Branch}
                    </strong>
                  </div>

                  <div className="pt-2">
                    <span className="block text-slate-400 font-medium">Ban / Vị trí phòng</span>
                    <strong className="text-slate-800 font-semibold block">{viewingMember.Department}</strong>
                  </div>

                  <div className="pt-2">
                    <span className="block text-slate-400 font-medium">Chức hiệu chuyên môn</span>
                    <strong className="text-slate-800 block">{viewingMember.Title}</strong>
                  </div>

                  <div className="pt-2">
                    <span className="block text-slate-400 font-medium">Chức vụ trong Công Đoàn</span>
                    <strong className="text-amber-75 bg-amber-50 border border-amber-100 text-amber-800 rounded px-1.5 py-0.5 inline-block font-semibold mt-1">
                      {viewingMember.UnionPosition}
                    </strong>
                  </div>

                  <div className="pt-2">
                    <span className="block text-slate-400 font-medium">Khóa tiếp nhận</span>
                    <strong className="text-slate-800 block mt-1">
                      {viewingMember.JoinDate.split('-').reverse().join('/')}
                    </strong>
                  </div>

                  <div className="col-span-2 pt-2">
                    <span className="block text-slate-400 font-medium">Số điện thoại liên hệ</span>
                    <strong className="text-slate-850 text-slate-800 font-medium text-sm mt-0.5 block select-all">
                      {currentUser.role === 'MEMBER' && viewingMember.EmployeeCode !== currentUser.employeeCode
                        ? `${maskPhone(viewingMember.Phone)} (Ẩn để bảo mật)`
                        : viewingMember.Phone}
                    </strong>
                  </div>

                  <div className="col-span-2 pt-2">
                    <span className="block text-slate-400 font-medium">Email trao đổi</span>
                    <strong className="text-slate-800 font-mono text-sm mt-0.5 block select-all">
                      {currentUser.role === 'MEMBER' && viewingMember.EmployeeCode !== currentUser.employeeCode
                        ? `${maskEmail(viewingMember.Email)} (Ẩn để bảo mật)`
                        : viewingMember.Email}
                    </strong>
                  </div>

                </div>

                {/* Render clean mock QR Code simulating Digital Union Connect app verification */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between mt-4">
                  <div className="space-y-1 pr-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Xác thực Thẻ Điện Tử</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">Quét mã QR để nhanh chóng liên kết điểm danh, ghi nhận giờ sinh hoạt phong trào.</p>
                  </div>
                  {/* Visual mockup of standard QR matrix */}
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 flex-shrink-0 flex flex-wrap gap-1 items-center justify-center">
                    <div className="w-3 h-3 bg-blue-900 leading-none"></div>
                    <div className="w-3 h-3 bg-blue-900 leading-none"></div>
                    <div className="w-3 h-3 bg-slate-35 bg-slate-300 leading-none"></div>
                    <div className="w-3 h-3 bg-blue-900 leading-none"></div>
                    <div className="w-3 h-3 bg-blue-900 leading-none"></div>
                    <div className="w-3 h-3 bg-blue-900 leading-none"></div>
                    <div className="w-3 h-3 bg-blue-900 leading-none"></div>
                    <div className="w-2 h-2 bg-slate-30 bg-slate-300 leading-none"></div>
                    <div className="w-3 h-3 bg-blue-900 leading-none"></div>
                    <div className="w-3 h-3 bg-slate-30 bg-slate-300 leading-none"></div>
                  </div>
                </div>

                {/* Footer close */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                  <button
                    onClick={() => {
                      showNotification('Đã lưu chứng nhận đoàn viên của ' + viewingMember.FullName);
                    }}
                    className="flex-1 py-2 bg-amber-50 cursor-pointer text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg font-semibold transition"
                  >
                    Tải Giấy chứng nhận
                  </button>
                  <button
                    onClick={() => setViewingMember(null)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium rounded-lg cursor-pointer transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
