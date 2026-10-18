/**
 * SAP BTP Solution Diagrams — Architecture Icons Library
 * Based on the official SAP BTP Solution Diagrams guidelines:
 * https://sap.github.io/btp-solution-diagrams/docs/btp_guideline/diagr_comp/icons/
 */

export interface SapArchitectureIcon {
  id: string;
  title: string;
  category: SapIconCategory;
  description: string;
  color: string;
  tags: string[];
  svg: string;
  drawioXml: string;
}

export type SapIconCategory =
  | 'Integration Suite'
  | 'Data & Analytics'
  | 'Foundational Services'
  | 'Business AI'
  | 'Security & Identity'
  | 'Enterprise Applications'
  | 'Architecture Actors';

export const SAP_ICON_CATEGORIES: SapIconCategory[] = [
  'Integration Suite',
  'Data & Analytics',
  'Foundational Services',
  'Business AI',
  'Security & Identity',
  'Enterprise Applications',
  'Architecture Actors',
];

/**
 * Creates a clean SVG data URI for use in board image elements
 */
export function getSvgDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

/**
 * Generate standard draw.io mxCell XML for an icon
 */
export function createDrawioIconXml(title: string, svgDataUri: string, width = 64, height = 64): string {
  return `<mxCell id="sap_${Date.now()}" value="${title}" style="shape=image;verticalLabelPosition=bottom;labelBackgroundColor=none;verticalAlign=top;aspect=fixed;imageAspect=0;image=${svgDataUri};" vertex="1" parent="1">
  <mxGeometry width="${width}" height="${height}" as="geometry"/>
</mxCell>`;
}

