import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { boxGeo, FINISHES, PAINT_BUCKETS, createWoodTexturesFromConfig } from './shared.js';

/* ---------- Catálogo completo de 115 acessórios (itens 1 a 115) ---------- */
const ACCESSORY_CATEGORIES = [
  { id: 'all', label: 'Todas as categorias (1–115)' },
  { id: 'vidros_espelhos', label: '1. Vidros e Espelhos (1–14)' },
  { id: 'perfis_estruturas', label: '2. Perfis Metálicos e Estruturas Aparentes (15–26)' },
  { id: 'puxadores_abertura', label: '3. Puxadores e Sistemas de Abertura (27–41)' },
  { id: 'dobradicas_corredicas', label: '4. Dobradiças, Articuladores e Corrediças (42–59)' },
  { id: 'portas_correr', label: '5. Sistemas para Portas de Correr (60–68)' },
  { id: 'iluminacao_eletrica', label: '6. Iluminação e Elétrica Integrada (69–82)' },
  { id: 'org_cozinha_lavanderia', label: '7. Organizadores Internos Cozinha e Lavanderia (83–95)' },
  { id: 'org_quarto_closet', label: '8. Organizadores Internos Quarto e Closet (96–105)' },
  { id: 'pes_fixacao_acabamento', label: '9. Pés, Apoios, Fixação e Acabamento (106–115)' }
];

