
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Download, RefreshCw, Home } from "lucide-react";
import { dbService } from "../services/dbService";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleEmergencyExport = async () => {
    try {
      const projects = await dbService.getAllProjects();
      const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EMERGENCY_RESCUE_DATA_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Database access failed", e);
    }
  };

  private handleReset = async () => {
      if(confirm("CẢNH BÁO: Thao tác này sẽ xóa toàn bộ dữ liệu dự án để khôi phục App. Bạn nên thử 'Cứu Dữ Liệu' trước. Tiếp tục?")) {
          await dbService.clearAll();
          window.location.reload();
      }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Hệ thống gặp sự cố</h1>
                <p className="text-slate-400 text-sm">Application Error Protection System</p>
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-4 mb-6 border border-slate-800 overflow-auto max-h-40 custom-scrollbar">
              <p className="text-red-400 font-mono text-xs break-all">
                {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                  <pre className="text-slate-600 text-[10px] mt-2">
                      {this.state.errorInfo.componentStack}
                  </pre>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={18} /> Tải Lại Ứng Dụng
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={this.handleEmergencyExport}
                    className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Download size={18} /> Cứu Dữ Liệu (JSON)
                  </button>
                  <button
                    onClick={this.handleReset}
                    className="py-3 bg-slate-800 hover:bg-red-900/20 border border-slate-700 hover:border-red-500/50 text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Home size={18} /> Reset Gốc
                  </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-600 mt-6">
                TVC Planner AI &copy; Safe Mode Active
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
