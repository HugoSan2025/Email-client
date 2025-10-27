
"use client";

import { useState, useEffect, useRef, useTransition } from 'react';
import { enhanceEmail } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { getClients } from '@/lib/client-data';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Loader2, Sparkles, X, Search } from 'lucide-react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Client {
  code: string;
  name: string;
  emails: string[];
}

const clientData = getClients();

export default function EmailForm() {
  const [clientCode, setClientCode] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [searchedCode, setSearchedCode] = useState('');
  
  const [isDictating, setIsDictating] = useState(false);
  const [dictationStatus, setDictationStatus] = useState('');
  
  const [isPending, startTransition] = useTransition();
  const [isEnhancing, startEnhancingTransition] = useTransition();
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);

  useEffect(() => {
    // This check now runs only on the client, after the initial render.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionAvailable(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsDictating(true);
        setDictationStatus('Escuchando...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setBody(prevBody => (prevBody ? prevBody.trim() + ' ' : '') + transcript + '.');
      };

      recognition.onerror = (event: any) => {
        let errorMsg = `Error de dictado: ${event.error}`;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errorMsg = 'Acceso al micrófono denegado. Por favor, revisa los permisos del navegador.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No se detectó voz. Inténtalo de nuevo.';
        } else if (event.error === 'network') {
          errorMsg = 'Error de red. Revisa tu conexión a internet.';
        }
        setDictationStatus(errorMsg);
        handleMessage(errorMsg, 'destructive', 'Error de Dictado');
      };

      recognition.onend = () => {
        setIsDictating(false);
        setDictationStatus(''); // Clear status on end
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMessage = (description: string, variant: "default" | "destructive" = "default", title?: string) => {
    toast({
        variant,
        title,
        description,
    });
  };

  const findClient = (code: string): Client | undefined => {
    return clientData.find(c => c.code === code);
  };

  const handleSearch = (code: string) => {
    startTransition(() => {
      const codeToSearch = code.trim();
      setSearchedCode(codeToSearch);

      if (!codeToSearch) {
        setRecipients([]);
        setSubject('');
        setBody('');
        return;
      }
      
      const client = findClient(codeToSearch);

      if (client) {
        setRecipients(client.emails);
        const newSubject = `Comunicación con ${client.name}`;
        const newBody = `Estimado equipo de ${client.name},\n\nNos ponemos en contacto con ustedes para...`;
        setSubject(newSubject);
        setBody(newBody);
      } else {
        setRecipients([]);
        setSubject('');
        setBody('');
      }
    });
  };

  const handleClientCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientCode(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(clientCode);
    }
  };

  const handleClearClientCode = () => {
    setClientCode('');
    setRecipients([]);
    setSubject('');
    setBody('');
    setSearchedCode('');
  };

  const toggleDictation = () => {
    if (!recognitionAvailable || !recognitionRef.current) {
        handleMessage('El dictado por voz no está disponible en este navegador.', 'destructive');
        return;
    }
    
    if (isDictating) {
        recognitionRef.current.stop();
    } else {
        try {
            recognitionRef.current.start();
        } catch (error) {
            console.error("Error starting recognition:", error);
            handleMessage('No se pudo iniciar el dictado. Revisa los permisos del micrófono.', 'destructive');
        }
    }
  };

  const handleEnhanceClick = () => {
    if (!body.trim()) {
        handleMessage('El cuerpo del correo está vacío.', 'destructive', 'Error');
        return;
    }
    startEnhancingTransition(async () => {
        const result = await enhanceEmail(body);
        setBody(result.suggestedImprovements);
        handleMessage('El texto del correo ha sido mejorado.', 'default', 'IA');
    });
  };

  const generateMailto = () => {
    if (!searchedCode) {
      handleMessage('Por favor, introduce y busca un Código de Cliente.', "destructive", "Faltan datos");
      return;
    }
    if (recipients.length === 0) {
      handleMessage(`No se encontraron correos para el código "${searchedCode}".`, "destructive", "Cliente no encontrado");
      return;
    }
  
    const toEmails = recipients.slice(0, 2);
    const ccEmails = recipients.slice(2);
  
    const baseUrl = 'https://outlook.live.com/mail/0/deeplink/compose';
    const params = new URLSearchParams();
  
    if (toEmails.length > 0) {
      params.append('to', toEmails.join(','));
    }
    if (ccEmails.length > 0) {
      params.append('cc', ccEmails.join(','));
      params.append('showcc', '1');
    }
    if (subject) {
      params.append('subject', subject);
    }
    if (body) {
      params.append('body', body);
    }
  
    // Replace '+' with '%20' for spaces, which Outlook Web handles better.
    const queryString = params.toString().replace(/\+/g, '%20');
    const url = `${baseUrl}?${queryString}`;
      
    window.open(url, '_blank', 'noopener,noreferrer');
    handleMessage('Abriendo cliente de correo...', "default", "Éxito");
  };


  let toEmails: string[] = [];
  let ccEmails: string[] = [];

  if (recipients.length > 0) {
    toEmails = recipients.slice(0, 2);
    ccEmails = recipients.slice(2);
  }


  const wasSearched = !!searchedCode;
  const hasRecipients = recipients.length > 0;
  
  return (
    <div className="w-full max-w-4xl shadow-2xl rounded-xl p-6 md:p-10 border border-gray-700 bg-background">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-6 pb-2 text-center border-b border-accent/50 text-shadow-md">
        GESTOR DE CORREOS
      </h1>

      <div className="space-y-8">
        <Card className="p-6 rounded-xl border-indigo-300 shadow-3xl bg-card text-card-foreground transition duration-200 transform hover:-translate-y-0.5">
          <CardHeader className="p-0 mb-4">
            <h2 className="text-2xl font-bold">1. Buscar Cliente</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div>
              <Label htmlFor="clientCode" className="block text-sm font-medium mb-1">
                Código de Cliente
              </Label>
              <div className="relative flex items-center gap-2">
                <Input
                  type="text"
                  id="clientCode"
                  value={clientCode}
                  onChange={handleClientCodeChange}
                  onKeyDown={handleKeyDown}
                  className="block w-full p-4 h-auto border-2 border-indigo-400 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-3xl transition duration-200 transform hover:-translate-y-0.5 bg-input text-foreground"
                  placeholder="Escriba el código..."
                />
                 {clientCode && !isPending && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearClientCode}
                    className="absolute right-[calc(4rem+0.5rem)] sm:right-[calc(7.5rem+0.5rem)] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
                 <Button 
                  onClick={() => handleSearch(clientCode)} 
                  disabled={isPending}
                  className="px-4 py-2 h-auto text-sm font-bold rounded-xl shadow-3xl transition duration-200 transform hover:-translate-y-0.5 bg-primary hover:bg-accent"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  <span className="sr-only sm:not-sr-only sm:ml-2">Buscar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 rounded-lg border-gray-700 shadow-3xl bg-card text-card-foreground transition duration-200 transform hover:-translate-y-0.5">
          <CardHeader className="p-0 mb-3 px-2">
            <h2 className="text-2xl font-bold">2. Redactar correo o dictado</h2>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-4">
              <div id="recipient-display" className={`p-3 rounded-lg text-sm border shadow-3xl transition-all duration-200 transform hover:-translate-y-0.5 ${!wasSearched || hasRecipients ? 'bg-green-100 text-green-900 border-green-200' : 'bg-yellow-100 text-yellow-900 border-yellow-200'}`}>
                {isPending ? (
                  <p>Buscando...</p>
                ) : wasSearched && !hasRecipients ? (
                  <p>Destinatarios: Código "{searchedCode.toUpperCase()}" no encontrado.</p>
                ) : hasRecipients ? (
                  <>
                    <p><span className="font-bold text-gray-700">TO:</span> {toEmails.join(', ')}</p>
                    {ccEmails.length > 0 && <p><span className="font-bold text-gray-700">CC:</span> {ccEmails.join(', ')}</p>}
                  </>
                ) : (
                  <p>Destinatarios: Ingrese un código para cargar los correos.</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="emailSubject" className="block text-sm font-medium">Asunto del Correo</Label>
                <Input
                  type="text"
                  id="emailSubject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full p-3 rounded-lg shadow-3xl transition duration-200 transform hover:-translate-y-0.5 bg-input text-foreground border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <Label htmlFor="emailBody" className="block text-sm font-medium mb-1">Cuerpo del Correo</Label>
                <Textarea
                  id="emailBody"
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 rounded-lg text-sm shadow-3xl transition duration-200 transform hover:-translate-y-0.5 bg-input text-foreground border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Escribe tu mensaje o usa el dictado por voz..."
                />
                 <div className="flex justify-between items-center mt-2">
                   <Button
                    size="icon"
                    onClick={handleEnhanceClick}
                    disabled={isEnhancing}
                    className="p-3 rounded-full shadow-3xl transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-opacity-50 h-12 w-12 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                    title="Mejorar texto con IA"
                  >
                    {isEnhancing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                  </Button>
                  
                  <div className="text-center">
                    { (dictationStatus) && <p className={`text-sm ${isDictating ? 'text-green-600' : 'text-red-600'}`}>{dictationStatus}</p> }
                  </div>

                  <Button
                    id="dictationButton"
                    size="icon"
                    onClick={toggleDictation}
                    disabled={!recognitionAvailable}
                    className={`p-3 rounded-full shadow-3xl transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-opacity-50 h-12 w-12
                      ${isDictating ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}
                      disabled:bg-gray-400 disabled:cursor-not-allowed`}
                    title={isDictating ? "Detener Dictado" : "Iniciar Dictado por Voz"}
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={generateMailto} className="w-64 px-6 py-3 h-auto text-lg font-bold rounded-xl shadow-3xl transition duration-200 transform hover:-translate-y-0.5 bg-primary hover:bg-accent">
                Generar Correo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