const ACCESSORIES_115 = [
  // 1. Vidros e Espelhos (1–14)
  { id: 1, cat: 'vidros_espelhos', name: 'Espelho prata comum (3mm ou 4mm)', t: 'acessorio', w: 50, h: 70, d: 0.4, c: 'espelho_prata' },
  { id: 2, cat: 'vidros_espelhos', name: 'Espelho bronze', t: 'acessorio', w: 50, h: 70, d: 0.4, c: 'espelho_bronze' },
  { id: 3, cat: 'vidros_espelhos', name: 'Espelho fumê', t: 'acessorio', w: 50, h: 70, d: 0.4, c: 'espelho_fume' },
  { id: 4, cat: 'vidros_espelhos', name: 'Espelho com película de segurança (anti-estilhaço)', t: 'acessorio', w: 50, h: 70, d: 0.5, c: 'espelho_prata' },
  { id: 5, cat: 'vidros_espelhos', name: 'Espelho bisotado (com bordas lapidadas em ângulo)', t: 'acessorio', w: 55, h: 75, d: 0.5, c: 'espelho_prata' },
  { id: 6, cat: 'vidros_espelhos', name: 'Espelho orgânico / formato irregular (penteadeiras e aparadores)', t: 'acessorio', w: 58, h: 72, d: 0.5, c: 'espelho_prata' },
  { id: 7, cat: 'vidros_espelhos', name: 'Vidro incolor comum ou temperado', t: 'acessorio', w: 50, h: 60, d: 0.6, c: 'vidro_incolor' },
  { id: 8, cat: 'vidros_espelhos', name: 'Vidro Extra Clear (sem tom esverdeado)', t: 'acessorio', w: 50, h: 60, d: 0.6, c: 'vidro_extraclear' },
  { id: 9, cat: 'vidros_espelhos', name: 'Vidro Reflecta bronze (espelhado translúcido)', t: 'acessorio', w: 45, h: 70, d: 0.6, c: 'vidro_reflecta_bronze' },
  { id: 10, cat: 'vidros_espelhos', name: 'Vidro Reflecta prata', t: 'acessorio', w: 45, h: 70, d: 0.6, c: 'vidro_reflecta_prata' },
  { id: 11, cat: 'vidros_espelhos', name: 'Vidro Reflecta fumê', t: 'acessorio', w: 45, h: 70, d: 0.6, c: 'vidro_reflecta_fume' },
  { id: 12, cat: 'vidros_espelhos', name: 'Vidro canelado / canelato (texturizado)', t: 'acessorio', w: 45, h: 70, d: 0.6, c: 'vidro_canelado' },
  { id: 13, cat: 'vidros_espelhos', name: 'Vidro serigrafado / pintado (Lacobel branco, preto, off-white)', t: 'acessorio', w: 50, h: 70, d: 0.6, c: 'vidro_lacobel' },
  { id: 14, cat: 'vidros_espelhos', name: 'Vidro acidato / jateado (fosco)', t: 'acessorio', w: 50, h: 60, d: 0.6, c: 'vidro_acidato' },

  // 2. Perfis Metálicos e Estruturas Aparentes (15–26)
  { id: 15, cat: 'perfis_estruturas', name: 'Perfil de alumínio para porta de vidro (slim, minimalista ou tradicional)', t: 'acessorio', w: 45, h: 70, d: 2.0, c: 'metal' },
  { id: 16, cat: 'perfis_estruturas', name: 'Perfil puxador de embutir (cava de alumínio)', t: 'acessorio', w: 40, h: 2.5, d: 2.0, c: 'inox' },
  { id: 17, cat: 'perfis_estruturas', name: 'Perfil puxador de sobrepor (tipo perfil G ou perfil C)', t: 'acessorio', w: 40, h: 3.5, d: 2.2, c: 'inox' },
  { id: 18, cat: 'perfis_estruturas', name: 'Perfil divisor de painel / filete metálico decorativo (dourado, preto, bronze)', t: 'acessorio', w: 1.2, h: 80, d: 1.0, c: 'dourado' },
  { id: 19, cat: 'perfis_estruturas', name: 'Estrutura metálica em metalon (quadrado ou retangular) estilo industrial', t: 'acessorio', w: 80, h: 75, d: 45, c: 'metal' },
  { id: 20, cat: 'perfis_estruturas', name: 'Barra de ferro / tubo para prateleiras suspensas (estilo aéreo)', t: 'acessorio', w: 80, h: 2.5, d: 2.5, c: 'metal' },
  { id: 21, cat: 'perfis_estruturas', name: 'Mão francesa metálica (decorativa ou reforçada)', t: 'acessorio', w: 3.0, h: 22, d: 22, c: 'metal' },
  { id: 22, cat: 'perfis_estruturas', name: 'Cantoneira metálica externa de reforço', t: 'acessorio', w: 4.0, h: 4.0, d: 4.0, c: 'inox' },
  { id: 23, cat: 'perfis_estruturas', name: 'Tela metálica expandida / perfurada (portas estilo industrial)', t: 'acessorio', w: 42, h: 68, d: 1.5, c: 'metal' },
  { id: 24, cat: 'perfis_estruturas', name: 'Palhinha natural ou sintética (sextavada ou fechada) para frentes de portas', t: 'acessorio', w: 42, h: 68, d: 0.8, c: 'palhinha' },
  { id: 25, cat: 'perfis_estruturas', name: 'Ripas / filetes de acabamento (ripado pronto)', t: 'acessorio', w: 60, h: 80, d: 2.0, c: 'freijo' },
  { id: 26, cat: 'perfis_estruturas', name: 'Fita de borda (PVC, ABS ou lâmina de madeira natural)', t: 'acessorio', w: 80, h: 0.2, d: 2.2, c: 'carvalho' },

  // 3. Puxadores e Sistemas de Abertura (27–41)
  { id: 27, cat: 'puxadores_abertura', name: 'Puxador tipo alça (reta ou curva)', t: 'acessorio', w: 16, h: 2.5, d: 3.0, c: 'inox' },
  { id: 28, cat: 'puxadores_abertura', name: 'Puxador tipo ponto / botão', t: 'acessorio', w: 2.8, h: 2.8, d: 2.5, c: 'dourado' },
  { id: 29, cat: 'puxadores_abertura', name: 'Puxador tipo concha (estilo retrô ou provençal)', t: 'acessorio', w: 9.0, h: 4.0, d: 2.2, c: 'bronze' },
  { id: 30, cat: 'puxadores_abertura', name: 'Puxador de couro com pino metálico', t: 'acessorio', w: 3.0, h: 12, d: 2.5, c: 'couro' },
  { id: 31, cat: 'puxadores_abertura', name: 'Puxador em madeira maciça (cava ou sobreposto)', t: 'acessorio', w: 18, h: 3.0, d: 2.8, c: 'nogueira' },
  { id: 32, cat: 'puxadores_abertura', name: 'Puxador cava usinado direto no MDF (45° ou meia-cana)', t: 'acessorio', w: 40, h: 2.2, d: 2.2, c: 'freijo' },
  { id: 33, cat: 'puxadores_abertura', name: 'Fecho toque magnético (sistema push-open / sem puxador)', t: 'acessorio', w: 3.8, h: 1.5, d: 6.5, c: 'inox' },
  { id: 34, cat: 'puxadores_abertura', name: 'Fecho magnético simples (imã para portas)', t: 'acessorio', w: 4.0, h: 1.5, d: 1.8, c: 'inox' },
  { id: 35, cat: 'puxadores_abertura', name: 'Fecho rolete / trava de pressão', t: 'acessorio', w: 3.5, h: 2.5, d: 2.0, c: 'inox' },
  { id: 36, cat: 'puxadores_abertura', name: 'Fechadura para gaveta ou porta de armário', t: 'acessorio', w: 5.0, h: 5.0, d: 2.5, c: 'inox' },
  { id: 37, cat: 'puxadores_abertura', name: 'Fechadura eletrônica / biométrica para gaveta ou armário', t: 'acessorio', w: 6.5, h: 8.5, d: 2.5, c: 'metal' },
  { id: 38, cat: 'puxadores_abertura', name: 'Cremona (trava clássica com varão para cristaleiras e armários altos)', t: 'acessorio', w: 3.0, h: 90, d: 2.0, c: 'dourado' },
  { id: 39, cat: 'puxadores_abertura', name: 'Trinco embutido (unha ou ferrolho)', t: 'acessorio', w: 2.0, h: 12, d: 1.5, c: 'inox' },
  { id: 40, cat: 'puxadores_abertura', name: 'Targeta / trava de segurança', t: 'acessorio', w: 5.5, h: 3.5, d: 1.5, c: 'inox' },
  { id: 41, cat: 'puxadores_abertura', name: 'Chaveiro / espelho de fechadura decorativo', t: 'acessorio', w: 3.5, h: 5.0, d: 0.4, c: 'dourado' },

  // 4. Dobradiças, Articuladores e Corrediças (42–59)
  { id: 42, cat: 'dobradicas_corredicas', name: 'Dobradiça caneco reta (porta totalmente sobreposta)', t: 'acessorio', w: 3.5, h: 4.5, d: 1.4, c: 'inox' },
  { id: 43, cat: 'dobradicas_corredicas', name: 'Dobradiça caneco curva (porta parcialmente sobreposta)', t: 'acessorio', w: 3.5, h: 4.5, d: 1.4, c: 'inox' },
  { id: 44, cat: 'dobradicas_corredicas', name: 'Dobradiça caneco supercurva (porta embutida)', t: 'acessorio', w: 3.5, h: 4.5, d: 1.4, c: 'inox' },
  { id: 45, cat: 'dobradicas_corredicas', name: 'Dobradiça com amortecedor integrado (soft-close)', t: 'acessorio', w: 3.5, h: 4.5, d: 1.6, c: 'inox' },
  { id: 46, cat: 'dobradicas_corredicas', name: 'Dobradiça de abertura ampla (165° ou 180° para canto)', t: 'acessorio', w: 4.2, h: 5.0, d: 2.0, c: 'inox' },
  { id: 47, cat: 'dobradicas_corredicas', name: 'Dobradiça para porta de vidro (caneco ou pressão)', t: 'acessorio', w: 3.5, h: 4.5, d: 1.5, c: 'inox' },
  { id: 48, cat: 'dobradicas_corredicas', name: 'Dobradiça invisível / embutida (portas de passagem ou painéis)', t: 'acessorio', w: 1.6, h: 11, d: 2.5, c: 'inox' },
  { id: 49, cat: 'dobradicas_corredicas', name: 'Dobradiça vai-e-vem (portas estilo bang-bang)', t: 'acessorio', w: 5.0, h: 8.0, d: 2.0, c: 'inox' },
  { id: 50, cat: 'dobradicas_corredicas', name: 'Pistão a gás força normal (portas basculantes para cima)', t: 'acessorio', w: 1.5, h: 27, d: 1.5, c: 'inox' },
  { id: 51, cat: 'dobradicas_corredicas', name: 'Pistão a gás força inversa (portas basculantes para baixo)', t: 'acessorio', w: 1.5, h: 27, d: 1.5, c: 'inox' },
  { id: 52, cat: 'dobradicas_corredicas', name: 'Articulador mecânico de fricção (qualquer ângulo)', t: 'acessorio', w: 2.5, h: 22, d: 2.0, c: 'metal' },
  { id: 53, cat: 'dobradicas_corredicas', name: 'Sistema articulador duplo (tipo Aventos)', t: 'acessorio', w: 12, h: 24, d: 10, c: 'metal' },
  { id: 54, cat: 'dobradicas_corredicas', name: 'Corrediça telescópica comum (abertura total)', t: 'acessorio', w: 1.3, h: 4.5, d: 45, c: 'inox' },
  { id: 55, cat: 'dobradicas_corredicas', name: 'Corrediça telescópica com amortecedor', t: 'acessorio', w: 1.3, h: 4.5, d: 45, c: 'inox' },
  { id: 56, cat: 'dobradicas_corredicas', name: 'Corrediça telescópica com fecho toque (push-open)', t: 'acessorio', w: 1.3, h: 4.5, d: 45, c: 'inox' },
  { id: 57, cat: 'dobradicas_corredicas', name: 'Corrediça oculta / invisível (sob a gaveta)', t: 'acessorio', w: 2.0, h: 3.5, d: 45, c: 'inox' },
  { id: 58, cat: 'dobradicas_corredicas', name: 'Gaveta metálica com lateral fina (tandembox / metabox)', t: 'acessorio', w: 45, h: 14, d: 45, c: 'metal' },
  { id: 59, cat: 'dobradicas_corredicas', name: 'Trilho para mesa extensível (abertura sincronizada)', t: 'acessorio', w: 4.5, h: 2.5, d: 60, c: 'inox' },

  // 5. Sistemas para Portas de Correr (60–68)
  { id: 60, cat: 'portas_correr', name: 'Kit de roldanas aparentes estilo celeiro (barn door)', t: 'acessorio', w: 160, h: 8.0, d: 4.0, c: 'metal' },
  { id: 61, cat: 'portas_correr', name: 'Kit de sistema deslizante embutido (trilho superior e inferior)', t: 'acessorio', w: 120, h: 3.0, d: 4.0, c: 'inox' },
  { id: 62, cat: 'portas_correr', name: 'Sistema deslizante com amortecedor de fechamento e abertura', t: 'acessorio', w: 120, h: 3.5, d: 4.5, c: 'inox' },
  { id: 63, cat: 'portas_correr', name: 'Sistema coplanar (portas alinhadas no mesmo plano)', t: 'acessorio', w: 140, h: 4.0, d: 5.0, c: 'inox' },
  { id: 64, cat: 'portas_correr', name: 'Sistema camarão / sanfonado (portas articuladas)', t: 'acessorio', w: 90, h: 3.0, d: 3.5, c: 'inox' },
  { id: 65, cat: 'portas_correr', name: 'Trilho de alumínio duplo ou simples (embutir ou sobrepor)', t: 'acessorio', w: 140, h: 2.0, d: 5.5, c: 'inox' },
  { id: 66, cat: 'portas_correr', name: 'Guia inferior / pino guia', t: 'acessorio', w: 4.0, h: 3.0, d: 3.0, c: 'metal' },
  { id: 67, cat: 'portas_correr', name: 'Desempenador de portas (haste metálica embutida)', t: 'acessorio', w: 2.0, h: 180, d: 1.5, c: 'metal' },
  { id: 68, cat: 'portas_correr', name: 'Escova de vedação (tapa-poeira para portas de correr)', t: 'acessorio', w: 180, h: 0.7, d: 0.6, c: 'metal' },

  // 6. Iluminação e Elétrica Integrada (69–82)
  { id: 69, cat: 'iluminacao_eletrica', name: 'Fita de LED (branco quente 3000K, neutro 4000K ou frio 6000K)', t: 'acessorio', w: 100, h: 0.3, d: 1.0, c: 'led_quente' },
  { id: 70, cat: 'iluminacao_eletrica', name: 'Fita de LED COB (luz contínua sem pontos marcados)', t: 'acessorio', w: 100, h: 0.4, d: 1.0, c: 'led_frio' },
  { id: 71, cat: 'iluminacao_eletrica', name: 'Perfil de alumínio de embutir com difusor leitoso', t: 'acessorio', w: 100, h: 1.2, d: 1.8, c: 'led_quente' },
  { id: 72, cat: 'iluminacao_eletrica', name: 'Perfil de alumínio de sobrepor ou de canto (45°)', t: 'acessorio', w: 100, h: 1.6, d: 1.6, c: 'led_quente' },
  { id: 73, cat: 'iluminacao_eletrica', name: 'Mini spot de LED de embutir (redondo ou quadrado)', t: 'acessorio', w: 6.5, h: 1.5, d: 6.5, c: 'led_quente' },
  { id: 74, cat: 'iluminacao_eletrica', name: 'Fonte / driver slim para fita de LED (12V ou 24V)', t: 'acessorio', w: 16, h: 2.2, d: 4.5, c: 'metal' },
  { id: 75, cat: 'iluminacao_eletrica', name: 'Sensor de abertura de porta (acende LED ao abrir)', t: 'acessorio', w: 3.5, h: 2.0, d: 1.5, c: 'inox' },
  { id: 76, cat: 'iluminacao_eletrica', name: 'Sensor de presença / movimento para móveis', t: 'acessorio', w: 4.5, h: 2.0, d: 3.0, c: 'inox' },
  { id: 77, cat: 'iluminacao_eletrica', name: 'Interruptor touch de embutir na madeira (com dimerização)', t: 'acessorio', w: 4.0, h: 1.2, d: 4.0, c: 'led_frio' },
  { id: 78, cat: 'iluminacao_eletrica', name: 'Cabideiro iluminado com LED', t: 'acessorio', w: 75, h: 3.0, d: 2.0, c: 'led_quente' },
  { id: 79, cat: 'iluminacao_eletrica', name: 'Torre de tomadas retrátil (manual ou automática)', t: 'acessorio', w: 11, h: 26, d: 11, c: 'metal' },
  { id: 80, cat: 'iluminacao_eletrica', name: 'Régua de tomadas de embutir na marcenaria', t: 'acessorio', w: 28, h: 4.5, d: 6.0, c: 'metal' },
  { id: 81, cat: 'iluminacao_eletrica', name: 'Carregador por indução (wireless) embutido sob o tampo', t: 'acessorio', w: 10, h: 1.2, d: 10, c: 'metal' },
  { id: 82, cat: 'iluminacao_eletrica', name: 'Passa-fios circular ou retangular (plástico, alumínio ou escovado)', t: 'acessorio', w: 6.0, h: 1.5, d: 6.0, c: 'inox' },

  // 7. Organizadores Internos para Cozinha e Lavanderia (83–95)
  { id: 83, cat: 'org_cozinha_lavanderia', name: 'Divisor de talheres (madeira, bambu, acrílico ou PVC)', t: 'acessorio', w: 42, h: 5.5, d: 38, c: 'carvalho' },
  { id: 84, cat: 'org_cozinha_lavanderia', name: 'Porta-temperos aramado deslizante', t: 'acessorio', w: 15, h: 48, d: 45, c: 'inox' },
  { id: 85, cat: 'org_cozinha_lavanderia', name: 'Porta-latas / garrafeiro deslizante', t: 'acessorio', w: 18, h: 48, d: 45, c: 'inox' },
  { id: 86, cat: 'org_cozinha_lavanderia', name: 'Lixeira de embutir com corrediça (simples ou dupla)', t: 'acessorio', w: 34, h: 38, d: 46, c: 'metal' },
  { id: 87, cat: 'org_cozinha_lavanderia', name: 'Escorredor de louças embutido para armário aéreo', t: 'acessorio', w: 76, h: 12, d: 28, c: 'inox' },
  { id: 88, cat: 'org_cozinha_lavanderia', name: 'Cesto fruteira deslizante aramado', t: 'acessorio', w: 36, h: 16, d: 42, c: 'inox' },
  { id: 89, cat: 'org_cozinha_lavanderia', name: 'Cantoneira mágica / sistema giratório para canto', t: 'acessorio', w: 65, h: 58, d: 45, c: 'inox' },
  { id: 90, cat: 'org_cozinha_lavanderia', name: 'Tulha deslizante (cesto de roupa suja aramado ou plástico)', t: 'acessorio', w: 38, h: 54, d: 44, c: 'inox' },
  { id: 91, cat: 'org_cozinha_lavanderia', name: 'Tábua de passar roupa retrátil / embutida na gaveta', t: 'acessorio', w: 40, h: 6.0, d: 85, c: 'carvalho' },
  { id: 92, cat: 'org_cozinha_lavanderia', name: 'Suporte deslizante para vassouras e produtos de limpeza', t: 'acessorio', w: 22, h: 65, d: 45, c: 'inox' },
  { id: 93, cat: 'org_cozinha_lavanderia', name: 'Porta-panos de prato deslizante', t: 'acessorio', w: 14, h: 42, d: 44, c: 'inox' },
  { id: 94, cat: 'org_cozinha_lavanderia', name: 'Tapete antiderrapante para fundo de gavetas', t: 'acessorio', w: 45, h: 0.4, d: 42, c: 'metal' },
  { id: 95, cat: 'org_cozinha_lavanderia', name: 'Protetor metálico / bandeja de alumínio para gabinete de pia', t: 'acessorio', w: 76, h: 2.5, d: 48, c: 'inox' },

  // 8. Organizadores Internos para Quarto e Closet (96–105)
  { id: 96, cat: 'org_quarto_closet', name: 'Tubo cabideiro (oblongo ou redondo em alumínio/inox)', t: 'acessorio', w: 80, h: 2.5, d: 2.5, c: 'inox' },
  { id: 97, cat: 'org_quarto_closet', name: 'Suporte central e lateral para cabideiro', t: 'acessorio', w: 3.5, h: 5.0, d: 3.5, c: 'inox' },
  { id: 98, cat: 'org_quarto_closet', name: 'Cabideiro basculante (puxador para parte alta do armário)', t: 'acessorio', w: 80, h: 65, d: 18, c: 'metal' },
  { id: 99, cat: 'org_quarto_closet', name: 'Calceiro deslizante (com varetas removíveis)', t: 'acessorio', w: 50, h: 8.0, d: 45, c: 'inox' },
  { id: 100, cat: 'org_quarto_closet', name: 'Sapateira deslizante (aramada ou prateleiras inclinadas)', t: 'acessorio', w: 55, h: 14, d: 45, c: 'inox' },
  { id: 101, cat: 'org_quarto_closet', name: 'Gaveta colmeia / organizadora de joias, relógios e óculos', t: 'acessorio', w: 48, h: 7.0, d: 40, c: 'veludo' },
  { id: 102, cat: 'org_quarto_closet', name: 'Tampo de vidro para gaveta organizadora', t: 'acessorio', w: 48, h: 0.6, d: 40, c: 'vidro_incolor' },
  { id: 103, cat: 'org_quarto_closet', name: 'Espelho deslizante ou articulado interno para guarda-roupa', t: 'acessorio', w: 35, h: 120, d: 1.5, c: 'espelho_prata' },
  { id: 104, cat: 'org_quarto_closet', name: 'Porta-gravatas e porta-cintos lateral deslizante', t: 'acessorio', w: 12, h: 8.0, d: 42, c: 'inox' },
  { id: 105, cat: 'org_quarto_closet', name: 'Cesto aramado deslizante para roupas dobradas', t: 'acessorio', w: 45, h: 18, d: 44, c: 'inox' },

  // 9. Pés, Apoios, Fixação e Acabamento (106–115)
  { id: 106, cat: 'pes_fixacao_acabamento', name: 'Pé palito de madeira maciça (com chapa de fixação)', t: 'acessorio', w: 4.5, h: 18, d: 4.5, c: 'carvalho' },
  { id: 107, cat: 'pes_fixacao_acabamento', name: 'Pé estilo hairpin leg (grampo de ferro)', t: 'acessorio', w: 8.0, h: 16, d: 8.0, c: 'metal' },
  { id: 108, cat: 'pes_fixacao_acabamento', name: 'Pé nivelador plástico (base de armários sob rodapé)', t: 'acessorio', w: 4.0, h: 12, d: 4.0, c: 'metal' },
  { id: 109, cat: 'pes_fixacao_acabamento', name: 'Pé metálico regulável (quadrado ou cilíndrico)', t: 'acessorio', w: 5.0, h: 15, d: 5.0, c: 'inox' },
  { id: 110, cat: 'pes_fixacao_acabamento', name: 'Rodízio de silicone (transparente ou preto, com ou sem trava)', t: 'acessorio', w: 5.0, h: 6.5, d: 5.0, c: 'metal' },
  { id: 111, cat: 'pes_fixacao_acabamento', name: 'Sapata deslizadora (de pregar ou colar para proteger piso)', t: 'acessorio', w: 2.5, h: 0.8, d: 2.5, c: 'metal' },
  { id: 112, cat: 'pes_fixacao_acabamento', name: 'Suporte invisível para prateleira flutuante (pino tucano)', t: 'acessorio', w: 1.6, h: 1.6, d: 14, c: 'inox' },
  { id: 113, cat: 'pes_fixacao_acabamento', name: 'Suporte cadeirinha / cantoneira de fixação na parede', t: 'acessorio', w: 3.0, h: 5.0, d: 5.0, c: 'inox' },
  { id: 114, cat: 'pes_fixacao_acabamento', name: 'Suporte para prateleira de vidro (fenda ou pelicano)', t: 'acessorio', w: 2.5, h: 3.5, d: 3.0, c: 'inox' },
  { id: 115, cat: 'pes_fixacao_acabamento', name: 'Grelha de ventilação (respiro para nichos e adegas)', t: 'acessorio', w: 18, h: 5.0, d: 1.0, c: 'inox' }
];

