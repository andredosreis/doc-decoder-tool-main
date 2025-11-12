/**
 * 🎯 CONFIGURAÇÕES CENTRALIZADAS DA APLICAÇÃO
 * 
 * Este arquivo contém TODAS as configurações que você pode querer mudar
 * sem mexer em múltiplos arquivos.
 * 
 * ONDE MUDAR: Altere os valores abaixo conforme sua necessidade
 */

// ========================
// 📱 INFORMAÇÕES DO APP
// ========================
export const APP_CONFIG = {
  // Nome da plataforma (aparece no header, título da página, etc.)
  name: "APP XPRO",
  
  // Descrição para SEO
  description: "Transforme PDFs em Apps PWA Profissionais - Sem código, sem fricção",
  
  // URL base (mudar quando tiver domínio próprio)
  // ONDE MUDAR: Quando publicar, trocar para seu domínio
  baseUrl: "https://seuapp.lovable.app",
  
  // Email de suporte
  supportEmail: "suporte@docdecodertool.com",
  
  // Links de redes sociais (deixar vazio se não usar)
  social: {
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
  },
  
  // CTAs principais
  mainCTA: "Transformar Meu Conteúdo",
  secondaryCTA: "Ver Demo Ao Vivo",
} as const;

// ========================
// 🎨 TEMAS PRÉ-DEFINIDOS
// ========================
// ONDE MUDAR: Adicionar mais presets de cores ou modificar existentes
export const THEME_PRESETS = {
  blue: {
    name: "Azul Profissional",
    primary: "217 91% 60%",        // HSL: azul vibrante
    secondary: "210 40% 96%",      // HSL: azul muito claro
    accent: "217 91% 55%",         // HSL: azul médio
  },
  purple: {
    name: "Roxo Moderno",
    primary: "262 83% 58%",
    secondary: "270 20% 96%",
    accent: "262 83% 50%",
  },
  green: {
    name: "Verde Sucesso",
    primary: "142 76% 36%",
    secondary: "138 76% 97%",
    accent: "142 76% 30%",
  },
  orange: {
    name: "Laranja Energia",
    primary: "25 95% 53%",
    secondary: "24 100% 97%",
    accent: "25 95% 48%",
  },
  // ONDE MUDAR: Adicionar mais temas aqui
  // custom: {
  //   name: "Meu Tema",
  //   primary: "XXX XX% XX%",
  //   secondary: "XXX XX% XX%",
  //   accent: "XXX XX% XX%",
  // },
} as const;

// ========================
// 🔐 CONFIGURAÇÕES DE AUTENTICAÇÃO
// ========================
export const AUTH_CONFIG = {
  // Tempo de expiração da sessão (em dias)
  sessionExpiryDays: 30,
  
  // Permitir cadastro de novos admins? (false = apenas por convite)
  allowSignup: true,
  
  // Campos obrigatórios no cadastro
  requiredSignupFields: {
    name: true,
    email: true,
    phone: false,
  },
  
  // Redirecionar após login
  redirectAfterLogin: "/admin/dashboard",
} as const;

// ========================
// 📹 CONFIGURAÇÕES DE MÍDIA
// ========================
export const MEDIA_CONFIG = {
  // Tamanho máximo de upload (em MB)
  // ONDE MUDAR: Ajustar conforme plano do Supabase
  maxUploadSizeMB: {
    image: 5,      // Imagens: 5MB
    video: 500,    // Vídeos: 500MB
    pdf: 20,       // PDFs: 20MB
  },
  
  // Formatos aceitos
  acceptedFormats: {
    image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    video: ["video/mp4", "video/webm"],
    pdf: ["application/pdf"],
  },
  
  // Qualidade de compressão de imagens (0-1)
  imageQuality: 0.85,
};

// ========================
// 💳 PLATAFORMAS DE PAGAMENTO SUPORTADAS
// ========================
// ONDE MUDAR: Adicionar ou remover plataformas conforme necessário
export const PAYMENT_PLATFORMS: Array<{
  id: string;
  name: string;
  webhookPath: string;
}> = [
  { 
    id: "hotmart", 
    name: "Hotmart",
    webhookPath: "/payment-webhook?platform=hotmart",
  },
  { 
    id: "kiwify", 
    name: "Kiwify",
    webhookPath: "/payment-webhook?platform=kiwify",
  },
  { 
    id: "monetizze", 
    name: "Monetizze",
    webhookPath: "/payment-webhook?platform=monetizze",
  },
  { 
    id: "eduzz", 
    name: "Eduzz",
    webhookPath: "/payment-webhook?platform=eduzz",
  },
  // ONDE MUDAR: Adicionar mais plataformas aqui
];

// ========================
// 📊 CONFIGURAÇÕES DE ANALYTICS
// ========================
export const ANALYTICS_CONFIG = {
  // Ativar rastreamento de eventos
  enabled: true,
  
  // Eventos rastreados
  trackEvents: {
    moduleComplete: true,
    videoWatch: true,
    pdfOpen: true,
    login: true,
  },
} as const;

