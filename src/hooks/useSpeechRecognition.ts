// src/hooks/useSpeechRecognition.ts
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

// A global ref to hold the recognition instance.
// This is outside the component to prevent re-creation on re-renders.
let recognition: SpeechRecognition | null = null;

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isDictating, setIsDictating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // We use a ref to hold the latest transcript to avoid stale closures in callbacks
  const transcriptRef = useRef('');

  useEffect(() => {
    // This check runs only on the client-side
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsAvailable(true);
      
      // Initialize recognition only once
      if (!recognition) {
        recognition = new SpeechRecognitionAPI();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsDictating(true);
          setError(null);
        };

        recognition.onend = () => {
          setIsDictating(false);
          // Update the final transcript state
          setTranscript(transcriptRef.current);
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
          const newTranscript = event.results[0][0].transcript;
          // Append the new result to the existing transcript
          const updatedTranscript = (transcriptRef.current ? transcriptRef.current.trim() + ' ' : '') + newTranscript + '.';
          transcriptRef.current = updatedTranscript;
          // We can update the state here for live feedback if needed, but the final update is on `onend`
          setTranscript(updatedTranscript); 
        };
      }
    } else {
      setIsAvailable(false);
    }
    
    // Cleanup function to stop recognition if the component unmounts
    return () => {
        if (recognition && isDictating) {
            recognition.stop();
        }
    };
  }, [isDictating]); // Depend on isDictating to manage cleanup

  const startDictation = useCallback(() => {
    if (recognition && !isDictating) {
        // Reset transcript ref before starting
        transcriptRef.current = transcript;
        recognition.start();
    }
  }, [isDictating, transcript]);

  const stopDictation = useCallback(() => {
    if (recognition && isDictating) {
        recognition.stop();
    }
  }, [isDictating]);

  return { isDictating, transcript, error, isAvailable, startDictation, stopDictation };
};