const SPECIAL_COLORS = {
  metal: '#2a2b2e',
  inox: '#b9c0c8',
  dourado: '#c8a24b',
  bronze: '#7c583a',
  couro: '#5a3622',
  palhinha: '#d7be92',
  veludo: '#3a2d36',
  stone: '#efe7da',
  espelho_prata: '#dce6ec',
  espelho_bronze: '#b99678',
  espelho_fume: '#5e646c',
  vidro_incolor: '#cfe4ee',
  vidro_extraclear: '#e3f2f8',
  vidro_reflecta_bronze: '#9c7a5c',
  vidro_reflecta_prata: '#b8c6cf',
  vidro_reflecta_fume: '#555b63',
  vidro_canelado: '#c2d9e4',
  vidro_lacobel: '#f4f2ed',
  vidro_acidato: '#dce6ea',
  led_quente: '#ffdfb0',
  led_frio: '#dff2ff'
};

/* ---------- Peças e novos móveis (Lavanderia 90-91, Hall 99-104, Área Externa 105-110) ---------- */
const TYPES = {
  lateral:           { label: 'Lateral',              n: 'Parede Lateral',       t: 'painel',   w: 2.2, h: 80, d: 50 },
  base:              { label: 'Base',                 n: 'Base Inferior',        t: 'painel',   w: 80, h: 2.2, d: 50 },
  tampo:             { label: 'Tampo',                n: 'Tampo Superior',       t: 'painel',   w: 80, h: 2.2, d: 50 },
  travessa:          { label: 'Travessa fixa',        n: 'Travessa Fixa',        t: 'painel',   w: 76, h: 2.2, d: 48 },
  prateleira:        { label: 'Prateleira',           n: 'Prateleira',           t: 'painel',   w: 76, h: 2.2, d: 46 },
  divisoria:         { label: 'Divisória',            n: 'Divisória',            t: 'painel',   w: 2.2, h: 76, d: 48 },
  porta:             { label: 'Porta',                n: 'Porta',                t: 'porta',    w: 40, h: 76, d: 2.2 },
  gaveta:            { label: 'Gaveta',               n: 'Gaveta',               t: 'gaveta',   w: 40, h: 16, d: 46 },
  ripado:            { label: 'Painel ripado',        n: 'Painel Ripado',        t: 'ripado',   w: 60, h: 80, d: 2.2 },
  fundo:             { label: 'Fundo',                n: 'Fundo',                t: 'painel',   w: 80, h: 80, d: 0.6 },
  tubo:              { label: 'Tubo metalon',         n: 'Tubo Metalon',         t: 'tubo',     w: 3, h: 80, d: 3, c: 'metal' },
  pe:                { label: 'Pé',                   n: 'Pés',                  t: 'pe',       w: 4, h: 10, d: 4 },
  balcao_tanque:     { label: '90. Balcão tanque',    n: '90. Balcão para tanque', t: 'painel', w: 80, h: 85, d: 55, c: 'stone' },
  cesto_ripado:      { label: '91. Cesto ripado',     n: '91. Cesto de roupas sujas ripado', t: 'ripado', w: 42, h: 62, d: 42 },
  sapateira_slim:    { label: '99. Sapateira slim',   n: '99. Sapateira slim / basculante', t: 'porta', w: 70, h: 95, d: 24 },
  banco_sapateira:   { label: '100. Banco sapateira', n: '100. Banco sapateira hall', t: 'painel', w: 90, h: 46, d: 38 },
  cabideiro_parede:  { label: '101. Cabideiro pared.',n: '101. Cabideiro de parede', t: 'painel', w: 75, h: 20, d: 18 },
  mancebo_chao:      { label: '102. Mancebo chão',    n: '102. Mancebo cabideiro de chão', t: 'tubo', w: 42, h: 170, d: 42 },
  console_hall:      { label: '103. Console hall',    n: '103. Console / aparador estreito', t: 'painel', w: 110, h: 82, d: 30 },
  biombo_divisor:    { label: '104. Biombo divisor',  n: '104. Biombos divisórios', t: 'ripado', w: 135, h: 180, d: 3.5 },
  banco_jardim:      { label: '105. Banco jardim',    n: '105. Banco de jardim / praça', t: 'painel', w: 150, h: 45, d: 52 },
  namoradeira_var:   { label: '106. Namoradeira var.',n: '106. Namoradeira de varanda', t: 'painel', w: 125, h: 78, d: 54 },
  espreguicadeira:   { label: '107. Espreguiçadeira', n: '107. Espreguiçadeira de madeira', t: 'painel', w: 68, h: 36, d: 195 },
  mesa_bistro_var:   { label: '108. Mesa varanda',    n: '108. Mesa dobrável varanda / bistrô', t: 'painel', w: 70, h: 75, d: 70 },
  pergolado_mad:     { label: '109. Pergolado',       n: '109. Pergolado de madeira', t: 'tubo', w: 220, h: 230, d: 180 },
  painel_jardim:     { label: '110. Painel jardim',   n: '110. Painel vertical de jardim', t: 'ripado', w: 120, h: 180, d: 4.0 }
};

