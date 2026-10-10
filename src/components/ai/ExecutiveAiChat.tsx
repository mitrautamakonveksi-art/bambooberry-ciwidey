"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { askExecutiveAI, AiQueryResult } from "@/modules/ai/actions/ai-actions"
import { Sparkles, Send, Bot, User, Loader2, Copy, Check, Lightbulb } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  sources?: string[]
  isFallback?: boolean
  timestamp: string
}

const PRESET_PROMPTS = [
  "Analisis perbandingan Food Cost menu bulan ini dan rekomendasikan solusinya.",
  "Identifikasi anomali paling kritis dari Early Warning System (EWS) dan akar masalahnya.",
  "Bagaimana cara menekan selisih kasir dan meningkatkan akurasi rekonsiliasi harian?",
  "Berikan arahan taktis untuk menaikkan kepuasan ulasan Google Maps di outlet Ciwidey.",
]

let messageSeq = 0
function createMessageId(prefix: string): string {
  messageSeq += 1
  return `${prefix}-${messageSeq}`
}

export default function ExecutiveAiChat({
  outletId,
  initialGreeting,
}: {
  outletId?: string
  initialGreeting?: string
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      role: "assistant",
      text:
        initialGreeting ||
        "Halo! Saya **IBMS AI**, Asisten Analitik Bisnis F&B Anda. Saya telah membaca data live dari seluruh outlet (Food Cost, EWS Anomali, Rekonsiliasi Kas, dan Ulasan Tamu). Apa yang ingin Anda diskusikan hari ini?",
      timestamp: "Baru saja",
    },
  ])
  const [inputQuery, setInputQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim()
    if (!q || loading) return

    const userMessageId = createMessageId("user")
    const newMsg: Message = {
      id: userMessageId,
      role: "user",
      text: q,
      timestamp: "Baru saja",
    }

    setMessages((prev) => [...prev, newMsg])
    setInputQuery("")
    setLoading(true)

    try {
      const result: AiQueryResult = await askExecutiveAI(q, outletId)
      const assistantMsg: Message = {
        id: createMessageId("ai"),
        role: "assistant",
        text: result.answer,
        sources: result.sources,
        isFallback: result.isFallback,
        timestamp: "Baru saja",
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Koneksi terputus."
      const errorMsg: Message = {
        id: createMessageId("ai-err"),
        role: "assistant",
        text: `Maaf, terjadi kesalahan saat menghubungi mesin AI: ${errorMessage}`,
        timestamp: "Baru saja",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* QUICK PRESET PROMPTS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap pl-1">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-medium">Ide Analisis:</span>
        </div>
        {PRESET_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-xs bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 whitespace-nowrap text-slate-700 shadow-sm transition hover:border-[#2A7C13] hover:text-[#2A7C13] disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* CHAT CONTAINER */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-lg py-3 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles size={18} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                IBMS Executive Copilot
                <Badge variant="outline" className="text-[10px] bg-emerald-500/20 border-emerald-400/30 text-emerald-300 py-0">
                  Live F&B Context
                </Badge>
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-300">
                Didukung oleh Google Gemini GenAI & Guardrail RBAC Multi-Outlet
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4 max-h-[560px] overflow-y-auto bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-4 shadow-sm text-xs leading-relaxed space-y-2 ${
                  msg.role === "user"
                    ? "bg-[#2A7C13] text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 border-b border-black/5 pb-1">
                  <span className="font-semibold">{msg.role === "user" ? "Anda (Eksekutif)" : "IBMS AI"}</span>
                  <div className="flex items-center gap-2">
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="hover:opacity-100 flex items-center gap-1"
                        title="Salin respon"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Salin
                      </button>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                    <span className="font-medium text-slate-400">Data Terintegrasi:</span>
                    {msg.sources.map((s, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-600">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-[#2A7C13] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#2A7C13]" />
                <span>Menganalisis data keuangan, stok bahan baku, dan anomali outlet...</span>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-3 bg-white border-t rounded-b-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2 items-center"
          >
            <Textarea
              placeholder="Tanyakan analisis bisnis ke AI (misal: 'Bandingkan profitabilitas dan food cost menu strawberry...')"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              className="resize-none text-xs"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white h-full px-4"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 px-1">
            <span>Tekan Enter untuk mengirim, Shift+Enter untuk baris baru</span>
            <span>Data dilindungi enkripsi internal IBMS</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
