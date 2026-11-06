import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { ShieldAlert, KeyRound, X, CheckCircle2 } from 'lucide-react';

interface ManagerPinModalProps {
  title: string;
  description: string;
  actionLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (managerName: string) => void;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  title,
  description,
  actionLabel,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { lang, verifyManagerPin } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال رمز المرور' : 'Please enter PIN');
      return;
    }

    const verification = verifyManagerPin(pin);
    if (verification.valid && verification.manager) {
      onSuccess(verification.manager.name);
      setPin('');
      setError('');
      onClose();
    } else {
      setError(lang === 'ar' ? 'رمز مرور المدير غير صحيح' : 'Invalid manager PIN');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'clear') {
      setPin('');
      setError('');
    } else if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      setError('');
    } else {
      if (pin.length < 8) {
        setPin((prev) => prev + val);
        setError('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3 className="font-black text-sm text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 my-3 leading-relaxed">{description}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'ar' ? 'رمز مرور المدير أو المالك (PIN):' : 'Manager / Owner PIN:'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="••••"
                className="w-full text-center text-xl font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl py-2 px-8 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                autoFocus
              />
            </div>
            {error && <p className="text-xs font-bold text-rose-600 mt-1 text-center">{error}</p>}
          </div>

          {/* Quick Touch Keypad */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-base rounded-xl transition-colors cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress('clear')}
              className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              {lang === 'ar' ? 'مسح' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-base rounded-xl cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('backspace')}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              ⌫
            </button>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLabel || (lang === 'ar' ? 'اعتماد وتنفيذ' : 'Authorize')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