function buildPresetParts(key, finish) {
  const f = finish || 'freijo';
  if (key === 'balcao_tanque_90') {
    return [
      { t: 'painel', n: '90. Balcão tanque — Lateral Esq.', w: 2.2, h: 78, d: 52, x: -38.9, y: 46, z: 0, c: f },
      { t: 'painel', n: '90. Balcão tanque — Lateral Dir.', w: 2.2, h: 78, d: 52, x: 38.9, y: 46, z: 0, c: f },
      { t: 'painel', n: '90. Balcão tanque — Base', w: 75.6, h: 2.2, d: 52, x: 0, y: 8.1, z: 0, c: f },
      { t: 'painel', n: '90. Balcão tanque — Tampo/Cuba', w: 82, h: 4.0, d: 55, x: 0, y: 86.0, z: 1.5, c: 'stone' },
      { t: 'porta',  n: '90. Balcão tanque — Porta Esq.', w: 37.5, h: 72, d: 2.0, x: -19, y: 46, z: 25, c: f },
      { t: 'porta',  n: '90. Balcão tanque — Porta Dir.', w: 37.5, h: 72, d: 2.0, x: 19, y: 46, z: 25, c: f },
      { t: 'pe',     n: '90. Balcão tanque — Pés Elevados', w: 4.5, h: 7, d: 4.5, x: -34, y: 3.5, z: 20, c: 'inox' },
      { t: 'pe',     n: '90. Balcão tanque — Pés Elevados Dir.', w: 4.5, h: 7, d: 4.5, x: 34, y: 3.5, z: 20, c: 'inox' }
    ];
  }
  if (key === 'cesto_ripado_91') {
    return [
      { t: 'ripado', n: '91. Cesto ripado — Corpo Ventilado', w: 42, h: 58, d: 42, x: 0, y: 31, z: 0, c: f },
      { t: 'painel', n: '91. Cesto ripado — Base', w: 38, h: 2.0, d: 38, x: 0, y: 3, z: 0, c: f },
      { t: 'tampo',  n: '91. Cesto ripado — Tampa Basculante', w: 44, h: 2.2, d: 44, x: 0, y: 61, z: 0, c: f }
    ];
  }
  if (key === 'hall_100_101') {
    return [
      { t: 'painel', n: '100. Banco sapateira — Assento', w: 90, h: 3.0, d: 38, x: 0, y: 44.5, z: 0, c: f },
      { t: 'painel', n: '100. Banco sapateira — Lateral Esq.', w: 2.2, h: 43, d: 36, x: -42, y: 21.5, z: 0, c: f },
      { t: 'painel', n: '100. Banco sapateira — Lateral Dir.', w: 2.2, h: 43, d: 36, x: 42, y: 21.5, z: 0, c: f },
      { t: 'painel', n: '100. Banco sapateira — Prateleira Calçados', w: 81.8, h: 2.0, d: 34, x: 0, y: 16, z: 0, c: f },
      { t: 'painel', n: '101. Cabideiro de parede — Régua e Prateleira', w: 80, h: 18, d: 16, x: 0, y: 155, z: -12, c: f }
    ];
  }
  if (key === 'pergolado_109') {
    return [
      { t: 'tubo', n: '109. Pergolado — Pilar Frontal Esq.', w: 12, h: 220, d: 12, x: -95, y: 110, z: 80, c: f },
      { t: 'tubo', n: '109. Pergolado — Pilar Frontal Dir.', w: 12, h: 220, d: 12, x: 95, y: 110, z: 80, c: f },
      { t: 'tubo', n: '109. Pergolado — Pilar Fundo Esq.', w: 12, h: 220, d: 12, x: -95, y: 110, z: -80, c: f },
      { t: 'tubo', n: '109. Pergolado — Pilar Fundo Dir.', w: 12, h: 220, d: 12, x: 95, y: 110, z: -80, c: f },
      { t: 'painel', n: '109. Pergolado — Viga Frontal', w: 210, h: 14, d: 6, x: 0, y: 227, z: 80, c: f },
      { t: 'painel', n: '109. Pergolado — Viga Traseira', w: 210, h: 14, d: 6, x: 0, y: 227, z: -80, c: f },
      { t: 'ripado', n: '109. Pergolado — Ripas Superiores', w: 196, h: 5, d: 176, x: 0, y: 236, z: 0, c: f }
    ];
  }
  return [];
}

