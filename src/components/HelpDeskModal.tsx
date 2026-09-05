import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Headphones, 
  ShieldCheck, 
  Building2, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  User, 
  Bot, 
  Sparkles,
  RefreshCw,
  PhoneCall,
  Check
} from 'lucide-react';
import { HelpDeskTicket, HelpDeskMessage, UserRole } from '../types';
import { 
  subscribeToHelpDeskTickets, 
  createHelpDeskTicket, 
  sendMessageToTicket, 
  assignAgentToTicket 
} from '../services/helpdeskService';
import { playFeedbackChime } from '../utils/speech';

interface HelpDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalType: 'government' | 'recycler' | 'collector';
  userName: string;
  userId: string;
  userPhone?: string;
}

export const HelpDeskModal: React.FC<HelpDeskModalProps> = ({
  isOpen,
  onClose,
  portalType,
  userName,
  userId,
  userPhone
}) => {
  const [tickets, setTickets] = useState<HelpDeskTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnectingAgent, setIsConnectingAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time tickets from Firebase Firestore
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToHelpDeskTickets((allTickets) => {
      const filtered = allTickets.filter((t) => t.portalType === portalType || t.userId === userId);
      setTickets(filtered);
      if (filtered.length > 0 && !activeTicketId) {
        setActiveTicketId(filtered[0].id);
      }
    });
    return () => unsubscribe();
  }, [isOpen, portalType, userId, activeTicketId]);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tickets, activeTicketId]);

  if (!isOpen) return null;

  const currentTicket = tickets.find((t) => t.id === activeTicketId);

  // Portal specific configuration & quick bot questions
  const portalConfig = {
    government: {
      title: 'CPCB Regulatory & Legal Cell Help Desk',
      subtitle: 'Official MoEFCC & SPCB Compliance Assistance',
      assignedAgentDefault: 'Dr. Anand Kumar (CPCB National Legal Cell)',
      agentRole: 'CPCB Regulatory Director',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      botAvatarBg: 'bg-emerald-700 text-white',
      quickChips: [
        {
          q: 'How to verify EPR Credit authenticity?',
          a: 'EPR credits on E-Kabad Setu are cryptographically backed by weighbridge gross-tare differential mass tickets and CPCB Schedule recovery yields. Verify UTR and CPCB certificate hashes in the Regulatory Ledger.'
        },
        {
          q: 'Reporting informal acid-leaching violation',
          a: 'Immediate SPCB Enforcement Alert triggered. Under Rule 16 of E-Waste 2022, open acid leaching carries strict environmental compensation penalties. Forwarding coordinates to State Pollution Control Board Field Officer.'
        },
        {
          q: 'SPCB interstate e-waste transport guidelines',
          a: 'Form-6 manifest is digitally auto-generated for interstate transport. Consignment must carry digital GPS tracking seal and authorized recycler acceptance code.'
        },
        {
          q: 'Sanctioning unlisted category floor rate',
          a: 'Access the CPCB Category Approvals Desk in Tab 3 to review AI vision diagnostics, assign statutory floor rate per kg, and notify national aggregators.'
        }
      ]
    },
    recycler: {
      title: 'Industrial Operations & Plant Liaison Desk',
      subtitle: 'Technical Support for Authorized Recyclers & Aggregators',
      assignedAgentDefault: 'Er. Rajesh Deshmukh (SPCB Plant Inspector)',
      agentRole: 'Senior Industrial Liaison Officer',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      botAvatarBg: 'bg-indigo-700 text-white',
      quickChips: [
        {
          q: 'Weighbridge Class-III calibration drift',
          a: 'Ensure tare weight balance calibration certificate is renewed every 12 months under Legal Metrology Act. You can manually enter verified mass with supervisor override flag.'
        },
        {
          q: 'Handling hazardous swollen battery batch',
          a: 'Quarantine the lot immediately. Place in vermiculite fire-retardant safety bins and apply terminal insulation tape before processing in hydrometallurgical shredder.'
        },
        {
          q: 'Collector partner KYC verification workflow',
          a: 'New partner registrations initiated here are dispatched directly to the CPCB Government Desk for statutory approval before commercial lots can be booked.'
        },
        {
          q: 'Disputing anomalous mandi rate declaration',
          a: 'The AI Vision anomaly engine flags rates exceeding statutory variance. Use the supervisor override or rejection protocol in the Anomaly Review panel.'
        }
      ]
    },
    collector: {
      title: 'कबाड़ मित्र सहायता केंद्र (Kabadiwala Saathi Help Desk)',
      subtitle: 'सरकारी हमीभाव, तत्काल UPI भुगतान व सुरक्षा सहायता',
      assignedAgentDefault: 'Smt. Sunita Tai (Kabadiwala Welfare Officer)',
      agentRole: 'Safai Sathi Mitra Officer',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      botAvatarBg: 'bg-teal-700 text-white',
      quickChips: [
        {
          q: 'मेरा भुगतान कब जमा होगा? (Payment status)',
          a: 'जैसे ही अधिकृत प्लांट के वजन कांटे पर आपका कबाड़ तुल जाएगा, CPCB नियमों के तहत आपका पूरा पैसा सीधे आपके UPI बैंक खाते में तुरंत ट्रांसफर हो जाएगा।'
        },
        {
          q: 'सर्वर मदरबोर्ड का सबसे अधिक भाव कैसे पाएं?',
          a: 'मदरबोर्ड को तेजाब में न डालें और न ही हथौड़े से तोड़ें। सोने की पिन और संपर्कों को साबुत रखने पर CPCB अधिकृत ₹480/kg का पूरा समर्थन भाव मिलेगा।'
        },
        {
          q: 'नई अनलिस्टेड श्रेणी का भाव कैसे तय होगा?',
          a: 'कैमरे से फोटो खींचकर जमा करें। हमारी AI टीम और CPCB सरकारी अधिकारी 2 घंटे में लैब परीक्षण के बाद आधिकारिक दर निर्धारित कर देंगे।'
        },
        {
          q: 'सीआरटी कांच या फूली बैटरी से सुरक्षा कैसे करें?',
          a: 'फूली बैटरी को पानी या आग से दूर रखें। सीआरटी कांच को कभी न तोड़ें, साबुत क्रेट में भरकर रिसाइक्लर तक पहुंचाएं।'
        }
      ]
    }
  };

  const currentConfig = portalConfig[portalType];

  const handleStartNewTicket = async (title: string, message: string) => {
    playFeedbackChime('beep');
    const newT = await createHelpDeskTicket(
      {
        title,
        category: portalType === 'government' ? 'compliance' : portalType === 'recycler' ? 'weighbridge' : 'rates',
        portalType,
        userName,
        userId,
        userPhone
      },
      message
    );
    setActiveTicketId(newT.id);
  };

  const handleSendTextMessage = async () => {
    if (!inputMessage.trim()) return;
    const textToSend = inputMessage.trim();
    setInputMessage('');
    playFeedbackChime('beep');

    if (!currentTicket) {
      await handleStartNewTicket(textToSend.slice(0, 40) + '...', textToSend);
      return;
    }

    await sendMessageToTicket(currentTicket.id, {
      senderRole: portalType,
      senderName: userName,
      text: textToSend
    });
  };

  const handleQuickQuestionClick = async (chip: { q: string; a: string }) => {
    playFeedbackChime('beep');
    if (!currentTicket) {
      const newT = await createHelpDeskTicket(
        {
          title: chip.q,
          category: portalType === 'government' ? 'compliance' : portalType === 'recycler' ? 'weighbridge' : 'rates',
          portalType,
          userName,
          userId,
          userPhone
        },
        chip.q
      );
      setActiveTicketId(newT.id);
      // Add Bot Answer
      setTimeout(async () => {
        await sendMessageToTicket(newT.id, {
          senderRole: 'bot',
          senderName: `${currentConfig.title} AI Bot`,
          text: chip.a
        });
      }, 500);
    } else {
      await sendMessageToTicket(currentTicket.id, {
        senderRole: portalType,
        senderName: userName,
        text: chip.q
      });
      setTimeout(async () => {
        await sendMessageToTicket(currentTicket.id, {
          senderRole: 'bot',
          senderName: `${currentConfig.title} AI Bot`,
          text: chip.a
        });
      }, 600);
    }
  };

  const handleConnectLiveAgent = async () => {
    if (!currentTicket) {
      const newT = await createHelpDeskTicket(
        {
          title: 'Request for Live Regulatory / Plant Officer Connection',
          category: 'other',
          portalType,
          userName,
          userId,
          userPhone
        },
        'Requesting immediate real-time connection with an authorized human officer.'
      );
      setActiveTicketId(newT.id);
      setIsConnectingAgent(true);
      playFeedbackChime('beep');
      setTimeout(async () => {
        await assignAgentToTicket(newT.id, currentConfig.assignedAgentDefault);
        setIsConnectingAgent(false);
        playFeedbackChime('success');
      }, 1200);
      return;
    }

    setIsConnectingAgent(true);
    playFeedbackChime('beep');
    setTimeout(async () => {
      await assignAgentToTicket(currentTicket.id, currentConfig.assignedAgentDefault);
      setIsConnectingAgent(false);
      playFeedbackChime('success');
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] max-h-[720px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-800 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs ${currentConfig.botAvatarBg}`}>
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {currentConfig.title}
                </h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                  Firebase Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Officer Status Ribbon */}
        <div className="bg-emerald-50/90 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-950 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active Desk Agent: <strong>{currentTicket?.assignedAgentName || currentConfig.assignedAgentDefault}</strong></span>
          </div>

          {currentTicket?.status !== 'agent_assigned' ? (
            <button
              type="button"
              onClick={handleConnectLiveAgent}
              disabled={isConnectingAgent}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <PhoneCall className={`w-3 h-3 ${isConnectingAgent ? 'animate-spin' : ''}`} />
              <span>{isConnectingAgent ? 'Connecting...' : 'Connect to Live Human Officer'}</span>
            </button>
          ) : (
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Officer Connected</span>
            </span>
          )}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
          
          {/* Welcome Message */}
          <div className="flex items-start gap-2.5 max-w-[88%]">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${currentConfig.botAvatarBg}`}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs shadow-xs text-xs space-y-1.5">
              <p className="font-bold text-slate-900">
                Welcome to the {currentConfig.title}
              </p>
              <p className="text-slate-600 leading-relaxed">
                We are connected via Central Firebase Firestore. You can pick any domain query below for instant statutory automated resolution, or click &quot;Connect to Live Human Officer&quot; to speak directly with an authorized representative.
              </p>
            </div>
          </div>

          {/* Quick Domain Questions Chips */}
          <div className="space-y-1.5 pl-10 pr-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
              Quick Resolution Topics:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentConfig.quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestionClick(chip)}
                  className="text-left text-[11px] py-1.5 px-3 bg-white hover:bg-slate-100 active:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-xl font-medium text-slate-700 shadow-2xs transition-all cursor-pointer"
                >
                  💬 {chip.q}
                </button>
              ))}
            </div>
          </div>

          {/* Render Active Ticket Messages */}
          {currentTicket && currentTicket.messages.map((msg) => {
            const isMe = msg.senderRole === portalType;
            const isAgent = msg.senderRole === 'agent';
            const isBot = msg.senderRole === 'bot';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isMe
                      ? 'bg-slate-800 text-white'
                      : isAgent
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {isMe ? <User className="w-4 h-4" /> : isAgent ? <ShieldCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-1 ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                      : isAgent
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-tl-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-mono">
                    <span className="font-bold">{msg.senderName}</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTextMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ${portalType === 'government' ? 'regulatory compliance' : portalType === 'recycler' ? 'plant operations' : 'कबाड़ मित्र'} question or type concern...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
