
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  isDictating: boolean;
  transcript: string;
  error: string | null;
  isAvailable: boolean;
  startDictation: () => void;
  stopDictation: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isDictating, setIsDictating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsAvailable(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsDictating(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = `Error de dictado: ${event.error}`;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errorMessage = 'Acceso al micrófono denegado. Por favor, revisa los permisos del navegador.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No se detectó voz. Inténtalo de nuevo.';
        } else if (event.error === 'network') {
          errorMessage = 'Error de red. Revisa tu conexión a internet.';
        }
        setError(errorMessage);
        setIsDictating(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => (prev ? prev.trim() + ' ' : '') + finalTranscript.trim());
      };

      recognitionRef.current = recognition;

    } else {
      setIsAvailable(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startDictation = useCallback(() => {
    if (recognitionRef.current && !isDictating) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
        setError("No se pudo iniciar el dictado. Inténtalo de nuevo.");
      }
    }
  }, [isDictating]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current && isDictating) {
      try {
        recognitionRef.current.stop();
      } catch(e) {
        console.error("Error stopping recognition:", e);
      }
    }
  }, [isDictating]);

  return { isDictating, transcript, error, isAvailable, startDictation, stopDictation };
};
