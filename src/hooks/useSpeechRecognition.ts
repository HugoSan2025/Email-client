
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Define the shape of the return value for our hook
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
    // This effect runs once on the client to check for API availability
    // and set up the recognition instance.
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsAvailable(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'es-ES';
      recognition.interimResults = false; // We only care about the final result
      recognition.continuous = true; // Keep listening until stopped

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
        // Append new final results to the existing transcript
        setTranscript(prev => (prev ? prev.trim() + ' ' : '') + finalTranscript.trim());
      };

      recognitionRef.current = recognition;

    } else {
      setIsAvailable(false);
    }

    // Cleanup function to stop recognition if the component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const startDictation = useCallback(() => {
    if (recognitionRef.current && !isDictating) {
      // It's important to set the transcript before starting a new session
      // if the user wants to append to existing text.
      // We pass the current transcript via a closure.
      setTranscript(currentTranscript => {
        recognitionRef.current!.start();
        return currentTranscript; // return the same state to start
      });
    }
  }, [isDictating]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current && isDictating) {
      recognitionRef.current.stop();
    }
  }, [isDictating]);

  return { isDictating, transcript, error, isAvailable, startDictation, stopDictation };
};
