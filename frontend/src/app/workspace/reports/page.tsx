
import React from 'react';
import Link from 'next/link';

export default function ReportsHub() {
  return (
    <div className="w-full h-full p-8 bg-zinc-100 overflow-y-auto font-sans tracking-wide">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-500 drop-shadow-sm mb-2">🦌 多模生成式分析中心库 - 【Reports Pool】 </h2>
        <p className="text-gray-500">所有的由 Data Reporting 主理 Agent 打包生成的 MD 或带样式纯点包单本 HTML  集中查档于兹！(将与 Outputs 后部对接！目前暂列草案)</p>

        {/* Card Groups Grid layout*/ }
        <div className="mt-8 grid lg:grid-cols-2 lg:gap-8 flex-col gap-6 md:p-3 pb-8 max-w-7xl relative ">
             
             {/* Report Tile Items Prototype!  */ }    
             <div className="flex p-5 gap-4 group  hover:shadow duration-500 bg-white/70 overflow-hidden relative shadow border hover:shadow-cyan-100 rounded-sm">
                <div role="img" className="bg-sky-50 w-24 h-[6.5rem] p-3 text-cyan-600 italic font-mono flex items-center shadow-inner rounded-sm rotate-3 break-all justify-center"><small className="rotate-2 leading-3">HTML/MD<br/><br/>Repv2_{}</small></div>
                <div className="flex-1 shrink flex-col gap-1 items-start mr-8 py-2 z-10 w-full overflow-hidden block">
                     <p className="text-2xs font-semibold uppercase italic bg-lime-50 rounded-xl px-1 text-slate-800 -rotate-1 truncate w-[22%] mb-0 select-none pb-0 text-amber-500 tracking-[-1px] font-[math]">★ LATEST </p>
                     <h3 className="line-clamp-2 md:-mb-1 text-slate-700 delay-50 break-normal tracking-[-.1px] delay flex text-xl font-bold selection:bg-purple-200 "> 【示例案档】 门店全栈清洗薪酬统计分析.html </h3>
                     <h5 className="italic flex w-min px-4 ml-[min] break-keep select-none cursor:no-drop bg-[rgba(66,244,14,0.02)] uppercase rounded-md tracking-1 justify-content mb-auto line-clamp-2 hover:line-clamp-6 opacity-65 min-h-[50%]" style={{ lineHeight:1.7}}> <span className="pt-[min(0px, 3vh)] mix-blend-color-burn break-all indent">由 [Reporter] 子探生成并于 2026-X 推送! 数据质量健康 优秀 。..</span></h5>
                 </div>
                 <button className="absolute group-hover:scale-y-110 active:opacity-none z-10 p-2 sm:px-min  lg:-mr-1 bgGradient1 text-cyan-200 mix-blend-difference group-hover:-inset-y-3 font-[ui-sans-serif] delay-700 right-0 py-8 lg:-mr-1 active:shadow-indigo-700 outline cursor transition transition scale-0 lg:group-hover:translate-x-min  right   select hover:bg-black rounded-[0em_5em_0_0em]"> Open Web <br/> Viewer 	{'>'} 
                 </button>   
             </div>

             {/* Waiting placeholder*/}
             <div className="col-span-1 rounded bg-slate-200 border-2  border-dashed outline-transparent  grid place-center shadow-inner shadow-[gray] mix-blend-multiply opacity-100"> <span className="self-center place-self-center mx-auto opacity-70 tracking-widest pointer-events-none  " >等待更多数据报单析出 . . .</span><br/>  </div>

       </div>  
    </div>
  )
}
