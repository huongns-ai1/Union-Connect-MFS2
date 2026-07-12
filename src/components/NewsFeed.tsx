/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { NewsPost, User, Comment, Attachment } from '../types';
import { 
  Heart, MessageSquare, Send, Paperclip, Share2, Plus, X, 
  Tag, Download, Link, Info, Newspaper, Megaphone, BookOpen, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsFeedProps {
  posts: NewsPost[];
  comments: Comment[];
  currentUser: User;
  onAddPost: (post: Omit<NewsPost, 'id' | 'likes' | 'likedBy'>) => void;
  onLikePost: (postId: string, userEmail: string) => void;
  onAddComment: (postId: string, content: string, authorName: string, authorRole: string, authorAvatar?: string) => void;
}

export default function NewsFeed({
  posts,
  comments,
  currentUser,
  onAddPost,
  onLikePost,
  onAddComment
}: NewsFeedProps) {
  // Category search states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeDetailPost, setActiveDetailPost] = useState<NewsPost | null>(null);
  
  // Create Post Form states
  const [isPublishingOpen, setIsPublishingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Thông báo' | 'Hoạt động phong trào' | 'Tin tức học tập' | 'Thi đua - Khen thưởng'>('Thông báo');
  const [newLink, setNewLink] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{name: string, size: string}[]>([]);
  const [mockFileText, setMockFileText] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');
  const [publishError, setPublishError] = useState('');

  // Comment input state (for detail modal)
  const [commentText, setCommentText] = useState('');

  // Toast confirmation state
  const [actionAlert, setActionAlert] = useState('');

  const showToast = (msg: string) => {
    setActionAlert(msg);
    setTimeout(() => setActionAlert(''), 3000);
  };

  // Pre-sort posts: newest published always first
  const sortedPosts = useMemo(() => {
    const raw = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (selectedCategory !== 'All') {
      return raw.filter(p => p.category === selectedCategory);
    }
    return raw;
  }, [posts, selectedCategory]);

  // Helper theme resolver per category tag
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Thi đua - Khen thưởng':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          gradient: 'from-amber-600 to-yellow-500',
          icon: <Megaphone className="w-3.5 h-3.5" />
        };
      case 'Hoạt động phong trào':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          gradient: 'from-emerald-600 to-teal-500',
          icon: <Heart className="w-3.5 h-3.5" />
        };
      case 'Tin tức học tập':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          gradient: 'from-indigo-600 to-blue-500',
          icon: <BookOpen className="w-3.5 h-3.5" />
        };
      default: // 'Thông báo'
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          gradient: 'from-rose-600 to-pink-500',
          icon: <Info className="w-3.5 h-3.5" />
        };
    }
  };

  // Add dummy file attachment
  const handleAttachMockFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockFileText.trim()) return;
    setAttachedFiles([
      ...attachedFiles,
      { name: mockFileText.trim(), size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB` }
    ]);
    setMockFileText('');
  };

  // Publish news post submit handler
  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError('');

    if (!newTitle.trim() || !newContent.trim()) {
      setPublishError('Vui lòng nhập đầy đủ Tiêu đề và Nội dung bản tin.');
      return;
    }

    onAddPost({
      title: newTitle,
      content: newContent,
      category: newCategory,
      authorName: currentUser.role === 'ADMIN_SUPER' ? 'BCH Công đoàn Tổng' : `BCH CĐ ${currentUser.branch.replace('MFS ', '')}`,
      createdAt: new Date().toISOString(),
      attachments: attachedFiles.map(f => ({ name: f.name, size: f.size, url: '#' })),
      externalLink: newLink.trim() || undefined
    });

    // Reset fields
    setNewTitle('');
    setNewContent('');
    setNewLink('');
    setAttachedFiles([]);
    setIsPublishingOpen(false);
    showToast('Đã phát hành bài viết truyền thông thành công!');
  };

  // Execute like reaction
  const handleLikeClick = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering detail layout click
    onLikePost(postId, currentUser.email);
    showToast('Đã ghi nhận tương tác bài đăng!');
  };

  // Write comment submit
  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Derived user role string
    const roleMap = {
      'ADMIN_SUPER': 'BCH Công đoàn Tổng',
      'ADMIN_BRANCH': `BCH CĐ ${currentUser.branch.replace('MFS ', '')}`,
      'MEMBER': 'Đoàn viên'
    };
    const authorRole = roleMap[currentUser.role];

    onAddComment(
      postId,
      commentText.trim(),
      currentUser.fullName,
      authorRole,
      currentUser.avatarUrl
    );

    setCommentText('');
    showToast('Gửi bình luận thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Toast alerts */}
      <AnimatePresence>
        {actionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{actionAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>Truyền thông Nội bộ & Tin tức</span>
            <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
              Live Feed
            </span>
          </h2>
          <p className="text-xs text-slate-500">Kênh phát thanh nội bộ, phong trào thi đua thanh niên và văn bản Liên đoàn</p>
        </div>

        {/* Publish CTA only for authorized branch/super admins */}
        {currentUser.role !== 'MEMBER' && (
          <button
            id="publish-news-cta"
            onClick={() => setIsPublishingOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Đăng tin mới
          </button>
        )}
      </div>

      {/* Content Layout split: News Feed Left, Filtering Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Postings list */}
        <div className="lg:col-span-3 space-y-4">
          
          {sortedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
              <Newspaper className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium mt-2">Chưa có bài viết thuộc danh mục này</p>
            </div>
          ) : (
            sortedPosts.map((post, idx) => {
              const theme = getCategoryTheme(post.category);
              const postCommentsCount = comments.filter(c => c.postId === post.id).length;
              const hasLiked = post.likedBy?.includes(currentUser.email);

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setActiveDetailPost(post)}
                  className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-all cursor-pointer overflow-hidden group shadow-sm flex flex-col justify-between"
                >
                  
                  {/* Category gradient bar indicator */}
                  <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

                  <div className="p-5 space-y-3">
                    {/* Meta info row */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 ${theme.bg}`}>
                          {theme.icon}
                          {post.category}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-medium">Tác giả: <strong className="text-slate-700">{post.authorName}</strong></span>
                      </div>
                      <span className="text-slate-400 font-mono">
                        {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Shortened preview content */}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Quick indicator check for attachments or link */}
                    {(post.attachments && post.attachments.length > 0 || post.externalLink) && (
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-medium">
                        {post.attachments && post.attachments.length > 0 && (
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            Đính kèm: {post.attachments.length} tài liệu
                          </span>
                        )}
                        {post.externalLink && (
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-blue-600">
                            <Link className="w-3 h-3" />
                            Có liên kết nguồn ngoài
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Interaction Bar */}
                  <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4 font-semibold">
                      
                      {/* Like button reaction */}
                      <button
                        onClick={(e) => handleLikeClick(post.id, e)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer group-hover:scale-105 ${
                          hasLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes} Yêu thích</span>
                      </button>

                      {/* Comments count indicator */}
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>{postCommentsCount} bình luận</span>
                      </div>

                    </div>

                    <span className="text-[11px] font-semibold text-blue-600 hover:underline group-hover:translate-x-1 duration-200 transition-transform">
                      Đọc chi tiết công văn →
                    </span>
                  </div>

                </motion.div>
              );
            })
          )}

        </div>

        {/* Right Column: Taxonomy Filtering Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
          <strong className="text-xs font-bold text-slate-700 uppercase tracking-widest block">Tìm kiếm theo đề mục</strong>
          
          <div className="flex flex-col gap-1">
            {[
              { id: 'All', label: 'Tất cả mục truyền thông', count: posts.length, icon: <Newspaper className="w-4 h-4" /> },
              { id: 'Thông báo', label: 'Thông báo quan trọng', count: posts.filter(p => p.category === 'Thông báo').length, icon: <Info className="w-4 h-4 text-rose-500" /> },
              { id: 'Thi đua - Khen thưởng', label: 'Thi đua - Khen thưởng', count: posts.filter(p => p.category === 'Thi đua - Khen thưởng').length, icon: <Megaphone className="w-4 h-4 text-amber-500" /> },
              { id: 'Hoạt động phong trào', label: 'Hoạt động thanh niên', count: posts.filter(p => p.category === 'Hoạt động phong trào').length, icon: <Heart className="w-4 h-4 text-emerald-500" /> },
              { id: 'Tin tức học tập', label: 'Văn thư - Giáo dục', count: posts.filter(p => p.category === 'Tin tức học tập').length, icon: <BookOpen className="w-4 h-4 text-indigo-500" /> }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedCategory(item.id)}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer transition-all ${
                  selectedCategory === item.id 
                    ? 'bg-blue-50/70 text-blue-700 border-blue-200 font-bold shadow-sm' 
                    : 'bg-white text-slate-600 border-transparent hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  selectedCategory === item.id ? 'bg-blue-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] leading-relaxed text-slate-500 space-y-2">
            <span className="font-bold text-slate-700 block">Tiếp nhận thông tin số:</span>
            <p>100% người lao động tại MobifoneService được khuyến khích tương tác tích cực, bày tỏ ý kiến xây dựng vì lợi ích Công đoàn chung.</p>
          </div>
        </div>

      </div>

      {/* --- MODAL 1: WRITE & PUBLISH POST FORM --- */}
      <AnimatePresence>
        {isPublishingOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-100. max-h-[90vh] flex flex-col text-xs"
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-rose-700 to-rose-800 p-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Phát hành Bản tin Công đoàn</h3>
                  <p className="text-xs text-rose-100">Đăng thông báo, văn bản chỉ đạo tới toàn chi nhánh hệ thống</p>
                </div>
                <button 
                  onClick={() => setIsPublishingOpen(false)} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {publishError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{publishError}</span>
                  </div>
                )}

                {/* Grid Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Mục phân loại truyền thông</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Thông báo">Thông báo quan trọng</option>
                      <option value="Thi đua - Khen thưởng">Thi đua - Khen thưởng</option>
                      <option value="Hoạt động phong trào">Hoạt động phong trào</option>
                      <option value="Tin tức học tập">Tin tức học tập</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 col-span-2">Tiêu đề chính (Bắt buộc) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Triển khai chiến dịch Thanh niên Số tình nguyện hè 2026..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 col-span-2">Nội dung chi tiết (Markdown / Văn bản thường) *</label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Viết nội dung bản tin tại đây. Hãy định rõ thời hạn, đối tượng tham gia và người chịu trách nhiệm..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Đính kèm Liên kết ngoài (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://mobifoneservice.com.vn/..."
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                  </div>

                  {/* Attachment input simulation */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <label className="block text-slate-600 font-semibold mb-1">Thiết lập tài liệu đính kèm (.PDF, .DOCX)</label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tên tài liệu mẫu (e.g. QuyetDinh_42.pdf)"
                        value={mockFileText}
                        onChange={(e) => setMockFileText(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-slate-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAttachMockFile}
                        className="px-3 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg font-bold font-semibold cursor-pointer"
                      >
                        Đính kèm
                      </button>
                    </div>

                    {attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {attachedFiles.map((file, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md flex items-center gap-1 text-[10px]">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            {file.name} ({file.size})
                            <button
                              type="button"
                              onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                              className="text-red-500 hover:text-red-700 ml-1 font-bold cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions close */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsPublishingOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium rounded-lg cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 font-semibold text-white rounded-lg cursor-pointer"
                  >
                    Đăng tin ngay
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: BULLETIN DETAIL VIEW & COMMITTING COMMENTS --- */}
      <AnimatePresence>
        {activeDetailPost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col text-xs"
            >
              {/* Header */}
              <div className="bg-slate-55 bg-slate-50 p-5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">CHI TIẾT VĂN BẢN TRUYỀN THÔNG</span>
                <button 
                  onClick={() => setActiveDetailPost(null)} 
                  className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scroll Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Header detail */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-semibold text-[10px]">
                      {activeDetailPost.category}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 font-medium font-semibold">{activeDetailPost.authorName}</span>
                  </div>

                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {activeDetailPost.title}
                  </h2>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Ngày đăng: {new Date(activeDetailPost.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>

                {/* Primary Content Paragraphs */}
                <div className="text-slate-700 leading-relaxed text-xs space-y-3 whitespace-pre-line border-t border-slate-100 pt-4">
                  {activeDetailPost.content}
                </div>

                {/* Attachments Section if they exist */}
                {activeDetailPost.attachments && activeDetailPost.attachments.length > 0 && (
                  <div className="space-y-2 border-t border-b border-indigo-50 py-3.5">
                    <span className="block font-bold text-slate-700 uppercase tracking-widest text-[10px]">Tập tin văn bản đi kèm</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeDetailPost.attachments.map((file, i) => (
                        <div key={i} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition duration-200">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="truncate">
                              <span className="block font-semibold text-slate-800 truncate" title={file.name}>{file.name}</span>
                              <span className="block text-[10px] text-slate-400">{file.size} • PDF Document</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => showToast(`Đang tải trữ lượng tập tin: ${file.name}`)}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-800 flex items-center justify-center transition border border-slate-25 border-slate-200 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External link CTA */}
                {activeDetailPost.externalLink && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-slate-800">Liên kết tham khảo bên ngoài</strong>
                      <span className="text-slate-400">Nhấp để liên kết trực tiếp tới bài viết báo hoặc văn thư</span>
                    </div>
                    <a
                      href={activeDetailPost.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Truy cập <Link className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Dynamic Comments List feed */}
                <div className="space-y-4 pt-2">
                  <strong className="block font-bold text-slate-700 uppercase tracking-widest text-[10px] border-b border-slate-100 pb-2">
                    Ý kiến đóng góp & Đóng góp luận văn ({comments.filter(c => c.postId === activeDetailPost.id).length})
                  </strong>

                  <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                    {comments.filter(c => c.postId === activeDetailPost.id).length === 0 ? (
                      <p className="text-center text-slate-400 py-4 italic">Chưa có ý kiến phản hồi đóng góp nào. Hãy là người đầu tiên chia sẻ.</p>
                    ) : (
                      comments
                        .filter(c => c.postId === activeDetailPost.id)
                        .map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-100 font-bold text-[10px] text-blue-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                              {comment.authorName.split(' ').pop()?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-slate-850 text-slate-800">
                                  {comment.authorName} <span className="font-normal text-slate-400 text-[9px]">({comment.authorRole})</span>
                                </span>
                                <span className="text-slate-400 font-mono">
                                  {new Date(comment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-655 text-xs text-slate-750 font-sans font-medium whitespace-pre-line leading-relaxed text-slate-700">{comment.content}</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Submission form */}
                  <form onSubmit={(e) => handleCommentSubmit(e, activeDetailPost.id)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập ý kiến bình thảo đóng góp của bạn..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/25 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-4 bg-blue-600 hover:bg-blue-700 font-semibold text-white rounded-xl disabled:opacity-50 flex items-center justify-center cursor-pointer transition-colors"
                      title="Gửi bình luận đóng góp"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

              </div>

              {/* Close Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setActiveDetailPost(null)}
                  className="px-5 py-2 bg-slate-200/55 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition"
                >
                  Đóng công văn
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
