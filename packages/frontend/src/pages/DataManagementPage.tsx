import { useState, useRef } from 'react';
import { Database, Download, Upload, Trash2, AlertCircle, CheckCircle, FileJson, Users, Calendar, Package, ListChecks } from 'lucide-react';
import { membersApi, schedulesApi, distributionsApi, requirementsApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

interface ExportData {
  exportedAt: string;
  version: string;
  members: unknown[];
  schedules: unknown[];
  requirements: unknown[];
  distributions: unknown[];
}

interface ImportPreview {
  members: number;
  schedules: number;
  requirements: number;
  distributions: number;
  version: string;
  exportedAt: string;
}

export default function DataManagementPage() {
  const { isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return (
      <div className="card text-center py-12 text-violet-400/50">
        <AlertCircle className="mx-auto mb-3 text-yellow-500/50" size={40} />
        <p>仅管理员可访问数据管理</p>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      setExporting(true);
      setStatus({ type: 'info', message: '正在导出数据...' });
      
      const [members, schedules, requirements, distributions] = await Promise.all([
        membersApi.list(),
        schedulesApi.list(),
        requirementsApi.list(),
        distributionsApi.list(),
      ]);

      const data: ExportData = {
        exportedAt: new Date().toISOString(),
        version: '2.1',
        members,
        schedules,
        requirements,
        distributions,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guild-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setStatus({ 
        type: 'success', 
        message: `导出成功！包含 ${members.length} 名成员、${schedules.length} 条日程、${requirements.length} 条需求、${distributions.length} 条分配记录` 
      });
    } catch (err) {
      setStatus({ type: 'error', message: '导出失败：' + (err instanceof Error ? err.message : '未知错误') });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setStatus({ type: 'info', message: '正在读取文件...' });
    
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      
      // Validation
      if (!data.version) {
        throw new Error('文件格式无效：缺少版本信息');
      }
      if (!data.members || !Array.isArray(data.members)) {
        throw new Error('文件格式无效：缺少成员数据');
      }
      
      setImportData(data);
      setPreview({
        members: data.members.length,
        schedules: data.schedules?.length || 0,
        requirements: data.requirements?.length || 0,
        distributions: data.distributions?.length || 0,
        version: data.version,
        exportedAt: data.exportedAt || '未知时间',
      });
      
      setStatus({ type: 'success', message: '文件读取成功，请确认导入' });
    } catch (err) {
      setStatus({ type: 'error', message: '读取失败：' + (err instanceof Error ? err.message : '未知错误') });
      setPreview(null);
      setImportData(null);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!importData) return;
    
    setImporting(true);
    setStatus({ type: 'info', message: '正在导入数据...' });
    
    try {
      // TODO: 实现实际的导入API调用
      // 目前仅显示预览，实际导入需要后端支持
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({ 
        type: 'success', 
        message: `导入预览完成！版本 ${importData.version}，包含 ${importData.members.length} 名成员` 
      });
      
      // Clear preview after success
      setTimeout(() => {
        setPreview(null);
        setImportData(null);
      }, 3000);
    } catch (err) {
      setStatus({ type: 'error', message: '导入失败：' + (err instanceof Error ? err.message : '未知错误') });
    } finally {
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setPreview(null);
    setImportData(null);
    setStatus(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('zh-CN');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="text-purple-400" size={24} />
        <div>
          <h1 className="text-xl font-bold text-white">数据管理</h1>
          <p className="text-xs text-violet-400">导出备份、导入恢复、系统维护</p>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`card border-l-4 ${
          status.type === 'success' ? 'border-green-500 bg-green-900/10' :
          status.type === 'error' ? 'border-red-500 bg-red-900/10' :
          'border-blue-500 bg-blue-900/10'
        }`}>
          <div className="flex items-center gap-2">
            {status.type === 'success' && <CheckCircle className="text-green-400" size={18} />}
            {status.type === 'error' && <AlertCircle className="text-red-400" size={18} />}
            {status.type === 'info' && <Database className="text-blue-400" size={18} />}
            <span className={`text-sm ${
              status.type === 'success' ? 'text-green-300' :
              status.type === 'error' ? 'text-red-300' :
              'text-blue-300'
            }`}>
              {status.message}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Download className="text-green-400" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">导出数据</h2>
              <p className="text-xs text-violet-400">备份所有数据到 JSON 文件</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-violet-300">
              <Users className="w-4 h-4" />
              <span>成员信息</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-violet-300">
              <Calendar className="w-4 h-4" />
              <span>Raid 日程</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-violet-300">
              <ListChecks className="w-4 h-4" />
              <span>装备需求</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-violet-300">
              <Package className="w-4 h-4" />
              <span>掉落分配</span>
            </div>
          </div>

          <button 
            className="btn-primary flex items-center gap-2 w-full justify-center" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download size={16} /> 导出 JSON
              </>
            )}
          </button>
        </div>

        {/* Import Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Upload className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">导入数据</h2>
              <p className="text-xs text-violet-400">从 JSON 文件恢复数据</p>
            </div>
          </div>

          {!preview ? (
            <>
              <div className="p-4 bg-slate-900/50 rounded-lg border border-dashed border-slate-700 mb-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileJson className="text-slate-500" size={32} />
                  <p className="text-sm text-slate-400">选择之前导出的 JSON 文件</p>
                  <p className="text-xs text-slate-500">支持版本 2.0+ 的数据文件</p>
                </div>
              </div>

              <label className="btn-secondary flex items-center gap-2 w-full justify-center cursor-pointer">
                <Upload size={16} />
                <span>选择文件</span>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                  disabled={importing} 
                />
              </label>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-violet-800/30">
                <h3 className="text-sm font-medium text-violet-300 mb-3">导入预览</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">文件版本</span>
                    <span className="text-white">{preview.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">导出时间</span>
                    <span className="text-white">{formatDate(preview.exportedAt)}</span>
                  </div>
                  <div className="border-t border-slate-700 my-2" />
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> 成员
                    </span>
                    <span className="text-white">{preview.members} 名</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 日程
                    </span>
                    <span className="text-white">{preview.schedules} 条</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ListChecks className="w-3 h-3" /> 需求
                    </span>
                    <span className="text-white">{preview.requirements} 条</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Package className="w-3 h-3" /> 分配
                    </span>
                    <span className="text-white">{preview.distributions} 条</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  className="btn-secondary flex-1" 
                  onClick={handleCancelImport}
                  disabled={importing}
                >
                  取消
                </button>
                <button 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  onClick={handleConfirmImport}
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      确认导入
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-900/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Trash2 className="text-red-400" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-red-400">危险操作</h2>
            <p className="text-xs text-red-400/70">这些操作不可逆，请谨慎</p>
          </div>
        </div>

        <button
          className="btn-danger flex items-center gap-2"
          onClick={() => {
            if (confirm('确认退出登录？')) handleLogout();
          }}
        >
          <Trash2 size={16} />
          退出登录
        </button>
      </div>
    </div>
  );
}
