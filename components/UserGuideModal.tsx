
import React, { useState } from 'react';
import { X, Book, Zap, Factory, Layers, Download, Database, Cpu, Image as ImageIcon, Video, Mic } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('intro');

  if (!isOpen) return null;

  const sections = [
    { id: 'intro', label: 'Giới thiệu chung', icon: Book },
    { id: 'single', label: 'Chế độ Single Mode', icon: Zap },
    { id: 'factory', label: 'Chế độ Factory Mode', icon: Factory },
    { id: 'features', label: 'Tính năng Sản xuất', icon: Layers },
    { id: 'resources', label: 'Tài nguyên & Xuất', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'intro':
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="text-indigo-400" /> TVC Planner AI là gì?
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Đây là một hệ thống "Agentic Workflow" tự động hóa quy trình sản xuất TVC/Video ngắn. 
              Hệ thống sử dụng Gemini 2.5 Flash để đóng vai các chuyên gia: Creative Director, Scriptwriter, Storyboard Artist và Producer.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h4 className="font-bold text-white mb-2">Đầu vào (Input)</h4>
                <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                  <li>Tên chiến dịch/Sản phẩm</li>
                  <li>Context (DNA sản phẩm, thông tin nền)</li>
                  <li>Hình ảnh sản phẩm (Tối đa 5 ảnh)</li>
                  <li>Cấu hình Tone & Platform</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h4 className="font-bold text-white mb-2">Đầu ra (Output)</h4>
                <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                  <li>Phân tích Product DNA</li>
                  <li>10-15 Concept kịch bản</li>
                  <li>Manifest sản xuất chi tiết</li>
                  <li>Storyboard (Ảnh + Prompt)</li>
                  <li>Video Demo (Veo) & Audio (TTS)</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 'single':
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" /> Quy trình Single Mode
            </h3>
            <p className="text-slate-300">Dành cho việc tập trung phát triển sâu một dự án cụ thể.</p>
            
            <ol className="space-y-4 relative border-l border-slate-700 ml-2 mt-4">
              <li className="ml-6 relative">
                <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-4 ring-[#0f172a] text-xs font-bold">1</span>
                <h4 className="text-white font-bold">Khởi tạo</h4>
                <p className="text-sm text-slate-400">Nhập tên, dán nội dung Context (hoặc dùng Brand Vault), upload ảnh và nhấn "Phân Tích & Lên Concept".</p>
              </li>
              <li className="ml-6 relative">
                <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-4 ring-[#0f172a] text-xs font-bold">2</span>
                <h4 className="text-white font-bold">Brainstorming (Giai đoạn 1)</h4>
                <p className="text-sm text-slate-400">AI sẽ phân tích hình ảnh và text để trích xuất DNA sản phẩm và đề xuất danh sách các Concept ý tưởng.</p>
              </li>
              <li className="ml-6 relative">
                <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-4 ring-[#0f172a] text-xs font-bold">3</span>
                <h4 className="text-white font-bold">Lựa chọn Concept</h4>
                <p className="text-sm text-slate-400">Xem danh sách các ý tưởng. Tick chọn các ý tưởng bạn thích (Select All hoặc chọn lẻ). Nhấn "Run Scripts" ở thanh công cụ phía dưới.</p>
              </li>
              <li className="ml-6 relative">
                <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-4 ring-[#0f172a] text-xs font-bold">4</span>
                <h4 className="text-white font-bold">Triển khai chi tiết (Giai đoạn 2)</h4>
                <p className="text-sm text-slate-400">AI viết kịch bản chi tiết (Voice, Visual, Âm thanh) cho từng Concept đã chọn. Kết quả chuyển sang trạng thái "Script Ready".</p>
              </li>
            </ol>
          </div>
        );
      case 'factory':
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Factory className="text-indigo-400" /> Quy trình Factory Mode
            </h3>
            <p className="text-slate-300">Chế độ "Nhà máy" giúp chạy hàng loạt chiến dịch (Campaign) mà không cần giám sát thủ công. Thích hợp để cắm máy chạy qua đêm.</p>

            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl">
              <h4 className="font-bold text-indigo-300 mb-2">Cách hoạt động:</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>1. Chuyển nút gạt trên Sidebar sang <strong>FACTORY</strong>.</li>
                <li>2. Nhập thông tin dự án A -> Nhấn "Add to Factory Queue".</li>
                <li>3. Nhập thông tin dự án B -> Nhấn "Add to Factory Queue".</li>
                <li>4. Lặp lại với bao nhiêu dự án tùy thích.</li>
                <li>5. Nhấn nút <strong>START PRODUCTION LINE</strong> ở cuối Sidebar.</li>
              </ul>
            </div>
            <p className="text-sm text-amber-400 mt-2 bg-amber-500/10 p-3 rounded border border-amber-500/20">
              ⚡ Lưu ý: Factory Mode sẽ tự động thực hiện từ A-Z: Phân tích -> Tự động chạy TOÀN BỘ Concept -> Chờ Cooldown API -> Chuyển sang dự án tiếp theo.
            </p>
          </div>
        );
      case 'features':
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-pink-400" /> Chi tiết Tính năng
            </h3>
            
            <div className="grid gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-3">
                <div className="p-2 bg-purple-500/20 rounded text-purple-400 h-fit"><ImageIcon size={20}/></div>
                <div>
                  <h4 className="font-bold text-white">Multi-Layer Visuals</h4>
                  <p className="text-sm text-slate-400 mt-1">Trong màn hình xem Script chi tiết, bạn có thể nhấn vào icon ảnh ở từng Shot để AI vẽ Storyboard minh họa. Hoặc dùng nút "Render Visuals" ở ngoài Grid để vẽ hàng loạt.</p>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-3">
                <div className="p-2 bg-emerald-500/20 rounded text-emerald-400 h-fit"><Video size={20}/></div>
                <div>
                  <h4 className="font-bold text-white">Veo Video Generation</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Tại phần "Hook (3s)" của kịch bản, bấm nút "Tạo Veo Video" để tạo video demo chuyển động thực tế (Cần Paid API Key).
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-3">
                <div className="p-2 bg-blue-500/20 rounded text-blue-400 h-fit"><Mic size={20}/></div>
                <div>
                  <h4 className="font-bold text-white">Audio & TTS</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Nghe thử giọng đọc AI cho Hook, Body và CTA trực tiếp trên giao diện.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'resources':
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="text-emerald-400" /> Tài nguyên & Lưu trữ
            </h3>
            
            <ul className="space-y-4">
               <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <strong className="text-white block mb-1">Brand DNA Vault</strong>
                  <span className="text-sm text-slate-400">Lưu trữ các thông tin Brand dùng nhiều lần (Context, Tone). Giúp điền nhanh thông tin khi tạo dự án mới.</span>
               </li>
               <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <strong className="text-white block mb-1">Prompt Library</strong>
                  <span className="text-sm text-slate-400">Chỉnh sửa "não bộ" của AI. Bạn có thể thay đổi System Instruction hoặc cấu trúc Prompt để AI trả về kết quả theo ý muốn.</span>
               </li>
               <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <strong className="text-white block mb-1">Export / Xuất File</strong>
                  <span className="text-sm text-slate-400">
                    - <strong>JSON/Backup:</strong> Lưu toàn bộ dữ liệu database.<br/>
                    - <strong>Premiere XML:</strong> Xuất file timeline để import thẳng vào Adobe Premiere.<br/>
                    - <strong>Images Zip:</strong> Tải toàn bộ ảnh storyboard về máy.
                  </span>
               </li>
            </ul>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Book className="text-indigo-400" size={20} />
                Hướng Dẫn Sử Dụng
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-64 border-r border-slate-700 bg-slate-900/50 flex flex-col overflow-y-auto">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeTab === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveTab(section.id)}
                            className={`flex items-center gap-3 p-4 text-left transition-all border-l-2 hover:bg-slate-800/50 ${isActive ? 'border-indigo-500 bg-slate-800' : 'border-transparent'}`}
                        >
                            <Icon size={18} className={`${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{section.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#0b1121] p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
