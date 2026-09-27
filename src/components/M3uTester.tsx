import React, { useState } from 'react';
import { 
  Tv, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileCode, 
  Search,
  Filter,
  Sparkles
} from 'lucide-react';

interface ChannelItem {
  name: string;
  group: string;
  url: string;
  tvgId?: string;
  logo?: string;
}

export const M3uTester: React.FC = () => {
  const [m3uText, setM3uText] = useState(`#EXTM3U
#EXTINF:-1 tvg-id="BtvHD" tvg-name="bTV HD" tvg-logo="https://cdn.logos.stream/btv.png" group-title="Bulgaria National",bTV HD
http://stream.relay-eu.cloud:8080/live/btv_hd/index.m3u8
#EXTINF:-1 tvg-id="NovaHD" tvg-name="Nova TV HD" tvg-logo="https://cdn.logos.stream/nova.png" group-title="Bulgaria National",NOVA TV HD
http://stream.relay-eu.cloud:8080/live/nova_hd/index.m3u8
#EXTINF:-1 tvg-id="DiemaSport" tvg-name="Diema Sport HD" group-title="Sports BG",Diema Sport 1 HD
http://stream.relay-eu.cloud:8080/live/diema1/index.m3u8
#EXTINF:-1 tvg-id="MaxSport1" tvg-name="Max Sport 1 HD" group-title="Sports BG",Max Sport 1 HD
http://stream.relay-eu.cloud:8080/live/max1/index.m3u8
#EXTINF:-1 tvg-id="Eurosport1" tvg-name="Eurosport 1 4K" group-title="International Sports",Eurosport 1 UHD
http://stream.relay-eu.cloud:8080/live/euro1/index.m3u8`);

  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [analyzed, setAnalyzed] = useState(false);
  const [isValidM3u, setIsValidM3u] = useState(true);

  const handleAnalyze = () => {
    const lines = m3uText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const isM3U = lines.length > 0 && lines[0].startsWith('#EXTM3U');
    setIsValidM3u(isM3U);

    const parsedChannels: ChannelItem[] = [];
    const detectedGroups = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const infLine = lines[i];
        const urlLine = lines[i + 1] && !lines[i + 1].startsWith('#') ? lines[i + 1] : '';

        // Extract name (after the last comma)
        const commaIdx = infLine.lastIndexOf(',');
        const name = commaIdx !== -1 ? infLine.substring(commaIdx + 1).trim() : 'Unknown Channel';

        // Extract group-title
        const groupMatch = infLine.match(/group-title="([^"]+)"/);
        const group = groupMatch ? groupMatch[1] : 'Общи';
        detectedGroups.add(group);

        // tvg-id
        const idMatch = infLine.match(/tvg-id="([^"]+)"/);
        const tvgId = idMatch ? idMatch[1] : undefined;

        // tvg-logo
        const logoMatch = infLine.match(/tvg-logo="([^"]+)"/);
        const logo = logoMatch ? logoMatch[1] : undefined;

        parsedChannels.push({
          name,
          group,
          url: urlLine,
          tvgId,
          logo,
        });
      }
    }

    setChannels(parsedChannels);
    setGroups(Array.from(detectedGroups));
    setAnalyzed(true);
  };

  const filteredChannels = channels.filter(ch => {
    if (selectedGroup !== 'all' && ch.group !== selectedGroup) return false;
    if (search.trim() && !ch.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">M3U / M3U8 Плейлист Анализатор & Валидатор</h2>
            <p className="text-xs text-slate-400">
              Тествайте синтаксиса на IPTV листите, извличайте списък с канали, групи и HLS адреси
            </p>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Поставете съдържание на M3U плейлист
          </label>
          <textarea
            rows={6}
            value={m3uText}
            onChange={e => setM3uText(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {m3uText.split('\n').length} реда за анализ
          </span>
          <button
            onClick={handleAnalyze}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
          >
            Стартирай анализ на каналите
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analyzed && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isValidM3u ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Валиден #EXTM3U хедър</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">Липсва стандартен #EXTM3U хедър</span>
                  </>
                )}
              </div>

              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-xs text-slate-300">
                Открити: <strong className="font-mono text-emerald-400">{channels.length}</strong> канала
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-xs text-slate-300">
                Категории: <strong className="font-mono text-teal-400">{groups.length}</strong>
              </span>
            </div>

            {/* Quick Filter & Search */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Търси канал..."
                className="py-1 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />

              <select
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                className="py-1 px-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Всички групи ({channels.length})</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Channels Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Име на канал</th>
                  <th className="py-2.5 px-3">Група / Категория</th>
                  <th className="py-2.5 px-3">Протокол</th>
                  <th className="py-2.5 px-3">Стрийм адрес</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredChannels.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-white truncate max-w-[200px]">
                      {ch.name}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-400">
                      {ch.group}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {ch.url.includes('.m3u8') ? 'HLS (m3u8)' : ch.url.startsWith('http') ? 'HTTP TS' : 'MPEG-TS'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 truncate max-w-[260px] text-[11px]">
                      {ch.url}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
