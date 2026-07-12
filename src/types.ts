/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'Nam' | 'Nữ';

export type AccountRole = 'ADMIN_SUPER' | 'ADMIN_BRANCH' | 'MEMBER';

export type MemberStatus = 'Đang hoạt động' | 'Tạm dừng' | 'Đã chuyển sinh hoạt';

export interface Member {
  MemberID: string;
  EmployeeCode: string;
  FullName: string;
  Gender: Gender;
  DOB: string; // YYYY-MM-DD
  Branch: string; // e.g., "Mobifone Service Hà Nội", "Mobifone Service TP.HCM", "Mobifone Service Đà Nẵng", etc.
  Department: string; // e.g., "Phòng Công nghệ số", "Phòng Kỹ thuật", "Phòng CSKH", "Phòng Kinh doanh", "Phòng Nhân sự"
  JoinDate: string; // YYYY-MM-DD
  Status: MemberStatus;
  Phone: string;
  Email: string;
  UnionPosition: string; // e.g., "Đoàn viên", "Bí thư Chi đoàn", "Phó Bí thư", "Ủy viên BCH"
  Title: string; // e.g., "Chuyên viên giải pháp CNTT", "Kỹ sư tối ưu hóa mạng", "Chuyên viên Chăm sóc khách hàng"
  DeletedAt?: string | null; // For soft delete
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  branch: string; // "All" for SUPER, or specific branch
  avatarUrl?: string;
  employeeCode?: string;
}

export interface Attachment {
  name: string;
  size: string;
  url: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorRole: string; // e.g., "Admin Tổng", "Đoàn viên Hà Nội", etc.
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string; // Can support simple HTML or Markdown paragraphs
  category: 'Thông báo' | 'Hoạt động phong trào' | 'Tin tức học tập' | 'Thi đua - Khen thưởng';
  authorName: string;
  createdAt: string;
  likes: number;
  likedBy: string[]; // List of user emails who liked it
  attachments?: Attachment[];
  externalLink?: string;
}
