import React from 'react';
import { Sigma, Calculator } from 'lucide-react';

interface MathPanelProps {
  t: any;
  theme: 'light' | 'dark';
}

const MathPanel: React.FC<MathPanelProps> = ({ t, theme }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-5 text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
        <Calculator size={18} />
        {t.math.title}
      </div>

      <div className="space-y-6">
        
        {/* Weight Function Section */}
        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{t.math.weightFunction}</div>
          <div className="font-mono text-sm md:text-base text-gray-800 dark:text-gray-200 mb-3 overflow-x-auto pb-2">
            W(x) = smoothstep(R, R <span className="text-orange-500">± F</span>, x)
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            {t.math.weightDesc}
          </div>
        </div>

        {/* Output Function Section */}
        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{t.math.outputFunction}</div>
          
          <div className="font-mono text-sm md:text-base text-gray-800 dark:text-gray-200 mb-3 overflow-x-auto pb-2 flex items-center">
            <span>Y(x) = x + </span>
            <div className="mx-2 flex flex-col items-center justify-center">
               <span className="text-xs">n</span>
               <Sigma size={14} />
               <span className="text-xs">i=1</span>
            </div>
            <span>( E<sub className="text-xs">i</sub> · W<sub className="text-xs">i</sub>(x) )</span>
          </div>
          
          <div className="text-xs text-gray-500 leading-relaxed">
            {t.math.outputDesc}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono bg-gray-100/50 dark:bg-gray-900/50 p-3 rounded">
            <div>x : {t.math.variables.x}</div>
            <div>y : {t.math.variables.y}</div>
            <div>W : {t.math.variables.w}</div>
            <div>E : {t.math.variables.e}</div>
            <div>R : {t.math.variables.r}</div>
            <div>F : {t.math.variables.f}</div>
        </div>

      </div>
    </div>
  );
};

export default MathPanel;