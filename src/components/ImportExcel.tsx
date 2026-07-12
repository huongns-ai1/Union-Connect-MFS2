/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Member, Gender, MemberStatus } from '../types';
import { DEPARTMENT_MAP } from '../data';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, 
  Trash2, Play, ChevronRight, HelpCircle, ArrowRight, ShieldAlert, Check,
  Search, BookOpen, Info
} from 'lucide-react';
import { motion } from 'motion/react';

// Detailed mapping of actual Vietnamese Union Groups from corporate sheets to standardized database Departments
const VN_COOP_MAP: Record<string, string> = {
  'PHÒNG TỔ CHỨC HÀNH CHÍNH': 'P. TỔ CHỨC - HÀNH CHÍNH',
  'PHÒNG TCHC': 'P. TỔ CHỨC - HÀNH CHÍNH',
  'TỔ CĐ TCHC': 'P. TỔ CHỨC - HÀNH CHÍNH',
  'PHÒNG KẾ TOÁN': 'P. TÀI CHÍNH - KẾ TOÁN',
  'PHÒNG CÔNG NGHỆ SỐ': 'P. CÔNG NGHỆ SỐ',
  'PHÒNG CNS': 'P. CÔNG NGHỆ SỐ',
  'TỔ CĐ CNS': 'P. CÔNG NGHỆ SỐ',
  'PHÒNG KẾ HOẠCH KINH DOANH': 'P. KẾ HOẠCH - KINH DOANH',
  'PHÒNG KH KD': 'P. KẾ HOẠCH - KINH DOANH',
  'PHÒNG KINH DOANH & VẬN HÀNH DỊCH VỤ': 'Phòng KD & VHDV',
  'PHÒNG KD & VHDV': 'Phòng KD & VHDV',
  'PHÒNG HÀNH CHÍNH TỔNG HỢP': 'Phòng HCTH',
  'PHÒNG HCTH': 'Phòng HCTH',
  'PHÒNG VẬN HÀNH HẠ TẦNG - VIỄN THÔNG': 'Phòng VH HT-VT',
  'PHÒNG VH HT-VT': 'Phòng VH HT-VT',
  'TỔ CĐ INBOUND': 'Phòng KD & VHDV',
  'TỔ CĐ UCTT BÌNH ĐỊNH': 'Phòng VH HT-VT',
  'TỔ CĐ UCTT QUẢNG TRỊ': 'Phòng VH HT-VT',
  'TỔ CĐ UCTT KHÁNH HÒA': 'Phòng VH HT-VT',
  'TỔ CĐ UCTT QUẢNG NGÃI': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV TRUYỀN DẪN, CLC, ĐO KIỂM, NOC, LÁI XE': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV KON TUM': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV ĐẮK LẮK': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV ĐẮK NÔNG': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV KHÁNH HÒA': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV PHÚ YÊN': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV QUẢNG NAM': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV MẠNG LƯỚI MIỀN TRUNG': 'Phòng VH HT-VT',
  'TỔ CĐ HTNV VĂN PHÒNG CÔNG TY 7': 'Phòng HCTH',
  'TỔ CĐ KHỐI VĂN PHÒNG CHI NHÁNH, CALLOUT, XÁC MINH THÔNG TIN': 'Phòng KD & VHDV',
  'KHÁC': 'Phòng HCTH',
  'BAN TỔNG GIÁM ĐỐC': 'BAN TỔNG GIÁM ĐỐC',
  'P. TỔ CHỨC - HÀNH CHÍNH': 'P. TỔ CHỨC - HÀNH CHÍNH',
  'P. TÀI CHÍNH - KẾ TOÁN': 'P. TÀI CHÍNH - KẾ TOÁN',
  'P. HẠ TẦNG - VIỄN THÔNG': 'P. HẠ TẦNG - VIỄN THÔNG',
  'P. KẾ HOẠCH - KINH DOANH': 'P. KẾ HOẠCH - KINH DOANH',
  'P. CÔNG NGHỆ SỐ': 'P. CÔNG NGHỆ SỐ'
};

interface ImportExcelProps {
  onImportCompleted: (importedMembers: Member[]) => void;
  existingMembers: Member[];
  branches: string[];
  departments: string[];
}

