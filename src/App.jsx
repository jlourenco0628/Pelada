import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Users, Trash2, Shuffle, Plus, AlertCircle, RefreshCw, 
  LayoutDashboard, Settings, List, Map, Play, Pause, RotateCcw, 
  History, Award, MessageSquare, Clock, Star, Printer 
} from 'lucide-react';

const App = () => {
  // --- INICIALIZAÇÃO DE ESTADO (COM LOCAL STORAGE) ---
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('pelada_react_config');
    return saved ? JSON.parse(saved) : { teamA: 'TIME A', teamB: 'TIME B', playersPerTeam: 4, gameType: 'futsal' };
  });

  const [fieldPlayers, setFieldPlayers] = useState(() => {
    const saved = localStorage.getItem('pelada_react_field');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [goalkeepers, setGoalkeepers] = useState(() => {
    const saved = localStorage.getItem('pelada_react_gk');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('pelada_react_teams');
    return saved ? JSON.parse(saved) : null;
  });

  // Estados para Partida, Histórico, Artilharia e Resenha
  const [matchHistory, setMatchHistory] = useState(() => {
    const saved = localStorage.getItem('pelada_react_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('pelada_react_goals');
    return saved ? JSON.parse(saved) : {};
  });

  const [resenhas, setResenhas] = useState(() => {
    const saved = localStorage.getItem('pelada_react_resenhas');
    return saved ? JSON.parse(saved) : [];
  });

  // Separação de abas (5 abas principais no lado direito)
  const [activeTab, setActiveTab] = useState('tatico'); // 'tatico' | 'partida' | 'sumula' | 'artilharia' | 'resenha'
  const [viewMode, setViewMode] = useState('court'); // 'list' | 'court'
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);

  // Estados do Jogo (Cronômetro e Placar)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [score, setScore] = useState({ a: 0, b: 0 });
  
  const [selectedScorer, setSelectedScorer] = useState('');
  const [resenhaText, setResenhaText] = useState('');

  // --- EFEITOS PARA PERSISTÊNCIA ---
  useEffect(() => { localStorage.setItem('pelada_react_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('pelada_react_field', JSON.stringify(fieldPlayers)); }, [fieldPlayers]);
  useEffect(() => { localStorage.setItem('pelada_react_gk', JSON.stringify(goalkeepers)); }, [goalkeepers]);
  useEffect(() => {
    if (teams) localStorage.setItem('pelada_react_teams', JSON.stringify(teams));
    else localStorage.removeItem('pelada_react_teams');
  }, [teams]);
  useEffect(() => { localStorage.setItem('pelada_react_history', JSON.stringify(matchHistory)); }, [matchHistory]);
  useEffect(() => { localStorage.setItem('pelada_react_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('pelada_react_resenhas', JSON.stringify(resenhas)); }, [resenhas]);

  // --- EFEITO DO CRONÔMETRO ---
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // --- HANDLERS ---
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const adjustPlayers = (amount) => {
    setConfig(prev => ({
      ...prev,
      playersPerTeam: Math.max(1, Math.min(15, prev.playersPerTeam + amount))
    }));
  };

  const addPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const player = { id: Date.now(), name: newPlayerName.trim() };
    if (isGoalkeeper) setGoalkeepers([...goalkeepers, player]);
    else setFieldPlayers([...fieldPlayers, player]);
    setNewPlayerName('');
  };

  const removePlayer = (id, type) => {
    if (type === 'field') setFieldPlayers(fieldPlayers.filter(p => p.id !== id));
    else setGoalkeepers(goalkeepers.filter(p => p.id !== id));
  };

  const clearAllData = () => {
    if (window.confirm("Deseja apagar todos os jogadores, placares, artilharia e configurações? Esta ação não pode ser desfeita.")) {
      setFieldPlayers([]); setGoalkeepers([]); setTeams(null);
      setMatchHistory([]); setGoals({}); setResenhas([]);
      setScore({ a: 0, b: 0 }); setTimerSeconds(0); setIsTimerRunning(false);
      setConfig({ teamA: 'TIME A', teamB: 'TIME B', playersPerTeam: 4, gameType: 'futsal' });
      localStorage.clear();
    }
  };

  const shuffleTeams = () => {
    const requiredField = config.playersPerTeam * 2;
    if (fieldPlayers.length < requiredField) {
      alert(`Adicione pelo menos ${requiredField} jogadores de linha para formar os times (Configurado: ${config.playersPerTeam} por time).`);
      return;
    }

    const shuffledField = [...fieldPlayers].sort(() => Math.random() - 0.5);
    const shuffledGK = [...goalkeepers].sort(() => Math.random() - 0.5);

    const teamA = {
      name: config.teamA,
      gk: shuffledGK[0] || null,
      players: shuffledField.slice(0, config.playersPerTeam)
    };

    const teamB = {
      name: config.teamB,
      gk: shuffledGK[1] || null,
      players: shuffledField.slice(config.playersPerTeam, config.playersPerTeam * 2)
    };

    const reserves = shuffledField.slice(config.playersPerTeam * 2);
    const reserveGks = shuffledGK.slice(2);
    setTeams({ teamA, teamB, reserves, reserveGks });
    setViewMode('court');
    setActiveTab('tatico');
  };

  // Funções da Partida
  const adjustScore = (team, val) => {
    setScore(prev => ({ ...prev, [team]: Math.max(0, prev[team] + val) }));
  };

  const saveMatch = () => {
    if (score.a === 0 && score.b === 0 && !window.confirm("Salvar partida com placar 0x0?")) return;
    
    const newMatch = {
      id: Date.now(),
      teamA: config.teamA,
      teamB: config.teamB,
      scoreA: score.a,
      scoreB: score.b,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMatchHistory([newMatch, ...matchHistory]);
    setScore({ a: 0, b: 0 });
    alert("Resultado registrado na aba Súmula!");
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  // Funções de Resenha e Artilharia
  const addGoal = () => {
    if (!selectedScorer) return;
    setGoals(prev => ({ ...prev, [selectedScorer]: (prev[selectedScorer] || 0) + 1 }));
    setSelectedScorer('');
  };

  const addResenha = () => {
    if (!resenhaText.trim()) return;
    const newResenha = {
      id: Date.now(),
      text: resenhaText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setResenhas([newResenha, ...resenhas]);
    setResenhaText('');
  };

  const printReport = () => {
    window.print();
  };

  const allPlayers = [...fieldPlayers, ...goalkeepers].sort((a, b) => a.name.localeCompare(b.name));
  const sortedScorers = Object.entries(goals).sort((a, b) => b[1] - a[1]);

  // --- TACTICAL COURT COMPONENT ---
  const TacticalCourt = () => {
    if (!teams) return null;

    const bgImages = {
      futsal: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1526232761682-d26e4f9c60e4?q=80&w=1000&auto=format&fit=crop')",
      society: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1518604666860-9ed391f76460?q=80&w=1000&auto=format&fit=crop')",
      field: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1000&auto=format&fit=crop')"
    };

    const getPositions = (isTeamB) => {
      const base = isTeamB ? 26 : 74;
      const dir = isTeamB ? 1 : -1;
      return [
        { t: base + (dir * 12), l: 50 }, // Zag/Fixo
        { t: base + (dir * 4), l: 15 },  // Ala/Lat E
        { t: base + (dir * 4), l: 85 },  // Ala/Lat D
        { t: base + (dir * -12), l: 50 }, // Ata/Pivô
        { t: base + (dir * -4), l: 30 }, // Meio E
        { t: base + (dir * -4), l: 70 }, // Meio D
        { t: base + (dir * 12), l: 25 }, // Zag E
        { t: base + (dir * 12), l: 75 }, // Zag D
        { t: base + (dir * -20), l: 35 }, // Ata E
        { t: base + (dir * -20), l: 65 }, // Ata D
        { t: base, l: 50 }, // Volante
      ];
    };

    const PlayerNode = ({ player, pos, isTeamB, isGk }) => {
      if (!player) return null;
      const topPos = isGk ? (isTeamB ? 5 : 95) : pos.t;
      const hasGoals = goals[player.name] > 0;

      return (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 transition-all duration-700" 
          style={{ top: `${topPos}%`, left: `${pos.l}%` }}
        >
          <div className={`relative w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border-2 border-white/80 shadow-[0_5px_15px_rgba(0,0,0,0.6)] ${isTeamB ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
            {player.name.charAt(0).toUpperCase()}
            {hasGoals && (
              <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-md animate-bounce">
                <div className="w-3 h-3 bg-black rounded-full border border-white"></div>
              </div>
            )}
          </div>
          <div className="bg-black/85 px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-white mt-1 backdrop-blur-sm whitespace-nowrap">
            {player.name.split(' ')[0]}
          </div>
        </div>
      );
    };

    const posA = getPositions(false);
    const posB = getPositions(true);

    return (
      <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border-[3px] border-white/20" style={{ paddingTop: '145%', backgroundImage: bgImages[config.gameType], backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Marcações do Campo */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-white/70 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/70 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
          <div className="absolute top-0 left-[22.5%] w-[55%] h-[14%] border-b-2 border-l-2 border-r-2 border-white/70 rounded-b-[40px] shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
          <div className="absolute bottom-0 left-[22.5%] w-[55%] h-[14%] border-t-2 border-l-2 border-r-2 border-white/70 rounded-t-[40px] shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
        </div>

        {/* Time A (Bottom) */}
        <PlayerNode player={teams.teamA.gk} pos={{l: 50}} isTeamB={false} isGk={true} />
        {teams.teamA.players.map((p, i) => (
          <PlayerNode key={p.id} player={p} pos={posA[i % posA.length]} isTeamB={false} />
        ))}

        {/* Time B (Top) */}
        <PlayerNode player={teams.teamB.gk} pos={{l: 50}} isTeamB={true} isGk={true} />
        {teams.teamB.players.map((p, i) => (
          <PlayerNode key={p.id} player={p} pos={posB[i % posB.length]} isTeamB={true} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* ========================================== */}
      {/* INTERFACE PRINCIPAL (Oculta na impressão) */}
      {/* ========================================== */}
      <div 
          className="print:hidden min-h-screen w-full text-slate-100 font-sans pb-20 selection:bg-green-500/30 bg-fixed bg-cover bg-center overflow-x-hidden"
          style={{ 
            backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.85), rgba(2, 6, 23, 0.98)), url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000&auto=format&fit=crop')",
            width: '100vw'
          }}
        >
        
        {/* Cabeçalho Premium */}
        <div className="bg-gradient-to-b from-green-900/40 to-transparent pt-12 pb-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Matchday Pro</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic uppercase text-white drop-shadow-lg">
                Pelada <span className="text-green-500">Pro</span>
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2 pl-1">Gestão Tática & Resultados</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={printReport}
                className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 border border-blue-500/20 px-4 py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                <Printer size={16} />
                Gerar Relatório (PDF)
              </button>
              <button 
                onClick={clearAllData}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 px-4 py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                <RefreshCw size={16} />
                Zerar Tudo
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto px-2 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ========================================== */}
            {/* LADO ESQUERDO: Configurações e Cadastro */}
            {/* ========================================== */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card de Configurações */}
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                  <Settings size={16} className="text-green-500" /> Definições
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Time A</label>
                    <input 
                      type="text" value={config.teamA} onChange={e => handleConfigChange('teamA', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 text-white font-bold transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1">Time B</label>
                    <input 
                      type="text" value={config.teamB} onChange={e => handleConfigChange('teamB', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-green-500 text-white font-bold transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Modalidade</label>
                    <select 
                      value={config.gameType} onChange={e => handleConfigChange('gameType', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs outline-none text-white font-bold appearance-none cursor-pointer focus:border-green-500"
                    >
                      <option value="futsal">Futsal</option>
                      <option value="society">Society</option>
                      <option value="field">Campo</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Atletas Linha/Time</label>
                    <div className="flex items-center bg-slate-950/50 border border-slate-800 rounded-xl p-2 shadow-inner">
  <button onClick={() => adjustPlayers(-1)} className="p-3 text-slate-500 hover:text-red-400 active:bg-red-500/10 rounded-lg transition-colors">
    <MinusIcon />
  </button>
  <input type="number" value={config.playersPerTeam} readOnly className="bg-transparent text-center flex-1 font-black text-lg text-white outline-none w-full" />
  <button onClick={() => adjustPlayers(1)} className="p-3 text-slate-500 hover:text-green-400 active:bg-green-500/10 rounded-lg transition-colors">
    <PlusIcon />
  </button>
</div>
                  </div>
                </div>
              </div>

              {/* Card de Convocação */}
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white italic">
                  <Plus className="text-green-500" /> Convocação
                </h2>
                <form onSubmit={addPlayer} className="space-y-4 relative z-10">
                  <input
                    type="text" placeholder="Nome do Jogador..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500/50 text-white font-semibold transition-all shadow-inner"
                    value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setIsGoalkeeper(false)} className={`p-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all ${!isGoalkeeper ? 'bg-green-600 text-white shadow-lg shadow-green-900/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      <User size={16} /> LINHA
                    </button>
                    <button type="button" onClick={() => setIsGoalkeeper(true)} className={`p-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all ${isGoalkeeper ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      <Shield size={16} /> GOLEIRO
                    </button>
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white border border-slate-700 active:scale-[0.98]">
                    Adicionar ao Elenco
                  </button>
                </form>
              </div>

              {/* Listas Atuais */}
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Elenco</h3>
                  <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold">{fieldPlayers.length + goalkeepers.length} Total</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Shield size={10}/> Goleiros ({goalkeepers.length})</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                      {goalkeepers.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 group">
                          <span className="text-xs font-bold">{p.name}</span>
                          <button onClick={() => removePlayer(p.id, 'gk')} className="text-slate-600 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Users size={10}/> Linha ({fieldPlayers.length})</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {fieldPlayers.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 group">
                          <span className="text-xs font-bold">{p.name}</span>
                          <button onClick={() => removePlayer(p.id, 'field')} className="text-slate-600 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ========================================== */}
            {/* LADO DIREITO: Tática, Partida, Súmula, Artilharia e Resenha */}
            {/* ========================================== */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Navegação Principal em Abas */}
              <div className="flex flex-wrap gap-2 bg-slate-900/60 backdrop-blur-xl p-2 rounded-2xl border border-slate-800 shadow-xl">
                <button onClick={() => setActiveTab('tatico')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1 ${activeTab === 'tatico' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <Map size={16}/> Tática
                </button>
                <button onClick={() => setActiveTab('partida')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1 ${activeTab === 'partida' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <Play size={16}/> Partida
                </button>
                <button onClick={() => setActiveTab('sumula')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1 ${activeTab === 'sumula' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <History size={16}/> Súmula
                </button>
                <button onClick={() => setActiveTab('artilharia')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1 ${activeTab === 'artilharia' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <Award size={16}/> Artilharia
                </button>
                <button onClick={() => setActiveTab('resenha')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1 ${activeTab === 'resenha' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <MessageSquare size={16}/> Resenha
                </button>
              </div>

              {/* ================= ABA 1: TÁTICA E SORTEIO ================= */}
              {activeTab === 'tatico' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <button 
                    onClick={shuffleTeams}
                    className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 p-6 rounded-[2rem] font-black text-white shadow-2xl shadow-green-900/50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm italic"
                  >
                    <Shuffle size={20} /> Sortear Times
                  </button>

                  {teams ? (
                    <div className="bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
                      <div className="flex gap-2 p-1.5 bg-slate-950/50 rounded-2xl border border-slate-800 mb-6">
                        <button onClick={() => setViewMode('court')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${viewMode === 'court' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                          <Map size={14} /> Mapa Tático
                        </button>
                        <button onClick={() => setViewMode('list')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${viewMode === 'list' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                          <List size={14} /> Escalação
                        </button>
                      </div>

                      {viewMode === 'court' ? (
                        <div className="space-y-4">
                           <div className="flex justify-center gap-6 mb-2">
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                  <span className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">{config.teamA}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                  <span className="text-[9px] font-black uppercase text-emerald-300 tracking-widest">{config.teamB}</span>
                              </div>
                          </div>
                          <TacticalCourt />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl overflow-hidden">
                            <div className="bg-indigo-600/90 p-4 text-center font-black uppercase tracking-[0.2em] text-xs">{teams.teamA.name}</div>
                            <div className="p-5 space-y-3">
                              <div className="flex items-center gap-3 text-indigo-300 font-bold border-b border-indigo-500/20 pb-3 text-sm">
                                <Shield size={16} /> {teams.teamA.gk ? teams.teamA.gk.name : 'Sem Goleiro'}
                              </div>
                              {teams.teamA.players.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 py-1 font-semibold text-sm">
                                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-[10px] text-indigo-400">{i+1}</div>
                                  {p.name}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-2xl overflow-hidden">
                            <div className="bg-emerald-600/90 p-4 text-center font-black uppercase tracking-[0.2em] text-xs">{teams.teamB.name}</div>
                            <div className="p-5 space-y-3">
                              <div className="flex items-center gap-3 text-emerald-300 font-bold border-b border-emerald-500/20 pb-3 text-sm">
                                <Shield size={16} /> {teams.teamB.gk ? teams.teamB.gk.name : 'Sem Goleiro'}
                              </div>
                              {teams.teamB.players.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 py-1 font-semibold text-sm">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-400">{i+1}</div>
                                  {p.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {(teams.reserves.length > 0 || teams.reserveGks.length > 0) && (
                        <div className="mt-6 bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
                          <h4 className="text-slate-400 font-black mb-3 text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={14} className="text-yellow-500" /> Próximos (Reserva)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {teams.reserveGks.map((p, i) => (
                              <span key={`rgk-${i}`} className="bg-blue-900/40 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Shield size={12}/> {p.name}
                              </span>
                            ))}
                            {teams.reserves.map((p, i) => (
                              <span key={`res-${i}`} className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[2rem] backdrop-blur-sm">
                      <LayoutDashboard size={48} className="mb-4 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs italic">Aguardando Sorteio...</p>
                    </div>
                  )}
                </div>
              )}

              {/* ================= ABA 2: PARTIDA (CRONÔMETRO E PLACAR) ================= */}
              {activeTab === 'partida' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  
                  {/* Cronômetro */}
                  <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 text-center shadow-2xl">
                    <div className="text-8xl font-black font-mono tracking-tighter text-white mb-8 italic drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      {formatTime(timerSeconds)}
                    </div>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setIsTimerRunning(!isTimerRunning)} 
                        className={`p-4 rounded-2xl flex items-center gap-2 font-black px-10 transition-all shadow-lg active:scale-95 text-slate-950 uppercase text-xs tracking-widest ${isTimerRunning ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/30' : 'bg-green-500 hover:bg-green-400 shadow-green-900/30'}`}
                      >
                        {isTimerRunning ? <><Pause size={18}/> Pausar</> : <><Play size={18}/> Iniciar</>}
                      </button>
                      <button onClick={resetTimer} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl transition-all border border-slate-700 active:rotate-180 duration-500 text-slate-400">
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Placar Live */}
                  <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 text-center shadow-2xl bg-gradient-to-b from-slate-800/40 to-slate-900/40">
                    <div className="flex justify-around items-center gap-6 mb-10">
                      <div className="flex-1 space-y-4">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] truncate italic">{config.teamA}</p>
                        <div className="flex flex-col items-center gap-4">
                          <span className="text-7xl font-black text-white tracking-tighter italic drop-shadow-xl">{score.a}</span>
                          <div className="flex gap-2">
                            <button onClick={() => adjustScore('a', -1)} className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800 hover:bg-slate-800 transition-all active:scale-95">-</button>
                            <button onClick={() => adjustScore('a', 1)} className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl hover:bg-indigo-500 transition-all active:scale-95">+</button>
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-black text-slate-700 italic">X</div>
                      <div className="flex-1 space-y-4">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] truncate italic">{config.teamB}</p>
                        <div className="flex flex-col items-center gap-4">
                          <span className="text-7xl font-black text-white tracking-tighter italic drop-shadow-xl">{score.b}</span>
                          <div className="flex gap-2">
                            <button onClick={() => adjustScore('b', -1)} className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800 hover:bg-slate-800 transition-all active:scale-95">-</button>
                            <button onClick={() => adjustScore('b', 1)} className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xl hover:bg-emerald-500 transition-all active:scale-95">+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={saveMatch} className="w-full bg-white text-slate-950 py-4 rounded-xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 uppercase shadow-xl">
                      Registrar Resultado na Súmula
                    </button>
                  </div>
                </div>
              )}

              {/* ================= ABA 3: SÚMULA (HISTÓRICO) ================= */}
              {activeTab === 'sumula' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-xl min-h-[400px]">
                    <h3 className="font-black mb-8 text-[12px] text-slate-400 tracking-[0.3em] uppercase flex items-center gap-2 italic">
                      <History size={16} className="text-slate-400" /> Histórico de Partidas
                    </h3>
                    <div className="space-y-4">
                      {matchHistory.length > 0 ? matchHistory.map((m, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-950/50 p-5 rounded-2xl border border-white/5 shadow-md hover:bg-slate-800 transition-colors">
                          <span className="font-black flex-1 text-right pr-5 text-xs uppercase text-slate-400 truncate">{m.teamA}</span>
                          <div className="bg-slate-900 px-5 py-3 rounded-xl border border-slate-700 flex items-center gap-4">
                            <span className="font-black text-white text-xl">{m.scoreA}</span>
                            <span className="text-[10px] text-slate-600 font-black italic">X</span>
                            <span className="font-black text-white text-xl">{m.scoreB}</span>
                          </div>
                          <div className="flex-1 flex items-center justify-between pl-5">
                            <span className="font-black text-xs uppercase text-slate-400 truncate">{m.teamB}</span>
                            <span className="text-[10px] text-slate-500 font-bold ml-2 hidden sm:block">{m.time}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                          <History size={48} className="mb-4 text-slate-600" />
                          <p className="text-slate-500 text-[10px] font-black uppercase italic tracking-widest">Nenhuma partida registrada</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= ABA 4: ARTILHARIA ================= */}
              {activeTab === 'artilharia' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-xl min-h-[400px]">
                    <h3 className="font-black mb-8 text-[12px] text-slate-400 tracking-[0.3em] uppercase flex items-center gap-2 italic">
                      <Award size={16} className="text-yellow-500" /> Melhores Marcadores
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                      <select 
                        value={selectedScorer} onChange={(e) => setSelectedScorer(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm outline-none text-white font-bold appearance-none cursor-pointer focus:border-yellow-500/50"
                      >
                        <option value="">Selecione o Artilheiro...</option>
                        {allPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                      <button onClick={addGoal} className="bg-yellow-500 text-slate-950 px-8 py-4 rounded-xl font-black transition-all active:scale-95 text-xs uppercase shadow-lg tracking-widest italic hover:bg-yellow-400">
                        Adicionar Gol
                      </button>
                    </div>

                    <div className="space-y-3">
                      {sortedScorers.length > 0 ? sortedScorers.map(([name, count], idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/50 p-5 rounded-2xl border-l-[4px] border-yellow-500 shadow-md hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 font-black text-xs">
                              {idx + 1}º
                            </div>
                            <span className="font-bold text-lg text-white">{name}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/20">
                            <Star size={14} className="text-yellow-500 fill-current" />
                            <span className="font-black text-yellow-500 text-xl italic tracking-tighter">{count}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                          <Award size={48} className="mb-4 text-slate-600" />
                          <p className="text-slate-500 text-[10px] font-black uppercase italic tracking-widest">Nenhum gol marcado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= ABA 5: RESENHA ================= */}
              {activeTab === 'resenha' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-xl min-h-[400px]">
                    <h3 className="font-black mb-6 text-[12px] text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                      <MessageSquare size={16} /> Sala de Imprensa (Resenha)
                    </h3>
                    <textarea 
                      value={resenhaText} onChange={(e) => setResenhaText(e.target.value)}
                      placeholder="Como foram as jogadas de hoje?..." 
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-5 text-sm outline-none h-32 mb-4 resize-none text-white font-medium focus:border-indigo-500/50 transition-all shadow-inner"
                    ></textarea>
                    <button onClick={addResenha} className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black text-white shadow-lg uppercase text-[10px] tracking-[0.2em] transition-all mb-8 italic active:scale-95">
                      Postar Comentário
                    </button>
                    
                    <div className="space-y-4">
                      {resenhas.length > 0 ? resenhas.map((r) => (
                        <div key={r.id} className="bg-slate-950/40 p-5 rounded-2xl border-l-[4px] border-indigo-600 shadow-md relative hover:bg-slate-800/40 transition-colors">
                          <p className="italic text-slate-200 text-sm leading-relaxed">"{r.text}"</p>
                          <div className="flex items-center gap-1 mt-3 opacity-50">
                            <Clock size={10} className="text-indigo-400" />
                            <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">{r.time}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                          <MessageSquare size={48} className="mb-4 text-slate-600" />
                          <p className="text-slate-500 text-[10px] font-black uppercase italic tracking-widest">O mural está vazio</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ÁREA DE IMPRESSÃO (Exclusiva para o PDF)   */}
      {/* ========================================== */}
      <div className="hidden print:block bg-white text-slate-900 p-8 font-sans">
        <div className="text-center mb-8 pb-6 border-b-2 border-slate-900">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter">Pelada Pro</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">
            Relatório Oficial da Sessão • {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Impressão da Súmula */}
        {matchHistory.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 mb-4 pb-2 text-slate-800">Súmula de Partidas</h2>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase tracking-widest text-[10px]">
                  <th className="p-3">Hora</th>
                  <th className="p-3 text-right">Time A</th>
                  <th className="p-3 text-center">Placar</th>
                  <th className="p-3">Time B</th>
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((m, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="p-3 text-slate-500 font-medium">{m.time}</td>
                    <td className="p-3 text-right font-black uppercase">{m.teamA}</td>
                    <td className="p-3 text-center font-black text-lg bg-slate-50">
                      {m.scoreA} <span className="text-slate-400 mx-1 text-xs">X</span> {m.scoreB}
                    </td>
                    <td className="p-3 font-black uppercase">{m.teamB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Impressão da Artilharia */}
        {sortedScorers.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 mb-4 pb-2 text-slate-800">Artilharia (Golden Boot)</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {sortedScorers.map(([name, count], idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-100 py-2">
                  <span className="font-bold text-slate-700">{idx + 1}º {name}</span>
                  <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-md">{count} Gols</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impressão da Resenha */}
        {resenhas.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 mb-4 pb-2 text-slate-800">Sala de Imprensa / Comentários</h2>
            <div className="space-y-4">
              {resenhas.map((r, i) => (
                <div key={i} className="pl-4 border-l-4 border-slate-300 py-1">
                  <p className="italic text-slate-700 font-medium">"{r.text}"</p>
                  <span className="text-xs text-slate-400 font-bold tracking-widest">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caso não existam dados */}
        {matchHistory.length === 0 && sortedScorers.length === 0 && resenhas.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="font-bold uppercase tracking-widest">Nenhum dado registrado nesta sessão.</p>
          </div>
        )}
        
        <div className="mt-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-200 pt-4">
          Gerado por Pelada Pro • Gestão Tática
        </div>
      </div>
    </>
  );
};

// --- ÍCONES AUXILIARES ---
const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default App;
