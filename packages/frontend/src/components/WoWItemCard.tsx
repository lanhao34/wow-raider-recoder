import React from 'react';
import { Trash2 } from 'lucide-react';

interface WoWItemCardProps {
  item: {
    id: string | number;
    itemName?: string;
    name?: string;
    nameZh?: string;
    quality?: string;
    itemLevel?: number;
    icon?: string;
    primaryStats?: string;
    stamina?: number;
    secondaryStats?: string;
    slot?: string;
    armorType?: string;
    weaponType?: string;
    isTier?: boolean;
    _rawStats?: any;
  };
  renderItemType?: (item: any) => string;
  actionButton?: React.ReactNode;
  onDelete?: () => void;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const WoWItemCard: React.FC<WoWItemCardProps> = ({ 
  item, 
  renderItemType, 
  actionButton, 
  onDelete, 
  className = '',
  onClick,
  selected = false
}) => {
  const isLegendary = item.quality === 'legendary';
  const isEpic = item.quality === 'epic' || !item.quality;
  const nameColor = isLegendary ? 'text-[#ff8000]' : isEpic ? 'text-[#a335ee]' : 'text-[#0070dd]';
  const borderColor = isLegendary ? 'border-[#ff8000]/50 shadow-[0_0_15px_rgba(255,128,0,0.3)]' : 'border-purple-600/40 shadow-[0_0_15px_rgba(163,53,238,0.15)]';
  const iconBorderColor = isLegendary ? 'border-[#ff8000]' : 'border-[#a335ee]';
  
  const displayName = item.itemName || item.nameZh || item.name || '未知物品';
  const typeText = renderItemType ? renderItemType(item) : (item.weaponType || item.armorType || item.slot);
  
  // Synthesize some primary stat numbers based on itemLevel to make it look realistic if missing
  const ilvl = item.itemLevel || 610;
  const mainStatVal = Math.floor(ilvl * 4.2);
  const staVal = item.stamina || Math.floor(ilvl * 6.5);
  const primaryStatsLine = item.primaryStats 
    ? `+${mainStatVal} ${item.primaryStats}` 
    : `+${mainStatVal} 敏捷/力量/智力`;

  return (
    <div 
      className={`group relative flex flex-col bg-[#07070b] border ${borderColor} rounded-md p-3 w-full sm:max-w-[300px] transition-all duration-200 ${selected ? 'ring-2 ring-emerald-500 scale-[1.02]' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Hover Actions */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Top Section: Icon & Headers */}
      <div className="flex gap-3 items-start">
        {/* Icon square */}
        <div className={`shrink-0 w-12 h-12 rounded overflow-hidden border-2 ${iconBorderColor} bg-black/50 shadow-[0_0_10px_rgba(0,0,0,0.8)_inset]`}>
          {item.icon ? (
            <img 
              src={`https://wow.zamimg.com/images/wow/icons/large/${item.icon}.jpg`} 
              className="w-full h-full object-cover"
              alt="icon"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-[#111]" />
          )}
        </div>
        
        {/* Titles */}
        <div className="flex-1 min-w-0 pr-6">
          <div className={`text-[15px] font-bold tracking-wide leading-tight ${nameColor}`}>{displayName}</div>
          <div className="text-[#ffd100] text-[12px] mt-0.5 font-medium">物品等级 {ilvl}</div>
          {item.isTier && <div className="text-yellow-500 text-[11px] mt-0.5">套装组件</div>}
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#4a4a6a]/50 to-transparent my-2" />
      
      {/* Sub Header (Binding, Slot) */}
      <div className="flex justify-between items-center text-white/90 text-[12px] mb-1.5">
        <span>拾取后绑定</span>
        <span className="text-right">{typeText}</span>
      </div>
      
      {/* Stats Block */}
      <div className="flex flex-col gap-0.5 text-[13px] tracking-wide mt-1">
        <span className="text-white">+{staVal} 耐力</span>
        <span className="text-white">{primaryStatsLine}</span>
        
        {item.secondaryStats ? (
           <span className="text-[#1eff00] mt-1">{item.secondaryStats}</span>
        ) : (
           <span className="text-[#1eff00] mt-1 opacity-50 italic">装备效果...</span>
        )}
      </div>
      
      {/* Action Button Area */}
      {actionButton && (
        <div className="mt-4 pt-3 border-t border-[#1a1a2e]">
          {actionButton}
        </div>
      )}
    </div>
  );
};
