import { useState } from 'react';
import { Database, Download, Upload, Trash2, AlertCircle } from 'lucide-react';
import { membersApi, schedulesApi, distributionsApi, requirementsApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export default function DataManagementPage() {
  const { isLeader, logout } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [importing, setImporting] = useState(false);

  if (!isLeader) {
    return (
      <div className="card text-center py-12 text-[#475569]">
        <AlertCircle className="mx-auto mb-3 text-yellow-500/50" size={40} />
        <p>仅团长可访问数据管理</p>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      setStatus('导出中...');
      const [members, schedules, requirements, distributions] = await Promise.all([
        membersApi.list(),
        schedulesApi.list(),
        requirementsApi.list(),
        distributionsApi.list(),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        version: '2.0',
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
      setStatus('导出成功！');
    } catch {
      setStatus('导出失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setStatus('导入中...');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // Basic validation
      if (!data.version || !data.members) {
        throw new Error('文件格式无效');
      }
      setStatus(`文件已读取（版本 ${data.version}），包含 ${data.members?.length ?? 0} 名成员、${data.schedules?.length ?? 0} 条日程`);
      // Note: Full import would require dedicated API endpoints
      // For now just show the data summary
    } catch (err: unknown) {
      setStatus('导入失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Database className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">数据管理</h1>
      </div>

      <div className="space-y-4">
        {/* Export */}
        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Download className="text-green-400" size={18} />
            导出数据
          </h2>
          <p className="text-sm text-[#475569] mb-4">将所有成员、日程、掉落记录导出为 JSON 文件</p>
          <button className="btn-primary flex items-center gap-2" onClick={handleExport}>
            <Download size={16} /> 导出 JSON
          </button>
        </div>

        {/* Import */}
        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Upload className="text-blue-400" size={18} />
            导入数据
          </h2>
          <p className="text-sm text-[#475569] mb-4">从之前导出的 JSON 文件中恢复数据</p>
          <label className="btn-secondary flex items-center gap-2 w-fit cursor-pointer">
            <Upload size={16} />
            <span>选择文件</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>

        {status && (
          <div className="card border-blue-800/50 bg-blue-900/10 text-blue-300 text-sm">
            {status}
          </div>
        )}

        {/* Danger Zone */}
        <div className="card border-red-900/50">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
            <Trash2 size={18} />
            危险操作
          </h2>
          <button
            className="btn-danger flex items-center gap-2"
            onClick={() => {
              if (confirm('确认退出登录？')) handleLogout();
            }}
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
