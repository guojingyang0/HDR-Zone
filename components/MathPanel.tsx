
import React from 'react';
import { Sigma, Calculator, TrendingUp, FunctionSquare } from 'lucide-react';

interface MathPanelProps {
  t: any;
  theme: 'light' | 'dark';
}

const MathPanel: React.FC<MathPanelProps> = ({ t, theme }) => {
  return (
    <div className="p-6 min-h-[280px] flex flex-col justify-center">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="p-2.5 rounded-lg bg-purple-600 text-white shadow-lg shadow-purple-900/20">
           <Calculator size={24} />
        </div>
        <div>
           <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t.math.title}</div>
           <h3 className="text-2xl font-black text-gray-800 dark:text-white">{t.math.formula}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Weight Function Section */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <FunctionSquare size={14} className="text-orange-500"/>
              {t.math.weightFunction}
           </div>
          
           <div className="bg-white dark:bg-black/30 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm font-mono text-sm md:text-base text-gray-800 dark:text-gray-200">
            W(x) = smoothstep(R, R <span className="text-orange-500 font-bold">± F</span>, x)
           </div>
           
           <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-1 border-l-2 border-gray-200 dark:border-gray-700">
             {t.math.weightDesc}
           </div>
        </div>

        {/* Output Function Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <TrendingUp size={14} className="text-blue-500"/>
              {t.math.outputFunction}
          </div>
          
          <div className="bg-white dark:bg-black/30 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm font-mono text-sm md:text-base text-gray-800 dark:text-gray-200 flex items-center">
            <span>Y(x) = x + </span>
            <div className="mx-2 flex flex-col items-center justify-center">
               <span className="text-[10px] opacity-70">n</span>
               <Sigma size={16} />
               <span className="text-[10px] opacity-70">i=1</span>
            </div>
            <span>( E<sub className="text-xs opacity-70">i</sub> · W<sub className="text-xs opacity-70">i</sub>(x) )</span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-1 border-l-2 border-gray-200 dark:border-gray-700">
            {t.math.outputDesc}
          </div>
        </div>

      </div>
      
      {/* Legend Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-3 md:grid-cols-6 gap-4 text-[10px] text-gray-400 font-mono">
            <div>x : {t.math.variables.x}</div>
            <div>y : {t.math.variables.y}</div>
            <div>W : {t.math.variables.w}</div>
            <div>E : {t.math.variables.e}</div>
            <div>R : {t.math.variables.r}</div>
            <div>F : {t.math.variables.f}</div>
      </div>
    </div>
  );
};

export default MathPanel;