const PRESETS = [
  { key: 'balcao_tanque_90', label: '+ Conjunto 90. Balcão tanque' },
  { key: 'cesto_ripado_91', label: '+ Conjunto 91. Cesto ripado' },
  { key: 'hall_100_101', label: '+ Conjunto 100–101 Hall entrada' },
  { key: 'pergolado_109', label: '+ Conjunto 109. Pergolado' }
];

/* ---------- Estado do projeto ---------- */
let project = { name: 'Meu móvel', finish: 'espresso', parts: [] };
try {
  const s = JSON.parse(localStorage.getItem('zf_project') || 'null');
  if (s && Array.isArray(s.parts) && s.parts.length) {
    project = { finish: 'espresso', ...s };
  }
} catch (e) { /* vazio */ }

if (!project.parts.length) {
  const f = project.finish;
  project.name = 'Caixa simples';
  project.parts = [
    { t: 'painel', n: 'Parede Lateral Esquerda', w: 2.2, h: 80, d: 50, x: -39, y: 40, z: 0, c: f },
    { t: 'painel', n: 'Parede Lateral Direita', w: 2.2, h: 80, d: 50, x: 39, y: 40, z: 0, c: f },
    { t: 'painel', n: 'Base Inferior', w: 76, h: 2.2, d: 50, x: 0, y: 1.1, z: 0, c: f },
    { t: 'painel', n: 'Tampo Superior', w: 80, h: 2.2, d: 50, x: 0, y: 81.1, z: 0, c: f }
  ];
}

