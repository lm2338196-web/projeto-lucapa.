/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Send, Gift, ShieldAlert, Sparkles, Navigation, X, CheckCircle } from "lucide-react";
import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import TechSpinner from "./TechSpinner";

interface WelcomeProps {
  userId: string;
  isNewUser: boolean;
  onClose: (claimed: boolean) => void;
}

export default function MultiStepWelcome({ userId, isNewUser, onClose }: WelcomeProps) {
  const [step, setStep] = useState<number>(1);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleClaimWelcomeBonus = async () => {
    setClaiming(true);
    setErrorMsg("");
    try {
      // Real-time Firestore update for new user balance increment
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        balance: 200.92, // Standard welcome bonus as requested!
        claimedWelcomeBonus: true
      });

      // Write transaction history
      const txRef = collection(db, "users", userId, "transactions");
      await addDoc(txRef, {
        type: "bonus",
        amount: 200.92,
        status: "completed",
        description: "Bónus de Boas-vindas Reclamado",
        createdAt: new Date().toISOString()
      });

      setClaimed(true);
      setTimeout(() => {
        setStep(3);
      }, 1500);
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      } catch (formattedErr: any) {
        setErrorMsg("Falha ao registrar bónus de boas-vindas.");
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleNext = () => {
    if (step === 2 && isNewUser && !claimed) {
      // Enforce claim or next step
      setStep(3);
    } else {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    onClose(claimed);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="welcome-sequence">
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-white/10 relative flex flex-col text-white animate-fade-in">
        
        {/* Header Indicator */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-5 py-3 flex justify-between items-center text-white border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" id="welcome-sparkles" />
            <span className="font-bold text-xs tracking-wide font-mono">
              ANGLO AMERICAN • NOTIFICAÇÕES ({step}/3)
            </span>
          </div>
          <button
            onClick={handleFinish}
            className="text-white/80 hover:text-white transition-colors focus:outline-none p-1 hover:bg-white/10 rounded-lg cursor-pointer"
            id="close-welcome-x"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Stages */}
        <div className="p-6 flex-1 space-y-4">
          {errorMsg && (
            <div className="mb-3 bg-red-950/50 text-red-300 text-xs py-2 px-4 rounded-lg font-medium border border-red-500/20 text-center">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center text-center space-y-3" id="welcome-step-1">
              <div className="bg-blue-500/10 p-3 rounded-full text-blue-400 border border-blue-500/25">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Saudações e Boas-Vindas!
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed max-w-sm">
                Estamos extremamente felizes por vê-lo de volta à nossa plataforma oficial. 
                Para acompanhar actualizações importantes, relatórios de prospecções em Angola e comissões extras, junte-se aos nossos canais oficiais agora.
              </p>
              
              <div className="w-full flex flex-col gap-2 pt-2">
                <a
                  href="https://t.me/+lLcHxsG0SmMyNjc0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#007bff] hover:bg-blue-600 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="join-telegram-welcome"
                >
                  <Send className="w-4 h-4" /> Grupo do Telegram Oficial
                </a>
                
                <a
                  href="https://chat.whatsapp.com/EEsv03mwEPVLJonKhhIyTh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="join-whatsapp-welcome"
                >
                  <span className="font-extrabold text-sm">WhatsApp</span> Entrar no Grupo Geral
                </a>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center text-center space-y-3" id="welcome-step-2">
              <div className="bg-green-500/10 p-3 rounded-full text-green-400 border border-green-500/25">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Bónus Reservado de Boas-Vindas
              </h3>
              
              {isNewUser ? (
                <>
                  <p className="text-gray-300 text-xs leading-relaxed max-w-sm">
                    Identificamos que você se registrou como um novo utilizador! Tem um bónus de prospecção de <strong className="text-white">200,92 Kz</strong> disponível para carregar na sua conta agora mesmo.
                  </p>
                  
                  {claimed ? (
                    <div className="flex flex-col items-center space-y-2 mt-2 text-green-400" id="bonus-claimed-badge">
                      <CheckCircle className="w-8 h-8 animate-bounce" />
                      <span className="text-xs font-semibold">Bónus de 200,92 Kz Creditado!</span>
                    </div>
                  ) : claiming ? (
                    <div className="p-3">
                      <TechSpinner size="sm" />
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimWelcomeBonus}
                      className="w-full mt-2 bg-green-500 hover:bg-green-400 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      id="claim-bonus-btn"
                    >
                      <Gift className="w-4 h-4" /> Reclamar Boas-Vindas (200,92 Kz)
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-300 text-xs leading-relaxed max-w-sm">
                    Você já é um investidor ativo da Anglo American. Os seus pacotes mineiros estão neste momento a gerar retornos constantes na província do Moxico.
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono italic">
                    Bónus de primeiro acesso indisponível para utilizadores antigos.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center space-y-3" id="welcome-step-3">
              <div className="bg-yellow-500/10 p-3 rounded-full text-yellow-400 border border-yellow-500/25">
                <Navigation className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Reimaginar a Mineração Para o Futuro
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed max-w-sm">
                Toda grande conquista de riqueza começa com uma decolagem estratégica. O valor de produção do cobre em Moxico é a bússola térmica para a transição energética global.
              </p>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 w-full text-left">
                <span className="text-[9px] font-bold text-blue-400 uppercase font-mono block mb-1">
                  CONSELHO FIDUCIÁRIO
                </span>
                <span className="text-xs text-gray-400 italic font-mono block leading-relaxed">
                  "O sucesso não é o destino final, mas sim a prospecção consistente e inteligente de recursos ao nosso redor." — Joyce
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="bg-slate-950/80 px-5 py-3 flex justify-between items-center border-t border-white/10">
          <div className="flex gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 1 ? 'bg-blue-500' : 'bg-white/20'}`} />
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 2 ? 'bg-blue-500' : 'bg-white/20'}`} />
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 3 ? 'bg-blue-500' : 'bg-white/20'}`} />
          </div>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              id="welcome-next-step"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              id="welcome-finish"
            >
              Começar
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
