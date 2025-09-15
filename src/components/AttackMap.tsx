import React from 'react';
import { AttackEvent } from '../services/honeypotService';

interface AttackMapProps {
  attacks: AttackEvent[];
}

export const AttackMap: React.FC<AttackMapProps> = ({ attacks }) => {
  const recentAttacks = attacks.slice(0, 10);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Attack Origins</h3>
      <div className="space-y-3">
        {recentAttacks.map((attack) => (
          <div key={attack.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-600">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-white font-mono text-sm">{attack.sourceIP}</p>
                <p className="text-slate-400 text-xs">{attack.geolocation?.country || 'Unknown'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-sm">{attack.service}:{attack.targetPort}</p>
              <p className="text-slate-400 text-xs">{attack.attackType}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};