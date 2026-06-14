/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import TechSpinner from "./TechSpinner";

interface PinSetupProps {
  userId: string;
  onSuccess: (pin: string) => void;
}

export default function PinSetupModal({ userId, onSuccess }: PinSetupProps) {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState<string[]>(["", "", "", ""]);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showNumbers, setShowNumbers] = useState<boolean>(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);
  }, []);

  const handleChange = (
    value: string,
    index: number,
    isConfirm: boolean
  ) => {
    const targetPin = isConfirm ? confirmPin : pin;
    const setTargetPin = isConfirm ? setConfirmPin : setPin;
    const refArray = isConfirm ? confirmInputsRef : inputsRef;

    // Only allow single digit numbers
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) {
      const newPin = [...targetPin];
      newPin[index] = "";
      setTargetPin(newPin);
      return;
    }

    const digit = cleanValue.charAt(cleanValue.length - 1);
    const newPin = [...targetPin];
    newPin[index] = digit;
    setTargetPin(newPin);

    // Jump to next field
    if (index < 3) {
      refArray.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    isConfirm: boolean
  ) => {
    const targetPin = isConfirm ? confirmPin : pin;
    const setTargetPin = isConfirm ? setConfirmPin : setPin;
    const refArray = isConfirm ? confirmInputsRef : inputsRef;

    if (e.key === "Backspace") {
      if (targetPin[index] === "") {
        if (index > 0) {
          const newPin = [...targetPin];
          newPin[index - 1] = "";
          setTargetPin(newPin);
          refArray.current[index - 1]?.focus();
        }
      } else {
        const newPin = [...targetPin];
        newPin[index] = "";
        setTargetPin(newPin);
      }
    }
  };

  const handleNext = () => {
    const completedStr = pin.join("");
    if (completedStr.length < 4) {
      setErrorMsg("O PIN deve conter exatamente 4 dígitos.");
      return;
    }
    setErrorMsg("");
    setIsConfirming(true);
    setTimeout(() => {
      confirmInputsRef.current[0]?.focus();
    }, 100);
  };

  const handleSavePin = async () => {
    const pinStr = pin.join("");
    const confirmStr = confirmPin.join("");

    if (pinStr !== confirmStr) {
      setErrorMsg("Os PINs não correspondem. Tente novamente.");
      setConfirmPin(["", "", "", ""]);
      setTimeout(() => {
        confirmInputsRef.current[0]?.focus();
      }, 100);
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        transactionPin: pinStr
      });
      onSuccess(pinStr);
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      } catch (formattedErr: any) {
        setErrorMsg("Erro ao gravar PIN de transação no servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec] flex items-center justify-center z-50 p-4" id="pin-setup-overlay">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100 flex flex-col items-center">
        <div className="bg-blue-50 p-4 rounded-full text-[#007bff] mb-6 animate-pulse">
          <ShieldCheck className="w-12 h-12" id="icon-shield-check" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 tracking-tight text-center mb-2">
          {isConfirming ? "Confirmar PIN de Transação" : "Definir PIN de Transação"}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {isConfirming
            ? "Por favor, introduza novamente os 4 dígitos para confirmação."
            : "Por favor, defina um PIN numérico secreto para autorizar levantamentos e investimentos."}
        </p>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-xs py-2 px-4 rounded-lg mb-4 w-full text-center font-medium border border-red-100">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3 justify-center mb-8 relative w-full">
          {!isConfirming ? (
            pin.map((digit, index) => (
              <input
                key={`pin-digit-${index}`}
                id={`pin-field-${index}`}
                type={showNumbers ? "text" : "password"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index, false)}
                onKeyDown={(e) => handleKeyDown(e, index, false)}
                ref={(el) => { inputsRef.current[index] = el; }}
                className="w-14 h-14 bg-gray-50 border-2 border-gray-200 focus:border-[#007bff] rounded-xl text-center text-xl font-extrabold text-gray-800 transition-all outline-none focus:bg-white"
              />
            ))
          ) : (
            confirmPin.map((digit, index) => (
              <input
                key={`confirm-digit-${index}`}
                id={`confirm-field-${index}`}
                type={showNumbers ? "text" : "password"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index, true)}
                onKeyDown={(e) => handleKeyDown(e, index, true)}
                ref={(el) => { confirmInputsRef.current[index] = el; }}
                className="w-14 h-14 bg-gray-50 border-2 border-gray-200 focus:border-green-500 rounded-xl text-center text-xl font-extrabold text-[#28a745] transition-all outline-none focus:bg-white"
              />
            ))
          )}

          <button
            type="button"
            onClick={() => setShowNumbers(!showNumbers)}
            className="absolute right-2 -bottom-8 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center gap-1 text-xs"
            id="toggle-pin-visibility"
          >
            {showNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showNumbers ? "Oculcar números" : "Mostrar números"}
          </button>
        </div>

        <div className="w-full mt-4 flex flex-col space-y-3">
          {loading ? (
            <TechSpinner size="sm" />
          ) : !isConfirming ? (
            <button
              onClick={handleNext}
              disabled={pin.some((d) => d === "")}
              className="w-full bg-[#007bff] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              id="pin-next-btn"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setIsConfirming(false);
                  setConfirmPin(["", "", "", ""]);
                }}
                className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all"
                id="pin-back-btn"
              >
                Voltar
              </button>
              <button
                onClick={handleSavePin}
                disabled={confirmPin.some((d) => d === "")}
                className="w-1/2 bg-[#28a745] hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                id="pin-save-btn"
              >
                Confirmar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
