/* features/dashboard/pages/AIAssistantPage.tsx */
import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, ArrowRight, TrendingUp, AlertCircle, Users, Receipt } from 'lucide-react';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';
import { useAuthStore } from '../../../stores/authStore';

export const AIAssistantPage: React.FC = () => {
  const { shop } = useAuthStore();
  const { customers } = useCustomers();
  const { sales } = useSales();
  const { payments } = usePayments();

  const [inputMsg, setInputMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello ${shop?.name || 'Shop Owner'}! 👋 I am your Shop KhattaBook AI Assistant. Ask me anything about your Udhaar debts, top customers, daily collections, or sales performance.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const totalUdhaar = customers.reduce((acc, c) => acc + (Number(c.currentBalance) > 0 ? Number(c.currentBalance) : 0), 0);
  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const topUdhaarCustomer = [...customers].sort((a, b) => (Number(b.currentBalance) || 0) - (Number(a.currentBalance) || 0))[0];

  const handleSendPrompt = (promptText?: string) => {
    const query = (promptText || inputMsg).trim();
    if (!query) return;

    const userEntry = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let aiReply = '';
    const qLower = query.toLowerCase();

    if (qLower.includes('udhaar') || qLower.includes('pending') || qLower.includes('owe')) {
      aiReply = `📊 Current Outstanding Udhaar across all customers is ₹${totalUdhaar.toLocaleString('en-IN')}. ${topUdhaarCustomer ? `Highest pending debt is from ${topUdhaarCustomer.name} (₹${topUdhaarCustomer.currentBalance}).` : ''}`;
    } else if (qLower.includes('collection') || qLower.includes('payment') || qLower.includes('received')) {
      aiReply = `💰 Total collections recorded so far: ₹${totalCollected.toLocaleString('en-IN')} across ${payments.length} payment transactions.`;
    } else if (qLower.includes('top customer') || qLower.includes('vip') || qLower.includes('best')) {
      const topSalesCustomers = [...customers].slice(0, 3);
      aiReply = `🌟 Your top customers are: ${topSalesCustomers.map(c => `${c.name} (${c.village || 'Local'})`).join(', ')}.`;
    } else if (qLower.includes('sales') || qLower.includes('revenue') || qLower.includes('bill')) {
      const totalSalesAmt = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
      aiReply = `📈 Total sales generated: ₹${totalSalesAmt.toLocaleString('en-IN')} across ${sales.length} credit invoices.`;
    } else {
      aiReply = `I analyzed your shop data for "${query}". You have ${customers.length} registered customers, ₹${totalUdhaar.toLocaleString('en-IN')} total pending debt, and ${sales.length} recorded sales. Let me know if you want to draft payment reminders or analyze top customer balances!`;
    }

    const aiEntry = {
      sender: 'ai' as const,
      text: aiReply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userEntry, aiEntry]);
    setInputMsg('');
  };

  const quickPrompts = [
    'How much total Udhaar is pending?',
    'Who are my highest Udhaar customers?',
    'Summarize my total collections',
    'How many active customers do I have?'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%', height: 'calc(100vh - 120px)' }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1.15rem 1.25rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
            Khatta AI Assistant
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Instant insights on your shop's sales, payments & customer debts
          </p>
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div style={{
        flex: 1,
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        padding: '1.25rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {chatHistory.map((msg, index) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '85%'
              }}
            >
              {isAI && (
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  backgroundColor: '#8B5CF6', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={18} />
                </div>
              )}

              <div style={{
                backgroundColor: isAI ? 'var(--bg-secondary)' : 'var(--primary)',
                color: isAI ? 'var(--text-heading)' : '#FFFFFF',
                borderRadius: '18px',
                padding: '0.85rem 1.1rem',
                fontSize: '0.9rem',
                lineHeight: 1.45,
                border: isAI ? '1px solid var(--border-color)' : 'none',
                boxShadow: isAI ? 'none' : '0 4px 12px var(--primary-glow)'
              }}>
                <div>{msg.text}</div>
                <div style={{
                  fontSize: '0.675rem',
                  opacity: 0.75,
                  textAlign: 'right',
                  marginTop: '0.35rem'
                }}>
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Quick Queries */}
      <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendPrompt(p)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-body)',
              fontSize: '0.775rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt();
        }}
        style={{ display: 'flex', gap: '0.6rem' }}
      >
        <input
          type="text"
          className="input-field"
          placeholder="Ask AI about sales, Udhaar, or customer reminders..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          style={{ borderRadius: '16px', padding: '0.85rem 1.25rem', fontSize: '0.925rem' }}
        />
        <button
          type="submit"
          disabled={!inputMsg.trim()}
          className="btn btn-primary"
          style={{ padding: '0.85rem 1.5rem', borderRadius: '16px', fontWeight: '800' }}
        >
          <Send size={18} />
        </button>
      </form>

    </div>
  );
};

export default AIAssistantPage;
