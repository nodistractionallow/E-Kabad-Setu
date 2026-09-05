import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HelpDeskTicket, HelpDeskMessage } from '../types';

const LOCAL_STORAGE_KEY = 'ekabad_helpdesk_tickets_v1';

// Initial pre-loaded demonstration tickets for realistic government & authority audit
export const INITIAL_HELPDESK_TICKETS: HelpDeskTicket[] = [
  {
    id: 'TCK-GOV-8912',
    title: 'Clarification on Inter-State EPR Credit Transfer (Maharashtra to Gujarat)',
    category: 'compliance',
    portalType: 'government',
    userName: 'Dr. R. K. Sharma (CPCB Western Zone)',
    userPhone: '+91 94220 11982',
    userId: 'GOV-AUD-001',
    status: 'agent_assigned',
    assignedAgentName: 'Dr. Anand Kumar (CPCB National Legal Cell)',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderRole: 'government',
        senderName: 'Dr. R. K. Sharma',
        text: 'EcoMetals CPCB Unit #4 is requesting generation of 14.8 MT EPR credits for material transferred from Pune to Surat hydrometallurgical plant. Please verify if inter-state Form-6 transit permit is pre-validated.',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'msg-2',
        senderRole: 'agent',
        senderName: 'Dr. Anand Kumar (CPCB National Legal Cell)',
        text: 'Form-6 manifest serial CPCB-GJ-MH-2026-902 is verified on the national portal. Weighbridge gross/tare differential matches within 0.15% tolerance. Approved for EPR credit issuance.',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ]
  },
  {
    id: 'TCK-AUTH-4410',
    title: 'Weighbridge Calibration Sensor Zero-Point Drift Inquiry',
    category: 'weighbridge',
    portalType: 'recycler',
    userName: 'Vikram Mehta (Plant Manager, EcoMetals)',
    userPhone: '+91 98221 44550',
    userId: 'REC-MH-PN-004',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      {
        id: 'msg-auth-1',
        senderRole: 'recycler',
        senderName: 'Vikram Mehta',
        text: 'Our 60 MT weighbridge digital load cell showed +12kg offset during morning tare calibration. SPCB Class-III certified inspector required for re-stamping.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]
  },
  {
    id: 'TCK-COL-2309',
    title: 'Payment settlement inquiry for Server Motherboard lot',
    category: 'settlement',
    portalType: 'collector',
    userName: 'Ram Sevak (रामसेवक कांबळे)',
    userPhone: '+91 98234 56789',
    userId: 'KBD-MH-4402',
    status: 'agent_assigned',
    assignedAgentName: 'Sunita Tai (Kabadiwala Mitra Desk)',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    messages: [
      {
        id: 'msg-col-1',
        senderRole: 'collector',
        senderName: 'रामसेवक कांबळे',
        text: 'मैंने 5 किलो हाई-ग्रेड पीसीबी जमा किया था। वजन कांटा पास हुआ या नहीं?',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        id: 'msg-col-2',
        senderRole: 'agent',
        senderName: 'Sunita Tai (Kabadiwala Mitra Desk)',
        text: 'नमस्ते रामसेवक जी! आपका लॉट वजन कांटे पर 5.0 किलो बिल्कुल सही प्रमाणित हो गया है और ₹2,400 का UPI भुगतान सीधे आपके बैंक खाते में सफलतापूर्वक क्रेडिट हो गया है।',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ]
  }
];

function getStoredTickets(): HelpDeskTicket[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed reading helpdesk tickets from localStorage:', err);
  }
  return INITIAL_HELPDESK_TICKETS;
}

function saveStoredTickets(tickets: HelpDeskTicket[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('Failed saving helpdesk tickets to localStorage:', err);
  }
}

/**
 * Subscribe to real-time tickets from Firebase Firestore, falling back to localStorage
 */
export function subscribeToHelpDeskTickets(onUpdate: (tickets: HelpDeskTicket[]) => void): () => void {
  // Immediately provide cached tickets
  onUpdate(getStoredTickets());

  let unsubscribeFirestore = () => {};

  try {
    const ticketsCol = collection(db, 'helpdesk_tickets');
    unsubscribeFirestore = onSnapshot(
      ticketsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteTickets: HelpDeskTicket[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as HelpDeskTicket;
            remoteTickets.push({ ...data, id: docSnap.id });
          });
          remoteTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          saveStoredTickets(remoteTickets);
          onUpdate(remoteTickets);
        } else {
          // Initialize remote collection with initial mock data
          INITIAL_HELPDESK_TICKETS.forEach(async (initTicket) => {
            try {
              await setDoc(doc(db, 'helpdesk_tickets', initTicket.id), initTicket);
            } catch (e) {
              // ignore offline error
            }
          });
          onUpdate(getStoredTickets());
        }
      },
      (error) => {
        console.warn('Firestore helpdesk onSnapshot error (offline fallback):', error);
        onUpdate(getStoredTickets());
      }
    );
  } catch (err) {
    console.warn('Firestore initialization error in helpdesk:', err);
    onUpdate(getStoredTickets());
  }

  // Cross-tab broadcast synchronization
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
      try {
        onUpdate(JSON.parse(e.newValue));
      } catch (e) {}
    }
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    unsubscribeFirestore();
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Create a new ticket
 */
