import { createContext, useContext, useState, useCallback } from "react";

const TicketContext = createContext(null);

function parseTicketText(raw) {
  const get = (patterns, fallback = "-") => {
    for (const pat of patterns) {
      const m = raw.match(pat);
      if (m && m[1]?.trim()) return m[1].trim();
    }
    return fallback;
  };

  // ✅ FIX: Multi block aman (nggak makan field bawah)
  const getMultiBlock = (label) => {
    const regex = new RegExp(
      `${label}\\s*:\\s*\\n([\\s\\S]*?)(?=\\n[A-Za-z][A-Za-z ]*\\s*:|$)`,
      "i"
    );

    const match = raw.match(regex);
    if (!match) return [];

    return match[1]
      .split("\n")
      .map((v) => v.trim())
      .filter((v) => v && !v.match(/^[A-Za-z ]+\s*:/)); // extra safety
  };

  // ✅ FIX: newline ke bawah
  const join = (arr) => (arr.length ? arr.join("\n") : "-");

  // ===== BASIC =====
  const caseId = get([/Case ID\s*:\s*(.+)/i]);
  const securityEvent = get([/Security Event\s*:\s*(.+)/i]);
  const severity = get([/Severity\s*:\s*(.+)/i]);
  const threatCategory = get([/Threat Category\s*:\s*(.+)/i]);
  const statusEvent = get([/Status Event\s*:\s*(.+)/i, /Status\s*:\s*(.+)/i]);
  const waktuDeteksi = get([/Waktu Deteksi\s*:\s*(.+)/i]);
  const stage = get([/Stage\s*:\s*(.+)/i]);
  const tactic = get([/Tactic\s*:\s*(.+)/i]);
  const technique = get([/Technique\s*:\s*(.+)/i]);

  // ===== SIGNATURE =====
  const signature = join(getMultiBlock("Signature"));

  // ===== SOURCE =====
  const srcIpLines = getMultiBlock("Source IP");
  const srcParsed = srcIpLines.map((line) => {
    const m = line.match(/([\d.]+)\s*\(([^)]+)\)/);
    return {
      ip: m ? m[1] : line,
      country: m ? m[2] : "-",
    };
  });

  const srcHost = join(getMultiBlock("Source Host"));
  const srcPort = join(getMultiBlock("Source Port"));
  const srcReputation = get([/Source Reputation\s*:\s*(.+)/i]);

  // ===== DESTINATION =====
  const dstIpLines = getMultiBlock("Destination IP");
  const dstParsed = dstIpLines.map((line) => {
    const m = line.match(/([\d.]+)\s*\(([^)]+)\)/);
    return {
      ip: m ? m[1] : line,
      country: m ? m[2] : "-",
    };
  });

  const dstHost = join(getMultiBlock("Destination Host"));
  const dstPort = get([/Dst port\s*:\s*(.+)/i, /Destination Port\s*:\s*(.+)/i]);
  const dstReputation = get([/Destination Reputation\s*:\s*(.+)/i]);

  // ===== APP & STATE =====
  const stateRaw = get([/State\s*:\s*(.+)/i]);
  const appRaw = get([/App\s*:\s*(.+)/i]);

  const reason =
    [
      stateRaw !== "-" ? `State : ${stateRaw}` : null,
      appRaw !== "-" ? `App : ${appRaw}` : null,
    ]
      .filter(Boolean)
      .join(" ") || "-";

  // ===== DATE =====
  let eventDate = "-";
  let eventTime = "-";

  if (waktuDeteksi !== "-") {
    const parts = waktuDeteksi.split(" ");
    eventDate = parts[0] || "-";
    eventTime = parts[1] || "-";
  }

  // ===== FINAL =====
  return {
    alarmsName: securityEvent,
    exploitSignature: signature,
    createdBy: get([/Created By\s*:\s*(.+)/i, /Analyst\s*:\s*(.+)/i]),
    caseId,
    noTiket: get([/No\.?\s*[Tt]iket\s*:\s*(.+)/i]),
    action: get([/Action\s*:\s*(.+)/i]),

    eventDate,
    eventTime,
    ticketDateTime: waktuDeteksi,

    socResponseTime: "-",
    timeResolution: "-",

    statusTicketing: statusEvent,
    reason,
    severity,

    // SOURCE
    ipSource: join(srcParsed.map((x) => x.ip)),
    countryCodeIpSource: join(srcParsed.map((x) => x.country)),
    sourceIpReputations: srcReputation,
    sourcePort: srcPort,
    sourceHost: srcHost,

    // MITRE
    stage,
    tactic,
    technique,

    macAddress: "-",
    dnsResolveIp: "-",

    // DESTINATION
    dstHost,
    ipDestination: join(dstParsed.map((x) => x.ip)),
    countryCodeIpDestination: join(dstParsed.map((x) => x.country)),
    destinationPort: dstPort,
    destinationIpReputations: dstReputation,

    threatCategory,

    numberFailed: "-",
    numberSuccessfull: "-",
    actual: "-",
    typical: "-",
    requestUsername: "-",
    requestPassword: "-",
    metadataCVE: "-",
  };
}

