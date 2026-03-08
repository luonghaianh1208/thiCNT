import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AITutorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Chào bạn! Mình là Trợ giảng Hoá học thông minh. Bạn cần hỗ trợ gì bài tập hoặc kiến thức ngày hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceQueries, setPracticeQueries] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      if (e.detail?.message) {
        handleSendExternal(e.detail.message);
      }
    };
    
    const handlePracticeState = (e: any) => {
      setPracticeMode(e.detail.isPractice);
      if (e.detail.isPractice) {
        setPracticeQueries(0);
      }
    };

    window.addEventListener('open-ai-tutor', handleOpenChat as EventListener);
    window.addEventListener('practice-state', handlePracticeState as EventListener);
    
    return () => {
       window.removeEventListener('open-ai-tutor', handleOpenChat as EventListener);
       window.removeEventListener('practice-state', handlePracticeState as EventListener);
    };
  }, []);

  const getSystemPrefix = () => {
    return practiceMode 
      ? `[HỆ THỐNG YÊU CẦU LƯU Ý KHI TRẢ LỜI NGƯỜI DÙNG: HỌC SINH ĐANG LÀM BÀI KIỂM TRA. HÃY ĐÓNG VAI TRỢ GIẢNG NHƯNG CHỈ ĐƯỢC PHÉP GỢI Ý CÁCH LÀM (HOẶC GỢI Ý LÝ THUYẾT). BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC CHO BIẾT TRỰC TIẾP HAY CHỈ RA CHÍNH XÁC ĐÁP ÁN CUỐI CÙNG TRONG SUỐT PHIÊN TRẢ LỜI NÀY.]\n\n` 
      : "";
  };

  const handleSendExternal = async (userMessage: string) => {
    if (practiceMode && practiceQueries >= 3) {
      toast.error("Bạn đã hết 3 lượt hỏi Trợ Giảng trong bài thi này!");
      return;
    }
    if (practiceMode) setPracticeQueries(prev => prev + 1);

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);
    
    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: getSystemPrefix() + userMessage })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: data.reply 
      }]);
    } catch (err) {
      toast.error("Không thể kết nối đến máy chủ AI.");
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "Xin lỗi, hiện tại mình không thể kết nối tới máy chủ AI." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const msg = input;
    setInput("");
    await handleSendExternal(msg);
  };

  const clearChat = () => {
    setMessages([{ role: "ai", content: "Chào bạn! Mình là Trợ giảng Hoá học. Mình đã dọn dẹp lịch sử, bạn cần hỗ trợ gì tiếp theo?" }]);
    toast.info("Đã làm mới cuộc hội thoại");
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 shadow-xl flex flex-col h-[500px] z-50 overflow-hidden ring-1 ring-slate-900/5">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-indigo-600 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-base font-medium text-white">AI Trợ Giảng</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:bg-white/20 hover:text-white" onClick={clearChat} title="Làm mới">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", 
                  msg.role === "user" ? "bg-slate-200" : "bg-indigo-100 text-indigo-600")}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn("rounded-lg p-3 text-sm max-w-[85%] overflow-hidden", 
                  msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800 prose prose-sm prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-white max-w-none")}>
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 flex-row items-center text-slate-400">
                <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-50 text-slate-500 rounded-lg py-2 px-3 text-sm flex gap-1 items-center italic">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> AI đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          
          <CardFooter className="p-3 border-t">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex w-full items-center space-x-2"
            >
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi AI Trợ giảng..." 
                className="flex-1"
                disabled={isTyping}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
