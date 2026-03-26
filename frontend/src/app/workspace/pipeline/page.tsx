
import React from 'react';

// 【预设数据】未来这里将调用 /api 请求去拉取 `threads/{id}/lineage_metrics.log` 数据还原！
export default function PipelineMonitorPage() {
  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-6 md:p-10 font-sans overflow-auto">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">AI数据清洁 流水运行舱 ⚡️</h1>
        <p className="text-sm text-slate-500 mt-2">Agent调度、中断管理 及数据转换动作节点捕获 （Data Lineage & Middlewares Status）</p>
      </header>
      
      { /* Top Metrics Cards */ }
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
             <div className="text-slate-400 text-sm font-semibold">当台运作状态 </div>
             <div className="mt-2 text-2xl font-bold text-emerald-600">健康运行中 [Healthy]</div>
         </div>
         <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
             <div className="text-slate-400 text-sm font-semibold">挂载断点与恢复存档 </div>
             <div className="mt-2 text-2xl font-bold text-blue-600">2个可还原检查点 (Ckpts) <span className="text-xs">&#8594;</span></div>
         </div>
         <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 text-rose-50 border-l-4 border-l-rose-500">
             <div className="text-rose-500 text-sm font-semibold">已拦异情警报 (Alarms) </div>
             <div className="mt-2 text-2xl font-bold text-rose-600">0 桩威胁 (Safe) </div>
         </div>
      </div>

     { /* Main Table Panel - Workflow Lineage List (Placeholding static array directly reflecting backend actions)*/ }
      <div className="flex-1 bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-dashed pb-2">实时操作行动序列追源台</h3>
        <p className="text-sm text-indigo-400 italic mb-4">监听后台 tools 下挥行为, 等待模型通讯连线注入活效血缘...</p>
        
        <table className="min-w-full text-left bg-zinc-50 rounded-lg">
            <thead className="bg-zinc-100 text-zinc-500 text-xs text-center border-b font-mono">
              <tr>
                 <th className="px-4 py-3">序列(Id)  </th>
                 <th className="px-4 py-3">执行发起人(Actor) </th>
                 <th className="px-4 py-3">指引动派对象(Script Line) </th>
                 <th className="px-4 py-3">动作特征输出剪影 </th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 text-center divide-y hover:divide-indigo-100 divide-zinc-200">
              <tr className="hover:bg-indigo-50 transition border-teal-500/20"> 
                 <td className="px-2 py-4 text-xs font-mono text-slate-400">Step:0x88 </td> 
                 <td className="px-2 py-4"> <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded">Agent: [Data Quality]</span></td> 
                 <td className="px-2 py-4"> `/scripts/profile.py --file=...` </td> 
                 <td className="px-2 py-4 font-mono text-xs">Quality ≈ 85, missing-detected! ...</td> 
              </tr>
              <tr className="hover:bg-indigo-50 border-teal-500/20 transition"> 
                 <td className="px-2 py-4 text-xs font-mono text-slate-400">Step:0x89 </td> 
                 <td className="px-2 py-4 border-slate-200 "><span className="whitespace-nowrap bg-teal-100 text-teal-800 px-2 py-1 rounded">Agent: [Data Clean]</span></td> 
                 <td className="px-2 py-4 font-mono text-teal-700 text-xs"> {'[pipeline: {fill_missing+trim_IQR}...]' } </td> 
                 <td className="px-2 py-4 font-mono text-xs border-r pr-2 shadow-sm " >(Success) affected_row=355! file exported ...</td> 
              </tr>
            </tbody>
        </table>
      </div>

    </div>
  );
}