export default function ImportExcel({
  onImportCompleted,
  existingMembers,
  branches,
  departments
}: ImportExcelProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [pastedData, setPastedData] = useState('');
  const [rowsToValidate, setRowsToValidate] = useState<any[]>([]);
  const [importReport, setImportReport] = useState<{
    validCount: number;
    errorCount: number;
    processedRows: any[];
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom states for searchable guidelines
  const [showRefList, setShowRefList] = useState(false);
  const [searchTermDept, setSearchTermDept] = useState('');
  const [activeRefTab, setActiveRefTab] = useState<'dept' | 'branch'>('dept');

  // Multi-criteria smart import configuration
  const [importBranchCriteria, setImportBranchCriteria] = useState<string>('All');
  const [importDeptCriteria, setImportDeptCriteria] = useState<string>('All');
  const [importCriteriaMode, setImportCriteriaMode] = useState<'none' | 'fill' | 'override'>('none');

  // Template reference schema
  const csvHeaders = 'EmployeeCode,FullName,Gender,DOB,Branch,Department,JoinDate,Status,Phone,Email,UnionPosition,Title';

  const badSampleText = `MFS801,Phạm Thành Luân,Nam,1995-04-10,Văn phòng tổng công ty MFS,Phòng CNS,2022-01-15,Đang hoạt động,0913554432,luan.pt@mobifoneservice.com.vn,Đoàn viên,Chuyên viên
MFS001,Trùng Mã Nhân Viên,Nam,1990-11-20,Chi nhánh miền Nam,Phòng KD & VHDV,2015-08-16,Đang hoạt động,0904123123,trungma@mobifoneservice.com.vn,Đoàn viên,Chuyên viên
MFS802,Lê Thùy Anh,Nữ,1997-08-30,Chi nhánh miền Nam,Phòng KD & VHDV,2023-05-10,Đang hoạt động,0909556677,lethuyanh@mobifoneservice.com.vn,Đoàn viên,Chuyên viên
MFS803,Nguyễn Trọng Đại,Nam,1999-99-99,Chi nhánh miền Trung,Phòng VH HT-VT,2025-02-14,Đang hoạt động,093455,nguyentrongdai@gmail,Đoàn viên,Chuyên viên
MFS804,,Nữ,1998-10-12,Văn phòng tổng công ty MFS,Phòng CNS,22-02-2022,Đang hoạt động,0903334444,huyen.vtt@mobifoneservice.com.vn,Ủy viên Ban Chấp hành công đoàn,Chuyên viên`;

  const goodSampleText = `MFS901,Phạm Minh Tuấn,Nam,1996-03-12,Văn phòng tổng công ty MFS,Phòng CNS,2021-05-18,Đang hoạt động,0904556622,tuan.pm@mobifoneservice.com.vn,Đoàn viên,Kỹ sư Công nghệ số
MFS902,Hoàng Lê Vy,Nữ,1998-07-25,Chi nhánh miền Nam,Phòng KD & VHDV,2022-11-10,Đang hoạt động,0909112233,vy.hl@mobifoneservice.com.vn,Bí thư Chi đoàn,Chuyên viên CSKH
MFS903,Hồ Hoàng Nam,Nam,1994-11-02,Chi nhánh miền Trung,Phòng VH HT-VT,2019-03-15,Đang hoạt động,0912445588,nam.hh@mobifoneservice.com.vn,Đoàn viên,Chuyên viên Vô tuyến`;

  // Simulator for downloading corporate excel template
  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFF" + [
      csvHeaders,
      'MFS901,Phạm Minh Tuấn,Nam,1996-03-12,Văn phòng tổng công ty MFS,Phòng CNS,2021-05-18,Đang hoạt động,0904556622,tuan.pm@mobifoneservice.com.vn,Đoàn viên,Kỹ sư Công nghệ số',
      'MFS902,Hoàng Lê Vy,Nữ,1998-07-25,Chi nhánh miền Nam,Phòng KD & VHDV,2022-11-10,Đang hoạt động,0909112233,vy.hl@mobifoneservice.com.vn,Bí thư Chi đoàn,Chuyên viên CSKH'
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "MFS_Union_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Automated injector for previewing
  const handleLoadSample = (sampleType: 'good' | 'bad') => {
    const data = sampleType === 'good' ? goodSampleText : badSampleText;
    setPastedData(data);
    parseAndValidate(data);
  };

  // Raw file reading and loading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileContent(file);
    }
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setPastedData(text);
        parseAndValidate(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFileContent(file);
    }
  };

  // Core parser and validator function
  const parseAndValidate = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const processed: any[] = [];
    let valid = 0;
    let errors = 0;

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      // Extract raw csv values split by comma
      const cols = line.split(',').map(s => {
        let val = s.trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        return val.trim();
      });

      // Skip report commentaries and metadata sheets (e.g. Exported report title lines)
      const isMetadataRow = cols.some(c => {
        const lower = c.toLowerCase();
        return lower.includes('báo cáo') || 
               lower.includes('tiêu chí') || 
               lower.includes('ngày xuất') || 
               lower.includes('người thực hiện') || 
               lower.startsWith('công đoàn') ||
               lower.includes('tác vụ excel') ||
               lower.includes('bộ lọc');
      });

      // Detect header row and skip it
      const isHeaderRow = cols.some(c => {
        const lower = c.toLowerCase();
        return lower === 'employeecode' || lower === 'fullname' || lower === 'mã nhân viên' || lower === 'họ tên';
      });

      if (isMetadataRow || (cols.length < 3 && !isHeaderRow)) {
        return; // Ignore descriptive info rows
      }

      if (isHeaderRow) {
        return; // Skip headers silently!
      }

      // Map columns: 
      // 0: EmployeeCode, 1: FullName, 2: Gender, 3: DOB, 4: Branch, 5: Department 
      // 6: JoinDate, 7: Status, 8: Phone, 9: Email, 10: UnionPosition, 11: Title

      const rawCode = cols[0] || '';
      const rawName = cols[1] || '';
      const rawGender = cols[2] || 'Nam';
      const rawDOB = cols[3] || '';
      const rawBranch = cols[4] || '';
      const rawDept = cols[5] || '';
      const rawJoinDate = cols[6] || '';
      const rawStatus = cols[7] || 'Đang hoạt động';
      const rawPhone = cols[8] || '';
      const rawEmail = cols[9] || '';
      const rawPosition = cols[10] || 'Đoàn viên';
      const rawTitle = cols[11] || 'Chuyên viên';

      const rowIssues: string[] = [];

      // Validations:
      // A. Check required code and duplicate code
      if (!rawCode) {
        rowIssues.push('Mã nhân viên trống');
      } else {
        const isDuplicateDB = existingMembers.some(
          m => m.EmployeeCode.toUpperCase() === rawCode.toUpperCase() && !m.DeletedAt
        );
        const isDuplicateInSelf = processed.some(
          r => r.data.EmployeeCode.toUpperCase() === rawCode.toUpperCase()
        );
        if (isDuplicateDB) {
          rowIssues.push(`Mã nhân viên ${rawCode} trùng lặp trong cơ sở dữ liệu`);
        }
        if (isDuplicateInSelf) {
          rowIssues.push(`Mã nhân viên ${rawCode} trùng lặp trong tệp tin excel`);
        }
      }

      // B. Name empty
      if (!rawName) {
        rowIssues.push('Họ tên đoàn viên không được bỏ trống');
      }

      // C. Gender validator
      let finalGender: Gender = 'Nam';
      if (rawGender === 'Nữ' || rawGender === 'Female' || rawGender === 'nu') {
        finalGender = 'Nữ';
      }

      // D. DOB validity
      if (!rawDOB) {
        rowIssues.push('Ngày sinh trống');
      } else {
        const parts = rawDOB.split('-');
        if (parts.length !== 3 || parts[0].length !== 4) {
          rowIssues.push(`Ngày sinh ${rawDOB} sai định dạng YYYY-MM-DD`);
        }
      }

      // E. Branch matching fallback with Criteria Logic
      let finalBranch = rawBranch;
      if (importCriteriaMode === 'override' && importBranchCriteria !== 'All') {
        finalBranch = importBranchCriteria;
      }

      if (!finalBranch) {
        if (importCriteriaMode === 'fill' && importBranchCriteria !== 'All') {
          finalBranch = importBranchCriteria;
        } else {
          rowIssues.push('Sở chi nhánh trống');
        }
      } else if (importCriteriaMode !== 'override' || importBranchCriteria === 'All') {
        const cleanInput = finalBranch.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
        
        // Custom smart keywords mapping before fuzzy match
        if (cleanInput.includes('da nang') || cleanInput.includes('mien trung') || cleanInput.includes('trung')) {
          finalBranch = 'Chi nhánh miền Trung';
        } else if (cleanInput.includes('ha noi') || cleanInput.includes('tong cong ty') || cleanInput.includes('văn phong')) {
          finalBranch = 'Văn phòng tổng công ty MFS';
        } else if (cleanInput.includes('mien bac') || cleanInput.includes('bac') || cleanInput.includes('hn')) {
          finalBranch = 'Chi nhánh miền Bắc';
        } else if (cleanInput.includes('mien nam') || cleanInput.includes('ho chi minh') || cleanInput.includes('sai gon') || cleanInput.includes('hcm') || cleanInput.includes('nam') || cleanInput.includes('mien tay') || cleanInput.includes('can tho') || cleanInput.includes('tay')) {
          finalBranch = 'Chi nhánh miền Nam';
        } else {
          const foundBranch = branches.find(b => {
            const bLower = b.toLowerCase();
            const cleanInputBranch = finalBranch.trim().toLowerCase();
            return bLower === cleanInputBranch || 
                   bLower.replace(/^(mfs\s+)/i, '').trim() === cleanInputBranch.replace(/^(mfs\s+)/i, '').trim() ||
                   bLower.includes(cleanInputBranch) || 
                   cleanInputBranch.includes(bLower);
          });
          if (foundBranch) {
            finalBranch = foundBranch;
          } else {
            if (importCriteriaMode === 'fill' && importBranchCriteria !== 'All') {
              finalBranch = importBranchCriteria;
            } else {
              rowIssues.push(`Chi nhánh "${rawBranch}" không tồn tại trong thiết lập`);
            }
          }
        }
      } else {
        finalBranch = importBranchCriteria;
      }

      // F. Department matching with Criteria Logic
      let finalDept = rawDept;
      if (importCriteriaMode === 'override' && importDeptCriteria !== 'All') {
        finalDept = importDeptCriteria;
      }

      if (!finalDept) {
        if (importCriteriaMode === 'fill' && importDeptCriteria !== 'All') {
          finalDept = importDeptCriteria;
        } else {
          rowIssues.push('Phòng ban trống');
        }
      } else if (importCriteriaMode !== 'override' || importDeptCriteria === 'All') {
        const cleanUpperDept = finalDept.trim().toUpperCase();
        
        if (VN_COOP_MAP[cleanUpperDept]) {
          finalDept = VN_COOP_MAP[cleanUpperDept];
        } else if (DEPARTMENT_MAP[cleanUpperDept]) {
          finalDept = DEPARTMENT_MAP[cleanUpperDept];
        } else {
          // Fallback to custom fuzzy keyword mapping or normalized lookup
          const norm = finalDept
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (norm.includes('giam doc') || norm.includes('tgd') || norm.includes('bgd')) {
            finalDept = 'BAN TỔNG GIÁM ĐỐC';
          } else if (norm.includes('to chuc') || norm.includes('tchc') || norm.includes('hanh chinh')) {
            finalDept = 'P. TỔ CHỨC - HÀNH CHÍNH';
          } else if (norm.includes('ke toan') || norm.includes('tai chinh')) {
            finalDept = 'P. TÀI CHÍNH - KẾ TOÁN';
          } else if (norm.includes('ha tang') || norm.includes('vien thong')) {
            finalDept = 'P. HẠ TẦNG - VIỄN THÔNG';
          } else if (norm.includes('cong nghe so') || norm.includes('cns') || norm.includes('digital') || norm.includes('it')) {
            finalDept = 'P. CÔNG NGHỆ SỐ';
          } else if (norm.includes('ke hoach') || norm.includes('kh kd') || norm.includes('kinh doanh tong hop') || norm.includes('kdth')) {
            finalDept = 'P. KẾ HOẠCH - KINH DOANH';
          } else if (norm.includes('kinh doanh') || norm.includes('vhdv') || norm.includes('dich vu') || norm.includes('cskh') || norm.includes('cham soc') || norm.includes('inbound') || norm.includes('callout')) {
            finalDept = 'Phòng KD & VHDV';
          } else if (norm.includes('hanh chinh tong hop') || norm.includes('hcth') || norm.includes('tong hop') || norm.includes('van phong')) {
            finalDept = 'Phòng HCTH';
          } else if (norm.includes('ky thuat') || norm.includes('ha tang') || norm.includes('van hanh') || norm.includes('vh ht vt') || norm.includes('uctt') || norm.includes('truyen dan') || norm.includes('noc')) {
            finalDept = 'Phòng VH HT-VT';
          } else {
            // Apply standard stripped prefix find matching
            const stripPrefixes = (s: string) => {
              return s
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/^(to\s+cd|to\s+cđ|to\s+cong\s+doan|cong\s+doan|phong)\s+/i, '')
                .replace(/\s+/g, '')
                .trim();
            };

            const searchKey = stripPrefixes(finalDept);
            const foundDept = departments.find(d => {
              const dKey = stripPrefixes(d);
              return dKey === searchKey || dKey.includes(searchKey) || searchKey.includes(dKey) || d.toLowerCase() === finalDept.trim().toLowerCase();
            });

            if (foundDept) {
              finalDept = foundDept;
            }
          }
        }
        
        if (!departments.includes(finalDept)) {
          if (importCriteriaMode === 'fill' && importDeptCriteria !== 'All') {
            finalDept = importDeptCriteria;
          } else {
            rowIssues.push(`Phòng ban "${rawDept}" không có trong thiết lập`);
          }
        }
      } else {
        finalDept = importDeptCriteria;
      }

      // G. Join date validator
      if (!rawJoinDate) {
        rowIssues.push('Ngày vào đoàn trống');
      } else {
        const parts = rawJoinDate.split('-');
        if (parts.length !== 3 || parts[0].length !== 4) {
          rowIssues.push(`Ngày vào đoàn ${rawJoinDate} sai định dạng YYYY-MM-DD`);
        }
      }

      // H. Email formatting & dynamic self-healing
      let finalEmail = rawEmail.trim();
      if (!finalEmail) {
        if (rawName) {
          const slug = rawName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/\s+/g, "");
          const codeSuffix = rawCode ? rawCode.toLowerCase().replace(/[^a-z0-9]/g, '') : Math.floor(Math.random() * 1000).toString();
          finalEmail = `${slug}.${codeSuffix}@mobifoneservice.com.vn`;
        } else {
          rowIssues.push('Địa chỉ Email trống và không thể tạo tự động');
        }
      } else if (!finalEmail.includes('@') || !finalEmail.includes('.')) {
        rowIssues.push(`Địa chỉ Email ${rawEmail} không đúng định dạng`);
      }

      // I. Phone simple check
      if (!rawPhone) {
        rowIssues.push('Số điện thoại trống');
      } else if (rawPhone.length < 8) {
        rowIssues.push(`Số điện thoại ${rawPhone} quá ngắn`);
      }

      const isValid = rowIssues.length === 0;
      if (isValid) valid++;
      else errors++;

      processed.push({
        id: `import_row_${index}`,
        lineNo: index + 1,
        rawLine: line,
        isValid,
        issues: rowIssues,
        data: {
          EmployeeCode: rawCode.toUpperCase(),
          FullName: rawName,
          Gender: finalGender,
          DOB: rawDOB,
          Branch: finalBranch,
          Department: finalDept,
          JoinDate: rawJoinDate,
          Status: rawStatus as MemberStatus,
          Phone: rawPhone,
          Email: finalEmail,
          UnionPosition: rawPosition,
          Title: rawTitle
        }
      });
    });

    setImportReport({
      validCount: valid,
      errorCount: errors,
      processedRows: processed
    });
    setActiveStep(2);
  };

  // Submit parsed items to the parent context
  const handleExecuteImport = () => {
    if (!importReport || importReport.validCount === 0) return;

    const validatedMembers: Member[] = importReport.processedRows
      .filter(row => row.isValid)
      .map(row => ({
        ...row.data,
        MemberID: `imported_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      }));

    onImportCompleted(validatedMembers);
    setActiveStep(3);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Visual Progress Steps Bar */}
      <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Tính năng Import Excel / CSV</h3>
            <p className="text-[11px] text-slate-500">Số hóa nhanh hàng loạt thông tư đoàn viên từ các chi nhánh cơ sở</p>
          </div>
        </div>

        {/* Indicators */}
        <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <div className={`flex items-center gap-1.5 ${activeStep >= 1 ? 'text-blue-600' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] font-bold">1</span>
            Chuẩn bị tệp tin
          </div>
          <ChevronRight className="w-3 h-3" />
          <div className={`flex items-center gap-1.5 ${activeStep >= 2 ? 'text-blue-600' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] font-bold">2</span>
            Kiểm tra dữ liệu
          </div>
          <ChevronRight className="w-3 h-3" />
          <div className={`flex items-center gap-1.5 ${activeStep === 3 ? 'text-green-600' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[10px] font-bold">3</span>
            Hoàn thành
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: CHOOSE PRESET FILES OR INJECT */}
        {activeStep === 1 && (
          <div className="space-y-6">
            
            {/* Multi-criteria preset sync configuration panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs">
                    ⚙
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-850 text-slate-800">Cấu hình Gán Tiêu chí Lọc thông minh khi Nhập</h4>
                    <p className="text-[10.5px] text-slate-500">Tự động bổ khuyết thông tin thiếu hoặc áp đặt đồng loạt đoàn viên vào chi nhánh / tổ công đoàn cụ thể</p>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] uppercase w-fit tracking-wider">
                  Tính năng MỚI
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phương thức xử lý tiêu chí</label>
                  <select
                    value={importCriteriaMode}
                    onChange={(e) => setImportCriteriaMode(e.target.value as 'none' | 'fill' | 'override')}
                    className="w-full text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer font-medium"
                  >
                    <option value="none">Không áp dụng (Dùng 100% cột Excel)</option>
                    <option value="fill">Bổ khuyết tự động (Chỉ tự điền nếu dòng trống/lỗi)</option>
                    <option value="override">Ghi đè đồng loạt (Ép toàn bộ bản ghi theo tiêu chí)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Chi nhánh đồng bộ</label>
                  <select
                    value={importBranchCriteria}
                    onChange={(e) => setImportBranchCriteria(e.target.value)}
                    disabled={importCriteriaMode === 'none'}
                    className="w-full text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 disabled:bg-slate-100 disabled:opacity-60 cursor-pointer font-medium"
                  >
                    <option value="All">-- Chọn chi nhánh mẫu --</option>
                    {branches.map(br => (
                      <option key={br} value={br}>{br}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tổ công đoàn đồng bộ</label>
                  <select
                    value={importDeptCriteria}
                    onChange={(e) => setImportDeptCriteria(e.target.value)}
                    disabled={importCriteriaMode === 'none'}
                    className="w-full text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 disabled:bg-slate-100 disabled:opacity-60 cursor-pointer font-medium"
                  >
                    <option value="All">-- Chọn tổ công đoàn mẫu --</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {importCriteriaMode !== 'none' && (
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start gap-2 animate-fadeIn">
                  <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="leading-tight">
                    Chế độ <strong className="font-bold">{importCriteriaMode === 'fill' ? 'Bổ khuyết tự động' : 'Ghi đè đồng loạt'}</strong> đang hoạt động. 
                    {importCriteriaMode === 'fill' ? (
                      <span> Hệ thống sẽ tự động gán chi nhánh <strong className="text-blue-900 font-bold">{importBranchCriteria !== 'All' ? `"${importBranchCriteria}"` : '(Giữ nguyên)'}</strong> và tổ công đoàn <strong className="text-blue-900 font-bold">{importDeptCriteria !== 'All' ? `"${importDeptCriteria}"` : '(Giữ nguyên)'}</strong> cho bất kỳ dòng nhập nào có cột trống hoặc không hợp lệ.</span>
                    ) : (
                      <span> Toàn bộ cơ sở dữ liệu đoàn viên trong đợt tải lên này sẽ bị ép buộc thuộc về chi nhánh <strong className="text-blue-900 font-bold">{importBranchCriteria !== 'All' ? `"${importBranchCriteria}"` : '(Bỏ qua)'}</strong> và tổ công đoàn <strong className="text-blue-900 font-bold">{importDeptCriteria !== 'All' ? `"${importDeptCriteria}"` : '(Bỏ qua)'}</strong>.</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Instructions Panel */}
              <div className="space-y-4 text-xs">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="font-bold text-blue-800 flex items-center gap-1.5 text-xs">
                    <HelpCircle className="w-4 h-4" /> Hướng dẫn tải lên đúng chuẩn
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Để đảm bảo hệ thống đọc chính xác, cấu trúc bảng Excel cần tuân thủ cấu trúc của file mẫu. Dữ liệu ngày tháng phải theo chuẩn <strong className="text-slate-800">YYYY-MM-DD</strong> (ví dụ: <strong className="text-slate-800">1996-03-12</strong>).
                  </p>
                  
                  <div className="pt-1.5">
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải Xuống File Mẫu (.csv)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-l-2 border-indigo-200 pl-4 py-1">
                  <span className="font-bold text-slate-700 block">Các trường bắt buộc gồm:</span>
                  <ul className="list-disc leading-relaxed pl-4 space-y-1 text-slate-500 text-[11px]">
                    <li><strong>EmployeeCode</strong> (Ví dụ: MFS001) – Không trùng lặp</li>
                    <li><strong>FullName</strong> (Họ tên đầy đủ có dấu)</li>
                    <li><strong>Email</strong> (Đầy đủ ký tự @mobifoneservice.com.vn hoặc cá nhân)</li>
                    <li><strong>Phone</strong> (Là số điện thoại có nghĩa)</li>
                  </ul>
                </div>

                {/* Searchable reference lists of Unions/Departments to make it extremely easy to copy-paste */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mt-4">
                  <button
                    onClick={() => setShowRefList(!showRefList)}
                    type="button"
                    className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-100/70 hover:bg-slate-100 transition duration-150 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-left">
                      <BookOpen className="w-4 h-4 text-emerald-600 animate-pulse flex-shrink-0" />
                      Tra cứu Danh sách Công đoàn & Chi nhánh thiết lập
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold uppercase flex items-center gap-1 flex-shrink-0">
                      {showRefList ? 'Thu gọn ▲' : 'Mở rộng ▼'}
                    </span>
                  </button>
                  
                  {showRefList && (
                    <div className="p-4 space-y-3 border-t border-slate-200 bg-white">
                      <p className="text-[10.5px] text-slate-500 leading-relaxed">
                        Hệ thống tự động đồng bộ hóa và nhận diện thông minh các từ khóa dưới đây trong cột <strong className="text-slate-700">Branch</strong> và <strong className="text-slate-700">Department</strong> khi bạn nạp Excel / CSV:
                      </p>

                      {/* Tabs */}
                      <div className="flex border-b border-slate-200 gap-1">
                        <button
                          type="button"
                          onClick={() => { setActiveRefTab('dept'); setSearchTermDept(''); }}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-t-lg transition border-b-2 -mb-px ${
                            activeRefTab === 'dept'
                              ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Tổ Công đoàn ({departments.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveRefTab('branch'); setSearchTermDept(''); }}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-t-lg transition border-b-2 -mb-px ${
                            activeRefTab === 'branch'
                              ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Chi nhánh ({branches.length})
                        </button>
                      </div>

                      {/* Filter Search input */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 ml-0.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={searchTermDept}
                          onChange={(e) => setSearchTermDept(e.target.value)}
                          placeholder={`Tìm nhanh ${activeRefTab === 'dept' ? 'tổ công đoàn...' : 'chi nhánh...'}`}
                          className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
                        />
                      </div>

                      {/* Option List Grid */}
                      <div className="max-h-56 overflow-y-auto pr-1 text-[11px] space-y-1">
                        {activeRefTab === 'dept' ? (
                          departments
                            .filter(d => d.toLowerCase().includes(searchTermDept.toLowerCase()))
                            .map((d, index) => {
                              // Find aliases or map if any exists
                              const normalizedKeys = Object.keys(VN_COOP_MAP).filter(k => VN_COOP_MAP[k] === d);
                              return (
                                <div key={index} className="p-2 bg-slate-50/50 rounded-lg border border-slate-100 flex items-center justify-between text-slate-700 hover:bg-slate-50 transition">
                                  <div className="space-y-0.5 pr-2">
                                    <strong className="text-slate-800 break-all">{d}</strong>
                                    {normalizedKeys.length > 0 && (
                                      <span className="block text-[9.5px] text-slate-400 leading-tight">
                                        Nạp bằng: "{d}" hoặc "{normalizedKeys[0]}"
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(d);
                                    }}
                                    className="px-2 py-0.5 border border-blue-100 hover:border-blue-300 text-blue-600 hover:bg-blue-50/50 font-semibold rounded text-[9.5px] cursor-pointer"
                                    title="Click để sao chép"
                                  >
                                    Copy
                                  </button>
                                </div>
                              );
                            })
                        ) : (
                          branches
                            .filter(b => b.toLowerCase().includes(searchTermDept.toLowerCase()))
                            .map((b, index) => (
                              <div key={index} className="p-2 bg-slate-50/50 rounded-lg border border-slate-100 flex items-center justify-between text-slate-700 hover:bg-slate-50 transition">
                                <div>
                                  <strong className="text-slate-800">{b}</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(b);
                                  }}
                                  className="px-2 py-0.5 border border-blue-100 hover:border-blue-300 text-blue-600 hover:bg-blue-50/50 font-semibold rounded text-[9.5px] cursor-pointer"
                                  title="Click để sao chép"
                                >
                                  Copy
                                </button>
                              </div>
                            ))
                        )}

                        {searchTermDept && (
                          (activeRefTab === 'dept' ? departments : branches).filter(x => x.toLowerCase().includes(searchTermDept.toLowerCase())).length === 0 && (
                            <div className="text-center py-4 text-slate-400 text-[10.5px]">
                              Không tìm thấy khớp với từ khóa "{searchTermDept}"
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area / Paste simulator or automated test injectors */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <strong className="text-xs font-bold text-slate-800 block">Khu vực kiểm thử nhanh (Demo Validation)</strong>
                  <span className="text-[11px] text-slate-500 block">Chọn nạp nhanh danh sách mẫu dưới đây để xem cách Union Connect quét lỗi thông minh từng hàng:</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Good list */}
                  <button
                    onClick={() => handleLoadSample('good')}
                    className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left transition cursor-pointer space-y-1 group"
                  >
                    <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      ✔
                    </div>
                    <div>
                      <strong className="block text-xs text-slate-800 group-hover:text-emerald-700">Dữ liệu hoàn hảo</strong>
                      <span className="text-[10px] text-slate-500 block leading-tight">3 Đoàn viên chuẩn bị sẵn, 100% hợp lệ để chuyển trực tiếp</span>
                    </div>
                  </button>

                  {/* Bad list */}
                  <button
                    onClick={() => handleLoadSample('bad')}
                    className="p-3 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-xl text-left transition cursor-pointer space-y-1 group"
                  >
                    <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs text-red-500">
                      ⚠
                    </div>
                    <div>
                      <strong className="block text-xs text-slate-800 group-hover:text-red-700">Dữ liệu nhiều lỗi</strong>
                      <span className="text-[10px] text-slate-500 block leading-tight">Gồm 5 Đoàn viên chứa mã trùng lặp, sai ngày, thiếu dữ liệu để test bộ lọc</span>
                    </div>
                  </button>
                </div>

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative pt-2 cursor-pointer transition-all ${isDragging ? 'scale-[1.01]' : ''}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".csv,.txt" 
                    className="hidden" 
                  />
                  <div className={`text-slate-400 text-center text-xs py-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 bg-white transition-all duration-200 ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                  }`}>
                    <Upload className={`w-5 h-5 transition-transform duration-200 ${isDragging ? 'scale-110 text-blue-500' : 'text-slate-400'}`} />
                    <span className={isDragging ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'}>
                      {isDragging ? 'Thả tệp tin tại đây...' : 'Kéo thả file CSV đoàn viên của bạn vào đây'}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Hoặc click để duyệt tìm file (.csv / .txt)</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Custom copy-paste table contents option */}
            <div className="space-y-2 border-t border-slate-100 pt-5">
              <label className="block text-xs font-bold text-slate-700">
                Nhập nội dung dữ liệu dán trực tiếp (Commas-separated values / CSV):
              </label>
              <textarea
                rows={5}
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder={`Ví dụ:\nEmployeeCode,FullName,Gender,DOB,Branch,Department,JoinDate,Status,Phone,Email,UnionPosition,Title\nMFS901,Phạm Minh Tuấn,Nam,1996-03-12,MFS Trung tâm Hà Nội,Phòng Công nghệ số,2021-05-18,Đang hoạt động,0904556622,tuan.pm@mobifoneservice.com.vn,Đoàn viên,Chuyên viên Công nghệ số`}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
              <div className="flex justify-end pt-1">
                <button
                  disabled={!pastedData.trim()}
                  onClick={() => parseAndValidate(pastedData)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Phân tích cấu trúc & Validate <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
          </div>
        )}

        {/* STEP 2: PREVIEW & ERROR VALIDATION LOGS */}
        {activeStep === 2 && importReport && (
          <div className="space-y-6">
            
            {/* Stats Summary Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-400">Tổng số dòng quét thấy</span>
                <strong className="block text-2xl font-bold text-slate-800 mt-0.5">{importReport.processedRows.length}</strong>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-xs text-green-800">
                <span className="text-green-600 font-medium">Đoàn viên Hợp lệ (Sẵn sàng nhập)</span>
                <strong className="block text-2xl font-bold mt-0.5">{importReport.validCount}</strong>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800">
                <span className="text-red-600 font-medium font-semibold">Bản ghi có lỗi chặn</span>
                <strong className="block text-2xl font-bold mt-0.5">{importReport.errorCount}</strong>
              </div>
            </div>

            {/* Validation alerts table list */}
            <div className="space-y-3">
              <strong className="text-xs font-bold text-slate-800 block">Chi tiết kết quả rà soát dữ liệu</strong>
              
              <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {importReport.processedRows.map((row, idx) => (
                  <div 
                    key={row.id} 
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 ${
                      row.isValid ? 'bg-white' : 'bg-red-50/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Check/Alert indicator */}
                      <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[10px] mt-0.5 ${
                        row.isValid 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {row.isValid ? '✓' : '!'}
                      </span>

                      <div>
                        {row.isValid ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 font-sans block">
                              {row.data.FullName} (Code: {row.data.EmployeeCode})
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {row.data.Branch} • {row.data.Department} • Chức vụ: {row.data.UnionPosition}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-600 block line-clamp-1 italic text-slate-400">
                              Dòng {row.lineNo}: "{row.rawLine}"
                            </span>
                            
                            {/* Issues details bullet error logs */}
                            <div className="flex flex-wrap gap-1">
                              {row.issues.map((issue: string, i: number) => (
                                <span key={i} className="bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                                  {issue}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Final state message */}
                    <div className="text-right text-[11px] font-semibold flex-shrink-0">
                      {row.isValid ? (
                        <span className="text-emerald-700 uppercase">Hợp lệ</span>
                      ) : (
                        <span className="text-amber-600 uppercase">Bị từ chối nhập</span>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 operations close */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                onClick={() => { setActiveStep(1); setImportReport(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl cursor-pointer"
              >
                Quay lại làm mới bản dán
              </button>

              <button
                disabled={importReport.validCount === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                Tiến hành Nhập ({importReport.validCount} Đoàn viên) <Check className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMED */}
        {activeStep === 3 && (
          <div className="text-center py-8 space-y-4 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border-4 border-green-100">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Đã nhập thành công!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Các đoàn viên hợp lệ đã được kiểm tra nghiêm ngặt, đối chiếu trùng mã số nội bộ và hòa vào cơ sở dữ liệu hệ thống Union Connect.
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  setActiveStep(1);
                  setPastedData('');
                  setImportReport(null);
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                Nhập thêm tệp tin khác
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
