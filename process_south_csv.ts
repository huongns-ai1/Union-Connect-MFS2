import * as fs from 'fs';
import * as path from 'path';

// Define the Member interface matching types.ts
interface Member {
  MemberID: string;
  EmployeeCode: string;
  FullName: string;
  Gender: 'Nam' | 'Nữ';
  DOB: string; // YYYY-MM-DD
  Branch: string;
  Department: string;
  JoinDate: string; // YYYY-MM-DD
  Status: 'Đang hoạt động' | 'Tạm dừng' | 'Đã chuyển sinh hoạt';
  Phone: string;
  Email: string;
  UnionPosition: string;
  Title: string;
}

// Custom CSV Parser supporting quoted fields and multiline values
function parseCSV(content: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let val = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        val += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(val);
      val = '';
      i++;
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
      row.push(val);
      if (row.length > 1 || row[0] !== '') {
        result.push(row);
      }
      row = [];
      val = '';
    } else {
      val += char;
      i++;
    }
  }
  
  if (row.length > 0 || val !== '') {
    row.push(val);
    result.push(row);
  }
  
  return result;
}

// Date normalization function (DD/MM/YYYY to YYYY-MM-DD)
function formatDOB(dobStr: string): string {
  if (!dobStr) return '';
  const parts = dobStr.trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dobStr.trim();
}

// Phone number normalization
function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/\s+/g, '');
  if (!p) return '';
  if (/^\d{9}$/.test(p)) {
    return '0' + p;
  }
  return p;
}

