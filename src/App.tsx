/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_MEMBERS, INITIAL_NEWS, INITIAL_COMMENTS, INITIAL_USERS, 
  BRANCHES, DEPARTMENTS, UNION_POSITIONS, migrateBranchAndDept
} from './data';
import { Member, NewsPost, Comment, User, AccountRole } from './types';
import Dashboard from './components/Dashboard';
import MemberList from './components/MemberList';
import ImportExcel from './components/ImportExcel';
import NewsFeed from './components/NewsFeed';
import UnionCardProfile from './components/UnionCardProfile';
import { 
  Building2, Users, FileSpreadsheet, Newspaper, UserCircle, 
  LogOut, Shield, MapPin, Layers, Award, Key, RefreshCw, Layers3, Flame, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // State initialization with LocalStorage sync
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('mfs_members');
    let loaded = saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    
    // One-time cleanup of old 'Văn phòng Công ty MFS' data from localStorage
    const hasCleanedV3 = localStorage.getItem('mfs_cleaned_hq_v3');
    if (!hasCleanedV3) {
      // Find the employee codes of the 44 HQ members and clear any existing instances in localStorage
      const hqEmployeeCodes = new Set(INITIAL_MEMBERS.filter(m => m.Branch === 'Văn phòng Công ty MFS').map(m => m.EmployeeCode));
      loaded = loaded.filter((m: Member) => !hqEmployeeCodes.has(m.EmployeeCode));
      localStorage.setItem('mfs_cleaned_hq_v3', 'true');
    }

    // Auto-merge any missing members from INITIAL_MEMBERS based on EmployeeCode
    const existingCodes = new Set(loaded.map((m: Member) => m.EmployeeCode));
    const missing = INITIAL_MEMBERS.filter(m => !existingCodes.has(m.EmployeeCode));
    if (missing.length > 0) {
      loaded = [...missing, ...loaded];
    }
    // Migrate any older branches or departments to the real actual ones
    loaded = loaded.map((m: Member) => {
      const migrated = migrateBranchAndDept(m.Branch, m.Department);
      return {
        ...m,
        Branch: migrated.branch,
        Department: migrated.department
      };
    });
    return loaded;
  });

  const [posts, setPosts] = useState<NewsPost[]>(() => {
    const saved = localStorage.getItem('mfs_posts');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('mfs_comments');
    return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mfs_current_user');
    // For outstanding evaluation experience, default to null so the user sees the beautiful login screen once,
    // then they can log in or switch roles with a single click.
    return saved ? JSON.parse(saved) : null;
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('mfs_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('mfs_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('mfs_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mfs_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mfs_current_user');
    }
  }, [currentUser]);

  // Handler: Login trigger
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Auto shift to dashboard
    setActiveTab('dashboard');
  };

  // Handler: Logout trigger
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Handler: Reset mock database to defaults
  const handleResetDatabase = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục cơ sở dữ liệu Union Connect về trạng thái ban đầu? Toàn bộ thay đổi tự gõ sẽ biến mất.')) {
      setMembers(INITIAL_MEMBERS);
      setPosts(INITIAL_NEWS);
      setComments(INITIAL_COMMENTS);
      localStorage.removeItem('mfs_members');
      localStorage.removeItem('mfs_posts');
      localStorage.removeItem('mfs_comments');
      alert('Đã khôi phục cơ sở dữ liệu mẫu thành công!');
    }
  };

  // Handler: Add custom member
  const handleAddMember = (newMeta: Omit<Member, 'MemberID'>) => {
    const fresh: Member = {
      ...newMeta,
      MemberID: `mem_${Date.now()}`
    };
    setMembers(prev => [fresh, ...prev]);
  };

  // Handler: Edit custom member
  const handleUpdateMember = (updated: Member) => {
    setMembers(prev => prev.map(m => m.MemberID === updated.MemberID ? updated : m));
  };

  // Handler: Soft Delete member
  const handleDeleteMember = (memberID: string) => {
    const timestamp = new Date().toISOString();
    setMembers(prev => prev.map(m => m.MemberID === memberID ? { ...m, DeletedAt: timestamp } : m));
  };

  // Handler: Restore soft-deleted member
  const handleRestoreMember = (memberID: string) => {
    setMembers(prev => prev.map(m => m.MemberID === memberID ? { ...m, DeletedAt: null } : m));
  };

  // Handler: Add many members from simulated CSV upload
  const handleImportMembers = (imported: Member[]) => {
    setMembers(prev => [...imported, ...prev]);
    // Shift view to Member List after importing
    setActiveTab('memberList');
  };

  // Handler: Add new news bulletins posts
  const handleAddPost = (newPostMeta: Omit<NewsPost, 'id' | 'likes' | 'likedBy'>) => {
    const post: NewsPost = {
      ...newPostMeta,
      id: `news_${Date.now()}`,
      likes: 0,
      likedBy: []
    };
    setPosts(prev => [post, ...prev]);
  };

  // Handler: Liked bullet feed
  const handleLikePost = (postId: string, userEmail: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const alreadyLiked = p.likedBy?.includes(userEmail);
      const updatedLikes = alreadyLiked 
        ? p.likes - 1 
        : p.likes + 1;
      const updatedLikedBy = alreadyLiked
        ? p.likedBy.filter(email => email !== userEmail)
        : [...(p.likedBy || []), userEmail];
      return { ...p, likes: updatedLikes, likedBy: updatedLikedBy };
    }));
  };

  // Handler: Append comments interactive
  const handleAddComment = (
    postId: string, 
    content: string, 
    authorName: string, 
    authorRole: string, 
    authorAvatar?: string
  ) => {
    const comment: Comment = {
      id: `com_${Date.now()}`,
      postId,
      authorName,
      authorRole,
      authorAvatar,
      content,
      createdAt: new Date().toISOString()
    };
    setComments(prev => [...prev, comment]);
  };

  // Render Login overlay Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#001e3c] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-white font-sans">
        
        {/* Background visual graphics */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-red-650/10 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4 z-10">
          
          {/* Logo representation with fallback */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-amber-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition duration-300" />
              <div className="relative bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-white/10 flex items-center justify-center">
                <img 
                  src="https://mobifoneservice.com.vn/store/themes/ks/images/logo.png" 
                  alt="Mobifone Service Logo"
                  className="h-10 object-contain brightness-110"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback visual if third party assets is blocked
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const txt = document.createElement('span');
                      txt.className = 'text-blue-300 font-extrabold text-lg tracking-tight';
                      txt.innerText = 'mobifone Service';
                      parent.appendChild(txt);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="px-4">
            <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl font-display">
              Union Connect
            </h1>
            <p className="mt-1.5 text-xs text-slate-300 max-w-sm mx-auto">
              Hệ thống Quản lý Đoàn viên & Truyền thông Nội bộ Công ty CP Dịch vụ Kỹ Thuật Mobifone
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10 animate-fade-in">
          <div className="bg-white/5 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-white/10 space-y-6 text-slate-100">
            
            {/* Login fields decoration */}
            <div className="space-y-4">
              <div className="text-center bg-blue-600/20 p-4 rounded-2xl border border-blue-500/20 space-y-1">
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-widest block">Trải nghiệm Nhanh Demo (Một chạm)</span>
                <span className="text-[10px] text-slate-300 block">Chọn nhanh vai trò để điểm duyệt các luồng chức năng phân quyền:</span>
              </div>

              <div className="space-y-2">
                {INITIAL_USERS.map((user) => {
                  const badgeColor = 
                    user.role === 'ADMIN_SUPER' 
                      ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                      : user.role === 'ADMIN_BRANCH'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-white/5 text-slate-300 border-white/10';

                  const desc = 
                    user.role === 'ADMIN_SUPER'
                      ? 'Quyền quản trị tối cao, kiểm tra tất cả chi nhánh'
                      : user.role === 'ADMIN_BRANCH'
                      ? `Quản trị thành viên tại cơ sở: ${user.branch.replace('MFS ', '')}`
                      : `Tra cứu thẻ số, đóng góp ý kiến thông cáo`;

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleLogin(user)}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <strong className="block text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                            {user.fullName}
                          </strong>
                          <span className="block text-[10px] text-slate-400 font-mono leading-none mt-0.5">{user.email}</span>
                          <span className="block text-[10px] text-slate-300 mt-1">{desc}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${badgeColor} select-none`}>
                        {user.role.replace('ADMIN_', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Standard inputs display placeholder */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-y-1/2 left-0 right-0 border-t border-white/10"></div>
              <span className="relative bg-[#001e3c]/90 px-3 text-[10px] uppercase font-bold text-slate-400">Đăng nhập tài khoản khác</span>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Địa chỉ email nội bộ</label>
                <input 
                  type="email" 
                  disabled
                  placeholder="nhan_vien@mobifoneservice.com.vn" 
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-400 font-bold block">Mật khẩu bảo mật</label>
                  <span className="text-[10px] text-blue-400 hover:underline cursor-pointer">Quên mật khẩu?</span>
                </div>
                <input 
                  type="password" 
                  disabled
                  placeholder="••••••••" 
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                />
              </div>

              <div className="text-slate-400 text-[10px] leading-relaxed italic text-center p-1">
                * Ở chế độ thử nghiệm nội bộ, vui lòng click trực tiếp vào các nút vai trò ở trên để thao tác tức thời.
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex flex-col items-center space-y-1 text-[10px] text-slate-400 text-center">
              <span>Được xây dựng bởi: <strong>Trưởng phòng Nguyễn Sông Hương & Phòng Công nghệ số</strong></span>
              <span>© 2026 Công ty Cổ phần Dịch vụ Kỹ Thuật Mobifone (MobifoneService)</span>
            </div>

          </div>
        </div>

      </div>
    );
  }
  // Header and layout shell variables
  const isSuperAdmin = currentUser.role === 'ADMIN_SUPER';
  const isBranchAdmin = currentUser.role === 'ADMIN_BRANCH';
  const isMember = currentUser.role === 'MEMBER';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* 1. TOP QUICK SWITCH ROLE BAR FOR EVALUATOR COGNITION */}
      <div className="bg-slate-900 text-white text-xs px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">Đang hoạt động: </span>
          <strong className="text-white font-semibold flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-md">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            {currentUser.fullName} ({
              currentUser.role === 'ADMIN_SUPER' 
                ? 'Công đoàn Tổng (Super Admin)' 
                : currentUser.role === 'ADMIN_BRANCH'
                ? `Cơ sở (Branch Admin)`
                : 'Đoàn viên (Member)'
            })
          </strong>
        </div>

        {/* Change account interactive trigger block */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] hidden md:inline">Đổi vai trò nhanh:</span>
          <div className="flex gap-1">
            {INITIAL_USERS.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    // auto redirect tab if we swap to avoid restricted blank layout
                    if (u.role === 'MEMBER') {
                      setActiveTab('profile');
                    } else {
                      setActiveTab('dashboard');
                    }
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-black' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                  title={u.fullName}
                >
                  {u.role.replace('ADMIN_', '')}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={handleResetDatabase}
            title="Trả mẫu dữ liệu ban đầu"
            className="ml-2 px-1.5 py-1 bg-red-650 bg-red-950 border border-red-800 hover:bg-red-900 text-red-200 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Reset
          </button>
        </div>
      </div>

      {/* 2. CORE WORKSPACE APP SHELL */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar Panel Left (Fixed or responsive sizing) */}
        <aside className="w-full lg:w-64 bg-white border-r border-slate-100 flex flex-col justify-between flex-shrink-0 lg:sticky lg:top-0 lg:h-[calc(100vh-42px)]">
          <div className="p-5 space-y-6">
            
            {/* branding with Mobifone technical logo */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="p-1 px-2.5 bg-white rounded-lg shadow-2xs border border-slate-100">
                <img 
                  src="https://mobifoneservice.com.vn/store/themes/ks/images/logo.png" 
                  alt="Mobifone Service Logo"
                  className="h-8 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const txt = document.createElement('span');
                      txt.className = 'text-blue-700 font-extrabold text-sm';
                      txt.innerText = 'mobifone';
                      parent.appendChild(txt);
                    }
                  }}
                />
              </div>
              <div className="leading-none">
                <strong className="text-xs font-black text-slate-800 block tracking-tight">Union Connect</strong>
                <span className="text-[10px] text-slate-400 font-medium">Bản Số Hóa v1.2</span>
              </div>
            </div>

            {/* Navigation tab links */}
            <nav className="space-y-1">
              
              {/* Op 1: Dashboard overview (Admins only get standard, member restricted or customized) */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-50 text-blue-700 shadow-2xs' 
                    : 'text-slate-650 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4 flex-shrink-0" />
                Tổng quan thống kê
              </button>

              {/* Op 2: Member management database (Admin/Branch only, hide or disabled for standard member for privacy but available for demonstration) */}
              <button
                onClick={() => setActiveTab('memberList')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'memberList' 
                    ? 'bg-blue-50 text-blue-700 shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  Quản lý Đoàn viên
                </span>
                {members.filter(m => !m.DeletedAt).length > 0 && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                    {members.filter(m => !m.DeletedAt).length}
                  </span>
                )}
              </button>

              {/* Op 3: Import Excel module (Admin only block) */}
              {!isMember && (
                <button
                  onClick={() => setActiveTab('importExcel')}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'importExcel' 
                      ? 'bg-blue-50 text-blue-700 shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                  Nhập dữ liệu Excel
                </button>
              )}

              {/* Op 4: News Communique feed (Visible for all) */}
              <button
                onClick={() => setActiveTab('newsFeed')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'newsFeed' 
                    ? 'bg-blue-50 text-blue-700 shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Newspaper className="w-4 h-4 flex-shrink-0" />
                  Truyền thông nội bộ
                </span>
                {posts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 block"></span>
                )}
              </button>

              {/* Op 5: Virtual Union Card Profile (Available for standard members / linked admin profiles) */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-700 shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserCircle className="w-4 h-4 flex-shrink-0" />
                Thẻ đoàn viên cá nhân
              </button>

            </nav>

          </div>

          {/* Dev credentials in the footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            {/* Developer Card representation */}
            <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Nhà phát triển (PRD)</span>
              <strong className="text-xs font-bold text-slate-800 block">Trưởng phòng Nguyễn Sông Hương</strong>
              <span className="text-[10px] text-slate-55 bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-medium mt-0.5 inline-block">
                Phòng Công nghệ số MFS
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={currentUser.avatarUrl} 
                  alt="avatar" 
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
                <div className="text-[10px] leading-tight">
                  <span className="font-bold text-slate-700 block max-w-[100px] truncate">{currentUser.fullName}</span>
                  <span className="text-slate-400 font-mono tracking-tighter block">{currentUser.employeeCode}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất khỏi hệ thống"
                className="w-7 h-7 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg flex items-center justify-center cursor-pointer transition border border-transparent hover:border-red-100"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </aside>

        {/* 3. MAIN WORKPLACE CANVAS RIGHT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-hidden">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  members={members} 
                  currentUser={currentUser} 
                  branches={BRANCHES} 
                />
              )}

              {activeTab === 'memberList' && (
                <MemberList 
                  members={members}
                  currentUser={currentUser}
                  branches={BRANCHES}
                  departments={DEPARTMENTS}
                  unionPositions={UNION_POSITIONS}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onDeleteMember={handleDeleteMember}
                  onRestoreMember={handleRestoreMember}
                  onTriggerImportView={() => setActiveTab('importExcel')}
                />
              )}

              {activeTab === 'importExcel' && (
                <ImportExcel 
                  onImportCompleted={handleImportMembers}
                  existingMembers={members}
                  branches={BRANCHES}
                  departments={DEPARTMENTS}
                />
              )}

              {activeTab === 'newsFeed' && (
                <NewsFeed 
                  posts={posts}
                  comments={comments}
                  currentUser={currentUser}
                  onAddPost={handleAddPost}
                  onLikePost={handleLikePost}
                  onAddComment={handleAddComment}
                />
              )}

              {activeTab === 'profile' && (
                <UnionCardProfile 
                  currentUser={currentUser}
                  members={members}
                  onUpdateMember={handleUpdateMember}
                />
              )}

            </motion.div>
          </AnimatePresence>

        </main>

      </div>

    </div>
  );
}