let sel = -1, step = 1, color = project.finish || 'espresso';
let accSearchTerm = '', accCategoryTerm = 'all';
const undo = [], redo = [];
const snap = () => JSON.stringify(project);

/* ---------- Cena Three.js ---------- */
const stage = document.getElementById('edStage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.7;

const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
camera.position.set(1.7, 1.4, 2.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.45, 0);

scene.add(new THREE.HemisphereLight(0xfff5e8, 0x8a7560, 0.8));
const key = new THREE.DirectionalLight(0xfff1de, 1.8);
key.position.set(2.5, 4, 3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 64),
  new THREE.MeshStandardMaterial({ color: 0xe4dac8, roughness: 0.95 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
scene.add(new THREE.GridHelper(5, 50, 0xc86d51, 0xd7ccb8).translateY(0.001));

const group = new THREE.Group();
scene.add(group);
const matCache = new Map();
let outline = null;

function cfgFor(c) {
  return FINISHES[c] || PAINT_BUCKETS.find((b) => b.id === c) || FINISHES.espresso;
}

function matFor(c, rotate) {
  if (SPECIAL_COLORS[c]) {
    const k = `spec|${c}`;
    if (!matCache.has(k)) {
      const isGlass = c.startsWith('vidro_') || c.startsWith('espelho_');
      const isLed = c.startsWith('led_');
      const isMetal = ['metal', 'inox', 'dourado', 'bronze'].includes(c);
      matCache.set(k, new THREE.MeshStandardMaterial({
        color: SPECIAL_COLORS[c],
        roughness: isGlass ? 0.12 : isMetal ? 0.35 : 0.75,
        metalness: isMetal ? 0.85 : c.startsWith('espelho_') ? 0.75 : 0.08,
        transparent: isGlass || isLed,
        opacity: c.startsWith('vidro_') ? 0.55 : isLed ? 0.92 : 1,
        emissive: isLed ? SPECIAL_COLORS[c] : 0x000000,
        emissiveIntensity: isLed ? 0.75 : 0
      }));
    }
    return matCache.get(k);
  }
  const k = `${c}|${rotate}`;
  if (!matCache.has(k)) {
    const cfg = cfgFor(c), { map, bumpMap } = createWoodTexturesFromConfig(cfg);
    if (rotate) {
      map.center.set(0.5, 0.5); map.rotation = Math.PI / 2;
      bumpMap.center.set(0.5, 0.5); bumpMap.rotation = Math.PI / 2;
    }
    matCache.set(k, new THREE.MeshStandardMaterial({
      map, bumpMap, bumpScale: 0.008,
      roughness: cfg.roughness, metalness: cfg.metalness
    }));
  }
  return matCache.get(k);
}

function rebuild() {
  while (group.children.length) group.remove(group.children[0]);
  project.parts.forEach((q, i) => {
    const m = new THREE.Mesh(boxGeo(q.w / 100, q.h / 100, q.d / 100), matFor(q.c, q.h < q.w && q.h < q.d));
    m.position.set(q.x / 100, q.y / 100, q.z / 100);
    m.castShadow = m.receiveShadow = true;
    m.userData.i = i;
    group.add(m);
  });
  if (outline) { scene.remove(outline); outline = null; }
  if (sel >= 0 && group.children[sel]) {
    outline = new THREE.BoxHelper(group.children[sel], 0xc86d51);
    scene.add(outline);
  }
  ui();
}

/* ---------- Interface ---------- */
const $ = (id) => document.getElementById(id);
const r1 = (v) => Math.round(v * 10) / 10;
const SW = () => [
  ...Object.entries(FINISHES).map(([id, f]) => [id, f.baseColor, f.name]),
  ...PAINT_BUCKETS.map((b) => [b.id, b.baseColor, b.name]),
  ...Object.entries(SPECIAL_COLORS).map(([id, hex]) => [id, hex, id.replace(/_/g, ' ')])
];

function catLabelFor(catId) {
  const found = ACCESSORY_CATEGORIES.find((c) => c.id === catId);
  return found ? found.label : 'Acessório';
}

function renderAccessoriesList() {
  const term = accSearchTerm.trim().toLowerCase();
  const filtered = ACCESSORIES_115.filter((item) => {
    const matchCat = accCategoryTerm === 'all' || item.cat === accCategoryTerm;
    if (!matchCat) return false;
    if (!term) return true;
    return String(item.id) === term ||
      item.name.toLowerCase().includes(term) ||
      catLabelFor(item.cat).toLowerCase().includes(term);
  });

  $('accCountInfo').textContent = `Exibindo ${filtered.length} de ${ACCESSORIES_115.length} acessórios`;
  $('accList').innerHTML = filtered.map((item) => `
    <button type="button" class="ed-acc-item" data-acc-id="${item.id}">
      <span><strong>${item.id}.</strong> ${item.name}<small>${item.w}×${item.h}×${item.d} cm · ${catLabelFor(item.cat).replace(/^\d+\.\s*/, '')}</small></span>
      <span class="ed-acc-badge">+ Add</span>
    </button>
  `).join('') || '<div class="ed-meta-note">Nenhum acessório encontrado para o filtro.</div>';
}

function ui() {
  $('projName').value = project.name;
  const ps = project.parts;
  const W = ps.length ? Math.max(...ps.map((q) => q.x + q.w / 2)) - Math.min(...ps.map((q) => q.x - q.w / 2)) : 0;
  const H = ps.length ? Math.max(...ps.map((q) => q.y + q.h / 2)) : 0;
  const D = ps.length ? Math.max(...ps.map((q) => q.z + q.d / 2)) - Math.min(...ps.map((q) => q.z - q.d / 2)) : 0;
  $('projDims').textContent = `Tamanho total: ${r1(W)} × ${r1(H)} × ${r1(D)} cm (L × A × P)`;
  $('partCount').textContent = ps.length;
  $('partList').innerHTML = ps.map((q, i) => `
    <button class="ed-item ${i === sel ? 'on' : ''}" data-i="${i}">
      ${q.n} <small>${r1(q.w)}×${r1(q.h)}×${r1(q.d)}</small>
    </button>
  `).join('');

  $('selCard').style.opacity = sel >= 0 ? 1 : 0.45;
  const q = ps[sel];
  $('selName').value = q ? q.n : '';
  $('selMeta').textContent = q
    ? (q.accId ? `Acessório #${q.accId} · ${catLabelFor(q.accCat)}` : `Tipo estrutural: ${q.t || 'painel'}`)
    : 'Nenhuma peça ou acessório selecionado';

  const field = (lab, k) => `
    <div class="ed-field">
      <label>${lab}</label>
      <div class="ed-step">
        <button data-k="${k}" data-s="-1">−</button>
        <input type="number" step="0.1" data-k="${k}" value="${q ? r1(q[k]) : ''}" />
        <button data-k="${k}" data-s="1">+</button>
      </div>
    </div>
  `;
  $('sizeFields').innerHTML = field('Largura', 'w') + field('Altura', 'h') + field('Profund.', 'd');
  $('posFields').innerHTML = field('Posição X', 'x') + field('Altura Y', 'y') + field('Posição Z', 'z');
  $('colors').innerHTML = SW().map(([id, c, n]) => `
    <button class="ed-sw ${id === color ? 'on' : ''}" style="background:${c}" data-c="${id}" title="${n}" aria-label="${n}"></button>
  `).join('');
}

function commit() {
  undo.push(snap());
  if (undo.length > 80) undo.shift();
  redo.length = 0;
}

function change(fn) {
  commit();
  fn();
  rebuild();
}

/* Inicialização de abas, filtros, presets e peças */
$('accCatFilter').innerHTML = ACCESSORY_CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');
renderAccessoriesList();

$('tabParts').addEventListener('click', () => {
  $('tabParts').classList.add('on'); $('tabParts').setAttribute('aria-selected', 'true');
  $('tabAcc').classList.remove('on'); $('tabAcc').setAttribute('aria-selected', 'false');
  $('panelParts').style.display = '';
  $('panelAcc').style.display = 'none';
});

$('tabAcc').addEventListener('click', () => {
  $('tabAcc').classList.add('on'); $('tabAcc').setAttribute('aria-selected', 'true');
  $('tabParts').classList.remove('on'); $('tabParts').setAttribute('aria-selected', 'false');
  $('panelAcc').style.display = '';
  $('panelParts').style.display = 'none';
});

$('accSearch').addEventListener('input', (e) => {
  accSearchTerm = e.target.value || '';
  renderAccessoriesList();
});

$('accCatFilter').addEventListener('change', (e) => {
  accCategoryTerm = e.target.value;
  renderAccessoriesList();
});

$('accList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-acc-id]');
  if (!btn) return;
  const accId = Number(btn.dataset.accId);
  const acc = ACCESSORIES_115.find((x) => x.id === accId);
  if (!acc) return;
  const count = project.parts.filter((p) => p.accId === acc.id).length + 1;
  change(() => {
    project.parts.push({
      t: acc.t,
      n: `${acc.id}. ${acc.name} #${count}`,
      w: acc.w,
      h: acc.h,
      d: acc.d,
      x: 0,
      y: acc.h / 2,
      z: 0,
      c: acc.c || color,
      accId: acc.id,
      accCat: acc.cat
    });
    sel = project.parts.length - 1;
  });
});

$('presetGrid').innerHTML = PRESETS.map((p) => `<button class="ed-chip" data-preset="${p.key}">${p.label}</button>`).join('');
$('presetGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-preset]');
  if (!btn) return;
  const items = buildPresetParts(btn.dataset.preset, project.finish || color);
  if (!items.length) return;
  change(() => {
    project.parts.push(...items);
    sel = project.parts.length - 1;
  });
});