const COLUMNS = [
  { key: "alarmsName", label: "Alarms Name" },
  { key: "exploitSignature", label: "Exploit Signature" },
  { key: "createdBy", label: "Created By" },
  { key: "caseId", label: "Case ID" },
  { key: "noTiket", label: "No. tiket" },
  { key: "action", label: "Action" },
  { key: "eventDate", label: "Event Date" },
  { key: "eventTime", label: "Event Time" },
  { key: "ticketDateTime", label: "Ticket Date & Time" },
  { key: "socResponseTime", label: "SOC Response Time" },
  { key: "timeResolution", label: "Time Resolution" },
  { key: "timeResolution", label: "Time Resolution" },
  { key: "timeResolution", label: "Time Resolution" },
  { key: "statusTicketing", label: "Status Ticketing" },
  { key: "reason", label: "Reason" },
  { key: "severity", label: "Severity" },
  { key: "ipSource", label: "IP Source" },
  { key: "countryCodeIpSource", label: "Country Code IP Source" },
  { key: "sourceIpReputations", label: "Source IP Reputations" },
  { key: "sourcePort", label: "Source Port" },
  { key: "stage", label: "Stage" },
  { key: "tactic", label: "Tactic" },
  { key: "technique", label: "Technique" },
  { key: "macAddress", label: "MAC Address" },
  { key: "dnsResolveIp", label: "DNS & Resolve IP" },
  { key: "sourceHost", label: "Source Host" },
  { key: "dstHost", label: "Dst Host" },
  { key: "ipDestination", label: "IP Destination" },
  { key: "countryCodeIpDestination", label: "Country Code IP Destination" },
  { key: "destinationPort", label: "Destination Port" },
  { key: "destinationIpReputations", label: "Destination IP Reputations" },
  { key: "threatCategory", label: "Threat Category" },
  { key: "numberFailed", label: "Number Failed" },
  { key: "numberSuccessfull", label: "Number Successfull" },
  { key: "actual", label: "Actual" },
  { key: "typical", label: "Typical" },
  { key: "requestUsername", label: "Request Username" },
  { key: "requestPassword", label: "Request Password" },
  { key: "metadataCVE", label: "Metadata CVE" },
];

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState([]);
  const [rawInput, setRawInput] = useState("");
  const [error, setError] = useState("");

  const addTicket = useCallback((raw) => {
    try {
      const parsed = parseTicketText(raw);
      setTickets((prev) => [...prev, parsed]);
      setRawInput("");
      setError("");
    } catch (e) {
      setError("Gagal parse ticket. Pastikan format sudah benar.");
    }
  }, []);

  const removeTicket = useCallback((index) => {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setTickets([]);
  }, []);

  const exportToCSV = useCallback(() => {
  const header = COLUMNS.map((c) => `"${c.label}"`).join(",");
  const rows = tickets.map((t) =>
    COLUMNS.map((c) =>
      `"${(t[c.key] ?? "-")
        .toString()
        .replace(/"/g, '""')}"`
    ).join(",")
  );

  const csv = [header, ...rows].join("\n");
const BOM = "\uFEFF";
const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "soc_tickets.csv";
  a.click();

  URL.revokeObjectURL(url);
}, [tickets]);

  return (
    <TicketContext.Provider
      value={{
        tickets,
        rawInput,
        setRawInput,
        error,
        addTicket,
        removeTicket,
        clearAll,
        exportToCSV,
        columns: COLUMNS,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTicket() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTicket must be used inside <TicketProvider>");
  return ctx;
}