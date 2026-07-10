/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, FileText, PhoneOff, Send, User, Stethoscope } from 'lucide-react';

interface VideoCallProps {
  setView: (view: string) => void;
  roomId: string | null;
  userRole: 'patient' | 'doctor' | 'clinic' | null;
}

export default function VideoCall({ setView, roomId, userRole }: VideoCallProps) {
  const [micOn, setMicOn] = React.useState(true);
  const [cameraOn, setCameraOn] = React.useState(true);
  const [showChat, setShowChat] = React.useState(true);

  // Chat message simulation
  const [chatInput, setChatInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: `HD Encrypted Room initialized securely. Room: ${roomId || 'DS-ROOM-3948'}`, time: '12:00 PM' },
    { sender: 'Dr. Rajesh Khanna', text: 'Hello, welcome to Doct Spark. How are you feeling today?', time: '12:01 PM' }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: userRole === 'doctor' ? 'Dr. Rajesh Khanna' : 'Aarav Mehta (Patient)',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Simulate doctor response if patient sends message
    if (userRole !== 'doctor') {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            sender: 'Dr. Rajesh Khanna',
            text: 'Understood. Please let me check your history. I am writing your prescription medications now.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1500);
    }
  };

  const handleEndCall = () => {
    const confirmEnd = window.confirm("Are you sure you want to exit the video call room?");
    if (confirmEnd) {
      if (userRole === 'doctor') {
        setView('doctor-dashboard');
      } else {
        setView('patient-dashboard');
      }
    }
  };

  return (
    <div className="flex-1 bg-[#1A2B3C] text-white flex flex-col h-[calc(100vh-4rem)] relative" id="video-call-room">
      
      {/* Top Banner Status */}
      <div className="bg-black/45 px-6 py-2 flex justify-between items-center text-xs shrink-0 z-10 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold">Agora Live Secure Call • HD Encryption</span>
        </div>
        <div className="font-semibold text-gray-400">
          Room ID: <span className="font-mono text-white">{roomId || 'ROOM-MOCK-774'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* LEFT: VIDEO FEED AREA (70% desktop) */}
        <div className="flex-1 bg-slate-950 p-4 relative flex flex-col justify-center items-center overflow-hidden min-h-0">
          
          {/* Main Stage (Remote Stream - Doctor or Patient depending on perspective) */}
          <div className="w-full h-full max-w-4xl rounded-2xl overflow-hidden relative border border-white/10 flex items-center justify-center bg-slate-900 shadow-2xl">
            {cameraOn ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Doctor Video Simulation using static cover/animation */}
                <img 
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800" 
                  alt="Doctor Stream" 
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Simulated consultation status banner */}
                <div className="absolute bottom-6 left-6 bg-black/60 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10">
                  <Stethoscope className="w-4 h-4 text-[#0A6E6E]" />
                  <span>Dr. Rajesh Khanna (Cardiologist)</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border border-white/10">
                  <Stethoscope className="w-10 h-10 text-[#0A6E6E]" />
                </div>
                <span className="text-xs font-bold text-gray-500 mt-3 uppercase tracking-wider">Remote Stream Paused</span>
              </div>
            )}

            {/* Local PIP Video (Patient Stream - Bottom Right Corner) */}
            <div className="absolute bottom-6 right-6 w-28 sm:w-40 h-20 sm:h-28 bg-slate-800 rounded-xl border border-white/20 shadow-xl overflow-hidden z-10 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center bg-[#F0F7F7]/5">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" 
                  alt="Patient Stream" 
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
              <div className="absolute bottom-1.5 left-1.5 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-bold">
                You (Aarav)
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT: CHAT SIDEBAR (30% desktop) */}
        {showChat && (
          <aside className="w-full md:w-80 bg-[#1A2B3C] border-t md:border-t-0 md:border-l border-white/10 flex flex-col min-h-0 shrink-0">
            <div className="p-3 bg-black/20 border-b border-white/5 font-bold text-xs uppercase tracking-wider text-gray-300 flex items-center gap-1.5 shrink-0">
              <MessageSquare className="w-4 h-4 text-[#F5A623]" /> Live Clinic Chat
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 min-h-0 text-xs">
              {messages.map((m, idx) => (
                <div key={idx} className={`p-2 rounded-lg ${m.sender === 'System' ? 'bg-white/5 text-gray-400 text-center font-bold text-[10px]' : m.sender.includes('Khanna') ? 'bg-slate-900/60' : 'bg-[#0A6E6E]/60 text-right ml-4'}`}>
                  {m.sender !== 'System' && (
                    <div className="font-extrabold text-[10px] text-gray-400 mb-0.5">{m.sender}</div>
                  )}
                  <p className="leading-relaxed font-semibold">{m.text}</p>
                  {m.sender !== 'System' && (
                    <span className="text-[9px] text-gray-500 font-bold block mt-0.5">{m.time}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-black/25 border-t border-white/5 flex gap-2 shrink-0">
              <input 
                type="text" 
                placeholder="Type medical symptom..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-semibold outline-none text-white focus:border-[#0A6E6E]"
              />
              <button 
                type="submit" 
                className="bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white p-2.5 rounded-lg shrink-0 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        )}

      </div>

      {/* BOTTOM CONTROL TOOLBAR */}
      <div className="bg-black/70 py-4 px-6 border-t border-white/5 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-2">
          {userRole === 'doctor' && (
            <button
              onClick={() => {
                alert('Launch Prescription form modal inside your dashboard to securely sign!');
              }}
              className="bg-[#0A6E6E]/20 hover:bg-[#0A6E6E]/40 border border-[#0A6E6E]/40 text-[#D1E5E5] text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" /> Prescription
            </button>
          )}
        </div>

        {/* Core Media Keys */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMicOn(!micOn)}
            className={`p-3 rounded-full transition-colors shrink-0 ${micOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setCameraOn(!cameraOn)}
            className={`p-3 rounded-full transition-colors shrink-0 ${cameraOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {cameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-colors shrink-0 ${showChat ? 'bg-[#0A6E6E]' : 'bg-slate-800'}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        <div>
          <button 
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" /> End Call
          </button>
        </div>
      </div>

    </div>
  );
}