$('addGrid').innerHTML = Object.entries(TYPES).map(([k, v]) => `<button class="ed-chip" data-add="${k}">+ ${v.label}</button>`).join('');
$('addGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const T = TYPES[btn.dataset.add];
  if (!T) return;
  const n = project.parts.filter((p) => p.n.startsWith(T.n)).length + 1;
  change(() => {
    project.parts.push({
      t: T.t,
      n: `${T.n} ${n}`,
      w: T.w,
      h: T.h,
      d: T.d,
      x: 0,
      y: T.h / 2,
      z: 0,
      c: T.c || color
    });
    sel = project.parts.length - 1;
  });
});

$('partList').addEventListener('click', (e) => {
  const i = e.target.closest('[data-i]');
  if (i) { sel = +i.dataset.i; rebuild(); }
});
$('projName').addEventListener('change', (e) => { project.name = e.target.value || 'Meu móvel'; });
$('selName').addEventListener('change', (e) => { if (sel >= 0) change(() => { project.parts[sel].n = e.target.value; }); });
$('stepSel').addEventListener('change', (e) => { step = +e.target.value; });

document.querySelector('.ed-panel').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-s]');
  if (b && sel >= 0) {
    const k = b.dataset.k;
    change(() => {
      const q = project.parts[sel];
      q[k] = Math.max(['w', 'h', 'd'].includes(k) ? 0.5 : -999, r1(q[k] + step * +b.dataset.s));
    });
    return;
  }
  const sw = e.target.closest('[data-c]');
  if (sw) {
    color = sw.dataset.c;
    if (sel >= 0) change(() => { project.parts[sel].c = color; });
    else ui();
  }
});