// migrateBranchAndDept cloned from src/data.ts to prevent circular dependencies or TS import errors during build/run
function migrateBranchAndDept(rawBranch: string, rawDept: string): { branch: string, department: string } {
  const b = rawBranch ? rawBranch.trim() : '';
  const d = rawDept ? rawDept.trim() : '';

  let finalBranch = 'Văn phòng tổng công ty MFS';
  const cleanB = b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const cleanD = d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

  if (b === 'Chi nhánh miền Bắc' || cleanB === 'chi nhanh mien bac' || b === 'MFS Chi nhánh Miền Bắc') {
    finalBranch = 'Chi nhánh miền Bắc';
  } else if (b === 'Chi nhánh miền Trung' || cleanB === 'chi nhanh mien trung' || b === 'MFS Chi nhánh Miền Trung') {
    finalBranch = 'Chi nhánh miền Trung';
  } else if (b === 'Chi nhánh miền Nam' || cleanB === 'chi nhanh mien nam' || b === 'MFS Chi nhánh Miền Nam') {
    finalBranch = 'Chi nhánh miền Nam';
  } else if (cleanB.includes('van phong') || cleanB.includes('tong cong ty') || cleanB.includes('vp tct') || cleanB.includes('vptct') || cleanB.includes('van phong tct') || cleanB === 'mfs') {
    finalBranch = 'Văn phòng tổng công ty MFS';
  } else if (cleanB.includes('ha noi') || cleanB.includes('mien bac') || cleanB.includes('bac') || cleanB.includes('hn')) {
    if (cleanD.includes('giam doc') || cleanD.includes('tgd') || cleanD.includes('bgd') ||
        cleanD.includes('cong nghe so') || cleanD.includes('cns') || 
        cleanD.includes('to chuc') || cleanD.includes('hanh chinh') || cleanD.includes('tchc') || 
        cleanD.includes('ke toan') || cleanD.includes('tai chinh') ||
        cleanD.includes('ha tang') || cleanD.includes('vien thong') ||
        cleanD.includes('ke hoach') || cleanD.includes('kinh doanh') || cleanD.includes('kh kd') || cleanD.includes('khkd') || cleanD.includes('kinh doanh tong hop') || cleanD.includes('kdth')) {
      finalBranch = 'Văn phòng tổng công ty MFS';
    } else {
      finalBranch = 'Chi nhánh miền Bắc';
    }
  } else if (cleanB.includes('mien trung') || cleanB.includes('trung') || cleanB.includes('da nang') || cleanB.includes('binh dinh') || cleanB.includes('khanh hoa')) {
    finalBranch = 'Chi nhánh miền Trung';
  } else if (cleanB.includes('mien nam') || cleanB.includes('nam') || cleanB.includes('ho chi minh') || cleanB.includes('sai gon') || cleanB.includes('hcm') || cleanB.includes('mien tay') || cleanB.includes('can tho') || cleanB.includes('tay')) {
    finalBranch = 'Chi nhánh miền Nam';
  } else {
    if (cleanD.includes('giam doc') || cleanD.includes('tgd') || cleanD.includes('bgd') ||
        cleanD.includes('cong nghe so') || cleanD.includes('cns') || 
        cleanD.includes('to chuc') || cleanD.includes('hanh chinh') || cleanD.includes('tchc') || 
        cleanD.includes('ke toan') || cleanD.includes('tai chinh') ||
        cleanD.includes('ha tang') || cleanD.includes('vien thong') ||
        cleanD.includes('ke hoach') || cleanD.includes('kinh doanh') || cleanD.includes('kh kd') || cleanD.includes('khkd')) {
      finalBranch = 'Văn phòng tổng công ty MFS';
    } else {
      finalBranch = 'Chi nhánh miền Bắc';
    }
  }

  let finalDept = '';
  if (finalBranch === 'Văn phòng tổng công ty MFS') {
    if (cleanD.includes('giam doc') || cleanD.includes('tgd') || cleanD.includes('bgd')) {
      finalDept = 'BAN TỔNG GIÁM ĐỐC';
    } else if (cleanD.includes('to chuc') || cleanD.includes('tchc') || cleanD.includes('hanh chinh') || cleanD.includes('tuyển dung') || cleanD.includes('bhxh') || cleanD.includes('luong')) {
      finalDept = 'P. TỔ CHỨC - HÀNH CHÍNH';
    } else if (cleanD.includes('ke toan') || cleanD.includes('tai chinh') || cleanD.includes('ngan hang') || cleanD.includes('thue') || cleanD.includes('quy')) {
      finalDept = 'P. TÀI CHÍNH - KẾ TOÁN';
    } else if (cleanD.includes('ha tang') || cleanD.includes('vien thong') || cleanD.includes('ky thuat') || cleanD.includes('mang luoi')) {
      finalDept = 'P. HẠ TẦNG - VIỄN THÔNG';
    } else if (cleanD.includes('ke hoach') || cleanD.includes('kinh doanh') || cleanD.includes('kh kd') || cleanD.includes('khkd') || cleanD.includes('kdth')) {
      finalDept = 'P. KẾ HOẠCH - KINH DOANH';
    } else if (cleanD.includes('cong nghe so') || cleanD.includes('cns') || cleanD.includes('digital') || cleanD.includes('it') || cleanD.includes('phan mem')) {
      finalDept = 'P. CÔNG NGHỆ SỐ';
    } else {
      finalDept = 'P. KẾ HOẠCH - KINH DOANH';
    }
  } else {
    if (cleanD.includes('kinh doanh') || cleanD.includes('cskh') || cleanD.includes('cham soc') || cleanD.includes('inbound') || cleanD.includes('callout') || cleanD.includes('dich vu') || cleanD.includes('vhdv') || cleanD.includes('kd')) {
      finalDept = 'Phòng KD & VHDV';
    } else if (cleanD.includes('hanh chinh') || cleanD.includes('hcth') || cleanD.includes('tong hop') || cleanD.includes('van phong')) {
      finalDept = 'Phòng HCTH';
    } else if (cleanD.includes('ky thuat') || cleanD.includes('ha tang') || cleanD.includes('van hanh') || cleanD.includes('vh') || cleanD.includes('htvt') || cleanD.includes('uctt') || cleanD.includes('truyen dan') || cleanD.includes('noc')) {
      finalDept = 'Phòng VH HT-VT';
    } else {
      finalDept = 'Phòng KD & VHDV';
    }
  }

  return { branch: finalBranch, department: finalDept };
}

