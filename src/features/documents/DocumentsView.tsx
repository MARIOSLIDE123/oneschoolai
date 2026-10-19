import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Clock, 
  ChevronRight, 
  Plus, 
  Search,
  Filter,
  Eye,
  FileCheck,
  Check,
  Edit2
} from 'lucide-react';
import { Document, DocumentType, ExtractedTaskDraft, Task } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface DocumentsViewProps {
  documents: Document[];
  onRefresh: () => void;
  onNavigateToTasks: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onRefresh,
  onNavigateToTasks,
}) => {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<DocumentType>('weekly_schedule');
  const [uploadCampus, setUploadCampus] = useState('CAMPUS-MAIN');
  const [rawTextContent, setRawTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // AI Extraction State & Preview Modal
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeExtractionDoc, setActiveExtractionDoc] = useState<Document | null>(null);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTaskDraft[]>([]);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase()) || doc.fileName.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'all' || doc.documentType === selectedType;
    return matchSearch && matchType;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Vui lòng nhập tên tài liệu kế hoạch');
      return;
    }
    if (!selectedFile && !rawTextContent.trim()) {
      alert('Vui lòng chọn tệp tin (DOCX, XLSX, PDF) hoặc dán văn bản nội dung kế hoạch');
      return;
    }

    try {
      setIsUploading(true);
      let newDoc: Document;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', uploadTitle);
        formData.append('documentType', uploadType);
        formData.append('campusId', uploadCampus);
        const result = await api.uploadDocumentFile(formData);
        newDoc = result.document;
      } else {
        newDoc = await api.uploadDocumentText({
          title: uploadTitle,
          documentType: uploadType,
          campusId: uploadCampus,
          rawContent: rawTextContent,
        });
      }

      setIsUploadModalOpen(false);
      setUploadTitle('');
      setRawTextContent('');
      setSelectedFile(null);
      onRefresh();

      // Automatically offer to trigger AI Extraction
      handleStartExtraction(newDoc);
    } catch (err: any) {
      alert('Lỗi tải tài liệu: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartExtraction = async (doc: Document) => {
    setActiveExtractionDoc(doc);
    setIsExtracting(true);
    try {
      const result = await api.extractTasksWithAI(doc.id, doc.rawTextPreview, doc.campusIds[0]);
      setExtractedTasks(result.tasks);
      setExtractionWarnings(result.warnings);
    } catch (err: any) {
      alert('Lỗi trích xuất: ' + err.message);
      setActiveExtractionDoc(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleTaskSelection = (tempId: string) => {
    setExtractedTasks((prev) =>
      prev.map((t) => (t.tempId === tempId ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleConfirmImport = async () => {
    const selected = extractedTasks.filter((t) => t.selected !== false);
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất 1 nhiệm vụ để nhập vào hệ thống');
      return;
    }

    try {
      setIsImporting(true);
      await api.importTasksFromDraft(activeExtractionDoc?.id, selected);
      setImportSuccessMessage(`Đã nhập thành công ${selected.length} nhiệm vụ vào lịch điều hành!`);
      setTimeout(() => {
        setImportSuccessMessage(null);
        setActiveExtractionDoc(null);
        setExtractedTasks([]);
        onRefresh();
        onNavigateToTasks();
      }, 1500);
    } catch (err: any) {
      alert('Lỗi nhập nhiệm vụ: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Trung tâm Kế hoạch & Tài liệu</h2>
          <p className="text-xs text-[#64748B]">
            Quản lý văn bản kế hoạch tháng, lịch tuần, phân công nhiệm vụ và trích xuất chuẩn hóa bằng Gemini AI
          </p>
        </div>

        {can('upload_documents') && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#12366B] hover:bg-[#0B2145] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Tải lên tài liệu mới</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu, số hiệu văn bản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-lg border border-[#E2E8F0] focus:ring-1 focus:ring-[#12366B] outline-none"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#172B4D] focus:ring-1 focus:ring-[#12366B] outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">Tất cả loại văn bản</option>
          <option value="weekly_schedule">Lịch công tác tuần</option>
          <option value="monthly_plan">Kế hoạch tháng</option>
          <option value="department_plan">Kế hoạch chuyên môn</option>
          <option value="directive">Văn bản chỉ đạo</option>
          <option value="notice">Thông báo</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FB] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Tên tài liệu / Văn bản</th>
                <th className="py-3 px-4">Loại văn bản</th>
                <th className="py-3 px-4">Điểm trường</th>
                <th className="py-3 px-4">Thời gian áp dụng</th>
                <th className="py-3 px-4">Người tải</th>
                <th className="py-3 px-4">Số việc trích xuất</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Không tìm thấy tài liệu phù hợp. Hãy tải lên tài liệu mới.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#172B4D]">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-[#12366B]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold">{doc.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{doc.fileName} ({(doc.fileSize / 1024).toFixed(1)} KB)</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {doc.documentType === 'weekly_schedule' ? 'Lịch công tác tuần' : doc.documentType === 'monthly_plan' ? 'Kế hoạch tháng' : 'Chỉ đạo chuyên môn'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {doc.campusIds.map((cId) => (
                          <StatusBadge key={cId} type="campus" value={cId} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {doc.validFrom} → {doc.validTo}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {doc.uploadedByName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {doc.extractedTaskCount} nhiệm vụ
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="approval" value={doc.approvalStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleStartExtraction(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#CCFBF1] text-[#0D9488] hover:bg-teal-100 rounded-lg font-semibold text-xs transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Phân tích</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload Document */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#12366B]" />
                Tải lên tài liệu kế hoạch / Lịch công tác
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Tên văn bản / Kế hoạch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kế hoạch công tác tuần 09/KH-THPT"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#12366B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Loại văn bản</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="weekly_schedule">Lịch công tác tuần</option>
                    <option value="monthly_plan">Kế hoạch tháng</option>
                    <option value="department_plan">Kế hoạch chuyên môn</option>
                    <option value="directive">Văn bản chỉ đạo</option>
                    <option value="notice">Thông báo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Điểm trường áp dụng</label>
                  <select
                    value={uploadCampus}
                    onChange={(e) => setUploadCampus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="CAMPUS-MAIN">Trường chính</option>
                    <option value="CAMPUS-BRANCH">Phân hiệu</option>
                  </select>
                </div>
              </div>

              {/* File upload input or direct text paste */}
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Chọn tệp (DOCX, XLSX, PDF, TXT)
                </label>
                <input
                  type="file"
                  accept=".docx,.xlsx,.xls,.pdf,.txt"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#12366B] hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Hoặc dán nội dung kế hoạch trực tiếp
                </label>
                <textarea
                  rows={4}
                  placeholder="Dán nội dung các mục trong kế hoạch tuần, tháng hoặc phân công..."
                  value={rawTextContent}
                  onChange={(e) => setRawTextContent(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-[#12366B]"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold bg-[#12366B] hover:bg-[#0B2145] text-white rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isUploading ? 'Đang xử lý...' : 'Lưu tài liệu & Chuẩn bị trích xuất'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal AI Extraction Preview & Review */}
      {activeExtractionDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#CCFBF1] text-[#0D9488]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-[#172B4D]">
                    Kết quả AI trích xuất kế hoạch: {activeExtractionDoc.title}
                  </h3>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  BGH rà soát, chỉnh sửa các trường trước khi chính thức đưa vào Lịch công tác và Phân công nhiệm vụ
                </p>
              </div>

              <button
                onClick={() => setActiveExtractionDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {importSuccessMessage && (
              <div className="p-3 my-3 bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/20 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {importSuccessMessage}
              </div>
            )}

            {isExtracting ? (
              <div className="py-16 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-[#0D9488] animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#172B4D]">Gemini đang phân tích văn bản kế hoạch...</p>
                <p className="text-[11px] text-[#64748B]">Đối chiếu danh mục nhân sự và điểm trường theo schema OneSchool AI</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {extractionWarnings.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                      Các lưu ý cần BGH xác minh:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                      {extractionWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Tìm thấy <strong>{extractedTasks.length} nhiệm vụ</strong> từ tài liệu:</span>
                    <span className="text-[11px] text-[#0D9488] font-medium">Đánh dấu tích để chọn nhập</span>
                  </div>

                  {extractedTasks.map((task) => (
                    <div
                      key={task.tempId}
                      className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                        task.selected !== false
                          ? 'bg-white border-teal-300 ring-1 ring-teal-100'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.selected !== false}
                            onChange={() => handleToggleTaskSelection(task.tempId)}
                            className="w-4 h-4 rounded text-[#0D9488] focus:ring-[#0D9488] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setExtractedTasks((prev) =>
                                prev.map((t) => (t.tempId === task.tempId ? { ...t, title: val } : t))
                              );
                            }}
                            className="font-bold text-[#172B4D] border-b border-transparent hover:border-slate-300 focus:border-[#12366B] outline-none px-1 py-0.5 w-80 md:w-96 text-xs"
                          />
                        </div>

                        <StatusBadge type="campus" value={task.campusId} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pl-6">
                        <div>
                          <span>⏰ Bắt đầu: </span>
                          <strong>{task.startDate} {task.startTime || '08:00'}</strong>
                        </div>
                        <div>
                          <span>📍 Địa điểm: </span>
                          <strong>{task.location || 'Chưa rõ'}</strong>
                        </div>
                        <div>
                          <span>👤 Chủ trì: </span>
                          <strong className={task.ownerNames.length === 0 ? 'text-amber-600' : 'text-[#12366B]'}>
                            {task.ownerNames.join(', ') || 'Chưa phân công'}
                          </strong>
                        </div>
                      </div>

                      {task.warnings && task.warnings.length > 0 && (
                        <p className="text-[11px] text-amber-700 pl-6 flex items-center gap-1">
                          ⚠️ {task.warnings.join('; ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Đã chọn: <strong>{extractedTasks.filter((t) => t.selected !== false).length} / {extractedTasks.length}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveExtractionDoc(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isImporting || extractedTasks.filter((t) => t.selected !== false).length === 0}
                  onClick={handleConfirmImport}
                  className="px-4 py-2 text-xs font-semibold bg-[#0D9488] hover:bg-[#0f766e] text-white rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận & Đưa vào Lịch công tác</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
