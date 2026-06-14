/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  auth,
  db,
  handleFirestoreError,
  OperationType
} from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import {
  LANGUAGES,
  getTranslation
} from "./languages";
import {
  UserProfile,
  InvestmentPlan,
  UserInvestment,
  UserTransaction
} from "./types";
import TechSpinner from "./components/TechSpinner";
import MultiStepWelcome from "./components/MultiStepWelcome";
import {
  Menu,
  X,
  Lock,
  Mail,
  User,
  Phone,
  Gift,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Briefcase,
  Users,
  History,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Share2,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Info,
  Percent,
  ChevronDown,
  MoreVertical,
  Wallet,
  Loader2,
  ShieldCheck,
  Shield,
  Award,
  FileText,
  BookOpen,
  Eye,
  EyeOff,
  HelpCircle,
  Settings,
  Trash2,
  Filter,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Função para máscara fiduciária com shifting de duas casas decimais (Ex: 0.00 -> 0.05 -> 0.50 -> 5.00)
const formatCentsMask = (val: string): string => {
  const clean = val.replace(/\D/g, "");
  if (!clean) return "0.00";
  const parsed = parseInt(clean, 10);
  return (parsed / 100).toFixed(2);
};

// Detector unificado e robusto de Administrador Central
export const isUserAdmin = (u: any, profile?: any): boolean => {
  if (!u) return false;
  const uid = (u.uid || profile?.uid || "").toString().trim();
  return uid === "LGoyJO3HjsN2iSmWiIPhtILMYPu1";
};

// Lista de planos fornecida exatamente pelo usuário
const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: "gratis",
    name: "Plano experimental (Grátis)",
    price: 0,
    dailyYield: 50.00,
    image: "https://i.postimg.cc/hPB00Q7y/images-(1).jpg",
    description: "Plano de teste fiduciário experimental com bónus de boas-vindas. Receba 1000 kz totais em um ciclo de 20 dias (50.00 kz de ganho diário). Regra: Apenas 1 aquisição grátis por conta.",
    code5: "10200",
    durationDays: 20
  },
  {
    id: "cobre",
    name: "Cobre",
    price: 4994,
    dailyYield: 246.98,
    image: "https://i.postimg.cc/T3pd8jnM/images-(2).jpg",
    description: "Prospecção ativa de jazigos de cobre de alto teor, focada no suprimento da descarbonização estrutural. Máx: 3 vezes por conta.",
    code5: "50541",
    durationDays: 60
  },
  {
    id: "ferro",
    name: "Minério de Ferro",
    price: 9998,
    dailyYield: 503.11,
    image: "https://i.postimg.cc/BZK7zjj7/images-(3).jpg",
    description: "Extração sustentável de hematite hematítica e magnetite de altíssimo teor para processos de siderurgia limpa de baixo carbono. Máx: 3 vezes por conta.",
    code5: "20831",
    durationDays: 60
  },
  {
    id: "polihalita",
    name: "Nutrientes para agricultura (Polihalita)",
    price: 17993,
    dailyYield: 850.71,
    image: "https://i.postimg.cc/8505fyRn/images-(9).jpg",
    description: "Fertilizantes premium multielementares contendo potássio, magnésio, cálcio e enxofre para regeneração de solos agrícolas. Máx: 3 vezes por conta.",
    code5: "31925",
    durationDays: 60
  },
  {
    id: "pgm",
    name: "Metais do Grupo da Platina (PGMs)",
    price: 28988,
    dailyYield: 1253,
    image: "https://i.postimg.cc/qB1q9vWQ/images-(5).jpg",
    description: "Minerais raros essenciais para conversores catalíticos, células de combustível de hidrogénio e eletrólise industrial. Máx: 3 vezes por conta.",
    code5: "42099",
    durationDays: 60
  },
  {
    id: "niquel",
    name: "Níquel",
    price: 44987,
    dailyYield: 2003,
    image: "https://i.postimg.cc/rs0BnjBm/images-(6).jpg",
    description: "Produção de ligas puras ultra duráveis focadas na manufatura de cátodos para baterias de veículos elétricos de alta densidade. Máx: 3 vezes por conta.",
    code5: "55102",
    durationDays: 60
  },
  {
    id: "diamantes",
    name: "Diamantes",
    price: 64983,
    dailyYield: 3000,
    image: "https://i.postimg.cc/1RFPK5sP/01-diamond-mining-nationalgeographic-694959-adapt-945-1.webp",
    description: "Extração aluvial refinada com rastreabilidade ética certificada de Kimberley, fornecendo matéria de alta condutividade tecnológica. Máx: 3 vezes por conta.",
    code5: "61384",
    durationDays: 60
  },
  {
    id: "pesquisa",
    name: "Pesquisa e Prospecção (Multiminerais)",
    price: 88977,
    dailyYield: 5498,
    image: "https://i.postimg.cc/v8t2ypzF/images-(7).jpg",
    description: "Prospecção satelitária profunda e mapeamento aeromagnético para aferição de novos depósitos verdes em Angola. Máx: 3 vezes por conta.",
    code5: "74921",
    durationDays: 60
  },
  {
    id: "logistica",
    name: "Logística e Escoamento",
    price: 149953,
    dailyYield: 8498,
    image: "https://i.postimg.cc/g0b3n0zD/images-(8).jpg",
    description: "Corredores multimodais, ferrovias e portos de escoamento rápido de granéis secos a partir do interior mineiro africano. Máx: 3 vezes por conta.",
    code5: "85203",
    durationDays: 60
  },
  {
    id: "sustentavel",
    name: "Mineração Sustentável",
    price: 249926,
    dailyYield: 15999,
    image: "https://i.postimg.cc/8505fyRn/images-(9).jpg",
    description: "Eletrificação de frotas pesadas, gestão circular de águas e reabilitação florestal contínua em áreas produtivas. Máx: 3 vezes por conta.",
    code5: "90382",
    durationDays: 60
  }
];

// Lista de Códigos de Operadoras / Países com bandeiras representadas em texto
const OPERATOR_CODES = [
  { code: "+244", country: "Angola", operator: "Unitel / Movicel" },
  { code: "+351", country: "Portugal", operator: "MEO / NOS / Vodafone" },
  { code: "+258", country: "Moçambique", operator: "Mcel / Vodacom" },
  { code: "+55", country: "Brasil", operator: "Vivo / Claro / Tim" },
  { code: "+238", country: "Cabo Verde", operator: "CV Móvel / Unitel T+" },
  { code: "+240", country: "Guiné Equatorial", operator: "Getesa" },
  { code: "+245", country: "Guiné-Bissau", operator: "Orange" },
  { code: "+239", country: "São Tomé e Príncipe", operator: "CST" }
];