export const SAP_ARCHITECTURE_ICONS: SapArchitectureIcon[] = [
  // --- INTEGRATION SUITE ---
  {
    id: 'sap-btp-integration-suite',
    title: 'SAP Integration Suite',
    category: 'Integration Suite',
    description: 'Enterprise integration platform-as-a-service (iPaaS)',
    color: '#5D36FF',
    tags: ['integration', 'ipaas', 'api', 'cloud', 'middleware', 'btp'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#5D36FF"/>
      <circle cx="20" cy="20" r="7" fill="#FFFFFF"/>
      <circle cx="44" cy="20" r="7" fill="#FFFFFF"/>
      <circle cx="32" cy="44" r="7" fill="#FFFFFF"/>
      <path d="M25 22 L39 22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <path d="M23 25 L29 39" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <path d="M41 25 L35 39" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="30" r="3.5" fill="#C4B5FD"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-cloud-integration',
    title: 'Cloud Integration (CPI)',
    category: 'Integration Suite',
    description: 'Core process integration, mappings, and adapter orchestration',
    color: '#0070F2',
    tags: ['cpi', 'process', 'mapping', 'adapters', 'flows', 'integration'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#0070F2"/>
      <path d="M18 36 C18 30 23 25 29 25 C31 21 35 18 40 18 C46 18 51 22 52 28 C55 29 57 32 57 36 C57 41 53 45 48 45 L20 45 C15 45 11 41 11 36 C11 32 14 28 18 27" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 38 L32 30 L40 38" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M32 30 L32 44" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-api-management',
    title: 'API Management',
    category: 'Integration Suite',
    description: 'Design, secure, manage, and govern enterprise APIs',
    color: '#0854A0',
    tags: ['api', 'gateway', 'rest', 'odata', 'governance', 'security'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#0854A0"/>
      <rect x="14" y="16" width="36" height="32" rx="6" fill="none" stroke="#FFFFFF" stroke-width="3.5"/>
      <path d="M22 26 L18 32 L22 38" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M42 26 L46 32 L42 38" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="32" r="4" fill="#67E8F9"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-event-mesh',
    title: 'SAP Event Mesh',
    category: 'Integration Suite',
    description: 'Event-driven architecture and asynchronous messaging',
    color: '#7C3AED',
    tags: ['event', 'messaging', 'queue', 'pubsub', 'kafka', 'amqp'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#7C3AED"/>
      <circle cx="32" cy="32" r="8" fill="#FFFFFF"/>
      <circle cx="16" cy="18" r="5" fill="#E9D5FF"/>
      <circle cx="48" cy="18" r="5" fill="#E9D5FF"/>
      <circle cx="16" cy="46" r="5" fill="#E9D5FF"/>
      <circle cx="48" cy="46" r="5" fill="#E9D5FF"/>
      <path d="M20 21 L26 27 M44 21 L38 27 M20 43 L26 37 M44 43 L38 37" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },

  // --- DATA & ANALYTICS ---
  {
    id: 'sap-btp-hana-cloud',
    title: 'SAP HANA Cloud',
    category: 'Data & Analytics',
    description: 'In-memory multi-model database engine with vector engine',
    color: '#0854A0',
    tags: ['hana', 'database', 'sql', 'in-memory', 'vector', 'analytics'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#0854A0"/>
      <ellipse cx="32" cy="19" rx="18" ry="7" fill="#38BDF8"/>
      <path d="M14 19 V31 C14 34.8 22 38 32 38 C42 38 50 34.8 50 31 V19" fill="#0284C7"/>
      <path d="M14 31 V43 C14 46.8 22 50 32 50 C42 50 50 46.8 50 43 V31" fill="#0369A1"/>
      <ellipse cx="32" cy="19" rx="18" ry="7" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
      <path d="M14 19 V43 C14 47 22 50 32 50 C42 50 50 47 50 43 V19" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
      <path d="M14 31 C14 35 22 38 32 38 C42 38 50 35 50 31" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-datasphere',
    title: 'SAP Datasphere',
    category: 'Data & Analytics',
    description: 'Business data fabric across hybrid and multi-cloud architectures',
    color: '#0284C7',
    tags: ['datasphere', 'dwc', 'data warehouse', 'fabric', 'semantic', 'analytics'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#0284C7"/>
      <circle cx="32" cy="32" r="18" fill="none" stroke="#FFFFFF" stroke-width="3"/>
      <ellipse cx="32" cy="32" rx="18" ry="7" fill="none" stroke="#BAE6FD" stroke-width="2.5"/>
      <line x1="32" y1="14" x2="32" y2="50" stroke="#BAE6FD" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="4.5" fill="#FFFFFF"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-analytics-cloud',
    title: 'SAP Analytics Cloud (SAC)',
    category: 'Data & Analytics',
    description: 'Business intelligence, enterprise planning, and predictive analytics',
    color: '#059669',
    tags: ['sac', 'bi', 'dashboards', 'planning', 'charts', 'reporting'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#059669"/>
      <rect x="15" y="32" width="8" height="18" rx="2" fill="#FFFFFF"/>
      <rect x="28" y="24" width="8" height="26" rx="2" fill="#FFFFFF"/>
      <rect x="41" y="15" width="8" height="35" rx="2" fill="#A7F3D0"/>
      <path d="M19 28 L32 20 L45 12" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <circle cx="45" cy="12" r="3" fill="#FFFFFF"/>
    </svg>`,
    drawioXml: '',
  },

  // --- BUSINESS AI ---
  {
    id: 'sap-btp-generative-ai-hub',
    title: 'Generative AI Hub',
    category: 'Business AI',
    description: 'Enterprise access to foundation models and LLM orchestration',
    color: '#8B5CF6',
    tags: ['ai', 'genai', 'llm', 'gemini', 'gpt', 'models', 'prompt'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#8B5CF6"/>
      <path d="M32 14 L36 26 L48 30 L36 34 L32 46 L28 34 L16 30 L28 26 Z" fill="#FFFFFF"/>
      <path d="M47 16 L49 22 L55 24 L49 26 L47 32 L45 26 L39 24 L45 22 Z" fill="#FDE047"/>
      <path d="M20 42 L21.5 46.5 L26 48 L21.5 49.5 L20 54 L18.5 49.5 L14 48 L18.5 46.5 Z" fill="#FDE047"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-ai-core',
    title: 'SAP AI Core & Launchpad',
    category: 'Business AI',
    description: 'Execution engine for machine learning models and pipelines',
    color: '#6366F1',
    tags: ['ai', 'ml', 'pipeline', 'training', 'serving', 'inference'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#6366F1"/>
      <rect x="20" y="20" width="24" height="24" rx="5" fill="none" stroke="#FFFFFF" stroke-width="3"/>
      <rect x="26" y="26" width="12" height="12" rx="3" fill="#C7D2FE"/>
      <line x1="14" y1="26" x2="20" y2="26" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="38" x2="20" y2="38" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="44" y1="26" x2="50" y2="26" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="44" y1="38" x2="50" y2="38" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="26" y1="14" x2="26" y2="20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="38" y1="14" x2="38" y2="20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="26" y1="44" x2="26" y2="50" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="38" y1="44" x2="38" y2="50" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },

  // --- FOUNDATIONAL SERVICES ---
  {
    id: 'sap-btp-cloud-foundry',
    title: 'Cloud Foundry Runtime',
    category: 'Foundational Services',
    description: 'PaaS polyglot application container runtime (Node.js, Java, Python)',
    color: '#005FB8',
    tags: ['cf', 'runtime', 'paas', 'nodejs', 'java', 'containers', 'compute'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#005FB8"/>
      <circle cx="32" cy="32" r="18" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-dasharray="5 3"/>
      <path d="M22 34 L28 40 L42 26" stroke="#38BDF8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-kyma-runtime',
    title: 'Kyma (Kubernetes) Runtime',
    category: 'Foundational Services',
    description: 'Cloud-native Kubernetes runtime for microservices and extensions',
    color: '#0D9488',
    tags: ['kyma', 'kubernetes', 'k8s', 'containers', 'serverless', 'microservices'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#0D9488"/>
      <polygon points="32,14 49,24 49,44 32,54 15,44 15,24" fill="none" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="32" cy="34" r="7" fill="#99F6E4"/>
      <path d="M32 20 L32 27 M44 27 L38 31 M44 41 L38 37 M32 48 L32 41 M20 41 L26 37 M20 27 L26 31" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-destination-service',
    title: 'Destination Service',
    category: 'Foundational Services',
    description: 'Outbound connectivity configurations and target endpoint routing',
    color: '#EA580C',
    tags: ['destination', 'connectivity', 'routing', 'endpoint', 'http', 'rfc'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#EA580C"/>
      <circle cx="32" cy="28" r="10" fill="none" stroke="#FFFFFF" stroke-width="3.5"/>
      <circle cx="32" cy="28" r="4" fill="#FED7AA"/>
      <path d="M32 38 L32 50" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M24 50 L40 50" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },

  // --- SECURITY & IDENTITY ---
  {
    id: 'sap-btp-identity-authentication',
    title: 'Cloud Identity Services (IAS)',
    category: 'Security & Identity',
    description: 'Authentication, Single Sign-On (SSO), and identity federation',
    color: '#DC2626',
    tags: ['ias', 'identity', 'auth', 'sso', 'saml', 'oidc', 'security'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#DC2626"/>
      <path d="M32 14 L48 20 V33 C48 43 41 51 32 54 C23 51 16 43 16 33 V20 Z" fill="none" stroke="#FFFFFF" stroke-width="3"/>
      <path d="M28 32 L31 35 L38 27" stroke="#FEF08A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-btp-cloud-connector',
    title: 'SAP Cloud Connector',
    category: 'Security & Identity',
    description: 'Secure reverse-proxy tunnel connecting BTP to on-premise systems',
    color: '#B91C1C',
    tags: ['connector', 'on-premise', 'tunnel', 'vpn', 'rfc', 'security', 'hybrid'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#B91C1C"/>
      <rect x="14" y="22" width="14" height="20" rx="3" fill="#FFFFFF"/>
      <rect x="36" y="22" width="14" height="20" rx="3" fill="#FFFFFF"/>
      <path d="M28 32 L36 32" stroke="#FEF08A" stroke-width="4" stroke-linecap="round"/>
      <path d="M32 26 L36 32 L32 38" fill="none" stroke="#FEF08A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    drawioXml: '',
  },

  // --- ENTERPRISE APPLICATIONS ---
  {
    id: 'sap-s4hana-cloud',
    title: 'SAP S/4HANA Cloud',
    category: 'Enterprise Applications',
    description: 'Next-generation cloud ERP core for enterprise business processes',
    color: '#0284C7',
    tags: ['s4hana', 'erp', 'finance', 'logistics', 'core', 's/4'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#0284C7"/>
      <text x="32" y="38" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">S/4</text>
      <path d="M16 48 L48 48" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-successfactors',
    title: 'SAP SuccessFactors',
    category: 'Enterprise Applications',
    description: 'Human Experience Management (HXM) and HR cloud suite',
    color: '#F59E0B',
    tags: ['hr', 'hxm', 'employees', 'people', 'successfactors'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#F59E0B"/>
      <circle cx="32" cy="24" r="8" fill="#FFFFFF"/>
      <path d="M18 46 C18 38 24 35 32 35 C40 35 46 38 46 46" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-ariba',
    title: 'SAP Ariba',
    category: 'Enterprise Applications',
    description: 'Procurement, supply chain collaboration, and supplier network',
    color: '#10B981',
    tags: ['procurement', 'suppliers', 'ariba', 'sourcing', 'invoicing'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#10B981"/>
      <path d="M18 20 L32 46 L46 20 Z" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="32" cy="20" r="4" fill="#A7F3D0"/>
    </svg>`,
    drawioXml: '',
  },

  // --- ARCHITECTURE ACTORS & COMPONENTS ---
  {
    id: 'sap-actor-user',
    title: 'Business User / Persona',
    category: 'Architecture Actors',
    description: 'End user interacting with SAP Fiori / Web client',
    color: '#4B5563',
    tags: ['user', 'actor', 'client', 'persona', 'human'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#4B5563"/>
      <circle cx="32" cy="23" r="8" fill="#FFFFFF"/>
      <path d="M17 48 C17 39 23 36 32 36 C41 36 47 39 47 48" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-actor-mobile-device',
    title: 'Mobile Device',
    category: 'Architecture Actors',
    description: 'Mobile tablet / smartphone running SAP Mobile Services',
    color: '#2563EB',
    tags: ['mobile', 'phone', 'tablet', 'ios', 'android', 'fiori'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#2563EB"/>
      <rect x="20" y="14" width="24" height="36" rx="4" fill="none" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="32" cy="44" r="2" fill="#FFFFFF"/>
      <line x1="26" y1="19" x2="38" y2="19" stroke="#93C5FD" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-actor-on-premise',
    title: 'On-Premise Backend System',
    category: 'Architecture Actors',
    description: 'Legacy SAP ERP, ECC 6.0, or custom database behind corporate firewall',
    color: '#374151',
    tags: ['on-premise', 'ecc', 'server', 'datacenter', 'backend', 'corporate'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#374151"/>
      <rect x="15" y="16" width="34" height="10" rx="3" fill="#D1D5DB"/>
      <rect x="15" y="28" width="34" height="10" rx="3" fill="#9CA3AF"/>
      <rect x="15" y="40" width="34" height="10" rx="3" fill="#6B7280"/>
      <circle cx="43" cy="21" r="1.5" fill="#10B981"/>
      <circle cx="43" cy="33" r="1.5" fill="#10B981"/>
      <circle cx="43" cy="45" r="1.5" fill="#10B981"/>
    </svg>`,
    drawioXml: '',
  },
  {
    id: 'sap-actor-third-party-cloud',
    title: 'Third-Party Cloud / SaaS',
    category: 'Architecture Actors',
    description: 'External non-SAP cloud service, hyperscaler (AWS/Azure/GCP), or vendor API',
    color: '#6B7280',
    tags: ['cloud', 'aws', 'azure', 'gcp', 'hyperscaler', '3rd-party', 'external'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#6B7280"/>
      <path d="M22 38 C18 38 15 35 15 31 C15 27.5 17.5 24.5 21 24 C22 19 26.5 15 32 15 C38 15 43 19 44 24.5 C47.5 25 50 28 50 31.5 C50 35.5 47 38 43 38 Z" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="32" cy="45" r="2.5" fill="#E5E7EB"/>
    </svg>`,
    drawioXml: '',
  },
];

// Populate drawioXml for all icons automatically
SAP_ARCHITECTURE_ICONS.forEach((icon) => {
  const dataUri = getSvgDataUri(icon.svg);
  icon.drawioXml = createDrawioIconXml(icon.title, dataUri, 64, 64);
});

const iconSearchCache = new Map<string, SapArchitectureIcon[]>();

/**
 * Filter icons by search query and category with LRU memoization cache.
 */
export function searchSapIcons(query: string, category?: string): SapArchitectureIcon[] {
  const cleanQ = query.trim().toLowerCase();
  const cacheKey = `${category || 'All'}::${cleanQ}`;

  if (iconSearchCache.has(cacheKey)) {
    return iconSearchCache.get(cacheKey)!;
  }

  const result = SAP_ARCHITECTURE_ICONS.filter((icon) => {
    const matchesCategory = !category || category === 'All' || icon.category === category;
    if (!matchesCategory) return false;
    if (!cleanQ) return true;
    return (
      icon.title.toLowerCase().includes(cleanQ) ||
      icon.description.toLowerCase().includes(cleanQ) ||
      icon.tags.some((tag) => tag.toLowerCase().includes(cleanQ))
    );
  });

  if (iconSearchCache.size > 200) {
    iconSearchCache.clear();
  }
  iconSearchCache.set(cacheKey, result);
  return result;
}