function run() {
  const members: Member[] = [];
  const files = [
    'south_part1.csv',
    'south_part2.csv',
    'south_part3.csv',
    'south_part4.csv',
    'south_part5.csv'
  ];

  for (const filename of files) {
    const filepath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filepath)) {
      console.error(`File not found: ${filename}`);
      continue;
    }
    
    console.log(`Processing file: ${filename}`);
    const content = fs.readFileSync(filepath, 'utf-8');
    const parsedRows = parseCSV(content);
    
    let skippedHeader = false;
    for (const row of parsedRows) {
      if (row.length < 5) continue;
      
      const tt = row[0].trim();
      // Skip headers
      if (tt === 'TT' || tt === '' || isNaN(Number(tt))) {
        continue;
      }
      
      const fullName = row[1].trim();
      const employeeCode = row[2].trim();
      const rawUnionPos = row[4].trim();
      const rawTitle = row[5].trim();
      
      // Determine Gender and DOB
      let gender: 'Nam' | 'Nữ' = 'Nam';
      let dob = '';
      
      const dobNam = row[6] ? row[6].trim() : '';
      const dobNu = row[7] ? row[7].trim() : '';
      
      if (dobNam !== '') {
        gender = 'Nam';
        dob = formatDOB(dobNam);
      } else if (dobNu !== '') {
        gender = 'Nữ';
        dob = formatDOB(dobNu);
      } else {
        // Fallback guesser based on name
        const lowerName = fullName.toLowerCase();
        if (/\bthi\b/i.test(lowerName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
          gender = 'Nữ';
        } else {
          gender = 'Nam';
        }
      }
      
      // Right-aligned column resolution for email, phone, and department
      const rawDept = row[row.length - 1].trim();
      const rawPhone = row[row.length - 2].trim();
      const rawEmail = row[row.length - 3].trim();
      
      const normalizedPhone = normalizePhone(rawPhone);
      const email = rawEmail.toLowerCase();
      
      // Map positions
      let unionPosition = 'Đoàn viên';
      if (rawUnionPos.includes('Chủ tịch CĐCS')) {
        unionPosition = 'Chủ tịch CĐ CSTV';
      } else if (rawUnionPos.includes('UV BCH CĐCS')) {
        unionPosition = 'Ủy viên Ban Chấp hành công đoàn';
      } else if (rawUnionPos.includes('Công đoàn viên') || rawUnionPos.includes('Đoàn viên')) {
        unionPosition = 'Đoàn viên';
      } else {
        unionPosition = rawUnionPos;
      }
      
      // Get branch and department migration mapping
      const mapped = migrateBranchAndDept("Chi nhánh miền Nam", rawDept);
      
      const member: Member = {
        MemberID: `mem_cnmn_${tt}`,
        EmployeeCode: employeeCode,
        FullName: fullName,
        Gender: gender,
        DOB: dob,
        Branch: mapped.branch,
        Department: mapped.department,
        JoinDate: '2015-01-01', // Default standard
        Status: 'Đang hoạt động',
        Phone: normalizedPhone,
        Email: email,
        UnionPosition: unionPosition,
        Title: rawTitle
      };
      
      members.push(member);
    }
  }

  console.log(`Successfully parsed ${members.length} members for Chi nhánh miền Nam.`);
  
  // Write output TS file
  const outPath = path.join(process.cwd(), 'src', 'south_members.ts');
  const code = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member } from './types';

export const SOUTH_MEMBERS: Member[] = ${JSON.stringify(members, null, 2)};
`;

  fs.writeFileSync(outPath, code, 'utf-8');
  console.log(`Generated ${outPath}`);
}

run();