document.querySelector('.ed-panel').addEventListener('change', (e) => {
  const k = e.target.dataset.k;
  if (k && sel >= 0) change(() => { project.parts[sel][k] = r1(parseFloat(e.target.value) || 0); });
});

$('dupBtn').addEventListener('click', () => {
  if (sel >= 0) change(() => {
    const q = { ...project.parts[sel] };
    q.n += ' (cópia)';
    q.x += 5;
    project.parts.push(q);
    sel = project.parts.length - 1;
  });
});
$('delBtn').addEventListener('click', () => { if (sel >= 0) change(() => { project.parts.splice(sel, 1); sel = -1; }); });
$('paintAllBtn').addEventListener('click', () => change(() => {
  project.parts.forEach((q) => { if (q.c !== 'metal' && q.c !== 'stone') q.c = color; });
}));
$('undoBtn').addEventListener('click', () => { if (undo.length) { redo.push(snap()); project = JSON.parse(undo.pop()); sel = -1; rebuild(); } });
$('redoBtn').addEventListener('click', () => { if (redo.length) { undo.push(snap()); project = JSON.parse(redo.pop()); sel = -1; rebuild(); } });
$('saveBtn').addEventListener('click', () => {
  localStorage.setItem('zf_project', JSON.stringify(project));
  location.href = 'index.html#edit';
});

/* ---------- Toque: selecionar e arrastar no chão ---------- */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
let drag = null;
function setPtr(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
}
renderer.domElement.addEventListener('pointerdown', (e) => {
  setPtr(e);
  const h = ray.intersectObjects(group.children, false)[0];
  if (!h) return;
  sel = h.object.userData.i;
  rebuild();
  const q = project.parts[sel];
  plane.constant = -q.y / 100;
  ray.ray.intersectPlane(plane, hit);
  drag = { sx: hit.x, sz: hit.z, x0: q.x, z0: q.z, moved: false, before: snap() };
  controls.enabled = false;
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  setPtr(e);
  if (!ray.ray.intersectPlane(plane, hit)) return;
  const q = project.parts[sel], g = group.children[sel];
  q.x = Math.round(drag.x0 + (hit.x - drag.sx) * 100);
  q.z = Math.round(drag.z0 + (hit.z - drag.sz) * 100);
  drag.moved = true;
  g.position.set(q.x / 100, q.y / 100, q.z / 100);
  if (outline) outline.update();
});
window.addEventListener('pointerup', () => {
  if (drag && drag.moved) { undo.push(drag.before); redo.length = 0; ui(); }
  drag = null;
  controls.enabled = true;
});

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
(function loop() {
  requestAnimationFrame(loop);
  if (document.hidden) return;
  controls.update();
  renderer.render(scene, camera);
})();
rebuild();
resize();
