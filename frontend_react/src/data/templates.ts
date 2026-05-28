import { type SceneNode } from '../store/useStore';

export interface TemplatePreset {
  id: string;
  name: string;
  category: 'political' | 'wedding' | 'business';
  width: number;
  height: number;
  description: string;
  nodes: SceneNode[];
}

export const templatesData: TemplatePreset[] = [
  {
    id: 'janasena-political-flex',
    name: 'Janasena Campaign Banner',
    category: 'political',
    width: 800,
    height: 600,
    description: '10x8ft Political Campaign Flex with shaped Telugu typography & border guards.',
    nodes: [
      {
        id: 'bg-political',
        type: 'shape',
        name: 'Background Card',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: true,
        style: {
          shapeType: 'rect',
          fill: '#0f172a',
          stroke: '#991b1b',
          strokeWidth: 4,
        }
      },
      {
        id: 'header-political',
        type: 'text',
        name: 'Telugu Header Banner',
        x: 100,
        y: 60,
        width: 600,
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
        style: {
          text: 'మార్పు కోసం జనసేన శంఖారావం',
          fontSize: 42,
          fontFamily: 'Ramabhadra',
          fill: '#ffffff',
          align: 'center',
          teluguShaped: true
        }
      },
      {
        id: 'subtext-political',
        type: 'text',
        name: 'Subtitle Support Text',
        x: 150,
        y: 160,
        width: 500,
        height: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
        style: {
          text: 'సమసమాజ స్థాపనే ధ్యేయం - పవన్ కళ్యాణ్',
          fontSize: 22,
          fontFamily: 'Mandali',
          fill: '#facc15',
          align: 'center',
          teluguShaped: true
        }
      },
      {
        id: 'border-political-guide',
        type: 'shape',
        name: 'Inner Margin Guide',
        x: 20,
        y: 20,
        width: 760,
        height: 560,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: true,
        style: {
          shapeType: 'rect',
          fill: 'transparent',
          stroke: '#ef4444',
          strokeWidth: 1,
        }
      }
    ]
  },
  {
    id: 'hindu-wedding-flex',
    name: 'Classic Wedding Banner',
    category: 'wedding',
    width: 1000,
    height: 400,
    description: '12x4ft Traditional Wedding Flex featuring golden frame panels & Shubh Lagna designs.',
    nodes: [
      {
        id: 'bg-wedding',
        type: 'shape',
        name: 'Wedding Background',
        x: 0,
        y: 0,
        width: 1000,
        height: 400,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: true,
        style: {
          shapeType: 'rect',
          fill: '#450a0a',
          stroke: '#eab308',
          strokeWidth: 6,
        }
      },
      {
        id: 'header-wedding',
        type: 'text',
        name: 'Telugu Wedding Title',
        x: 200,
        y: 50,
        width: 600,
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
        style: {
          text: 'కళ్యాణ మహోత్సవ ఆహ్వాన పత్రిక',
          fontSize: 38,
          fontFamily: 'NTR',
          fill: '#fef08a',
          align: 'center',
          teluguShaped: true
        }
      },
      {
        id: 'lagna-time-text',
        type: 'text',
        name: 'Lagna Mahurat details',
        x: 250,
        y: 150,
        width: 500,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
        style: {
          text: 'శుభ ముహూర్తం: స్వస్తిశ్రీ చైత్ర శుద్ధ పంచమి',
          fontSize: 24,
          fontFamily: 'Mandali',
          fill: '#ffffff',
          align: 'center',
          teluguShaped: true
        }
      }
    ]
  },
  {
    id: 'retail-business-marketing',
    name: 'Retail Flex Banner',
    category: 'business',
    width: 800,
    height: 300,
    description: '8x3ft Landscape Marketing Flex with pricing boxes and Indic typography.',
    nodes: [
      {
        id: 'bg-retail',
        type: 'shape',
        name: 'Retail Background',
        x: 0,
        y: 0,
        width: 800,
        height: 300,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: true,
        style: {
          shapeType: 'rect',
          fill: '#020617',
          stroke: '#2563eb',
          strokeWidth: 4,
        }
      },
      {
        id: 'header-retail',
        type: 'text',
        name: 'Telugu Business Name',
        x: 100,
        y: 40,
        width: 600,
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
        style: {
          text: 'శ్రీ లక్ష్మీ కిరాణా & జనరల్ స్టోర్స్',
          fontSize: 36,
          fontFamily: 'TenaliRamakrishna',
          fill: '#2563eb',
          align: 'center',
          teluguShaped: true
        }
      },
      {
        id: 'pricing-sub',
        type: 'text',
        name: 'Pricing description',
        x: 150,
        y: 140,
        width: 500,
        height: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
        style: {
          text: 'హోల్‌సేల్ ధరలకే చిల్లర వర్తకం - త్వరపడండి!',
          fontSize: 20,
          fontFamily: 'Mandali',
          fill: '#10b981',
          align: 'center',
          teluguShaped: true
        }
      }
    ]
  }
];