export async function createHelpDeskTicket(
  ticket: Omit<HelpDeskTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'status'>,
  initialMessageText: string
): Promise<HelpDeskTicket> {
  const ticketId = `TCK-${ticket.portalType.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const firstMsg: HelpDeskMessage = {
    id: `msg-${Date.now()}`,
    senderRole: ticket.portalType,
    senderName: ticket.userName,
    text: initialMessageText,
    timestamp: now
  };

  const newTicket: HelpDeskTicket = {
    ...ticket,
    id: ticketId,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    messages: [firstMsg]
  };

  // 1. Save locally
  const current = getStoredTickets();
  const updated = [newTicket, ...current.filter((t) => t.id !== ticketId)];
  saveStoredTickets(updated);

  // 2. Sync to Firebase Firestore
  try {
    await setDoc(doc(db, 'helpdesk_tickets', ticketId), newTicket);
  } catch (err) {
    console.warn('Could not push new ticket to Firestore (offline):', err);
  }

  return newTicket;
}

/**
 * Send a message on a ticket
 */
export async function sendMessageToTicket(
  ticketId: string,
  message: Omit<HelpDeskMessage, 'id' | 'timestamp'>
): Promise<HelpDeskTicket | null> {
  const current = getStoredTickets();
  const index = current.findIndex((t) => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const newMsg: HelpDeskMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: now
  };

  const updatedTicket: HelpDeskTicket = {
    ...current[index],
    updatedAt: now,
    messages: [...current[index].messages, newMsg]
  };

  current[index] = updatedTicket;
  saveStoredTickets(current);

  // Sync to Firestore
  try {
    await updateDoc(doc(db, 'helpdesk_tickets', ticketId), {
      messages: updatedTicket.messages,
      updatedAt: now
    });
  } catch (err) {
    console.warn('Could not update message in Firestore (offline):', err);
  }

  return updatedTicket;
}

/**
 * Assign live agent to ticket
 */
export async function assignAgentToTicket(ticketId: string, agentName: string): Promise<HelpDeskTicket | null> {
  const current = getStoredTickets();
  const index = current.findIndex((t) => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const joinMsg: HelpDeskMessage = {
    id: `msg-agent-join-${Date.now()}`,
    senderRole: 'bot',
    senderName: 'Official System Dispatcher',
    text: `🟢 Official Agent Connected: ${agentName} has entered the room. You can now consult directly in real-time.`,
    timestamp: now
  };

  const updatedTicket: HelpDeskTicket = {
    ...current[index],
    status: 'agent_assigned',
    assignedAgentName: agentName,
    updatedAt: now,
    messages: [...current[index].messages, joinMsg]
  };

  current[index] = updatedTicket;
  saveStoredTickets(current);

  try {
    await updateDoc(doc(db, 'helpdesk_tickets', ticketId), {
      status: 'agent_assigned',
      assignedAgentName: agentName,
      messages: updatedTicket.messages,
      updatedAt: now
    });
  } catch (err) {
    console.warn('Could not assign agent in Firestore:', err);
  }

  return updatedTicket;
}

/**
 * Mark ticket as resolved
 */
export async function resolveHelpDeskTicket(ticketId: string, resolutionSummary?: string): Promise<void> {
  const current = getStoredTickets();
  const index = current.findIndex((t) => t.id === ticketId);
  if (index === -1) return;

  const now = new Date().toISOString();
  const closeMsg: HelpDeskMessage = {
    id: `msg-close-${Date.now()}`,
    senderRole: 'bot',
    senderName: 'Official System Dispatcher',
    text: `✅ This support docket has been formally marked as Resolved. ${resolutionSummary ? `Resolution note: ${resolutionSummary}` : ''}`,
    timestamp: now
  };

  const updatedTicket: HelpDeskTicket = {
    ...current[index],
    status: 'resolved',
    updatedAt: now,
    messages: [...current[index].messages, closeMsg]
  };

  current[index] = updatedTicket;
  saveStoredTickets(current);

  try {
    await updateDoc(doc(db, 'helpdesk_tickets', ticketId), {
      status: 'resolved',
      messages: updatedTicket.messages,
      updatedAt: now
    });
  } catch (err) {
    console.warn('Could not resolve ticket in Firestore:', err);
  }
}
