import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types';
import { askClinicalAgent } from '@/services/api';
import { AlertsPanel } from '@/components/clinical/AlertsPanel';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClinicalAlert, ClinicalCheck } from '@/types';

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

export function AIAssistant({ open, onOpenChange, patientId }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your dialysis health assistant. Ask about your sessions, symptoms, or what to watch for. I'll use your session data and clinical alerts to respond.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [latestAlerts, setLatestAlerts] = useState<ClinicalAlert[]>([]);
  const [latestChecks, setLatestChecks] = useState<ClinicalCheck[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, latestAlerts]);

  const handleSend = async () => {
    if (!input.trim() || !patientId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = input;
    setInput('');
    setIsTyping(true);

    try {
      const result = await askClinicalAgent(patientId, question);
      setLatestAlerts(result.alerts);
      setLatestChecks(result.checks);

      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, response]);
    } catch {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Sorry, I could not reach the clinical assistant. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, response]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] h-[640px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            AI Health Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {(latestAlerts.length > 0 || latestChecks.length > 0) && (
              <AlertsPanel alerts={latestAlerts} checks={latestChecks} title="From your records" />
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-slide-up',
                  message.role === 'user' && 'flex-row-reverse'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    message.role === 'assistant' ? 'bg-primary' : 'bg-secondary'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 max-w-[85%]',
                    message.role === 'assistant'
                      ? 'bg-secondary text-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            This assistant provides information only. Always consult your healthcare provider for medical decisions.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your sessions or symptoms..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