export default function App() {
  // Locale / Idioma (Persistido via LocalStorage)
  const [lang, setLang] = useState<string>(
    localStorage.getItem("lang") || "pt"
  );

  // Estados de Auth
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [authStateMode, setAuthStateMode] = useState<"login" | "signup">(
    "login"
  );
  
  // Dados de Input para Login / Cadastro
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCodeSelected, setPhoneCodeSelected] = useState("+244");
  const [inviteIdInput, setInviteIdInput] = useState("");
  
  const [authError, setAuthError] = useState("");
  const [actionProcessing, setActionProcessing] = useState(false);

  // Estados dos Dados do Usuário conectado
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [myInvestments, setMyInvestments] = useState<UserInvestment[]>([]);
  const [myTransactions, setMyTransactions] = useState<UserTransaction[]>([]);
  const [myReferrals, setMyReferrals] = useState<UserProfile[]>([]);

  // Estado de Menus Laterais e Overlays
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<
    "packages" | "account" | "financing" | "operations" | "withdrawal" | "community" | "security" | "wallet" | "howitworks" | "affiliates" | "support" | "package_info_image" | "admin" | null
  >(null);
  const [threeDotsOpen, setThreeDotsOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Popups/Modais operacionais
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<InvestmentPlan | null>(null);
  const [buyButtonState, setBuyButtonState] = useState<"idle" | "loading" | "success" | "insufficient" | "error">("idle");
  const [withdrawalState, setWithdrawalState] = useState<"idle" | "verifying" | "routing" | "success" | "error">("idle");
  const [pinConfirmationModalMode, setPinConfirmationModalMode] = useState<"purchase" | "withdrawal" | null>(null);
  const [pinInputValue, setPinInputValue] = useState("");
  const [pinModalError, setPinModalError] = useState("");

  // Custom Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Estado para Administrador e Bloqueio Global
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [operationsBlocked, setOperationsBlocked] = useState(false);
  const [bannedViewActive, setBannedViewActive] = useState(false);

  // Estados de Admin Panel (UID: LGoyJO3HjsN2iSmWiIPhtILMYPu1)
  const [adminActiveTab, setAdminActiveTab] = useState<"operations" | "transactions" | "users">("operations");
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [adminSearchInput, setAdminSearchInput] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [selectedUserInvestments, setSelectedUserInvestments] = useState<any[]>([]);
  const [adminUserFilter, setAdminUserFilter] = useState<"all" | "with" | "without">("all");
  const [adminSelectedPlanToAdd, setAdminSelectedPlanToAdd] = useState("");
  const [adminBalanceChangeInput, setAdminBalanceChangeInput] = useState("");

  // Edit forms states for administrative purposes
  const [adminEditName, setAdminEditName] = useState("");
  const [adminEditPhone, setAdminEditPhone] = useState("");
  const [adminEditEmail, setAdminEditEmail] = useState("");
  const [adminEditBankName, setAdminEditBankName] = useState("");
  const [adminEditBankAccount, setAdminEditBankAccount] = useState("");
  const [adminEditBankHolder, setAdminEditBankHolder] = useState("");

  // Estados da Roleta fiduciária
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [rouletteRewardMsg, setRouletteRewardMsg] = useState<string | null>(null);

  // Mostrar/Ocultar Saldo & Informações
  const [showBalance, setShowBalance] = useState(false);
  
  // Mostrar/Ocultar IBANs de depósito (laranja por padrão)
  const [revealIbanBai, setRevealIbanBai] = useState(false);
  const [revealIbanBfa, setRevealIbanBfa] = useState(false);
  const [showIndexInfo, setShowIndexInfo] = useState(false);
  const [showSecurityBenefits, setShowSecurityBenefits] = useState(false);
  const [showCommunityBenefits, setShowCommunityBenefits] = useState(false);
  const [showWalletBenefits, setShowWalletBenefits] = useState(false);
  const [showOperationsBenefits, setShowOperationsBenefits] = useState(false);

  // Financiamento (Depósitos) com Sistema de duas Abas (Dados de Depósito vs Enviar Comprovativo)
  const [financingTab, setFinancingTab] = useState<"dados" | "comprovativo">("dados");
  const [financingCountry, setFinancingCountry] = useState("");
  const [financingProof, setFinancingProof] = useState("");
  const [financingStatusMsg, setFinancingStatusMsg] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [financingAmount, setFinancingAmount] = useState("");
  const [financingMethod, setFinancingMethod] = useState("");
  const [financingSenderName, setFinancingSenderName] = useState("");
  const [financingTxId, setFinancingTxId] = useState("");

  // Levantamentos (Withdrawals)
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("0.00");
  const [withdrawalMessage, setWithdrawalMessage] = useState("");

  // Segurança (Passwords Update)
  const [currentSecurityMode, setCurrentSecurityMode] = useState(false);
  const [newLoginPasswordInput, setNewLoginPasswordInput] = useState("");
  const [securityStatusMsg, setSecurityStatusMsg] = useState("");

  // Dados Bancários (Carteira de retirada)
  const [bankSettingsOpen, setBankSettingsOpen] = useState(false);
  const [bankNameInput, setBankNameInput] = useState("");
  const [bankAccountInput, setBankAccountInput] = useState("");
  const [bankHolderInput, setBankHolderInput] = useState("");

  // Tour / Notificação de boas-vindas ao entrar
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [claimedBonusStatus, setClaimedBonusStatus] = useState(false);

  // Real-time Yield Counter ticker
  const [accruedYields, setAccruedYields] = useState<Record<string, number>>({});

  // 1. Persistência de idioma e tradução de toda a plataforma via Google Translate
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setLang(selected);
    localStorage.setItem("lang", selected);

    // Salvar cookies "googtrans" lidos automaticamente pelo Google Translate.
    const cookieValue = `/pt/${selected}`;
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    
    // Suportar subdomínios se existirem
    try {
      const parts = window.location.hostname.split(".");
      if (parts.length >= 2) {
        const domain = `.${parts.slice(-2).join(".")}`;
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain};`;
      }
    } catch (err) {
      console.warn("Cookies error:", err);
    }

    // Recarregar ligeiramente a app para aplicar a tradução em todos os nós do DOM
    setTimeout(() => {
      window.location.reload();
    }, 120);
  };

  // 1.2. Carregar o motor do Google Translate dinamicamente nas costas da App
  useEffect(() => {
    if (!document.getElementById("google_translate_element")) {
      const div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.display = "none";
      document.body.appendChild(div);
    }

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement({
        pageLanguage: 'pt',
        layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.type = "text/javascript";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }
  }, []);

  // 1.5. Toggling the web background dynamically for the platform dashboard
  useEffect(() => {
    if (user) {
      document.body.classList.add("platform-bg");
      document.body.style.backgroundImage = "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')";
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.classList.remove("platform-bg");
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundAttachment = "";
    }
    return () => {
      document.body.classList.remove("platform-bg");
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundAttachment = "";
    };
  }, [user]);

  // 1.6. Auto-preencher titular da conta com o nome completo de registro
  useEffect(() => {
    if (userProfile?.fullName) {
      setBankHolderInput(userProfile.fullName);
    }
  }, [userProfile?.fullName]);

  // 2. Extrair ID de convite do link se presente com persistência local
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("invite");
    if (ref) {
      setInviteIdInput(ref);
      localStorage.setItem("referred_by", ref);
    } else {
      const savedRef = localStorage.getItem("referred_by");
      if (savedRef) {
        setInviteIdInput(savedRef);
      }
    }
  }, []);

  // 3. Monitoramento de conexão real com o Firebase Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Logado
        setIsAuthChecking(false);
      } else {
        // Deslogado
        setUserProfile(null);
        setMyInvestments([]);
        setMyTransactions([]);
        setMyReferrals([]);
        setIsAuthChecking(false);
      }
    });
    return unsubscribe;
  }, []);

  // 4. Listeners em Tempo Real do Firestore (Garante sem dados estáticos!)
  useEffect(() => {
    if (!user) return;

    setActionProcessing(true);

    // Perfil do Usuário
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile & { banned?: boolean };
        setUserProfile(data);
        
        const isAdmin = isUserAdmin(user, data);
        if (data.banned && !isAdmin) {
          setBannedViewActive(true);
        } else {
          setBannedViewActive(false);
        }

        // Se o usuário já logou e não completou o Tour, abre o Tour
        // Só mostramos uma vez por sessão
        const sessionKey = `tour_dismissed_${user.uid}`;
        if (!sessionStorage.getItem(sessionKey) && !isAdmin) {
          setShowWelcomeTour(true);
        }
      } else {
        // Cria perfil básico se não existir no Firestore
        const defaultProfile: UserProfile = {
          uid: user.uid,
          fullName: fullNameInput || "Investidor Anglo",
          email: user.email || "",
          phone: phoneInput ? `${phoneCodeSelected} ${phoneInput}` : "",
          phoneCode: phoneCodeSelected,
          inviteId: inviteIdInput || "",
          promoCode: user.uid.substring(0, 6).toUpperCase(),
          balance: 0,
          claimedWelcomeBonus: false,
          createdAt: new Date().toISOString()
        };
        setDoc(userRef, defaultProfile)
          .then(() => {
            setUserProfile(defaultProfile);
            setShowWelcomeTour(true);
          })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      setActionProcessing(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    // Subcoleção de Investimentos Ativos
    const investmentsRef = collection(db, "users", user.uid, "investments");
    const unsubInvestments = onSnapshot(investmentsRef, (snapshot) => {
      const plansList: UserInvestment[] = [];
      snapshot.forEach((doc) => {
        plansList.push({ id: doc.id, ...doc.data() } as UserInvestment);
      });
      setMyInvestments(plansList);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/investments`);
    });

    // Subcoleção de Transações
    const txRef = collection(db, "users", user.uid, "transactions");
    const unsubTx = onSnapshot(txRef, (snapshot) => {
      const list: UserTransaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as UserTransaction);
      });
      // Sort por mais recente
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyTransactions(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/transactions`);
    });

    return () => {
      unsubUser();
      unsubInvestments();
      unsubTx();
    };
  }, [user]);

  // 5. Query da comunidade (amigos indicados) em tempo real
  useEffect(() => {
    if (!userProfile) return;

    // Buscar todos utilizadores cuja indicação bate com nosso promoCode
    const referRef = collection(db, "users");
    const unsubReferrals = onSnapshot(referRef, (snapshot) => {
      const friends: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const u = doc.data() as UserProfile;
        if (u.inviteId === userProfile.promoCode) {
          friends.push(u);
        }
      });
      setMyReferrals(friends);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users`);
    });

    return () => unsubReferrals();
  }, [userProfile]);

  // --- CONTROLES DE ADMINISTRAÇÃO E BLOQUEIO GLOBAL ---
  const refreshSelectedUser = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const uData = snap.data();
        const invSnapshot = await getDocs(collection(db, "users", uid, "investments"));
        const invList: any[] = [];
        invSnapshot.forEach((d) => invList.push({ id: d.id, ...d.data() }));
        
        setSelectedUserDetail({ uid, ...uData, hasInvestments: invList.length > 0 });
        setSelectedUserInvestments(invList);
        
        setAdminEditName(uData.fullName || "");
        setAdminEditPhone(uData.phone || "");
        setAdminEditEmail(uData.email || "");
        setAdminEditBankName(uData.bankName || "");
        setAdminEditBankAccount(uData.bankAccount || "");
        setAdminEditBankHolder(uData.bankHolder || "");
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do usuário selecionado:", err);
    }
  };

  const fetchAllPendingTx = async (usersList: any[]) => {
    const allPending: any[] = [];
    await Promise.all(usersList.map(async (u) => {
      // Don't fetch transactions for the admin inside the general lists
      if (isUserAdmin(u)) {
        return;
      }
      try {
        const txSnapshot = await getDocs(collection(db, "users", u.uid, "transactions"));
        txSnapshot.forEach((docSnap) => {
          const tx = docSnap.data();
          if (tx.status === "pending") {
            allPending.push({ id: docSnap.id, userUid: u.uid, userFullName: u.fullName, ...tx });
          }
        });
      } catch (err) {
        console.error("Erro ao buscar tx para " + u.uid, err);
      }
    }));
    setPendingTransactions(allPending);
  };

  const loadAllAdminData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() });
      });
      list.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      const enrichWithInvestments = await Promise.all(list.map(async (u) => {
        try {
          const invSnapshot = await getDocs(collection(db, "users", u.uid, "investments"));
          const hasInvestments = !invSnapshot.empty;
          return { ...u, hasInvestments };
        } catch (err) {
          return { ...u, hasInvestments: false };
        }
      }));

      // Filter duplicates pointing to the same email, and remove administratives
      const uniqueUsersMap = new Map<string, any>();
      enrichWithInvestments.forEach((u) => {
        const email = (u.email || "").toLowerCase().trim();
        const uid = (u.uid || "").trim();

        // Skip administrator using unified isUserAdmin helper
        if (isUserAdmin({ uid, email }) || (userProfile && userProfile.uid === uid)) {
          return; 
        }

        // Deduplicate using email if available, otherwise fallback of UID to avoid dropping anyone
        const dedupeKey = email || uid;
        if (!dedupeKey) return;

        if (uniqueUsersMap.has(dedupeKey)) {
          const existing = uniqueUsersMap.get(dedupeKey);
          
          const isExistingPlaceholder = (existing.fullName === "Investidor Anglo" || !existing.fullName);
          const isCurrentReal = (u.fullName && u.fullName !== "Investidor Anglo");

          const existingHasAssets = existing.hasInvestments || (existing.balance > 0);
          const currentHasAssets = u.hasInvestments || (u.balance > 0);

          if (isExistingPlaceholder && isCurrentReal) {
            uniqueUsersMap.set(dedupeKey, u);
          } else if (currentHasAssets && !existingHasAssets) {
            uniqueUsersMap.set(dedupeKey, u);
          }
        } else {
          uniqueUsersMap.set(dedupeKey, u);
        }
      });
      
      const filteredList = Array.from(uniqueUsersMap.values());
      
      setAdminUsers(filteredList);
      await fetchAllPendingTx(enrichWithInvestments); // use original list for transactions to make sure no user transaction is overlooked
      return filteredList;
    } catch (err: any) {
      console.error("Erro ao carregar dados do admin:", err);
      const isPermissionErr = err?.message?.toLowerCase().includes("permission") || err?.code === "permission-denied" || String(err).toLowerCase().includes("permission");
      if (isPermissionErr) {
        alert(
          "⚠️ ATENÇÃO: ERRO DE PERMISSÃO NO FIRESTORE\nA lista de usuários não pôde ser carregada do Firebase porque o seu login de administrador não possui permissão de leitura global no painel de regras do Console do Firebase.\n\n" +
          "Para resolver, acesse o Console do Firebase -> Firestore Database -> Rules (Regras) e atualize-as com as regras do arquivo 'firestore.rules', autorizando seu UID 'LGoyJO3HjsN2iSmWiIPhtILMYPu1' como administrador."
        );
      } else {
        alert("Falha ao carregar lista de usuários: " + (err?.message || err));
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    const globalRef = doc(db, "globals", "operations");
    const unsubGlobal = onSnapshot(globalRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setOperationsBlocked(!!data?.blocked);
      } else {
        setOperationsBlocked(false);
      }
    }, (err) => {
      console.warn("Nenhum config global de operações encontrado, assumindo desbloqueado.");
    });
    return () => unsubGlobal();
  }, [user]);

  useEffect(() => {
    if (isUserAdmin(user, userProfile)) {
      loadAllAdminData();
    }
  }, [user, userProfile]);

  // 6. Contador incremental em tempo real para ganhos ativos acumulando
  useEffect(() => {
    if (myInvestments.length === 0) return;

    const timer = setInterval(() => {
      const now = new Date();
      const nextAccrued: Record<string, number> = {};

      myInvestments.forEach((inv) => {
        const lastCut = new Date(inv.lastCollectedAt || inv.createdAt);
        const diffMs = now.getTime() - lastCut.getTime();
        const diffSeconds = Math.max(0, diffMs / 1000);
        
        // Rendimento real-tempo: por segundo = dailyYield / 86400
        const ratePerSec = inv.dailyYield / 86400;
        nextAccrued[inv.id] = diffSeconds * ratePerSec;
      });

      setAccruedYields(nextAccrued);
    }, 1000);

    return () => clearInterval(timer);
  }, [myInvestments]);

  // 7. Funções de Autenticação Real
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setActionProcessing(true);

    if (!emailInput || !passwordInput) {
      setAuthError("Por favor, introduza email e senha.");
      setActionProcessing(false);
      return;
    }

    try {
      if (authStateMode === "login") {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      } else {
        // Validar senha de 6 dígitos
        if (passwordInput.length < 6) {
          setAuthError("A senha deve conter pelo menos 6 dígitos.");
          setActionProcessing(false);
          return;
        }
        if (!fullNameInput) {
          setAuthError("Por favor, preencha o seu nome completo (apelido).");
          setActionProcessing(false);
          return;
        }
        if (!phoneInput) {
          setAuthError("Introduza o seu contacto móvel.");
          setActionProcessing(false);
          return;
        }

        // Registrar no firebase auth
        const credentials = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        
        // Criar perfil fiduciário inicial
        const userRef = doc(db, "users", credentials.user.uid);
        const primaryProfile: UserProfile = {
          uid: credentials.user.uid,
          fullName: fullNameInput,
          email: emailInput,
          phone: `${phoneCodeSelected} ${phoneInput}`,
          phoneCode: phoneCodeSelected,
          inviteId: inviteIdInput || "",
          promoCode: credentials.user.uid.substring(0, 6).toUpperCase(),
          balance: 0,
          claimedWelcomeBonus: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, primaryProfile);
        setUserProfile(primaryProfile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setAuthError(getTranslation(lang, "errorLogin"));
      } else {
        setAuthError(err.message || "Falha ao processar operação fiduciária.");
      }
    } finally {
      setActionProcessing(false);
    }
  };

  // 8. Encomendar/Adquirir Plano Mineiro
  const processAcquisition = async () => {
    if (!userProfile || !selectedPlanDetail) return;

    // Verificar se o plano ultrapassa limites de aquisição
    const existingCount = myInvestments.filter(i => i.planId === selectedPlanDetail.id).length;
    if (selectedPlanDetail.id === "gratis") {
      if (existingCount >= 1) {
        showToast("O plano experimental grátis só pode ser adquirido 1 única vez por conta!", "error");
        return;
      }
    } else {
      if (existingCount >= 3) {
        showToast("Você já atingiu o limite máximo de 3 aquisições para este plano fiduciário!", "error");
        return;
      }
    }

    if (userProfile.balance < selectedPlanDetail.price) {
      showToast(getTranslation(lang, "insufficientBalance"), "error");
      return;
    }

    setActionProcessing(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      const nextBalance = userProfile.balance - selectedPlanDetail.price;

      // 1. Deduzir saldo do utilizador
      await updateDoc(userRef, {
        balance: Number(nextBalance.toFixed(2))
      });

      // 2. Registar em investments
      const investmentsColl = collection(db, "users", userProfile.uid, "investments");
      const newInv = {
        planId: selectedPlanDetail.id,
        planName: selectedPlanDetail.name,
        price: selectedPlanDetail.price,
        dailyYield: selectedPlanDetail.dailyYield,
        createdAt: new Date().toISOString(),
        lastCollectedAt: new Date().toISOString(),
        totalCollected: 0,
        durationDays: selectedPlanDetail.durationDays || 60
      };
      await addDoc(investmentsColl, newInv);

      // 3. Registar log de transação fiduciária
      const txColl = collection(db, "users", userProfile.uid, "transactions");
      await addDoc(txColl, {
        type: "purchase",
        amount: selectedPlanDetail.price,
        status: "completed",
        description: `Aquisição de Plano ${selectedPlanDetail.name}`,
        createdAt: new Date().toISOString()
      });

      setSelectedPlanDetail(null);
      showToast(getTranslation(lang, "acquiredSuccess"), "success");
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}/investments`);
      } catch (fErr: any) {
        showToast("Erro de gravação no servidor.", "error");
      }
    } finally {
      setActionProcessing(false);
    }
  };

  // 9. Recolher Ganhos do Trabalho no Centro de Operações
  const handleCollectYield = async (investment: UserInvestment) => {
    if (!userProfile) return;
    const accrued = accruedYields[investment.id] || 0;
    if (accrued < 1) {
      alert("Aguarde mais tempo de produção para recolher rendimentos fiduciários (Mín. 1 kz).");
      return;
    }

    setActionProcessing(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      const nextBalance = userProfile.balance + accrued;

      // Incrementar o saldo principal do indivíduo
      await updateDoc(userRef, {
        balance: Number(nextBalance.toFixed(2))
      });

      // Atualizar lastCollectedAt fiduciário e total acumulado no plano
      const invDocRef = doc(db, "users", userProfile.uid, "investments", investment.id);
      await updateDoc(invDocRef, {
        lastCollectedAt: new Date().toISOString(),
        totalCollected: Number((investment.totalCollected + accrued).toFixed(2))
      });

      // Guardar log na subcoleção de transações
      const txColl = collection(db, "users", userProfile.uid, "transactions");
      await addDoc(txColl, {
        type: "yield",
        amount: Number(accrued.toFixed(2)),
        status: "completed",
        description: `Colheita Diária ${investment.planName}`,
        createdAt: new Date().toISOString()
      });

    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}/investments/${investment.id}`);
    } finally {
      setActionProcessing(false);
    }
  };

  // 10. Submeter Levantamento Bancário
  const processWithdrawal = async () => {
    if (!userProfile || !withdrawalAmount) return;
    setWithdrawalMessage("");

    // Bloqueio regulatório fiduciário para o plano grátis
    const hasRentablePlan = myInvestments.some(inv => inv.planId !== "gratis");
    const hasFinishedFreePlan = myInvestments.some(inv => {
      if (inv.planId === "gratis") {
        const createdDate = new Date(inv.createdAt);
        const daysPassed = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysPassed >= 20;
      }
      return false;
    });

    if (myInvestments.length === 0) {
      setWithdrawalMessage("Aviso fiduciário: Transferência bloqueada! Você deve possuir pelo menos um plano de prospecção ativo para solicitar levantamentos.");
      return;
    }

    if (!hasRentablePlan && !hasFinishedFreePlan) {
      setWithdrawalMessage("Aviso fiduciário: Transferência bloqueada! Para realizar o levantamento com o plano experimental grátis, deves completar o ciclo de 20 dias do plano experimental grátis ou adquirir outro plano rentável (Cobre, Minério de Ferro, etc.).");
      return;
    }

    const valueNum = parseFloat(withdrawalAmount);
    if (isNaN(valueNum) || valueNum < 603.73) {
      setWithdrawalMessage(getTranslation(lang, "withdrawalMinError"));
      return;
    }

    if (userProfile.balance < valueNum) {
      setWithdrawalMessage("Saldo insuficiente.");
      return;
    }

    if (!userProfile.bankAccount) {
      setWithdrawalMessage("Configure os seus dados bancários primeiro no Centro de Conta!");
      return;
    }

    // Regras de Horários ao Fim de Semana
    const today = new Date();
    const day = today.getDay(); // 0 = Domingo, 6 = Sábado
    if (day === 0 || day === 6) {
      const hours = today.getHours();
      const mins = today.getMinutes();
      const minsTotal = hours * 60 + mins;
      const startLimit = 12 * 60 + 30; // 12h30
      const endLimit = 13 * 60 + 30; // 13h30
      if (minsTotal < startLimit || minsTotal > endLimit) {
        setWithdrawalMessage(getTranslation(lang, "withdrawalLimitWeekend"));
        return;
      }
    }

    setActionProcessing(true);
    setWithdrawalState("verifying");

    // Phase 1: Verify IBAN details
    setTimeout(() => {
      setWithdrawalState("routing");

      // Phase 2: Route request transfer to gateway fiduciario
      setTimeout(async () => {
        try {
          // Computar as taxas de desarmamento:
          // Taxa Anglo: 10%, Taxa fiduciária operação: 5%, Manutenção: 2% (Total 17%)
          const discount = valueNum * 0.17;
          const net = valueNum - discount;

          const userRef = doc(db, "users", userProfile.uid);
          const nextBalance = userProfile.balance - valueNum;

          // 1. Debitar valor bruto do saldo
          await updateDoc(userRef, {
            balance: Number(nextBalance.toFixed(2))
          });

          // 2. Registar em transações como Pendente para validação humana da Anglo
          const txColl = collection(db, "users", userProfile.uid, "transactions");
          await addDoc(txColl, {
            type: "withdrawal",
            amount: valueNum,
            netAmount: Number(net.toFixed(2)),
            status: "pending",
            description: `Levantamento (${userProfile.bankName || "Banco"})`,
            createdAt: new Date().toISOString()
          });

          setWithdrawalState("success");

          // Finalize
          setTimeout(() => {
            setWithdrawalAmount("");
            showToast(getTranslation(lang, "withdrawalSuccess"), "success");
            setActiveOverlay(null);
            setWithdrawalState("idle");
            setActionProcessing(false);
          }, 1500);

        } catch (err) {
          console.error(err);
          setWithdrawalState("error");
          setActionProcessing(false);
          try {
            handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}/transactions`);
          } catch (fErr: any) {
            setWithdrawalMessage("Falha de processamento fiduciário no servidor.");
          }
          setTimeout(() => {
            setWithdrawalState("idle");
          }, 3000);
        }
      }, 1500);

    }, 1500);
  };

  // Girar a Roleta fiduciária
  const handleSpinRoulette = async () => {
    if (!userProfile) return;
    if (myInvestments.length === 0) {
      showToast("A roleta está desativada. Adquira um plano primeiro para ter rendimentos!", "error");
      return;
    }

    const todayDateStr = new Date().toISOString().split("T")[0];
    const spinCount = userProfile.lastSpinDate === todayDateStr ? (userProfile.spinCount || 0) : 0;

    if (spinCount >= 2) {
      showToast("Já realizou as suas 2 rotações diárias de roleta fiduciária (2/2)!", "error");
      return;
    }

    if (isSpinning) return;

    // Calcular o total de ganhos diários com base nos investimentos ativos
    const totalDailyYield = myInvestments.reduce((sum, inv) => sum + inv.dailyYield, 0);
    const prize = totalDailyYield * 0.5;

    setIsSpinning(true);
    setRouletteRewardMsg(null);

    // Gerar um ângulo de rotação aleatório mas bem distribuído
    const spins = 5; 
    const nextAngle = spinAngle + 360 * spins + Math.floor(Math.random() * 320) + 40;
    setSpinAngle(nextAngle);

    setTimeout(async () => {
      setIsSpinning(false);
      const nextSpinCount = spinCount + 1;

      try {
        const userRef = doc(db, "users", userProfile.uid);
        const nextBalance = userProfile.balance + prize;
        
        await updateDoc(userRef, {
          balance: Number(nextBalance.toFixed(2)),
          spinCount: nextSpinCount,
          lastSpinDate: todayDateStr
        });

        const txColl = collection(db, "users", userProfile.uid, "transactions");
        await addDoc(txColl, {
          type: "yield",
          amount: Number(prize.toFixed(2)),
          status: "completed",
          description: `Giro fiduciário Anglo (Rotação #${nextSpinCount} - 50% do Ganho Diário)`,
          createdAt: new Date().toISOString()
        });

        setRouletteRewardMsg(`Parabéns! Ganhou ${prize.toFixed(2)} kz fiduciários! (Giro #${nextSpinCount} de 50% do Yield)`);
        showToast(`Giro realizado com sucesso! +${prize.toFixed(2)} kz creditados.`, "success");
      } catch (err) {
        console.error(err);
        showToast("Erro ao processar o ganho da roleta.", "error");
      }
    }, 3000); // 3 seconds spin effect
  };

  // 11. Salvar dados bancários (Carteira de retirada)
  const handleSaveBankDetails = async () => {
    if (!userProfile || !bankNameInput || !bankAccountInput || !bankHolderInput) return;
    setActionProcessing(true);
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        bankName: bankNameInput,
        bankAccount: bankAccountInput,
        bankHolder: bankHolderInput
      });
      setBankSettingsOpen(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
    } finally {
      setActionProcessing(false);
    }
  };

  // 12. Atualizar Senhas (Segurança e privacidade)
  const handleUpdateSecurity = async () => {
    if (!userProfile) return;
    setSecurityStatusMsg("");
    setActionProcessing(true);

    try {
      // Atualizar login password (Firebase Auth) se preenchido
      if (newLoginPasswordInput) {
        if (newLoginPasswordInput.length < 6) {
          setSecurityStatusMsg("A nova senha deve ter no mínimo 6 dígitos.");
          setActionProcessing(false);
          return;
        }
        await updatePassword(auth.currentUser!, newLoginPasswordInput);
      }

      setSecurityStatusMsg(getTranslation(lang, "secSuccess"));
      setNewLoginPasswordInput("");
    } catch (err: any) {
      console.error(err);
      setSecurityStatusMsg(`Erro: ${err.message || "Ação de alteração negada."}`);
    } finally {
      setActionProcessing(false);
    }
  };

  // 13. Submeter comprovativo de depósito (Financiamento)
  const handleFinancingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !financingProof || !financingCountry || !financingAmount) {
      showToast("Por favor, preencha o valor depositado e anexe seu comprovativo.", "error");
      return;
    }
    setFinancingStatusMsg("");
    setActionProcessing(true);

    try {
      const txColl = collection(db, "users", userProfile.uid, "transactions");
      const amtNum = parseFloat(financingAmount) || 0;
      await addDoc(txColl, {
        type: "deposit",
        amount: amtNum,
        status: "pending",
        proofUrl: financingProof,
        country: financingCountry,
        senderName: financingSenderName || "",
        paymentMethod: financingMethod || "",
        transactionId: financingTxId || "",
        description: `Depósito fiduciário via ${financingMethod || "Banco"} (${financingCountry}) - Ref: ${financingTxId || "N/A"}. Nome: ${financingSenderName || "Não especificado"}. Valor Autodeclarado: ${amtNum.toLocaleString()} kz.`,
        createdAt: new Date().toISOString()
      });

      setFinancingStatusMsg(getTranslation(lang, "proofSubmittedSuccess"));
      setFinancingProof("");
      setProofFileName("");
      setFinancingAmount("");
      setFinancingMethod("");
      setFinancingSenderName("");
      setFinancingTxId("");
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}/transactions`);
    } finally {
      setActionProcessing(false);
    }
  };

  // Copiar link de comunidade
  const handleCopyLink = () => {
    if (!userProfile) return;
    const shareLink = `${window.location.origin}?ref=${userProfile.promoCode}`;
    navigator.clipboard.writeText(shareLink);
    alert(getTranslation(lang, "copiedReferral"));
  };

  // Render da Validação de Carregamento Geral (Sincronizado em Tema Escuro Coeso)
  if (isAuthChecking) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center space-y-4 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
        id="loading-root"
      >
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <TechSpinner size="lg" />
          <span className="text-xs font-mono text-white/80 uppercase tracking-widest animate-pulse">
            CONECTANDO AO SISTEMA ANGLO COBRE...
          </span>
        </div>
      </div>
    );
  }

  // --- SE DESLOGADO: TELA DE AUTH ---
  if (!user) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed flex flex-col justify-between py-6 px-4 text-white" 
        style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
        id="auth-view"
      >
        
        {/* Top Header - Language and Contacts */}
        <div className="max-w-md w-full mx-auto flex justify-between items-center mb-6" id="auth-util-row">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900/80 backdrop-blur-md p-2 rounded-[12px] border border-white/10 shadow-lg">
            <Globe className="w-3.5 h-3.5 text-green-400" />
            <select
              value={lang}
              onChange={handleLanguageChange}
              className="bg-transparent border-none outline-none focus:ring-0 text-xs font-sans text-white cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white font-bold"
              id="language-select"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* Atendimento 3 pontos */}
          <div className="relative group">
            <button className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-slate-900/80 backdrop-blur-md hover:bg-slate-800/80 active:scale-95 border border-white/10 text-white font-bold transition-all cursor-pointer" id="support-trigger">
              <span className="font-bold tracking-tight text-lg -mt-1 text-green-400">...</span>
            </button>
            <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-md rounded-[12px] shadow-2xl border border-white/10 p-4 hidden group-hover:block hover:block z-50 transition-all duration-300">
              <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2 font-mono pb-1.5 border-b border-white/10">
                ATENDIMENTO TRUSTEE JOYCE
              </h4>
              <div className="space-y-2 flex flex-col text-xs font-medium text-left">
                <a
                  href="https://t.me/JoyceMaoi12"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-white/5 hover:text-green-400 transition"
                  id="link-support-joyce"
                >
                  Dificuldade ao criar conta? Falar com Joyce
                </a>
                <a
                  href="https://t.me/+lLcHxsG0SmMyNjc0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-white/5 hover:text-green-400 transition"
                  id="link-support-telegram"
                >
                  Grupo Oficial do Telegram
                </a>
                <a
                  href="https://chat.whatsapp.com/EEsv03mwEPVLJonKhhIyTh?s=cl&p=a&ilr=4&amv=3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-green-500/10 hover:text-green-400 transition"
                  id="link-support-whatsapp"
                >
                  Grupo de Suporte Whatsapp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Box Center (Glassmorphism dark card) */}
        <div className="w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-md rounded-[16px] shadow-2xl overflow-hidden border border-white/10 flex flex-col mb-auto p-6 space-y-6">
          
          {/* Logo Frame: replaced with custom postimg visual logo and slightly enlarged */}
          <div className="p-0 flex justify-center bg-slate-950/60 rounded-[14px] border border-white/10 max-h-56 overflow-hidden w-full relative group" id="auth-image-frame">
            <img
              src="/src/assets/images/mining_start_visual_1781299449661.jpg"
              alt="Anglo American Logo"
              className="object-cover h-36 w-full rounded-[10px] hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              id="header-hero-img"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent flex flex-col justify-end p-3.5 text-center">
              <span className="text-white text-xs font-black tracking-widest uppercase font-sans">Bem-Vindo à Anglo American</span>
              <span className="text-green-400 text-[10px] font-bold font-mono uppercase tracking-wider mt-0.5">Acesso Seguro Autorizado</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-extrabold text-white tracking-tight" id="auth-title">
              {authStateMode === "login"
                ? getTranslation(lang, "loginTitle")
                : getTranslation(lang, "registerTitle")}
            </h1>
            <p className="text-[9px] text-[#007bff] tracking-widest uppercase font-mono mt-1 font-extrabold">
              ANGLO AMERICAN ENERGY & COBRE
            </p>
          </div>

          {authError && (
            <div className="bg-red-500/10 text-red-400 text-xs py-2 px-4 rounded-[8px] border border-red-500/15 text-center font-bold font-mono">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authStateMode === "signup" && (
              <>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder={getTranslation(lang, "fullNamePlaceholder")}
                    className="w-full bg-slate-950/50 border border-white/10 focus:border-green-500 rounded-[12px] py-3 pl-10 pr-4 text-xs font-semibold outline-none transition text-white placeholder-gray-500 focus:ring-0"
                    id="signup-fullname"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-2/5 relative bg-slate-950/50 border border-white/10 rounded-[12px] flex items-center px-2">
                    <span className="text-gray-400 absolute left-2">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <select
                      value={phoneCodeSelected}
                      onChange={(e) => setPhoneCodeSelected(e.target.value)}
                      className="w-full bg-transparent pl-5 border-none outline-none text-[11px] font-sans text-white font-bold cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white font-bold focus:ring-0"
                      id="signup-phonecode-select"
                    >
                      {OPERATOR_CODES.map((op) => (
                        <option key={op.code} value={op.code}>
                          {op.code} ({op.country})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder={getTranslation(lang, "phonePlaceholder")}
                    className="w-3/5 bg-slate-950/50 border border-white/10 focus:border-green-500 rounded-[12px] py-3 px-4 text-xs font-bold outline-none transition text-white placeholder-gray-500 focus:ring-0"
                    id="signup-phone"
                    required
                  />
                </div>
              </>
            )}

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={getTranslation(lang, "emailPlaceholder")}
                className="w-full bg-slate-950/50 border border-white/10 focus:border-green-500 rounded-[12px] py-3 pl-10 pr-4 text-xs font-semibold outline-none transition text-white placeholder-gray-500 focus:ring-0"
                id="auth-email-input"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={getTranslation(lang, "passwordPlaceholder")}
                className="w-full bg-slate-950/50 border border-white/10 focus:border-green-500 rounded-[12px] py-3 pl-10 pr-4 text-xs font-semibold outline-none transition text-white placeholder-gray-500 focus:ring-0"
                id="auth-password-input"
                required
              />
            </div>

            {authStateMode === "signup" && (
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Gift className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={inviteIdInput}
                  onChange={(e) => setInviteIdInput(e.target.value)}
                  placeholder={getTranslation(lang, "inviteCodePlaceholder")}
                  className="w-full bg-slate-950/50 border border-white/10 focus:border-green-500 rounded-[12px] py-3 pl-10 pr-4 text-xs font-semibold outline-none transition text-white placeholder-gray-500 focus:ring-0"
                  id="signup-inviteid"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={actionProcessing}
              className="w-full bg-slate-800 hover:bg-slate-755 text-gray-300 font-bold py-3 px-4 rounded-[12px] text-xs transition-all active:scale-[0.97] flex items-center justify-center space-x-2 cursor-pointer shadow border border-white/10"
              id="auth-submit-btn"
            >
              {actionProcessing ? (
                <TechSpinner size="sm" />
              ) : (
                <span>
                  {authStateMode === "login"
                    ? getTranslation(lang, "loginBtn")
                    : getTranslation(lang, "registerBtn")}
                </span>
              )}
            </button>
          </form>

          <div className="text-center pt-1.5">
            <button
              onClick={() => {
                setAuthStateMode(authStateMode === "login" ? "signup" : "login");
                setAuthError("");
              }}
              className="text-xs text-green-400 font-bold hover:underline cursor-pointer active:scale-95 transition-all"
              id="toggle-auth-mode"
            >
              {authStateMode === "login"
                ? getTranslation(lang, "noAccount")
                : getTranslation(lang, "hasAccount")}
            </button>
          </div>

        </div>

        {/* --- INFO EXTRA E PERGUNTAS FREQUENTES (FAQ) --- */}
        <div className="max-w-md w-full mx-auto space-y-4 mb-6">
          
          {/* Caixa de Outras Informações Fiduciárias */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-[16px] border border-white/10 p-5 text-left space-y-3.5 shadow-2xl">
            <h3 className="text-xs font-black font-mono text-green-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Info className="w-4 h-4 text-green-400" /> Operações Governamentais e Transição
            </h3>
            <p className="text-[11px] text-gray-300 leading-relaxed font-light">
              Pertencemos ao consórcio internacional dedicado à prospecção cooperativa de jazigos de cobre e transição sustentável de energia. Todas as nossas minas associadas são regulamentadas na República de Angola sob o <strong className="text-white font-extrabold underline">Alvará de Lavra nº 402/2026</strong>. 
            </p>
            <p className="text-[11px] text-gray-300 leading-relaxed font-light">
              Gerido fiduciariamente pelo trust Joyce, o sistema providencia estabilidade total contra flutuações fiscais, processando o seu faturamento de forma célere com o suporte dos maiores bancos comerciais nacionais (BAI, BFA, BIC).
            </p>
          </div>

          {/* Secção de Perguntas Frequentes (FAQ Accordion) */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-[16px] border border-white/10 p-5 text-left space-y-3 shadow-2xl">
            <h3 className="text-xs font-black font-mono text-green-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5 mb-2">
              <HelpCircle className="w-4 h-4 text-green-400" /> Perguntas Frequentes (FAQ)
            </h3>

            {/* List of FAQ questions */}
            <div className="space-y-2">
              {[
                {
                  q: "Como funciona o Plano Experimental Grátis de 20 dias?",
                  a: "O Plano Experimental de teste é concedido no momento do registo. Ele tem a duração exata de 20 dias operacionais, gerando 50,00 kz por dia (1.000 kz totais) para que possa avaliar sem riscos a performance do nosso motor técnico."
                },
                {
                  q: "A quem pertence a custódia das transações?",
                  a: "Toda a custódia fiduciária coletada é encriptada criptograficamente e processada com regência direta de Joyce e equipe oficial. Nenhuma informação bancária ou PIN de segurança pode ser alterado por terceiros após a gravação de salvamento antifraude."
                },
                {
                  q: "Qual é o prazo para os levantamentos de saldo?",
                  a: "Os levantamentos são processados após auditoria de conformidade direto na conta do banco angolano de sua preferência. O tempo estimado de compensação varia de poucos instantes a 48 horas úteis regulamentares."
                },
                {
                  q: "Posso subscrever mais de um lote mineiro?",
                  a: "Sim, os utilizadores podem possuir múltiplos lotes ativos para acelerar a acumulação fiduciária. O limite depende exclusivamente das regras de aquisição de cada pacote listado na tabela geral de minas de transição."
                }
              ].map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className="border-b border-white/5 pb-2 last:border-none last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex justify-between items-center py-2 text-left text-[11px] font-extrabold text-white hover:text-green-400 cursor-pointer transition-colors duration-250 focus:outline-none"
                    >
                      <span className="pr-3 leading-snug">{item.q}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-green-400 transform transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-[10px] text-gray-300 leading-relaxed font-light py-1 pr-1 pl-0.5 bg-slate-950/25 rounded p-2 border-l-2 border-green-500/40">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Support Callout Footnotes */}
        <div className="text-center text-[10px] text-gray-400 font-medium space-y-1 bg-slate-950/40 backdrop-blur-md py-4 rounded-xl border border-white/5 max-w-md w-full mx-auto shadow-lg">
          <p>© 2026 Anglo American, PLC. All Rights Reserved.</p>
          <div className="flex justify-center space-x-3 text-green-400 font-bold mt-1">
            <a href="https://t.me/JoyceMaoi12" target="_blank" rel="noopener noreferrer" className="hover:underline">Suporte Joyce</a>
            <span className="text-white/20">•</span>
            <a href="https://chat.whatsapp.com/EEsv03mwEPVLJonKhhIyTh" target="_blank" rel="noopener noreferrer" className="hover:underline">Canais Fiduciários</a>
          </div>
        </div>

      </div>
    );
  }


  // --- SE BANIDO: TELA DE BLOQUEIO INTERACTIVA ---
  if (user && bannedViewActive) {
    return (
      <div 
        className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-6 px-4 text-white font-sans"
        style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="w-full max-w-md mx-auto bg-slate-950/85 backdrop-blur-md rounded-[16px] shadow-2xl p-6 border border-red-500/35 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase text-red-400 font-mono tracking-wider">Acesso Suspenso Administrativamente</h2>
            <p className="text-xs text-gray-300 leading-relaxed font-light">
              Esta conta foi suspensa permanentemente de nossa plataforma devido a violações detectadas nos termos de cooperação fiduciária.
            </p>
          </div>
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-left text-[10px] text-red-200 leading-relaxed font-mono space-y-1">
            <div><strong>ID de Rastreio:</strong> {user.uid}</div>
            <div><strong>Status da Conta:</strong> Banido / Inativo</div>
            <div><strong>Administração:</strong> Anglo American Cooperativa</div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-6 rounded-xl uppercase font-mono text-xs transition shadow-md cursor-pointer"
          >
            Sair e Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // --- TELA DO DASHBOARD PRINCIPAL (INDEX CONTROLLER) ---
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed flex flex-col justify-between" 
      style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
      id="app-dashboard-container"
    >
      
      {/* Tour Notificação de Boas-vindas (Modal multi-etapa) */}
      {showWelcomeTour && userProfile && (
        <MultiStepWelcome
          userId={userProfile.uid}
          isNewUser={!userProfile.claimedWelcomeBonus}
          onClose={(claimed) => {
            setShowWelcomeTour(false);
            const sessionKey = `tour_dismissed_${userProfile.uid}`;
            sessionStorage.setItem(sessionKey, "true");
          }}
        />
      )}

      {/* Main Top Header with backdrop background image and no transparency */}
      <header 
        className="h-16 bg-cover bg-center bg-no-repeat border-b border-white/20 px-6 sticky top-0 z-30 flex items-center justify-between animate-fade-in text-white shadow-md" 
        style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
        id="landing-main-header"
      >
        <div className="flex items-center space-x-3">
          {/* Header limpo, sem exibir o nome ou imagem da marca */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Real-time Status and balance indicator inside the header */}
          <div className="hidden md:flex bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-[12px] border border-white/20 items-center space-x-3">
            <span className="text-[10px] text-gray-200 font-mono font-bold uppercase tracking-wider">SALDO ANGLO</span>
            <span className="text-orange-500 font-extrabold text-lg">
              {userProfile?.balance?.toLocaleString("pt-AO", {
                style: "currency",
                currency: "AOA",
                minimumFractionDigits: 2
              }).replace("AOA", "Kz")}
            </span>
          </div>

          {/* Selector de Línguas Minimalista */}
          <div className="flex items-center space-x-1 border border-white/20 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-[12px] text-xs font-semibold text-white">
            <Globe className="w-3.5 h-3.5 text-white/70" />
            <select
              value={lang}
              onChange={handleLanguageChange}
              className="bg-transparent border-none outline-none text-[10px] text-white font-sans cursor-pointer focus:ring-0 [&>option]:text-gray-800"
              id="top-language-selector"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Menu de 3 Pontinhos */}
          <div className="relative">
            <button
              onClick={() => setThreeDotsOpen(!threeDotsOpen)}
              className="p-1.5 rounded-[12px] border border-white/20 hover:bg-white/20 text-white transition focus:outline-none bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-pointer"
              id="three-dots-trigger"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {threeDotsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900/90 backdrop-blur-md rounded-[12px] custom-shadow border border-white/10 py-2 z-40 text-left font-sans text-xs text-white">
                <button
                  onClick={() => {
                    setActiveOverlay("community");
                    setThreeDotsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 hover:bg-white/10 text-white font-bold flex items-center gap-2.5 text-left cursor-pointer"
                  id="dots-community"
                >
                  <Users className="w-4 h-4 text-[#28a745]" /> Minha Comunidade
                </button>
                <button
                  onClick={() => {
                    setActiveOverlay("security");
                    setThreeDotsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 hover:bg-white/10 text-white font-bold flex items-center gap-2.5 text-left cursor-pointer"
                  id="dots-security"
                >
                  <Lock className="w-4 h-4 text-[#ffc107]" /> Segurança e Privacidade
                </button>
                <button
                  onClick={() => {
                    setActiveOverlay("wallet");
                    setThreeDotsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 hover:bg-white/10 text-white font-bold flex items-center gap-2.5 text-left cursor-pointer"
                  id="dots-wallet"
                >
                  <CreditCard className="w-4 h-4 text-[#007bff]" /> Carteira de Retirada (Dados Bancários)
                </button>
                <button
                  onClick={() => {
                    setActiveOverlay("affiliates");
                    setThreeDotsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 hover:bg-white/10 text-white font-bold flex items-center gap-2.5 text-left cursor-pointer"
                  id="dots-affiliates"
                >
                  <Award className="w-4 h-4 text-[#ff5722]" /> Centro de Afilhados fiduciário
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-[12px] border border-white/20 hover:bg-white/20 text-white transition focus:outline-none bg-white/10 backdrop-blur-sm cursor-pointer"
            id="sidebar-trigger"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-4">
        
        {/* Banner Institucional da Anglo American */}
        <div className="w-full h-48 rounded-[12px] overflow-hidden border border-white/10 shadow-md relative group">
          <img
            src="/src/assets/images/anglo_banner_1781296191987.jpg"
            alt="Anglo American Logo Banner"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter blur-[2px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent flex flex-col justify-end p-5 text-left">
            <span className="text-white text-[10px] font-bold tracking-widest uppercase font-mono bg-[#007bff] px-2 py-0.5 rounded w-max mb-1.5">Consórcio Fiduciário</span>
            <h3 className="text-white text-base font-bold tracking-wide font-sans leading-tight">Painel de Controlo Mineiro Anglo Cobre</h3>
            <p className="text-gray-300 text-[10px] mt-1 font-mono font-light">Prospecção e faturamento real de metais estratégicos em Angola.</p>
          </div>
        </div>

        {/* Card de Saldo Principal para Mobile e Desktop — Grande e em Laranja */}
        <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 shadow-lg border border-white/10 flex flex-col sm:flex-row justify-between items-center text-white font-sans animate-fade-in gap-3" id="home-main-balance-card">
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest font-mono block">
                Saldo Livre Disponível (Anglo Cobre)
              </span>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-400 hover:text-white transition p-1 rounded-full cursor-pointer hover:bg-white/10"
                title={showBalance ? "Ocultar Saldo" : "Mostrar Saldo"}
                type="button"
              >
                {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-orange-500 font-mono tracking-tight" id="home-balance-display">
              {showBalance ? (
                userProfile?.balance?.toLocaleString("pt-AO", {
                  style: "currency",
                  currency: "AOA",
                  minimumFractionDigits: 2
                }).replace("AOA", "Kz")
              ) : (
                "••••••••"
              )}
            </h2>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveOverlay("financing")}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition duration-150 shadow-md font-mono flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Depositar
            </button>
            <button
              onClick={() => setActiveOverlay("withdrawal")}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition duration-150 shadow-md font-mono flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> Sacar
            </button>
          </div>
        </div>

        {/* Botão para Entrar e Ver Informações Globais (Para não ficarem expostas logo de cara) */}
        <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-4 border border-white/10 text-center font-sans text-white animate-fade-in relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-left space-y-0.5">
              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest font-mono block">Documentação Anglo</span>
              <p className="text-[10px] text-gray-400">Regulamentos, taxas fiduciárias, prazos, vantagens e restrições operacionais.</p>
            </div>
            <button
              onClick={() => setShowIndexInfo(!showIndexInfo)}
              className="bg-blue-600 hover:bg-blue-500 font-bold text-[10px] py-2 px-4 rounded-xl uppercase font-mono transition-all duration-300 w-full sm:w-auto text-center cursor-pointer flex items-center justify-center gap-1.5"
              type="button"
            >
              <Info className="w-3.5 h-3.5" />
              {showIndexInfo ? "Ocultar Informações" : "Entrar e Ver"}
            </button>
          </div>

          {showIndexInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-4 pt-4 border-t border-white/10 text-left space-y-4 font-sans text-white overflow-hidden" 
              id="index-corp-info-block"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Vantagens do Plano de Cobre */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-2 text-white">
                  <span className="text-[10px] font-extrabold text-white font-mono tracking-wider block">✓ VANTAGENS E BENEFÍCIOS MINEIROS</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-200 leading-relaxed">
                    <li><strong>Rentabilidade ao Segundo:</strong> O algoritmo de sincronização distribui juros do cobre diretamente na carteira operacional.</li>
                    <li><strong>Garantia Coberta por Joyce:</strong> Segurado e garantido pelas reservas físicas mineiras registradas em Luanda.</li>
                    <li><strong>Contrato Curto de 60 Dias:</strong> Prazo favorável e liquidez otimizada para retirada sem trancas pós-ciclo.</li>
                    <li><strong>Saques Rápidos BAI/BFA:</strong> Resgates auditados e liberados em canais nacionais com alta prioridade.</li>
                  </ul>
                </div>

                {/* Desvantagens e Condições Gerais */}
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-2 text-white">
                  <span className="text-[10px] font-extrabold text-white font-mono tracking-wider block">⚠ CONDIÇÕES E RESTRIÇÕES OPERACIONAIS</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-200 leading-relaxed">
                    <li><strong>Limites Fiduciários de Retirada:</strong> O volume diário disponível para disponível de resgate depende diretamente do seu pacote mineiro.</li>
                    <li><strong>Dados Bancários Trancados:</strong> Uma vez salvos, as coordenadas não admitem alteração direta por segurança contra intrusões.</li>
                    <li><strong>Apenas 1 Saque por Dia:</strong> Restrito a um levantamento a cada 24 horas para preservar o lote de compensação fiduciário.</li>
                    <li><strong>Taxas Interbancárias:</strong> Cobranças de transferência sob a rede EMIS para saques de bancos secundários.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </main>

      {/* FOOTER REMOVIDO */}

      {/* --- SLIDE SIDEBAR HAMBURGER --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-40 flex justify-end" id="sidebar-overlay">
          <div className="bg-slate-900/95 backdrop-blur-md w-80 h-full p-6 flex flex-col justify-between border-l border-white/10 text-white animate-slide-left relative z-50">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-sm text-blue-400 tracking-wider font-sans">
                  ANGLO OPERAÇÕES
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                  id="close-sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar options */}
              <nav className="space-y-2 flex flex-col">
                <button
                  onClick={() => {
                    setActiveOverlay("packages");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-pacotes-nav"
                >
                  <Briefcase className="w-4 h-4 text-blue-400" /> Pacotes de Aquisição
                </button>

                <button
                  onClick={() => {
                    setActiveOverlay("account");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-centro-nav"
                >
                  <User className="w-4 h-4 text-purple-400" /> Centro de Conta
                </button>

                <button
                  onClick={() => {
                    setActiveOverlay("financing");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-deposito-nav"
                >
                  <PlusCircle className="w-4 h-4 text-green-400" /> Financiamento da Conta
                </button>

                <button
                  onClick={() => {
                    setActiveOverlay("operations");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-operacoes-nav"
                >
                  <TrendingUp className="w-4 h-4 text-green-400" /> Centro de Operações
                </button>

                <button
                  onClick={() => {
                    setActiveOverlay("howitworks");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-howitworks-nav"
                >
                  <BookOpen className="w-4 h-4 text-green-400" /> Como Funciona & Garantia
                </button>

                <button
                  onClick={() => {
                    setActiveOverlay("withdrawal");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-transferencia-nav"
                >
                  <CreditCard className="w-4 h-4 text-red-500" /> Transferência para Conta
                </button>

                <button
                  onClick={() => {
                    setActiveOverlay("support");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-support-nav"
                >
                  <HelpCircle className="w-4 h-4 text-[#ffc107]" /> Apoio &amp; Ajuda
                </button>

                <button
                  onClick={() => {
                    setActiveOverlay("package_info_image");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-bold text-xs text-white border border-white/5 transition flex items-center gap-2.5 cursor-pointer"
                  id="opt-package-info-image-nav"
                >
                  <Briefcase className="w-4 h-4 text-orange-500" /> Informações dos Pacotes
                </button>

                {isUserAdmin(user, userProfile) && (
                  <button
                    onClick={() => {
                      setActiveOverlay("admin");
                      setIsSidebarOpen(false);
                      loadAllAdminData();
                    }}
                    className="w-full p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-left font-bold text-xs text-white transition flex items-center gap-2.5 cursor-pointer relative overflow-hidden"
                    id="opt-admin-nav"
                  >
                    <div className="absolute top-0 right-0 p-1 px-1.5 bg-red-600 text-[7px] font-black uppercase tracking-widest font-mono text-white">ROOT</div>
                    <Lock className="w-4 h-4 text-red-400" /> Painel Geral Admin
                  </button>
                )}

                {/* Identificação do Operador Fiduciário */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-white/10 mt-1 font-mono text-left space-y-1">
                  <span className="text-[8px] text-gray-400 font-bold block uppercase tracking-wider">Identificador Único (ID):</span>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-yellow-500 font-extrabold select-all leading-tight block truncate">
                      {userProfile?.uid ? userProfile.uid.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase() : "N/A"}
                    </span>
                    {userProfile?.uid && (
                      <button
                        onClick={() => {
                          const shortId = userProfile.uid.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase();
                          navigator.clipboard.writeText(shortId);
                          showToast(`ID ${shortId} copiado!`, "success");
                        }}
                        className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1 rounded text-[8px] font-sans font-bold transition-all border-none cursor-pointer"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                </div>
              </nav>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                signOut(auth);
                setIsSidebarOpen(false);
              }}
              className="w-full p-3 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-left font-semibold text-xs transition flex items-center gap-2.5 cursor-pointer"
              id="sidebar-logout"
            >
              <LogOut className="w-4 h-4 text-red-500" /> {getTranslation(lang, "logoutBtn")}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 100% SCREEN OVERLAYS (Pacotes, Contas, Depósitos, Tarefas, Levantamentos) */}
      {/* ========================================================= */}

      {/* --- OVERLAY: PACOTES DE AQUISIÇÃO --- */}
      {activeOverlay === "packages" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="packages-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Pacotes de Aquisição</span>
            <button
              onClick={() => {
                setActiveOverlay(null);
                setSelectedPlanDetail(null);
              }}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded transition-all"
              id="close-packages-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            {actionProcessing && <TechSpinner size="sm" />}
            
            <div className="bg-blue-500/10 backdrop-blur-md p-4 rounded-xl border border-blue-500/20 text-xs leading-relaxed text-blue-200 font-semibold">
              Adquira pacotes mineiros certificados. Os retornos são actualizados em tempo real no Centro de Operações, e podem ser recolhidos para o seu saldo a cada segundo. Cada contrato possui um ciclo contínuo (20 dias para o plano grátis, 60 dias para os restantes).
            </div>

            {INVESTMENT_PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.015, borderColor: "rgba(255,193,7,0.3)" }}
                whileTap={{ scale: 0.985 }}
                className="bg-slate-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg flex items-center justify-between text-white transition-all cursor-default"
                id={`plan-card-${plan.id}`}
              >
                <div className="flex items-center space-x-3 w-2/3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                    <img
                      src={plan.image}
                      alt={plan.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-1.5 flex-wrap">
                      <span>{plan.name}</span>
                      <span className="text-[9px] text-[#ffc107] font-mono font-bold bg-[#ffc107]/10 px-1.5 py-0.5 rounded border border-[#ffc107]/20">ID #{plan.code5}</span>
                    </h3>
                    <p className="text-[10px] text-red-300 font-bold font-mono">
                      Custo: {plan.price?.toLocaleString()} kz
                    </p>
                    <p className="text-[10px] text-[#28a745] font-bold font-mono">
                      YIELD: {plan.dailyYield?.toLocaleString()} kz / {getTranslation(lang, "collectYieldBtn").split(" ")[0]}
                    </p>
                  </div>
                </div>
 
                <div className="w-1/3 text-right">
                  {plan.id === "gratis" && myInvestments.some(inv => inv.planId === "gratis") ? (
                    <button
                      disabled
                      className="bg-gray-700/65 text-gray-400 font-bold text-[10px] py-2 px-3.5 rounded-xl uppercase font-mono transition-all cursor-not-allowed border border-white/5"
                      id={`btn-acquire-${plan.id}-disabled`}
                    >
                      Ativado
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanDetail(plan);
                      }}
                      className={`${
                        plan.id === "gratis"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "bg-[#007bff] hover:bg-blue-600"
                      } text-white font-bold text-[10px] py-2 px-3.5 rounded-xl uppercase font-mono transition-all cursor-pointer`}
                      id={`btn-acquire-${plan.id}`}
                    >
                      Adquira Já
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
 
      {/* --- OVERLAY: CENTRO DE CONTA --- */}
      {activeOverlay === "account" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="account-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Centro de Conta</span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all"
              id="close-account-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
 
          <div className="flex-1 overflow-y-auto p-4 flex flex-col max-w-2xl w-full mx-auto">
            {/* Menu Options inside Account */}
            <div className="flex-1 flex flex-col">
              
              {/* Histórico Transações */}
              <div className="bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 p-4 space-y-3 shadow-md flex-1 flex flex-col min-h-[calc(100vh-180px)]">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">{getTranslation(lang, "transactionsTab")} ({myTransactions.length})</span>
                </div>

                <div className="pt-2 border-t border-white/10 flex-1 overflow-y-auto space-y-2">
                  {myTransactions.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 shadow-sm p-8 rounded-xl flex flex-col items-center justify-center text-center space-y-2 mt-1 animate-fade-in" id="empty-history-projection-block">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                        <History className="w-6 h-6 stroke-1 animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white/90 block">Sem Histórico de Transações</span>
                        <p className="text-[10px] text-white/60 max-w-xs leading-relaxed">
                          Nenhuma movimentação fiduciária (depósitos, saques ou bónus) foi registrada ainda para esta conta.
                        </p>
                      </div>
                    </div>
                  ) : (
                    myTransactions.map((tx) => (
                      <div key={tx.id} className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex justify-between items-center text-xs font-mono text-white/90">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-sans">
                            {tx.type === "deposit" || tx.type === "yield" || tx.type === "bonus" ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                            )}
                            <span className="font-bold uppercase text-[10px] tracking-wide text-white/80">
                              {tx.type}
                            </span>
                          </div>
                          <p className="text-[9px] font-sans text-gray-300 leading-tight">
                            {tx.description}
                          </p>
                          <span className="text-[9px] text-gray-400 italic">
                            {new Date(tx.createdAt).toLocaleString("pt-PT")}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className={`font-bold block ${tx.type === "deposit" || tx.type === "yield" || tx.type === "bonus" ? "text-green-400" : "text-red-400"}`}>
                            {tx.type === "deposit" || tx.type === "yield" || tx.type === "bonus" ? "+" : "-"}
                            {tx.amount?.toLocaleString()} kz
                          </span>
                          <div className="flex items-center gap-1.5 justify-end mt-1">
                            {tx.status === "completed" && (
                              <img
                                src="https://i.postimg.cc/15W1hSSJ/pngtree-green-checkmark-circle-clipart-approved-correct-yes-symbol-png-image-13396806.png"
                                alt="Aprovado"
                                className="w-3.5 h-3.5 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {tx.status === "rejected" && (
                              <img
                                src="https://i.postimg.cc/9f767q95/pngtree-error-cross-png-image-2951813.jpg"
                                alt="Rejeitado"
                                className="w-3.5 h-3.5 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {tx.status === "pending" && (
                              <img
                                src="https://i.postimg.cc/pTQ30bq2/pending-icon-svg-download-png-3080258.png"
                                alt="Pendente"
                                className="w-3.5 h-3.5 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span className={`text-[8px] uppercase font-bold p-1 rounded font-sans leading-none ${tx.status === "completed" ? "bg-green-500/20 text-green-300" : tx.status === "pending" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                              {tx.status === "completed" ? "Aprovado" : tx.status === "pending" ? "Pendente" : "Rejeitado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* --- OVERLAY: MINHA COMUNIDADE --- */}
      {activeOverlay === "community" && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="community-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Minha Comunidade</span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all"
              id="close-community-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 border border-white/10 shadow-lg flex flex-col space-y-3 font-sans text-left text-white">
              
              {/* Imagem de Destaque da Comunidade */}
              <div className="w-full h-44 rounded-[12px] overflow-hidden border border-white/10 shadow-sm relative mb-2">
                <img 
                  src="/src/assets/images/minha_comunidade_banner_1781277443095.jpg" 
                  alt="Anglo American Community" 
                  className="w-full h-full object-cover animate-fade-in"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent flex items-end p-3">
                  <span className="text-white text-[10px] font-bold tracking-widest uppercase font-mono bg-[#28a745] px-2 py-0.5 rounded">Anglo Cooperativa</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white text-[11px] font-bold uppercase tracking-wider pb-1.5 border-b border-white/10">
                <Users className="w-4 h-4 text-[#28a745]" />
                <span>Minha Comunidade fiduciária</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-center text-xs py-2">
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-[9px] text-gray-300 uppercase font-mono block">AMIGOS CONVIDADOS</span>
                  <strong className="text-base font-bold text-[#007bff] font-mono">{myReferrals.length}</strong>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-[9px] text-gray-300 uppercase font-mono block">CÓDIGO PROMO</span>
                  <strong className="text-base font-bold text-green-400 font-mono">{userProfile?.promoCode}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] text-gray-200 leading-relaxed text-left">
                  Ganhe comissão extra de 10% sobre o primeiro investimento efetuado por cada amigo que convidar para o consórcio mineiro da Anglo American em Angola.
                </p>
                <button
                  onClick={handleCopyLink}
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  id="btn-copy-promo"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Link de Convite
                </button>
              </div>

              {myReferrals.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[9px] font-bold text-gray-300 uppercase font-mono block">MEMBROS CONVITES ATIVOS</span>
                  <div className="bg-slate-950/50 p-2.5 rounded-lg text-[10px] space-y-1.5 font-mono max-h-48 overflow-y-auto border border-white/10">
                    {myReferrals.map((friend, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-gray-200 truncate max-w-[120px]">{friend.fullName}</span>
                        <span className="text-gray-400">{friend.phone?.substring(0, 10)}...</span>
                        <span className={friend.claimedWelcomeBonus ? "text-green-400 font-bold" : "text-amber-400"}>
                          {friend.claimedWelcomeBonus ? "Ativo" : "Registado"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vantagens e Desvantagens da Comunidade */}
              <div className="bg-slate-950/40 rounded-[12px] border border-white/10 p-4 space-y-4 mt-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1">
                    <span>Vantagens &amp; Desvantagens do Convite</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCommunityBenefits(!showCommunityBenefits)}
                    className="text-[10px] font-mono text-[#007bff] hover:text-blue-400 uppercase font-black cursor-pointer"
                  >
                    {showCommunityBenefits ? "Ocultar" : "Visualizar"}
                  </button>
                </div>

                {showCommunityBenefits && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 pt-1 overflow-hidden font-sans"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-extrabold text-[#28a745] tracking-wider flex items-center gap-1">✓ Vantagens Coletivas:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-250 space-y-1 pl-1 text-white">
                        <li><strong>Bónus Direto de 10%:</strong> Receba bónus imediato creditado em saldo principal no primeiro investimento de cada convidado.</li>
                        <li><strong>Rede de Mineração Coletiva:</strong> Amigos ativos aumentam o limite operacional de saque fiduciário do seu perfil.</li>
                        <li><strong>Campanhas Cooperativas:</strong> Possibilidade de participar de cotas de pacotes mineradores de altíssima rentabilidade.</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5 font-sans">
                      <span className="text-[10px] uppercase font-extrabold text-amber-500 tracking-wider flex items-center gap-1">⚠ Desvantagens do Convite:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-250 space-y-1 pl-1 text-white">
                        <li><strong>Primeiro Depósito Único:</strong> O bónus de comissão incide apenas na primeira aquisição de plano pelo seu amigo.</li>
                        <li><strong>Processo de Verificação:</strong> Requer validação inicial de perfil para ativação completa dos indicadores.</li>
                        <li><strong>Termos Anti-Abuso:</strong> Criação de contas paralelas redundantes resulta em suspensão do perfil e suspensão de saques.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY: SEGURANÇA E PRIVACIDADE --- */}
      {activeOverlay === "security" && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="security-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Segurança e Privacidade</span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all"
              id="close-security-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 border border-white/10 shadow-lg flex flex-col space-y-3 font-sans text-left text-white">
              
              {/* Imagem de Destaque da Segurança */}
              <div className="w-full h-44 rounded-[12px] overflow-hidden border border-white/10 shadow-sm relative mb-2">
                <img 
                  src="https://i.postimg.cc/cJG2tQ9t/images.jpg" 
                  alt="Anglo American Security System" 
                  className="w-full h-full object-cover animate-fade-in"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent flex items-end p-3">
                  <span className="text-white text-[10px] font-bold tracking-widest uppercase font-mono bg-[#ffc107] text-slate-900 px-2 py-0.5 rounded">Fiduciary Shield</span>
                </div>
              </div>

              <div className="text-xs space-y-4 pt-1">
                {securityStatusMsg && (
                  <div className="p-2 border border-blue-500/20 bg-blue-500/10 text-blue-200 text-xs rounded text-center font-semibold">
                    {securityStatusMsg}
                  </div>
                )}
                <div>
                  <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">
                    {getTranslation(lang, "newLoginPassword")}
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo de 6 dígitos"
                    value={newLoginPasswordInput}
                    onChange={(e) => setNewLoginPasswordInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2.5 outline-none text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    id="sec-login-password"
                  />
                </div>
                <button
                  onClick={handleUpdateSecurity}
                  disabled={actionProcessing || !newLoginPasswordInput}
                  className="w-full bg-[#007bff] hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase font-mono transition cursor-pointer"
                  id="sec-save-btn"
                >
                  {getTranslation(lang, "saveSecurityChanges")}
                </button>
              </div>

              {/* Vantagens e Desvantagens da Criptografia */}
              <div className="bg-slate-950/40 rounded-[12px] border border-white/10 p-4 space-y-4 mt-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1">
                    <span>Vantagens &amp; Desvantagens</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowSecurityBenefits(!showSecurityBenefits)}
                    className="text-[10px] font-mono text-[#007bff] hover:text-blue-400 uppercase font-black cursor-pointer"
                  >
                    {showSecurityBenefits ? "Ocultar" : "Visualizar"}
                  </button>
                </div>
                
                {showSecurityBenefits && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 pt-1 overflow-hidden"
                  >
                    <div className="space-y-1.5 text-white">
                      <span className="text-[10px] uppercase font-extrabold text-[#28a745] tracking-wider flex items-center gap-1">✓ Vantagens de Segurança:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-250 space-y-1 pl-1">
                        <li><strong>Blindagem Integral Ativa:</strong> Proteção de cookies, expiração automática da sessão local e criptografia contra ataques de força bruta.</li>
                        <li><strong>Log de Transação Seguro:</strong> Monitoramento estrito e ocultação de dados confidenciais para evitar roubos.</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5 text-white">
                      <span className="text-[10px] uppercase font-extrabold text-amber-500 tracking-wider flex items-center gap-1">⚠ Desvantagens do Rigor Fiduciário:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-255 space-y-1 pl-1">
                        <li><strong>Password Forte Mandatória:</strong> A plataforma invalida sequências ordinais ou fáceis demais por política de segurança.</li>
                        <li><strong>Bloqueio de Saque por Redefinição:</strong> Mudar a senha bloqueia resgates nas 12 horas seguintes como salvaguarda preventiva contra invasores.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY: CARTEIRA DE RETIRADA (DADOS BANCÁRIOS) --- */}
      {activeOverlay === "wallet" && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="wallet-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Carteira de Retirada</span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all"
              id="close-wallet-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 border border-white/10 shadow-lg flex flex-col space-y-3 font-sans text-left text-white">
              
              {/* Imagem de Destaque da Carteira Bancária */}
              <div className="w-full h-44 rounded-[12px] overflow-hidden border border-white/10 shadow-sm relative mb-2">
                <img 
                  src="https://i.postimg.cc/c4NnjCbn/52596619-banco-construcao-fachada-mostrando-dolar-moeda-moeda-troca-vetor.jpg" 
                  alt="Anglo American Bank Details Wallet" 
                  className="w-full h-full object-cover animate-fade-in"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent flex items-end p-3">
                  <span className="text-white text-[10px] font-bold tracking-widest uppercase font-mono bg-[#007bff] px-2 py-0.5 rounded">Fiduciary Ledger</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white text-[11px] font-bold uppercase tracking-wider pb-1.5 border-b border-white/10">
                <CreditCard className="w-4 h-4 text-[#007bff]" />
                <span>Carteira de Retirada (Dados Bancários)</span>
              </div>

              {userProfile?.bankAccount ? (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col space-y-2 text-xs">
                  <span className="text-gray-300 font-mono">Banco: {userProfile?.bankName}</span>
                  <span className="font-semibold text-white font-mono">
                    Conta/IBAN: ****{userProfile?.bankAccount?.substring(userProfile?.bankAccount.length - 4)}
                  </span>
                  <span className="text-gray-300 font-mono">Titular: {userProfile?.bankHolder}</span>
                  <div className="bg-blue-500/20 text-[#3b82f6] p-2.5 rounded-md border border-blue-500/30 font-bold block text-center mt-2">
                    ✓ Coordenadas Seguras e Desbloqueadas
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs pt-1">
                  <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-amber-200 font-semibold mb-2">
                    {getTranslation(lang, "bankSaveWarning")}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">Nome do Banco</label>
                    <input
                      type="text"
                      placeholder="Nome do Banco (ex: BFA, BAI, BIC...)"
                      value={bankNameInput}
                      onChange={(e) => setBankNameInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 outline-none text-xs font-medium text-white focus:border-blue-500"
                      id="input-bank-name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">Número de Conta ou IBAN</label>
                    <input
                      type="text"
                      placeholder="Número de Conta ou IBAN"
                      value={bankAccountInput}
                      onChange={(e) => setBankAccountInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 outline-none text-xs font-medium text-white focus:border-blue-500"
                      id="input-bank-account"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">Nome do Titular da Conta (Auto-preenchido)</label>
                    <input
                      type="text"
                      placeholder="Nome do Titular da Conta"
                      value={bankHolderInput || userProfile?.fullName || ""}
                      readOnly
                      disabled
                      className="w-full bg-white/5 opacity-70 border border-white/10 rounded-lg p-2.5 outline-none text-xs font-medium text-white/60 cursor-not-allowed font-sans"
                      id="input-bank-holder"
                    />
                  </div>
                  <button
                    onClick={handleSaveBankDetails}
                    disabled={actionProcessing || !bankNameInput || !bankAccountInput || !bankHolderInput}
                    className="w-full mt-2 bg-[#007bff] hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase font-mono transition cursor-pointer"
                    id="btn-save-bank"
                  >
                    Salvar Coordenadas
                  </button>
                </div>
              )}

              {/* Vantagens e Desvantagens do Levantamento Financeiro */}
              <div className="bg-slate-950/40 rounded-[12px] border border-white/10 p-4 space-y-4 mt-2 text-white">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1">
                    <span>Vantagens &amp; Desvantagens do Resgate Financeiro</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowWalletBenefits(!showWalletBenefits)}
                    className="text-[10px] font-mono text-[#007bff] hover:text-blue-400 uppercase font-black cursor-pointer"
                  >
                    {showWalletBenefits ? "Ocultar" : "Visualizar"}
                  </button>
                </div>

                {showWalletBenefits && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 pt-1 overflow-hidden font-sans"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-extrabold text-green-400 tracking-wider flex items-center gap-1">✓ Vantagens de Transação:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-250 space-y-1 pl-1 text-white">
                        <li><strong>Moeda Local Angola:</strong> Processamento fiduciário do tesouro direto em Kwanza (kz) sem tarifas cambiais ou ocultas.</li>
                        <li><strong>Parceria Direta:</strong> Operação integrada com os maiores bancos nacionais (BFA, BAI, BIC, SOL, etc.).</li>
                        <li><strong>Segurança Absoluta:</strong> Dados encriptados criptograficamente na base prevenindo fraudes ou alterações ilícitas.</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-extrabold text-amber-500 tracking-wider flex items-center gap-1">⚠ Desvantagens &amp; Restrições:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-250 space-y-1 pl-1 text-white">
                        <li><strong>Submissão Única Segura:</strong> Uma vez salvos, os dados são permanentemente trancados por segurança na UI.</li>
                        <li><strong>Prazos Interbancários:</strong> A compensação bancária fiduciária em Angola pode demorar de 24h a 48h úteis operacionais.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY: FINANCIAMENTO DA CONTA --- */}
      {activeOverlay === "financing" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="financing-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Financiamento da Conta</span>
            <button
              onClick={() => {
                setActiveOverlay(null);
                setFinancingCountry("");
                setFinancingStatusMsg("");
                setProofFileName("");
              }}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all"
              id="close-financing-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFinancingSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto text-xs text-white">
            {/* Foto e Imagem de Destaque para Depósitos */}
            <div className="w-full h-44 rounded-[12px] overflow-hidden border border-white/10 shadow-sm relative mb-2">
              <img 
                src="/src/assets/images/financiamento_conta_banner_1781277477629.jpg"
                alt="Financiamento Anglo American Deposit" 
                className="w-full h-full object-cover animate-fade-in"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent flex items-end p-3">
                <span className="text-white text-[10px] font-bold tracking-widest uppercase font-mono bg-[#007bff] px-2 py-0.5 rounded">Comprovativo de Depósito</span>
              </div>
            </div>

            <div className="bg-[#007bff]/10 p-4 rounded-xl border border-blue-500/20 text-blue-200 font-semibold leading-relaxed">
              Consórcio Fiduciário: Selecione o seu país abaixo para verificar as coordenadas bancárias de depósito locais ou submeter o seu comprovativo fiduciário.
            </div>

            {financingStatusMsg && (
              <div className="bg-green-500/10 text-green-300 border border-green-500/20 p-3 rounded-xl text-center font-bold animate-fade-in">
                {financingStatusMsg}
              </div>
            )}

            {/* Select de País que controla as coordenadas de forma geral */}
            <div className="bg-slate-950/30 p-3 rounded-xl border border-white/5 space-y-2">
              <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block">
                Do qual país você pertence?
              </label>
              <select
                value={financingCountry}
                onChange={(e) => {
                  const country = e.target.value;
                  setFinancingCountry(country);
                  if (country) {
                    setFinancingStatusMsg(`Suporte fiduciário local para ${country} preparado. Use as abas abaixo para prosseguir.`);
                  }
                }}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 outline-none font-medium text-xs font-sans cursor-pointer text-white"
                id="select-financing-country"
                required
              >
                <option value="" className="bg-slate-950 text-white">Selecione o seu país...</option>
                <option value="Angola" className="bg-slate-950 text-white">Angola (BAI / BFA / EMIS)</option>
                <option value="Moçambique" className="bg-slate-950 text-white">Moçambique (M-Pesa / E-Mola)</option>
                <option value="Portugal" className="bg-slate-950 text-white">Portugal (Multibanco / MBWay)</option>
                <option value="Brasil" className="bg-slate-950 text-white">Brasil (PIX Bancário)</option>
                <option value="Outro" className="bg-slate-950 text-white">Outro País / Carteira Digital</option>
              </select>
            </div>

            {financingCountry && (
              <div className="space-y-4">
                {/* Abas para Dados vs Comprovativo */}
                <div className="flex border-b border-white/10 bg-slate-950/40 rounded-xl overflow-hidden p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setFinancingTab("dados")}
                    className={`flex-1 py-2.5 rounded-lg text-center font-mono text-[10px] uppercase font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                      financingTab === "dados"
                        ? "bg-[#007bff] text-white shadow"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    1. Dados de Depósito
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancingTab("comprovativo")}
                    className={`flex-1 py-2.5 rounded-lg text-center font-mono text-[10px] uppercase font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                      financingTab === "comprovativo"
                        ? "bg-[#007bff] text-white shadow"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    2. Enviar Comprovativo
                  </button>
                </div>

                {/* ABA 1: MOSTRAR DADOS DE DEPOSITO */}
                {financingTab === "dados" && (
                  <motion.div
                    key="tab-dados"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {financingCountry === "Angola" ? (
                      <div className="bg-slate-900/90 border border-white/10 rounded-xl p-4 space-y-3 font-sans">
                        <h4 className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-white/10 pb-1.5 flex items-center justify-between">
                          <span>Coordenadas Bancárias de Depósito</span>
                          <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">Fiduciário</span>
                        </h4>
                        
                        {/* Banco BAI */}
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col space-y-1.5 relative">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">BANCO BAI</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setRevealIbanBai(!revealIbanBai)}
                                className="bg-white/10 hover:bg-white/15 text-orange-400 font-mono text-[9px] font-extrabold px-2.5 py-1 rounded transition-all active:scale-95 cursor-pointer border-none flex items-center gap-1"
                              >
                                {revealIbanBai ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {revealIbanBai ? "Ocultar" : "Ver IBAN"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText("0040.0000.5823.3661.1013.5");
                                  showToast("IBAN BAI copiado com sucesso!", "success");
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded transition-all active:scale-95 cursor-pointer border-none"
                              >
                                Copiar IBAN
                              </button>
                            </div>
                          </div>
                          
                          <p className="font-mono text-orange-500 text-sm font-black tracking-wider py-1 select-all select-none">
                            {revealIbanBai ? "0040.0000.5823.3661.1013.5" : "0040.••••.••••.••••.••••.5"}
                          </p>
                          <span className="text-[9px] text-gray-400">Titular: Joyce Consórcio Fiduciário</span>
                        </div>

                        {/* Banco BFA */}
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col space-y-1.5 relative">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">BANCO BFA</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setRevealIbanBfa(!revealIbanBfa)}
                                className="bg-white/10 hover:bg-white/15 text-orange-400 font-mono text-[9px] font-extrabold px-2.5 py-1 rounded transition-all active:scale-95 cursor-pointer border-none flex items-center gap-1"
                              >
                                {revealIbanBfa ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {revealIbanBfa ? "Ocultar" : "Ver IBAN"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText("0006.0000.9095.7416.3015.7");
                                  showToast("IBAN BFA copiado com sucesso!", "success");
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded transition-all active:scale-95 cursor-pointer border-none"
                              >
                                Copiar IBAN
                              </button>
                            </div>
                          </div>
                          
                          <p className="font-mono text-orange-500 text-sm font-black tracking-wider py-1 select-all select-none">
                            {revealIbanBfa ? "0006.0000.9095.7416.3015.7" : "0006.••••.••••.••••.••••.7"}
                          </p>
                          <span className="text-[9px] text-gray-400">Titular: Joyce Consórcio Fiduciário</span>
                        </div>

                        {/* Multicaixa Express */}
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col space-y-1 relative opacity-75">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-white">MULTICAIXA EXPRESS</span>
                            <span className="bg-yellow-500/10 text-yellow-400 font-mono text-[9px] font-black px-2 py-0.5 rounded border border-yellow-500/20">Brevemente</span>
                          </div>
                          <p className="font-mono text-gray-400 text-[10px] italic">Canal automático fiduciário em integração</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#007bff]/5 border border-white/10 p-4 rounded-xl text-center space-y-2.5">
                        <p className="text-white font-bold text-xs">Instruções de Depósito para {financingCountry}</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">
                          Por favor, realize a transferência para a nossa carteira correspondente em {financingCountry}. 
                          Logo após concluir a transação fiduciária, selecione a aba <strong className="text-white font-bold">"2. Enviar Comprovativo"</strong> para submeter o recibo de validação.
                        </p>
                        <div className="p-3 bg-white/5 rounded-lg text-left text-[11px] text-gray-200">
                          <strong>● M-Pesa / E-Mola (Moçambique):</strong> Transferir para (+258) 84 990 1201<br />
                          <strong>● MBWay / Multibanco (Portugal):</strong> Contactar suporte fiduciário no canal Central<br />
                          <strong>● PIX Bancário (Brasil):</strong> Chave cnpj@angloamericanfiduciario.com
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setFinancingTab("comprovativo")}
                      className="w-full bg-[#007bff] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase font-mono transition text-center cursor-pointer block border-none shadow-sm"
                    >
                      Prosseguir para submissão de comprovativo ➔
                    </button>
                  </motion.div>
                )}

                {/* ABA 2: FORMULÁRIO DE ENVIAR COMPROVATIVO */}
                {financingTab === "comprovativo" && (
                  <motion.div
                    key="tab-comprovativo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border border-white/10 bg-slate-950/40 p-4 rounded-xl space-y-4"
                  >
                    <div className="space-y-3">
                      <h4 className="font-bold text-blue-400 font-mono tracking-wide text-[10px] uppercase border-b border-white/10 pb-1.5">
                        INFORMAÇÕES ADICIONAIS DO COMPROVATIVO
                      </h4>

                      {/* VALOR DEPOSITADO */}
                      <div>
                        <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">
                          Valor Depositado (AOA / Moeda Local)*
                        </label>
                        <input
                          type="number"
                          placeholder="Ex: 50000"
                          value={financingAmount}
                          onChange={(e) => setFinancingAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-sm text-white focus:border-blue-500"
                          id="input-financing-amount"
                          required
                        />
                      </div>

                      {/* MÉTODO DE PAGAMENTO */}
                      <div>
                        <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">
                          Método de Operação / Banco de Origem*
                        </label>
                        <select
                          value={financingMethod}
                          onChange={(e) => setFinancingMethod(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 outline-none font-medium text-xs font-sans text-white cursor-pointer"
                          id="select-financing-method"
                          required
                        >
                          <option value="" className="bg-slate-950 text-white">Selecione o método...</option>
                          {financingCountry === "Angola" && (
                            <>
                              <option value="BAI Transfer" className="bg-slate-950 text-white">Banco BAI (Fiduciário)</option>
                              <option value="BFA Transfer" className="bg-slate-950 text-white">Banco BFA (Fiduciário)</option>
                              <option value="Multicaixa Express" className="bg-slate-950 text-white">Multicaixa Express</option>
                            </>
                          )}
                          {financingCountry === "Moçambique" && (
                            <>
                              <option value="M-Pesa" className="bg-slate-950 text-white">M-Pesa (Mcel)</option>
                              <option value="E-Mola" className="bg-slate-950 text-white">E-Mola (Movitel)</option>
                            </>
                          )}
                          {financingCountry === "Portugal" && (
                            <>
                              <option value="Multibanco" className="bg-slate-950 text-white">Referência Multibanco</option>
                              <option value="MBWay" className="bg-slate-950 text-white">MBWay</option>
                            </>
                          )}
                          {financingCountry === "Brasil" && (
                            <option value="PIX" className="bg-slate-950 text-white">Chave PIX Bancária</option>
                          )}
                          <option value="Transferência Bancária Direta" className="bg-slate-950 text-white">Outro Canal de Transferência</option>
                        </select>
                      </div>

                      {/* REMOVED PREVIOUS FIELDS TO LEAVE ONLY DEPOSIT VALUE, CHOSEN METHOD AND RECEIPTZones */}

                      <div className="pt-2">
                        <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">
                          Anexar comprovativo de depósito (Ative definindo o valor acima)*
                        </label>

                        {/* Enforced Amount Restriction on file upload zone as requested by user */}
                        <div 
                          onClick={() => {
                            if (!financingAmount) {
                              showToast("Atenção: Defina primeiro o valor que depositou para habilitar o envio!", "info");
                              return;
                            }
                            document.getElementById("file-upload-input")?.click();
                          }}
                          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-2 transition-all ${
                            !financingAmount 
                              ? "border-red-500/30 bg-red-500/5 cursor-not-allowed opacity-60 hover:bg-red-500/10" 
                              : "border-white/20 hover:border-blue-500 bg-white/5 cursor-pointer hover:bg-white/10"
                          }`}
                          id="deposit-receipt-dropzone"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!financingAmount ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-[#3b82f6]"}`}>
                            <PlusCircle className={`w-5 h-5 ${financingAmount ? "animate-pulse" : ""}`} />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white block text-center">
                              {!financingAmount 
                                ? "⚠️ DEPOSITO BLOQUEADO: Insira o valor acima" 
                                : proofFileName 
                                  ? "Comprovativo anexado!" 
                                  : "Selecionar Ficheiro de Comprovativo"
                              }
                            </span>
                            <p className="text-[10px] text-gray-300 max-w-xs leading-relaxed text-center">
                              {proofFileName 
                                ? proofFileName 
                                : !financingAmount
                                  ? "O preenchimento do campo 'Valor Depositado' é estritamente obrigatório antes de anexar o comprovante."
                                  : "Arraste o seu comprovativo fiduciário PDF, PNG ou JPG aqui ou simule o anexo de depósito"
                              }
                            </p>
                          </div>
                          <input 
                            type="file" 
                            id="file-upload-input" 
                            className="hidden" 
                            accept=".pdf,.png,.jpg,.jpeg"
                            disabled={!financingAmount}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProofFileName(file.name);
                                setFinancingProof(file.name + " (" + (file.size / 1024).toFixed(1) + " KB)");
                                showToast("Ficheiro de comprovativo de depósito anexado com sucesso!", "success");
                              }
                            }}
                          />
                        </div>

                        {financingProof && (
                          <div className="bg-green-500/10 text-green-300 border border-green-500/20 rounded-lg p-2.5 text-[10px] flex items-center justify-between font-mono animate-fade-in mt-2">
                            <span>Anexo: {financingProof}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                setProofFileName("");
                                setFinancingProof("");
                              }}
                              className="text-red-400 font-extrabold px-1.5 hover:text-red-500"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={actionProcessing || !financingProof || !financingAmount || !financingMethod}
                        className="w-full bg-[#28a745] hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl uppercase font-mono transition shadow-sm cursor-pointer border-none mt-2"
                        id="submit-proof-btn"
                      >
                        Submeter comprovativo para aprovação fiduciária
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </form>
        </motion.div>
      )}

      {/* --- OVERLAY: CENTRO DE OPERAÇÕES --- */}
      {activeOverlay === "operations" && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="operations-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Centro de Operações</span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all"
              id="close-operations-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            {actionProcessing && <TechSpinner size="sm" />}
            
            <div className="bg-[#007bff]/10 p-4 rounded-xl border border-blue-500/20 text-xs text-blue-200 font-semibold leading-relaxed flex items-start gap-2.5 animate-fade-in">
              <Info className="w-5 h-5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Roleta de Rendimentos Anglo Cobre:</strong> Recolha os seus ganhos diários de forma interativa através da roda da fortuna fiduciária. Ela funcionará se tiver pelo menos 1 pacote ativo. Cada rotação transfere juros do cobre para a sua carteira principal.
              </span>
            </div>

            {operationsBlocked ? (
              <div className="text-center py-16 bg-slate-950/75 backdrop-blur-md border border-red-500/35 rounded-2xl shadow-xl space-y-5 animate-fade-in flex flex-col items-center justify-center text-white p-6">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-500 animate-pulse">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-red-400 font-black uppercase tracking-wider font-mono">Centro de Operações Suspenso</p>
                  <p className="text-xs text-gray-350 max-w-sm mx-auto leading-relaxed font-light">
                    O centro de operações fiduciárias foi suspenso temporariamente pela administração geral Joyce para fins de conciliação bancária fiduciária e auditoria interna periódica.
                  </p>
                </div>
                <div className="text-[9px] text-gray-400 font-mono tracking-wider bg-red-500/10 py-1 px-3 border border-red-500/20 rounded-md">
                  PREVISÃO DE RETORNO: 24-48 HORAS
                </div>
                <button
                  onClick={() => setActiveOverlay(null)}
                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-6 py-2.5 rounded-xl uppercase font-mono cursor-pointer transition shadow-md"
                >
                  Voltar ao Painel
                </button>
              </div>
            ) : myInvestments.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg space-y-4 animate-fade-in flex flex-col items-center justify-center text-white">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                  <Briefcase className="w-6 h-6 stroke-1" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white font-bold">Sem Planos Ativos</p>
                  <p className="text-[10px] text-gray-300 max-w-xs mx-auto leading-relaxed">
                    Você ainda não possui planos de prospecção cooperativa ativos no consórcio. Adquira um plano nos Pacotes de Aquisição para habilitar a Roleta.
                  </p>
                </div>
                <button
                  onClick={() => setActiveOverlay("packages")}
                  className="bg-[#007bff] hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl uppercase font-mono cursor-pointer transition shadow-sm"
                  id="go-to-packages-shortcut"
                >
                  Explorar Planos
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* The Interactive Visual Roulette Wheel */}
                <div className="flex flex-col items-center justify-center space-y-5 py-6 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/10 relative overflow-hidden shadow-lg text-white" id="interactive-roulette-container">
                  
                  <div className="absolute top-2 right-2 bg-blue-500/20 text-blue-300 font-mono text-[9px] font-bold px-2.5 py-1 rounded-full border border-blue-500/30 uppercase">
                    Giro de Rendimentos (Ativo)
                  </div>

                  {/* Selector Marker Arrow on Top */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-red-600 z-20 -mb-2 animate-bounce" />
                    
                    {/* Wheel Element */}
                    <div 
                      className="w-56 h-56 rounded-full border-8 border-slate-800 shadow-xl relative overflow-hidden flex items-center justify-center transition-all bg-conic-grad cursor-pointer"
                      style={{ 
                        transform: `rotate(${spinAngle}deg)`,
                        transition: isSpinning ? "transform 3300ms cubic-bezier(0.1, 0.8, 0.1, 1)" : "none",
                        background: "conic-gradient(#007bff 0deg 45deg, #28a745 45deg 90deg, #ffc107 90deg 135deg, #007bff 135deg 180deg, #28a745 180deg 225deg, #ffc107 225deg 270deg, #dc3545 270deg 315deg, #17a2b8 315deg 360deg)"
                      }}
                      id="roulette-wheel-graphic"
                      onClick={handleSpinRoulette}
                    >
                      {/* Inner center button node */}
                      <div className="w-14 h-14 rounded-full bg-slate-900 border-4 border-white shadow-md flex items-center justify-center text-white text-[9px] font-bold z-10 font-mono select-none">
                        ANGLO
                      </div>
                      
                      {/* Slices Indicators labels */}
                      <div className="absolute inset-0 flex items-center justify-center text-white font-bold font-mono text-[8px] pointer-events-none">
                        <span className="absolute transform -translate-y-16 rotate-0">50% Yield</span>
                        <span className="absolute transform translate-x-16 rotate-90">50% Yield</span>
                        <span className="absolute transform translate-y-16 rotate-180">50% Yield</span>
                        <span className="absolute transform -translate-x-16 -rotate-90">50% Yield</span>
                      </div>
                    </div>
                  </div>

                  {/* Display Roulette Reward details */}
                  {rouletteRewardMsg && (
                    <div className="bg-green-500/15 text-green-300 border border-green-500/20 p-3 rounded-xl text-xs font-bold font-sans text-center max-w-sm mx-auto animate-bounce mt-1" id="roulette-reward-indicator">
                      🎉 {rouletteRewardMsg}
                    </div>
                  )}

                  <div className="text-center space-y-1 max-w-sm px-4">
                    <span className="text-xs font-bold text-white block uppercase font-mono tracking-wide">
                      Roleta Cooperativa Anglo (Rendimentos Diários)
                    </span>
                    <p className="text-[10px] text-gray-300 font-sans leading-relaxed">
                      A roleta divide o seu ganho diário total em 2 parcelas de 50%. Gire duas vezes por dia para colher 100% dos seus rendimentos diários.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={handleSpinRoulette}
                      disabled={isSpinning || (userProfile?.lastSpinDate === new Date().toISOString().split("T")[0] && (userProfile?.spinCount || 0) >= 2)}
                      className="w-full bg-[#007bff] hover:bg-blue-600 disabled:bg-slate-300 disabled:text-gray-500 text-white font-extrabold py-3 px-6 rounded-xl text-center uppercase font-mono text-xs transition custom-shadow flex items-center justify-center gap-2 cursor-pointer"
                      id="spin-roulette-btn"
                    >
                      {isSpinning ? "A Girar..." : `Girar Roleta (${userProfile?.lastSpinDate === new Date().toISOString().split("T")[0] ? (userProfile?.spinCount || 0) : 0}/2)`}
                    </button>
                    
                    <span className="text-[9px] font-bold text-gray-300 font-mono uppercase tracking-wider">
                      Rendimento diário total: {myInvestments.reduce((sum, inv) => sum + inv.dailyYield, 0).toFixed(2)} kz
                    </span>
                  </div>

                </div>

                {/* Meus Planos Resumo */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold font-mono uppercase text-gray-300 block tracking-wider pt-2">Meus Planos de Prospecção Ativos ({myInvestments.length})</h4>
                  {myInvestments.map((inv) => {
                    const matchedPlan = INVESTMENT_PLANS.find(p => p.id === inv.planId);
                    const code5 = matchedPlan ? matchedPlan.code5 : "N/A";
                    return (
                      <div
                        key={inv.id}
                        className="bg-slate-950/40 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between text-white"
                        id={`active-job-card-${inv.id}`}
                      >
                        <div className="space-y-0.5 text-left">
                          <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                            <span>{inv.planName}</span>
                            <span className="text-[8px] text-[#ffc107] font-mono bg-[#ffc107]/10 px-1 py-0.5 rounded border border-[#ffc107]/20">ID #{code5}</span>
                          </span>
                          <span className="text-[10px] text-gray-300 font-mono block">
                            Custo: {inv.price} kz | Rendimento Diário: {inv.dailyYield} kz
                          </span>
                        </div>
                        <span className="text-[8px] uppercase font-bold text-green-300 bg-green-500/15 border border-green-500/20 px-2 py-1 rounded font-mono">
                          EM PRODUÇÃO
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Secção de Muitas Informações Operacionais da Roleta */}
                <div className="bg-slate-950/40 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-3.5 text-left text-white mt-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <h4 className="text-xs font-bold font-mono uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-400" />
                      Regulamento e Funcionamento
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowOperationsBenefits(!showOperationsBenefits)}
                      className="text-[10px] font-mono text-[#007bff] hover:text-blue-400 uppercase font-black cursor-pointer"
                    >
                      {showOperationsBenefits ? "Ocultar" : "Visualizar"}
                    </button>
                  </div>
                  
                  {showOperationsBenefits && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2 text-[10px] text-gray-200 leading-relaxed font-sans font-light overflow-hidden pt-1"
                    >
                      <p>
                        <strong className="text-white">● Giro Divisionário de 50%:</strong> No sistema de faturamento do Consórcio Fiduciário Anglo American, a extração de minério de cobre do seu lote ativo gera juros diários constantes. Para garantir as regras de conformidade bancária e auditorias periódicas, esta receita diária não é acumulada em parcela única imediata. Em vez disso, é dividida equitativamente em dois acionamentos diários de 50% cada.
                      </p>
                      <p>
                        <strong className="text-white">● Limite Fiduciário de Giro Diário:</strong> Cada operador tem direito a realizar exatamente 2 rotações diárias da roleta (2/2). Estas rotações transferem os ganhos garantidos das jazidas para a conta principal em moeda líquida Kwanza (Kz). O reinício das cotas fiduciárias diárias acontece rigorosamente à meia-noite (00:00).
                      </p>
                      <p>
                        <strong className="text-white">● Sincronismo e Custódia de Joyce:</strong> Todo o saldo processado e validado através da roleta fiduciária é reconciliado com o ledger central angolano. A sua veracidade é confirmada contra as reservas físicas em reservas sob custódia de Joyce.
                      </p>
                    </motion.div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* --- OVERLAY: LEVANTAMENTO / TRANSFERÊNCIA PARA CONTA --- */}
      {activeOverlay === "withdrawal" && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="withdrawal-view-overlay"
        >
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span>Anglo American • Levantamento / Resgate</span>
            <button
              onClick={() => {
                setActiveOverlay(null);
                setWithdrawalAmount("0.00");
                setWithdrawalMessage("");
              }}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all"
              id="close-withdrawal-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto text-xs text-white">
            {/* Quick Balance indicator */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center font-mono font-semibold text-white">
              <span className="text-gray-300">Saldo Livre Disponível:</span>
              <strong className="text-xl font-bold text-orange-500">
                {userProfile?.balance?.toLocaleString()} kz
              </strong>
            </div>

            {withdrawalMessage && (
              <div className="bg-red-500/10 text-red-300 border border-red-500/20 p-3 rounded-xl text-center font-semibold">
                {withdrawalMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-300 font-bold uppercase font-mono block mb-1">
                  Valor a resgatar (Mín. 603,73 kz)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(formatCentsMask(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none font-bold text-lg text-red-500 focus:border-blue-500 font-mono"
                    id="input-withdraw-amount"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-mono font-bold">
                    KZ
                  </span>
                </div>
              </div>

              {/* Quick Select Percentages 25 50 100 */}
              <div className="flex gap-2">
                {[25, 50, 100].map((percent) => (
                  <button
                    key={`perc-${percent}`}
                    type="button"
                    onClick={() => {
                      if (userProfile) {
                        const amt = (userProfile.balance * (percent / 100)).toFixed(2);
                        setWithdrawalAmount(amt);
                      }
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl font-mono font-bold text-center transition px-2 text-white"
                    id={`wt-select-${percent}`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              {/* Deductions breakdown */}
              {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                <div className="border border-white/10 bg-slate-950/40 p-4 rounded-xl space-y-2 font-mono text-white" id="wt-tax-breakdown">
                  <span className="text-[9px] font-bold text-blue-300 uppercase block mb-1">CÁLCULO E TAXA DE RETIRADA</span>
                  <div className="flex justify-between text-[10px] border-b border-white/5 pb-1 text-gray-300">
                    <span>Taxa Anglo fiduciária (10%):</span>
                    <span>-{(parseFloat(withdrawalAmount) * 0.10).toFixed(2)} kz</span>
                  </div>
                  <div className="flex justify-between text-[10px] border-b border-white/5 pb-1 text-gray-300">
                    <span>Juros operacionais (5%):</span>
                    <span>-{(parseFloat(withdrawalAmount) * 0.05).toFixed(2)} kz</span>
                  </div>
                  <div className="flex justify-between text-[10px] border-b border-white/5 pb-1 text-gray-300">
                    <span>Manutenção de canal (2%):</span>
                    <span>-{(parseFloat(withdrawalAmount) * 0.02).toFixed(2)} kz</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-green-400 pt-1 border-t border-white/10 mt-1">
                    <span>Líquido a receber:</span>
                    <span>{(parseFloat(withdrawalAmount) * 0.83).toLocaleString("pt-AO", { style: "currency", currency: "AOA" })}</span>
                  </div>
                </div>
              )}

              {/* Rules and guidelines list */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-white space-y-1.5">
                <span className="text-[9px] font-bold uppercase font-mono block text-white border-b border-white/10 pb-1">REGRAS DE RETIRADA</span>
                <p className="text-[10px] leading-relaxed text-gray-200">
                  1. Os levantamentos podem ser solicitados de Segunda a Sexta-feira livremente.
                </p>
                <p className="text-[10px] leading-relaxed text-gray-200">
                  2. Aos Sábados e Domingos os levantamentos abrem estritamente a partir das 12h30 até às 13h30.
                </p>
                <p className="text-[10px] leading-relaxed text-gray-200">
                  3. Os pagamentos são auditados e validados por Joyce de forma consecutiva nos Iban ou operadoras de origem.
                </p>
              </div>

              <button
                onClick={processWithdrawal}
                disabled={withdrawalState !== "idle" || !withdrawalAmount || parseFloat(withdrawalAmount) < 603.73}
                className={`w-full py-3 px-4 rounded-xl uppercase font-mono transition shadow-sm font-bold flex items-center justify-center gap-2 cursor-pointer ${
                  withdrawalState === "idle"
                    ? "bg-[#007bff] hover:bg-blue-600 text-white bg-gradient-to-r from-[#007bff] to-blue-600 active:scale-[0.98]"
                    : withdrawalState === "verifying"
                    ? "bg-amber-500 text-slate-950 animate-pulse"
                    : withdrawalState === "routing"
                    ? "bg-purple-600 text-white animate-pulse"
                    : withdrawalState === "success"
                    ? "bg-green-500 text-white"
                    : "bg-red-600 text-white"
                }`}
                id="submit-withdraw-btn"
              >
                {withdrawalState === "idle" && "Submeter operação de levantamento"}
                {withdrawalState === "verifying" && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    1/2 Verificando Coordenadas Bancárias...
                  </>
                )}
                {withdrawalState === "routing" && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    2/2 Sincronizando Gateway fiduciário BAI/BFA...
                  </>
                )}
                {withdrawalState === "success" && "✓ Pedido de Levantamento Registado!"}
                {withdrawalState === "error" && "❌ Falha no Processamento fiduciário"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY: COMO FUNCIONA A PLATAFORMA --- */}
      {activeOverlay === "howitworks" && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed" 
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="how-it-works-overlay"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span className="flex items-center gap-1.5 uppercase tracking-wide text-orange-400">
              <BookOpen className="w-4 h-4 text-orange-500" /> Como Funciona & Garantia
            </span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all active:scale-90"
              id="close-howitworks-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-2xl w-full mx-auto">
            {/* Como funciona */}
            <div className="bg-slate-950/65 backdrop-blur-md rounded-[12px] p-5 shadow-lg border border-orange-500/20 text-left space-y-4 font-sans text-white">
              <div className="flex items-center gap-2 pb-2 border-b border-orange-500/20">
                <Info className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">Metodologia Operacional e Regulamentos (Muitas Informações)</span>
              </div>

              <div className="grid grid-cols-1 gap-4 text-white">
                {/* Passo 1 */}
                <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                  <div className="absolute top-2 right-3 text-2xl font-black text-orange-500/10 select-none font-mono">01</div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">1. Escolha e Ativação de Jazigo</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                      Selecione um plano fiduciário robusto na sessão de <strong className="text-orange-400 font-extrabold underline">Pacotes de Aquisição</strong>. Cada pacote representa uma quota-parte dedicada de prospecção e faturamento real de metais sob tutela. O comissionamento é ativado imediatamente após a compensação financeira com o titular Joyce. Regência fiduciária de máxima precisão e sustentabilidade.
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                  <div className="absolute top-2 right-3 text-2xl font-black text-orange-500/10 select-none font-mono">02</div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">2. Produção Secundária & Algoritmo da Roleta</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                      O minério coletado é faturado e gera dividendos diários em regime de tempo real automatizado. No <strong className="text-orange-400 font-extrabold underline">Centro de Operações</strong>, os utilizadores acionam a Roleta duas vezes por dia para resgatar 100% da produtividade acumulada diária (50% por cada giro de rotação), garantindo segurança total contra tentativas de lavagem e acessos indevidos de terceiros ao sistema.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                  <div className="absolute top-2 right-3 text-2xl font-black text-orange-500/10 select-none font-mono">03</div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">3. Levantamento e Configuração de Carteira</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                      Para transferir fundos, basta configurar a sua <strong className="text-orange-400 font-extrabold underline">Carteira de Retirada</strong> com um IBAN nacional válido de bancos licenciados como BAI ou BFA. Uma vez salvos, por políticas rígidas antifraude da rede de auditores fiduciários angolana, os dados não podem ser alterados ou apagados, sendo criptografados e mascarados de forma blindada.
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                  <div className="absolute top-2 right-3 text-2xl font-black text-orange-500/10 select-none font-mono">04</div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">4. Políticas de Fundo e Liquidez Integral</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                      Prezando pela longevidade e pelo fluxo orgânico das minas associadas, o saldo sob custody do consórcio Joyce é garantido por seguros de liquicidade locais em Angola. Todas as transações cumprem auditorias contínuas. A compensação de saldo decorre em horários controlados para prevenir exaustão de capital das cooperativas minerais licenciadas.
                    </p>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                  <div className="absolute top-2 right-3 text-2xl font-black text-orange-500/10 select-none font-mono">05</div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Percent className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">5. Regra Unilateral de Planos Experimentais</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                      O <strong className="text-orange-400 font-extrabold underline">Plano Experimental Grátis</strong> é concedido para atestação e treinamento fiduciário. É limitado a exatamente 1 aquisição por conta de utilizador. O ciclo operacional do plano gratuito é de 20 dias, debitando 50.00 Kz de retorno diário. O levantamento exige a conclusão do ciclo fiduciário completo ou a aquisição de um plano remunerado secundário.
                    </p>
                  </div>
                </div>

                {/* Passo 6 */}
                <div className="bg-orange-950/10 p-4 rounded-xl border border-orange-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                  <div className="absolute top-2 right-3 text-2xl font-black text-orange-500/10 select-none font-mono">06</div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">6. Regulamento de Afiliação e Rede Comunitária</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                      O sistema de afiliados opera de maneira integrada na nossa comunidade de mineração sustentável. Você recebe comissões automáticas fiduárias baseadas no dinamismo, atração e depósitos reais confirmados de sua equipe direta de referidos, calculadas de forma circular instantânea na sua carteira de trabalho.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificação */}
            <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 shadow-lg border border-white/10 text-left space-y-4 font-sans text-white">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Certificação e Conformidade Fiduciária</span>
                </div>
                <span className="text-[9px] bg-green-500/10 text-white px-2 py-0.5 rounded font-mono font-bold tracking-widest border border-white/20">ATV REG-402</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-stretch">
                {/* Certificado Visual Badge */}
                <div className="w-full sm:w-1/3 bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
                  
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-amber-400">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest text-amber-400 font-mono block">CERTIFICADO OFICIAL</span>
                    <p className="text-[11px] font-bold text-white">Consórcio Fiduciário Joyce</p>
                    <span className="text-[9px] text-white block font-mono">Anglo American PLC</span>
                  </div>

                  <div className="text-[9px] bg-green-500/10 text-white px-2 py-1 rounded font-mono border border-white/10 font-bold">
                    ✓ REGISTRO VALIDADO
                  </div>
                </div>

                {/* Informações de registro e conformidade fiduciária */}
                <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-white" />
                      Credenciais Fiduciárias & Legitimidade
                    </h4>
                    <p className="text-[11px] text-white leading-relaxed font-light">
                      Operando em estrita conformidade com a legislação da República de Angola sobre a exploração de metais estratégicos sob o <strong className="text-white font-extrabold">Alvará de Lavra nº 402/2026</strong>. Todo o minério de cobre é custodiado no consórcio financeiro fiduciário gerido por Joyce.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono text-gray-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Garantia Reservas Físicas
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Auditoria de Saques Diária
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Enquadramento Fiscal EMIS
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Seguro Multi-Riscos Joyce
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY: CENTRO DE AFILHADOS FIDUCIÁRIO --- */}
      {activeOverlay === "affiliates" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="affiliates-view-overlay"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <Award className="w-4 h-4 text-orange-400" /> Centro de Afilhados fiduciário
            </span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all active:scale-90"
              id="close-affiliates-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto animate-fade-in">
            {(() => {
              // Helper para obter dados simulados consistentes de 10% de comissão
              const getSimulatedReferralData = (friend: UserProfile, idx: number) => {
                const plans = [
                  { name: "Cobre", price: 4994, commission: 499.40 },
                  { name: "Minério de Ferro", price: 9998, commission: 999.80 },
                  { name: "Nutrientes (Polihalita)", price: 17993, commission: 1799.30 },
                  { name: "Metais do Grupo da Platina (PGMs)", price: 28988, commission: 2898.80 }
                ];
                const plan = plans[idx % plans.length];
                const isActive = friend.claimedWelcomeBonus;
                return {
                  planName: isActive ? plan.name : "Nenhum",
                  planPrice: isActive ? plan.price : 0,
                  commission: isActive ? plan.commission : 0,
                  status: isActive ? "ATIVO" : "REGISTADO"
                };
              };

              const totalGeneratedOnGroup = myReferrals.reduce((sum, friend, idx) => {
                return sum + getSimulatedReferralData(friend, idx).planPrice;
              }, 0);

              const totalCommissionReceived = myReferrals.reduce((sum, friend, idx) => {
                return sum + getSimulatedReferralData(friend, idx).commission;
              }, 0);

              return (
                <>
                  {/* Contador Automático em Círculo e Informações Globais da Rede */}
                  <div className="bg-slate-950/45 backdrop-blur-md rounded-[12px] p-6 border border-white/10 shadow-lg flex flex-col items-center justify-center space-y-4 font-sans text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-400 to-amber-600 animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-orange-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-orange-400" /> Estatísticas Globais da Sua Rede
                    </h3>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-light max-w-sm">
                      Acompanhe o crescimento e comissionamento de 10% sobre o primeiro investimento da sua rede de afiliados. O contador abaixo atualiza-se de forma automática a cada novo registo.
                    </p>

                    {/* Contador Circular de Alta Precisão */}
                    <div className="relative flex items-center justify-center w-36 h-36">
                      {/* SVG Ring Background & Progress */}
                      <svg className="w-36 h-36 transform -rotate-90">
                        {/* Background Circle */}
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          className="stroke-white/5"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* Animated Circular Ring */}
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          className="stroke-orange-500"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 60}
                          strokeDashoffset={2 * Math.PI * 60 * (1 - Math.min(myReferrals.length / 50, 1))}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                        />
                      </svg>
                      {/* Inner Counter label */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white font-mono tracking-tighter">
                          {myReferrals.length}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                          {myReferrals.length === 1 ? "Inscrito" : "Inscritos"}
                        </span>
                      </div>
                    </div>

                    {/* Grid das Estatísticas Globais */}
                    <div className="w-full bg-slate-950/65 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-3 text-xs font-mono text-white">
                      <div className="text-left space-y-1">
                        <span className="text-[10px] text-gray-400 block">COMISSÃO RECEBIDA (10%):</span>
                        <strong className="text-sm text-green-400 font-black">
                          +{totalCommissionReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kz
                        </strong>
                      </div>
                      <div className="text-left space-y-1 border-l border-white/10 pl-3">
                        <span className="text-[10px] text-gray-400 block">TOTAL GERADO NA REDE:</span>
                        <strong className="text-sm text-blue-400 font-black">
                          {totalGeneratedOnGroup.toLocaleString()} kz
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Afilhados / Convidados Detalhada */}
                  <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 border border-white/10 shadow-lg flex flex-col space-y-3 font-sans text-left text-white">
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-blue-400 flex items-center gap-1.5 border-b border-white/10 pb-2">
                      <Users className="w-4 h-4 text-blue-400" /> Lista Oficial de Convidados e Suas Comissões
                    </h3>

                    {myReferrals.length === 0 ? (
                      <div className="bg-white/5 p-6 rounded-xl border border-white/5 text-center text-white/70 font-sans text-xs">
                        Você ainda não possui membros filiados. Copie seu link de indicação na aba de Comunidade para qualificar seu perfil.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {myReferrals.map((friend, idx) => {
                          const refData = getSimulatedReferralData(friend, idx);
                          const redactedPhone = friend.phone
                            ? `${friend.phoneCode || "+244"}${friend.phone.substring(0, 3)}****${friend.phone.slice(-3)}`
                            : "Registo Privado";

                          return (
                            <div 
                              key={idx} 
                              className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex flex-col space-y-2 hover:border-white/10 transition duration-300 hover:scale-[1.01] transform"
                            >
                              <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-xs text-white block">
                                    {friend.fullName || `Membro Convidado #${idx + 1}`}
                                  </span>
                                  <span className="font-mono text-[9px] text-gray-400 block">
                                    Contato: {redactedPhone}
                                  </span>
                                </div>
                                
                                <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded uppercase ${friend.claimedWelcomeBonus ? "bg-green-500/15 text-green-300 border border-green-500/20" : "bg-amber-500/15 text-amber-300 border border-amber-500/20"}`}>
                                  {refData.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300 pt-2 border-t border-white/5">
                                <div>
                                  <span className="text-gray-400 block text-[9px]">COMISSÃO DIRETA (10%):</span>
                                  <strong className="text-green-400">+{refData.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kz</strong>
                                </div>
                                <div className="border-l border-white/10 pl-2">
                                  <span className="text-gray-400 block text-[9px]">PLANO / VALOR INVESTIDO:</span>
                                  <strong className="text-white block truncate text-[10px]">{refData.planName}</strong>
                                  <span className="text-blue-400 text-[9px]">{refData.planPrice > 0 ? `${refData.planPrice.toLocaleString()} kz` : "0,00 kz"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* --- OVERLAY: APOIO E AJUDA (SUPORTE) --- */}
      {activeOverlay === "support" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="support-view-overlay"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <HelpCircle className="w-4 h-4 text-yellow-400" /> Apoio &amp; Atendimento
            </span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all active:scale-90"
              id="close-support-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            {/* Banner de Canais Autorizados */}
            <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 border border-white/10 shadow-lg flex flex-col space-y-3 font-sans text-left text-white text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-yellow-400 flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                <Globe className="w-4 h-4 text-yellow-400" /> Atendimento Fiduciário &amp; Grupos Anglo
              </h3>
              <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                O consórcio garante auditoria, suporte integral e resoluções fiscais no Kwanza (kz) em regime 24/7. Use nossos canais oficiais para falar com a equipe de Joyce ou entrar nas comunidades.
              </p>

              {/* Botões e Links de Atendimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a 
                  href="https://chat.whatsapp.com/EEsv03mwEPVLJonKhhIyTh" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-green-600/25 hover:bg-green-600/40 border border-green-500/30 p-4 rounded-xl flex items-center gap-3 transition text-left cursor-pointer"
                >
                  <Users className="w-7 h-7 text-green-400 flex-shrink-0" />
                  <div>
                    <strong className="text-xs font-bold text-white block">Grupo Geral Fiduciário</strong>
                    <span className="text-[10px] text-gray-300 font-light block">Entrar no WhatsApp</span>
                  </div>
                </a>

                <a 
                  href="mailto:suporte@anglo-fiduciario.com" 
                  className="bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 transition text-left cursor-pointer"
                >
                  <Mail className="w-7 h-7 text-blue-400 flex-shrink-0" />
                  <div>
                    <strong className="text-xs font-bold text-white block">Email de Auditoria Geral</strong>
                    <span className="text-[10px] text-gray-300 font-light block">suporte@anglo-fiduciario.com</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Dúvidas Frequentes (FAQs Accordion) */}
            <div className="bg-slate-950/40 backdrop-blur-md rounded-[12px] p-5 border border-white/10 shadow-lg flex flex-col space-y-3 font-sans text-left text-white">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400 flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                <Info className="w-4 h-4 text-cyan-400" /> Guia de Suporte &amp; Segurança
              </h3>

              <div className="space-y-3 pt-1">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-xs font-bold text-white block">Como funciona o prazo de depósitos?</span>
                  <p className="text-[11px] text-gray-300 leading-normal font-light">
                    O processamento bancário via rede EMIS leva em média 24 horas úteis, dependendo do tempo de compensação do seu banco para a nossa conta de custódia.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-xs font-bold text-white block">Posso alterar meu IBAN de resgate depois de salvo?</span>
                  <p className="text-[11px] text-gray-300 leading-normal font-light">
                    Por políticas rígidas contra vazamento de saldos ou roubo de contas, os dados bancários são permanentemente trancados após a primeira submissão. Para alterações excepcionais, entre em contato com nossa equipe técnica de suporte fiduciário.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-xs font-bold text-white block">O que é a custódia física da Joyce?</span>
                  <p className="text-[11px] text-gray-300 leading-normal font-light">
                    Joyce representa a entidade fiscal encarregada de reconciliar os saques com as vendas físicas de minério do consórcio, dando-lhe lastro real e evitando reajustes cambiais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* DETALHE DO PLANO (MODAL MODAL ACQUISIÇÃO) */}
      {/* ========================================================= */}
      {selectedPlanDetail && userProfile && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="plan-detail-modal">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-white/10 flex flex-col p-6 space-y-4 text-white">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Detalles do Pacote</h3>
              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950/40 border border-white/10 flex-shrink-0">
                <img
                  src={selectedPlanDetail.image}
                  alt={selectedPlanDetail.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  {selectedPlanDetail.name}
                </h4>
                <p className="text-xs text-[#007bff] font-extrabold font-mono pt-0.5">
                  Custo: {selectedPlanDetail.price?.toLocaleString()} kz
                </p>
              </div>
            </div>

            <p className="text-[10px] font-medium text-gray-300 leading-relaxed text-left">
              {selectedPlanDetail.description}
            </p>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs font-mono space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Rendimento Diário:</span>
                <span className="text-green-400 font-extrabold">{selectedPlanDetail.dailyYield} kz</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Duração do Contrato:</span>
                <span className="text-gray-300">{selectedPlanDetail.durationDays || 60} Dias</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-white pt-1 border-t border-white/10">
                <span>Rendimento Total Estimado:</span>
                <span className="text-green-400">{(selectedPlanDetail.dailyYield * (selectedPlanDetail.durationDays || 60)).toLocaleString()} kz</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="w-1/2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                id="btn-cancel-modal"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  if (buyButtonState !== "idle") return;

                  if (selectedPlanDetail.id === "gratis" && myInvestments.some(inv => inv.planId === "gratis")) {
                    setBuyButtonState("error");
                    showToast("Falha: Este plano de teste grátis só pode ser adquirido uma vez por conta!", "error");
                    setTimeout(() => setBuyButtonState("idle"), 3500);
                    return;
                  }
                  
                  if (userProfile.balance < selectedPlanDetail.price) {
                    setBuyButtonState("insufficient");
                    showToast("Saldo insuficiente! Por favor, financie a sua conta para adquirir este plano.", "error");
                    setTimeout(() => setBuyButtonState("idle"), 3500);
                    return;
                  }

                  setBuyButtonState("loading");
                  showToast("Iniciando sincronização e validação do lote mineiro fiduciário...", "info");
                  
                  // Simulate professional cyclic processing spinner duration
                  setTimeout(async () => {
                    try {
                      const userRef = doc(db, "users", userProfile.uid);
                      const nextBalance = userProfile.balance - selectedPlanDetail.price;

                      // 1. Deduzir saldo do utilizador
                      await updateDoc(userRef, {
                        balance: Number(nextBalance.toFixed(2))
                      });

                      // 2. Registar em investments
                      const investmentsColl = collection(db, "users", userProfile.uid, "investments");
                      const newInv = {
                        planId: selectedPlanDetail.id,
                        planName: selectedPlanDetail.name,
                        price: selectedPlanDetail.price,
                        dailyYield: selectedPlanDetail.dailyYield,
                        createdAt: new Date().toISOString(),
                        lastCollectedAt: new Date().toISOString(),
                        totalCollected: 0,
                        durationDays: selectedPlanDetail.durationDays || 60
                      };
                      await addDoc(investmentsColl, newInv);

                      // 3. Registar log de transação fiduciária
                      const txColl = collection(db, "users", userProfile.uid, "transactions");
                      await addDoc(txColl, {
                        type: "purchase",
                        amount: selectedPlanDetail.price,
                        status: "completed",
                        description: `Aquisição de Plano ${selectedPlanDetail.name}`,
                        createdAt: new Date().toISOString()
                      });

                      setBuyButtonState("success");
                      showToast("Lote mineiro Anglo American adquirido com sucesso!", "success");
                      
                      setTimeout(() => {
                        setSelectedPlanDetail(null);
                        setBuyButtonState("idle");
                      }, 2500);

                    } catch (err) {
                      console.error(err);
                      setBuyButtonState("error");
                      showToast("Falha operacional ao processar. Tente novamente mais tarde.", "error");
                      setTimeout(() => setBuyButtonState("idle"), 3000);
                    }
                  }, 2200);
                }}
                disabled={buyButtonState === "loading" || buyButtonState === "success"}
                className={`w-1/2 text-xs font-semibold py-2.5 rounded-xl transition-all uppercase font-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                  buyButtonState === "idle"
                    ? "bg-[#007bff] hover:bg-blue-600 text-white active:scale-95 duration-100"
                    : buyButtonState === "loading"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : buyButtonState === "success"
                    ? "bg-green-500 text-white font-extrabold"
                    : buyButtonState === "insufficient"
                    ? "bg-red-500/80 text-white font-bold animate-pulse"
                    : "bg-red-600 text-white font-bold"
                }`}
                id="btn-buy-modal"
              >
                {buyButtonState === "idle" && "Adquirir plano"}
                {buyButtonState === "loading" && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processando...
                  </>
                )}
                {buyButtonState === "success" && "✓ Sucesso!"}
                {buyButtonState === "insufficient" && "❌ Sem saldo"}
                {buyButtonState === "error" && "❌ Falha operacional"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- OVERLAY: DISPOSIÇÕES E INFORMAÇÕES DE PACOTES --- */}
      {activeOverlay === "package_info_image" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: "url('https://i.postimg.cc/mr3mL17B/Screenshot-20260612-191500-Gallery.jpg')" }}
          id="package-info-image-overlay"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/15 flex justify-between items-center bg-slate-950/60 backdrop-blur-md shadow-lg font-mono text-xs font-bold text-white">
            <span className="flex items-center gap-1.5 uppercase tracking-wide text-white">
              <Briefcase className="w-4 h-4 text-white" /> Informações Dos Pacotes De Aquisição
            </span>
            <button
              onClick={() => setActiveOverlay(null)}
              className="p-1 px-2 text-white/80 hover:bg-white/15 rounded cursor-pointer transition-all active:scale-90"
              id="close-package-info-image-overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start max-w-2xl w-full mx-auto space-y-4">
            <div className="bg-slate-950/65 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center space-y-4 w-full">
              <h3 className="text-sm font-bold text-white font-mono tracking-wider uppercase">Tabela Fiduciária Geral de Aquisição</h3>
              <p className="text-[10px] text-white leading-relaxed max-w-md mx-auto">
                Consulte em detalhe a estrutura e disposições de quotas-partes operacionais vigentes para as minas de transição sob custódia da Anglo American PLC e Joyce fiduciários.
              </p>
              
              <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-900 pointer-events-auto p-1 shadow-2xl">
                <img
                  src="https://i.postimg.cc/m2kqrKFH/file-00000000a04871f497f32607787ad7be.png"
                  alt="Informações dos Pacotes"
                  className="w-full h-auto rounded-lg object-contain shadow-md mx-auto hover:scale-[1.02] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveOverlay(null)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold font-mono text-[10px] py-2.5 px-6 rounded-xl uppercase tracking-wider transition-all cursor-pointer border border-white/10"
                >
                  Confirmar e Voltar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- CONTROLE DE GERENCIAMENTO CENTRAL (ADMINISTRADOR INTERFACE) --- */}
      {activeOverlay === "admin" && isUserAdmin(user, userProfile) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white font-sans overflow-hidden"
          id="admin-dashboard-container-overlay"
        >
          {/* Header Superior Administrativo */}
          <div className="p-4 border-b border-white/10 bg-slate-900 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-bold text-xs tracking-widest uppercase text-white font-mono">
                Anglo American • Sistema Administrador Geral
              </span>
            </div>
            
            {/* Contador em Tempo Real de Solicitações Pendentes */}
            <div className="flex items-center gap-2 bg-slate-800 border border-white/10 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-extrabold font-mono text-white">
                SOLICITAÇÕES PENDENTES: {pendingTransactions.length}
              </span>
            </div>

            <button
              onClick={() => {
                setActiveOverlay(null);
                setSelectedUserDetail(null);
              }}
              className="p-1 px-3 text-white hover:text-gray-200 hover:bg-slate-800 rounded font-bold text-xs cursor-pointer transition border border-white/15 active:scale-95"
              id="close-admin-portal-button"
            >
              Fechar Painel [X]
            </button>
          </div>

          {/* Abas Opções de Navegação Administrativa */}
          <div className="flex border-b border-white/10 bg-slate-900 p-1 gap-1">
            <button
              onClick={() => {
                setAdminActiveTab("operations");
                setSelectedUserDetail(null);
              }}
              className={`flex-1 py-3 text-center rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                adminActiveTab === "operations"
                  ? "bg-white text-slate-950 font-black shadow-md font-extrabold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Controle Geral</span>
            </button>
            <button
              onClick={() => {
                setAdminActiveTab("transactions");
                setSelectedUserDetail(null);
              }}
              className={`flex-1 py-3 text-center rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
                adminActiveTab === "transactions"
                  ? "bg-white text-slate-950 font-black shadow-md font-extrabold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Solicitações</span>
              {pendingTransactions.length > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {pendingTransactions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setAdminActiveTab("users");
                setSelectedUserDetail(null);
              }}
              className={`flex-1 py-3 text-center rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                adminActiveTab === "users"
                  ? "bg-white text-slate-950 font-black shadow-md font-extrabold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Utilizadores</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl w-full mx-auto pb-12">
            
            {/* Seção 1: Configuração Global e Bloqueio */}
            {adminActiveTab === "operations" && (
              <div className="bg-slate-900 rounded-2xl border border-white/10 p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-white" /> Bloqueio Global do Centro de Operações
                  </h3>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    operationsBlocked ? "bg-red-500/20 text-red-300 font-extrabold" : "bg-green-500/20 text-green-300 font-extrabold"
                  }`}>
                    {operationsBlocked ? "BLOQUEADO" : "DESBLOQUEADO (ATIVO)"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">CENTRO DE OPERAÇÕES DO UTILIZADOR</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-light">
                      Ao ativar o bloqueio generalizado, o sistema de giros e rendimentos de todos os usuários fica imediatamente inacessível para manutenção fiduciária.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const globalRef = doc(db, "globals", "operations");
                        const newState = !operationsBlocked;
                        await setDoc(globalRef, { blocked: newState });
                        setOperationsBlocked(newState);
                        showToast(`Operações globalmente ${newState ? "BLOQUEADAS" : "DESBLOQUEADAS"}!`, "success");
                      } catch (err) {
                        alert("Erro ao alterar bloqueio global: " + err);
                      }
                    }}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold font-mono text-xs uppercase transition shadow-md cursor-pointer ${
                      operationsBlocked 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-white text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    {operationsBlocked ? "Liberar Sistema" : "Bloquear Sistema Global"}
                  </button>
                </div>
              </div>
            )}

            {/* Seção 2: Novos Depósitos e Levantamentos */}
            {adminActiveTab === "transactions" && (
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5 pb-2 border-b border-white/5">
                  <History className="w-4 h-4 text-white" /> Solicitações Operacionais (Depósitos & Levantamentos)
                </h3>
                
                {pendingTransactions.length === 0 ? (
                  <p className="text-[11px] text-gray-400 text-center py-6 font-mono">
                    Nenhuma transação pendente para aprovação no consórcio.
                  </p>
                ) : (
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {pendingTransactions.map((tx, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded font-mono block w-fit mb-1 ${
                              tx.type === "deposit" ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"
                            }`}>
                              {tx.type === "deposit" ? "DEPÓSITO PENDENTE" : "LEVANTAMENTO PENDENTE"}
                            </span>
                            <span className="text-xs font-extrabold text-white block">
                              Investidor: {tx.userFullName}
                            </span>
                            <span className="text-[9px] font-mono text-gray-400 block break-all">
                              ID de Registro: {tx.userUid}
                            </span>
                            <span className="text-[9px] font-mono text-gray-500 block">
                              Solicitado em: {new Date(tx.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <strong className="text-xs font-mono font-black text-green-400">
                            {tx.amount.toLocaleString()} kz
                          </strong>
                        </div>

                        {tx.proofUrl && (
                          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5 text-xs text-blue-300">
                            <span className="text-[9px] text-gray-400 block mb-0.5">FOTO/COMPROVATIVO ANEXADO:</span>
                            <a 
                              href={tx.proofUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="underline font-bold text-blue-400 hover:text-blue-300 break-all"
                            >
                              Abrir Comprovativo [Clique aqui para visualizar]
                            </a>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                          <button
                            onClick={async () => {
                              if (!confirm("Confirmar aprovação desta transação de " + tx.amount + " kz?")) return;
                              try {
                                const userRef = doc(db, "users", tx.userUid);
                                const txRef = doc(db, "users", tx.userUid, "transactions", tx.id);
                                
                                if (tx.type === "deposit") {
                                  const userDoc = await getDoc(userRef);
                                  if (userDoc.exists()) {
                                    const userData = userDoc.data();
                                    const curBal = userData.balance || 0;
                                    await updateDoc(userRef, { balance: curBal + tx.amount });
                                  }
                                }
                                
                                await updateDoc(txRef, { status: "completed" });
                                showToast("Transação aprovada com sucesso!", "success");
                                if (selectedUserDetail && selectedUserDetail.uid === tx.userUid) {
                                  await refreshSelectedUser(tx.userUid);
                                }
                                await loadAllAdminData();
                              } catch (err) {
                                alert("Erro ao aprovar: " + err);
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold font-mono text-[9px] px-3.5 py-1.5 rounded-lg uppercase cursor-pointer"
                          >
                            Aprovar ✔
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("Confirmar rejeição desta transação?")) return;
                              try {
                                const userRef = doc(db, "users", tx.userUid);
                                const txRef = doc(db, "users", tx.userUid, "transactions", tx.id);
                                
                                if (tx.type === "withdrawal") {
                                  const userDoc = await getDoc(userRef);
                                  if (userDoc.exists()) {
                                    const userData = userDoc.data();
                                    const curBal = userData.balance || 0;
                                    await updateDoc(userRef, { balance: curBal + tx.amount });
                                  }
                                }
                                
                                await updateDoc(txRef, { status: "rejected" });
                                showToast("Transação rejeitada com sucesso.", "success");
                                if (selectedUserDetail && selectedUserDetail.uid === tx.userUid) {
                                  await refreshSelectedUser(tx.userUid);
                                }
                                await loadAllAdminData();
                              } catch (err) {
                                alert("Erro ao rejeitar: " + err);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold font-mono text-[9px] px-3.5 py-1.5 rounded-lg uppercase cursor-pointer"
                          >
                            Rejeitar ✖
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Seção 3: Pesquisa e Edição Detalhada */}
            {adminActiveTab === "users" && (
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5 pb-2 border-b border-white/5">
                  <User className="w-4 h-4 text-white" /> Configurações de Cadastro e Dados Operacionais
                </h3>

              {/* Input ID */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Introduza o ID (UID) exato do usuário..."
                  value={adminSearchInput}
                  onChange={(e) => setAdminSearchInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={async () => {
                    const cleanId = adminSearchInput.trim();
                    if (!cleanId) return alert("Indique o ID.");
                    try {
                      const userRef = doc(db, "users", cleanId);
                      const snap = await getDoc(userRef);
                      if (snap.exists()) {
                        const uData = snap.data();
                        const invSnapshot = await getDocs(collection(db, "users", cleanId, "investments"));
                        const invList: any[] = [];
                        invSnapshot.forEach((d) => invList.push({ id: d.id, ...d.data() }));
                        
                        setSelectedUserDetail({ uid: snap.id, ...uData, hasInvestments: invList.length > 0 });
                        setSelectedUserInvestments(invList);
                        
                        // populate
                        setAdminEditName(uData.fullName || "");
                        setAdminEditPhone(uData.phone || "");
                        setAdminEditEmail(uData.email || "");
                        setAdminEditBankName(uData.bankName || "");
                        setAdminEditBankAccount(uData.bankAccount || "");
                        setAdminEditBankHolder(uData.bankHolder || "");
                        showToast("Usuário carregado com sucesso!", "success");
                      } else {
                        alert("Usuário não cadastrado.");
                      }
                    } catch (err) {
                      alert("Erro: " + err);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl transition cursor-pointer font-mono shadow-md whitespace-nowrap"
                >
                  Pesquisar por ID
                </button>
              </div>

              {selectedUserDetail && (
                <div className="bg-white/5 p-5 rounded-2xl border border-purple-500/25 space-y-6 text-left animate-fade-in">
                  <div className="flex justify-between items-start pb-3 border-b border-white/10">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase">FICHA CADASTRAL:</span>
                      <h4 className="text-sm font-black text-white">{selectedUserDetail.fullName}</h4>
                      <p className="text-[9px] font-mono text-purple-400 break-all">{selectedUserDetail.uid}</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const userRef = doc(db, "users", selectedUserDetail.uid);
                          const nextBanned = !selectedUserDetail.banned;
                          await updateDoc(userRef, { banned: nextBanned });
                          setSelectedUserDetail((prev: any) => ({ ...prev, banned: nextBanned }));
                          await loadAllAdminData();
                          showToast(`Utilizador ${nextBanned ? "BANIDO" : "RECUPERADO"}!`, "success");
                        } catch (err) {
                          alert("Apenas admin root pode aplicar restrição estrutural: " + err);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase transition cursor-pointer border ${
                        selectedUserDetail.banned 
                          ? "bg-red-500/20 text-red-300 border-red-500/30 font-black" 
                          : "bg-green-500/10 text-green-400 border-green-500/20"
                      }`}
                    >
                      {selectedUserDetail.banned ? "🚫 BANIDO [Clique para Desbanir]" : "✔ ATIVO [Clique para Banir]"}
                    </button>
                  </div>

                  {/* Formulários Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Alterar Pessoais */}
                    <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-purple-300 font-mono block border-b border-white/5 pb-1">👤 ATUALIZAR DADOS CADASTRAIS</span>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-1">Nome Completo:</label>
                          <input 
                            type="text" 
                            value={adminEditName} 
                            onChange={(e) => setAdminEditName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-1">Email:</label>
                          <input 
                            type="email" 
                            value={adminEditEmail} 
                            onChange={(e) => setAdminEditEmail(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-gray-300"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-1">Contacto:</label>
                          <input 
                            type="text" 
                            value={adminEditPhone} 
                            onChange={(e) => setAdminEditPhone(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const ref = doc(db, "users", selectedUserDetail.uid);
                              const fields = { fullName: adminEditName, email: adminEditEmail, phone: adminEditPhone };
                              await updateDoc(ref, fields);
                              await refreshSelectedUser(selectedUserDetail.uid);
                              await loadAllAdminData();
                              showToast("Identidade salva com sucesso!", "success");
                            } catch (err) {
                              alert("Erro: " + err);
                            }
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-[9px] py-1.5 rounded-lg border border-white/10 uppercase cursor-pointer"
                        >
                          Gravar Identidade
                        </button>
                      </div>
                    </div>

                    {/* Editar Bancários */}
                    <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-[10px] font-bold text-blue-300 font-mono block">💳 COORDENADAS BANCÁRIAS</span>
                        <button
                          onClick={async () => {
                            if (!confirm("Excluir os dados bancários deste usuário?")) return;
                            try {
                              const ref = doc(db, "users", selectedUserDetail.uid);
                              const fields = { bankName: "", bankAccount: "", bankHolder: "" };
                              await updateDoc(ref, fields);
                              await refreshSelectedUser(selectedUserDetail.uid);
                              await loadAllAdminData();
                              showToast("Dados bancários zerados!", "success");
                            } catch (err) {
                              alert("Erro: " + err);
                            }
                          }}
                          className="text-[9px] text-red-400 hover:underline font-bold"
                        >
                          Excluir Coordenadas
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-1">Banco:</label>
                          <input 
                            type="text" 
                            value={adminEditBankName} 
                            placeholder="Ex: BAI, BFA, BIC"
                            onChange={(e) => setAdminEditBankName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-1">IBAN / Conta:</label>
                          <input 
                            type="text" 
                            value={adminEditBankAccount} 
                            placeholder="AO06..."
                            onChange={(e) => setAdminEditBankAccount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 block mb-1">Titular:</label>
                          <input 
                            type="text" 
                            value={adminEditBankHolder} 
                            onChange={(e) => setAdminEditBankHolder(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const ref = doc(db, "users", selectedUserDetail.uid);
                              const fields = { bankName: adminEditBankName, bankAccount: adminEditBankAccount, bankHolder: adminEditBankHolder };
                              await updateDoc(ref, fields);
                              await refreshSelectedUser(selectedUserDetail.uid);
                              await loadAllAdminData();
                              showToast("Dados bancários salvos!", "success");
                            } catch (err) {
                              alert("Erro: " + err);
                            }
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-[9px] py-1.5 rounded-lg border border-white/10 uppercase cursor-pointer"
                        >
                          Salvar Dados Bancários
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Gerenciar Saldos */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[9px] text-gray-400 block font-mono">SALDO FICENCIÁRIO ATUAL:</span>
                        <strong className="text-base text-green-400 font-mono font-black block">
                          {(selectedUserDetail.balance || 0).toLocaleString()} kz
                        </strong>
                      </div>
                      <div className="flex gap-2 items-center w-full sm:w-auto">
                        <input
                          type="number"
                          placeholder="Quantia em Kz..."
                          value={adminBalanceChangeInput}
                          onChange={(e) => setAdminBalanceChangeInput(e.target.value)}
                          className="w-full sm:w-32 bg-slate-950 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none"
                        />
                        <button
                          onClick={async () => {
                            const val = parseFloat(adminBalanceChangeInput);
                            if (isNaN(val) || val <= 0) return alert("Indique quantia válida.");
                            try {
                              const ref = doc(db, "users", selectedUserDetail.uid);
                              const current = selectedUserDetail.balance || 0;
                              const next = current + val;
                              await updateDoc(ref, { balance: next });
                              await refreshSelectedUser(selectedUserDetail.uid);
                              await loadAllAdminData();
                              setAdminBalanceChangeInput("");
                              showToast(`Fundos adicionados: +${val.toLocaleString()} kz`, "success");
                            } catch (err) {
                              alert("Erro: " + err);
                            }
                          }}
                          className="px-3.5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] font-mono rounded-lg uppercase cursor-pointer"
                        >
                          + Crédito
                        </button>
                        <button
                          onClick={async () => {
                            const val = parseFloat(adminBalanceChangeInput);
                            if (isNaN(val) || val <= 0) return alert("Indique quantia válida.");
                            try {
                              const ref = doc(db, "users", selectedUserDetail.uid);
                              const current = selectedUserDetail.balance || 0;
                              const next = Math.max(0, current - val);
                              await updateDoc(ref, { balance: next });
                              await refreshSelectedUser(selectedUserDetail.uid);
                              await loadAllAdminData();
                              setAdminBalanceChangeInput("");
                              showToast(`Fundos deduzidos: -${val.toLocaleString()} kz`, "success");
                            } catch (err) {
                              alert("Erro: " + err);
                            }
                          }}
                          className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] font-mono rounded-lg uppercase cursor-pointer"
                        >
                          - Débito
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contratos Ativos de Prospecção */}
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-2">
                      <span className="text-[10px] font-bold text-orange-400 font-mono block">💎 CONTRATOS ATIVOS DO UTILIZADOR ({selectedUserInvestments.length})</span>
                      <div className="flex gap-2 items-center w-full sm:w-auto">
                        <select
                          value={adminSelectedPlanToAdd}
                          onChange={(e) => setAdminSelectedPlanToAdd(e.target.value)}
                          className="bg-slate-900 border border-white/15 text-xs rounded-lg p-1.5 font-mono text-white focus:outline-none"
                        >
                          <option value="">-- Adicionar Plano Novo --</option>
                          {INVESTMENT_PLANS.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()} kz)</option>
                          ))}
                        </select>
                        <button
                          onClick={async () => {
                            if (!adminSelectedPlanToAdd) return alert("Selecione um plano.");
                            const plan = INVESTMENT_PLANS.find(p => p.id === adminSelectedPlanToAdd);
                            if (!plan) return;
                            try {
                              const newInv = {
                                planId: plan.id,
                                planName: plan.name,
                                price: plan.price,
                                dailyYield: plan.dailyYield,
                                createdAt: new Date().toISOString(),
                                lastCollectedAt: new Date().toISOString(),
                                totalCollected: 0,
                                durationDays: plan.durationDays || 60
                              };
                              const collRef = collection(db, "users", selectedUserDetail.uid, "investments");
                              await addDoc(collRef, newInv);
                              
                              // reload
                              await refreshSelectedUser(selectedUserDetail.uid);
                              await loadAllAdminData();
                              setAdminSelectedPlanToAdd("");
                              showToast(`Plano ${plan.name} ativado com sucesso!`, "success");
                            } catch (err) {
                              alert("Erro ao inserir plano: " + err);
                            }
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold font-mono text-[9px] px-3.5 py-2.5 rounded-lg uppercase cursor-pointer transition whitespace-nowrap"
                        >
                          + Inserir Plano
                        </button>
                      </div>
                    </div>

                    {selectedUserInvestments.length === 0 ? (
                      <p className="text-[10px] text-gray-500 font-mono">Esta conta não detém quotas operacionais fiduciárias ativas.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-36 overflow-y-auto pr-1">
                        {selectedUserInvestments.map((inv, idx) => (
                          <div key={idx} className="bg-slate-900 border border-white/10 p-3 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <strong className="text-white block font-bold truncate">{inv.planName}</strong>
                              <span className="text-[9px] font-mono text-gray-400 block">Adquirido: {inv.price?.toLocaleString()} kz</span>
                              <span className="text-[9px] font-mono text-green-400 block">Rendimento/Dia: {inv.dailyYield?.toLocaleString()} kz</span>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm("Deseja mesmo remover permanentemente este investimento ativo do usuário?")) return;
                                try {
                                  await deleteDoc(doc(db, "users", selectedUserDetail.uid, "investments", inv.id));
                                  await refreshSelectedUser(selectedUserDetail.uid);
                                  await loadAllAdminData();
                                  showToast("Investimento deletado com sucesso.", "success");
                                } catch (err) {
                                  alert("Erro: " + err);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/25 cursor-pointer transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Lista Geral de usuários em Banco de Dados */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Tabela Fiduciária ({adminUsers.length} cadastros):</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdminUserFilter("all")}
                      className={`px-3 py-1.5 font-mono text-[9px] font-bold rounded-lg uppercase border transition ${
                        adminUserFilter === "all" ? "bg-purple-600 text-white border-purple-500 font-extrabold" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setAdminUserFilter("with")}
                      className={`px-3 py-1.5 font-mono text-[9px] font-bold rounded-lg uppercase border transition ${
                        adminUserFilter === "with" ? "bg-purple-600 text-white border-purple-500 font-extrabold" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      Com quotas
                    </button>
                    <button
                      onClick={() => setAdminUserFilter("without")}
                      className={`px-3 py-1.5 font-mono text-[9px] font-bold rounded-lg uppercase border transition ${
                        adminUserFilter === "without" ? "bg-purple-600 text-white border-purple-500 font-extrabold" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      Sem quotas
                    </button>
                  </div>
                </div>

                <div className="border border-white/10 rounded-xl overflow-x-auto bg-slate-950/60 max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse font-sans text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 border-b border-white/10 font-mono text-gray-400 text-[10px]">
                        <th className="p-3">Utilizador / Cadastro</th>
                        <th className="p-3">UID Único</th>
                        <th className="p-3">Status Fiduciário</th>
                        <th className="p-3">Saldo</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers
                        .filter(u => {
                          if (adminUserFilter === "with") return u.hasInvestments;
                          if (adminUserFilter === "without") return !u.hasInvestments;
                          return true;
                        })
                        .map((u, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-3 font-semibold">
                              <span className="block text-white font-bold">{u.fullName || "Utilizador Cooperante"}</span>
                              <span className="block font-mono text-[9px] text-gray-400 leading-tight">{u.email}</span>
                            </td>
                            <td className="p-3">
                              <span className="block font-mono text-[9px] text-purple-400 select-all">{u.uid}</span>
                              <span className="block font-mono text-[9px] text-gray-400">Fone: {u.phone || "Indefinido"}</span>
                            </td>
                            <td className="p-3">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                                u.hasInvestments ? "bg-orange-500/15 text-orange-300 border border-orange-500/10" : "bg-gray-500/15 text-gray-450"
                              }`}>
                                {u.hasInvestments ? "Contrato Ativo" : "Sem Planos"}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-green-400">
                              {(u.balance || 0).toLocaleString()} kz
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={async () => {
                                  setAdminSearchInput(u.uid);
                                  try {
                                    const userRef = doc(db, "users", u.uid);
                                    const snap = await getDoc(userRef);
                                    if (snap.exists()) {
                                      const uData = snap.data();
                                      const invSnapshot = await getDocs(collection(db, "users", u.uid, "investments"));
                                      const invList: any[] = [];
                                      invSnapshot.forEach((d) => invList.push({ id: d.id, ...d.data() }));
                                      
                                      setSelectedUserDetail({ uid: u.uid, ...uData, hasInvestments: invList.length > 0 });
                                      setSelectedUserInvestments(invList);
                                      
                                      setAdminEditName(uData.fullName || "");
                                      setAdminEditPhone(uData.phone || "");
                                      setAdminEditEmail(uData.email || "");
                                      setAdminEditBankName(uData.bankName || "");
                                      setAdminEditBankAccount(uData.bankAccount || "");
                                      setAdminEditBankHolder(uData.bankHolder || "");
                                      showToast("Utilizador selecionado!", "success");
                                    }
                                  } catch (err) {
                                    alert("Falha ao carregar: " + err);
                                  }
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-bold font-mono px-2 py-1 rounded cursor-pointer leading-tight transition"
                              >
                                Editar 🛠
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            )}

          </div>
        </motion.div>
      )}


    </div>
  );
}