// ========================
// 🌐 CONFIGURAÇÕES PWA
// ========================
export const PWA_CONFIG = {
  // Nome do app quando instalado
  appName: "MinhaPlataforma",
  
  // Nome curto (aparece na tela inicial)
  shortName: "MinhaPlataforma",
  
  // Cor do tema (barra de status no mobile)
  // ONDE MUDAR: Usar cor primária do seu tema
  themeColor: "#3b82f6",
  
  // Cor de fundo da splash screen
  backgroundColor: "#ffffff",
} as const;

// ========================
// 🔔 CONFIGURAÇÕES DE NOTIFICAÇÕES
// ========================
export const NOTIFICATION_CONFIG = {
  // Enviar email de boas-vindas?
  sendWelcomeEmail: true,
  
  // Notificar admin sobre novas compras?
  notifyAdminOnPurchase: true,
  
  // Lembrar usuário de continuar conteúdo (em dias)
  reminderAfterDays: 7,
} as const;

// ========================
// 🛠️ CONFIGURAÇÕES DE DESENVOLVIMENTO
// ========================
export const DEV_CONFIG = {
  // Mostrar logs de debug no console?
  showDebugLogs: true,
  
  // Modo de desenvolvimento
  isDevelopment: import.meta.env.DEV,
  
  // Seed data para testes (criar dados falsos)
  useSeedData: false,
} as const;

// ========================
// 📝 CONFIGURAÇÕES DE CONTEÚDO
// ========================
export const CONTENT_CONFIG = {
  // Tipos de módulos suportados
  moduleTypes: [
    { id: "video", label: "Vídeo", icon: "🎥" },
    { id: "pdf", label: "PDF", icon: "📄" },
    { id: "text", label: "Texto", icon: "📝" },
    { id: "quiz", label: "Quiz", icon: "❓" },
    // ONDE MUDAR: Adicionar mais tipos aqui
  ],
  
  // Progresso mínimo para marcar como concluído (%)
  completionThreshold: 90,
  
  // Permitir download de PDFs?
  allowPdfDownload: false,
  
  // Velocidades disponíveis no player de vídeo
  videoPlaybackSpeeds: [0.5, 0.75, 1, 1.25, 1.5, 2],
} as const;

// ========================
// 🎯 FEATURES FLAGS
// ========================
// ONDE MUDAR: Ativar/desativar funcionalidades
export const FEATURES = {
  // Funcionalidades do Admin
  admin: {
    multipleApps: true,           // Criar múltiplos apps
    customization: true,          // Personalização de tema
    analytics: true,              // Dashboard de analytics
    bulkImport: false,            // Import em massa de conteúdo (TODO)
  },
  
  // Funcionalidades do Cliente
  client: {
    downloadCertificate: false,   // Certificado de conclusão (TODO)
    comments: false,              // Comentários em módulos (TODO)
    favorites: true,              // Favoritar módulos
    watchLater: true,             // Assistir depois
    notes: false,                 // Anotações pessoais (TODO)
  },
  
  // Integrações
  integrations: {
    whatsapp: false,              // Notificações WhatsApp (TODO)
    email: true,                  // Notificações Email
    stripe: false,                // Pagamento direto Stripe (TODO)
    calendar: false,              // Integração com calendário (TODO)
  },
} as const;

// ========================
// 🌍 INTERNACIONALIZAÇÃO
// ========================
// ONDE MUDAR: Adicionar traduções para outros idiomas
export const I18N_CONFIG = {
  defaultLanguage: "pt-BR",
  supportedLanguages: ["pt-BR"], // Adicionar: "en", "es", etc.
} as const;

// ========================
// 💾 STORAGE BUCKETS
// ========================
// ONDE MUDAR: Se criar buckets com nomes diferentes no Supabase
export const STORAGE_BUCKETS = {
  products: "products",      // Imagens de produtos
  modules: "modules",        // Vídeos e PDFs
  avatars: "avatars",        // Fotos de perfil
  logos: "logos",            // Logos dos apps
} as const;

/**
 * ⚠️ ATENÇÃO: NÃO MODIFICAR ABAIXO DESTA LINHA
 * As funções abaixo são helpers que usam as configurações acima
 */

// Helper: Obter URL completa
export const getFullUrl = (path: string) => {
  return `${APP_CONFIG.baseUrl}${path}`;
};

// Helper: Validar tamanho de arquivo
export const isFileSizeValid = (file: File, type: keyof typeof MEDIA_CONFIG.maxUploadSizeMB) => {
  const maxSizeBytes = MEDIA_CONFIG.maxUploadSizeMB[type] * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Helper: Validar formato de arquivo
export const isFileFormatValid = (file: File, type: keyof typeof MEDIA_CONFIG.acceptedFormats) => {
  return MEDIA_CONFIG.acceptedFormats[type].includes(file.type);
};

// Helper: Obter webhook URL completo
export const getWebhookUrl = (platformId: string): string | null => {
  const platform = PAYMENT_PLATFORMS.find(p => p.id === platformId);
  return platform ? `${APP_CONFIG.baseUrl}${platform.webhookPath}` : null;
};
