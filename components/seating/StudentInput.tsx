import React, { useRef } from 'react';
import { SeatingStudent } from '../../types/seating';
import { Download, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentInputProps {
  students: SeatingStudent[];
  setStudents: (students: SeatingStudent[]) => void;
}

const StudentInput: React.FC<StudentInputProps> = ({ students, setStudents }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const data = [
      ["학번", "이름"],
      ["10101", "김철수"],
      ["10102", "이영희"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "명단양식");
    XLSX.writeFile(wb, "학생명단_양식.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const newStudents: SeatingStudent[] = data
          .slice(1)
          .filter(row => row && row[1])
          .map((row, index) => ({
            id: `ex-${row[0] || index}-${Date.now()}`,
            name: `${row[0] ? `(${row[0]}) ` : ''}${row[1]}`.trim()
          }));

        if (newStudents.length > 0) {
          setStudents(newStudents);
        }
      } catch {
        alert("파일을 불러오는 중 오류가 발생했습니다.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={downloadTemplate}
          className="flex items-center justify-center px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-[13px] sm:text-[15px] font-black text-slate-500 uppercase active:scale-95 shadow-sm"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#1a4d2e]" />
          양식 받기
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center px-4 py-2.5 sm:py-3 bg-[#1a4d2e] text-white rounded-xl hover:bg-[#143a23] transition-all text-[13px] sm:text-[15px] font-black uppercase active:scale-95 shadow-md"
        >
          <FileUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
          명단 업로드
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
      </div>

      <div className="mt-auto pt-4 pb-1 border-t border-slate-50 flex items-center justify-center">
        <div className="bg-slate-50/80 px-4 py-2 rounded-full flex items-center shadow-inner border border-slate-100">
          <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mr-3 whitespace-nowrap">Registered</span>
          <span className="text-[14px] sm:text-[16px] font-black text-[#1a4d2e]">{students.length}명</span>
        </div>
      </div>
    </div>
  );
};

export default StudentInput;
