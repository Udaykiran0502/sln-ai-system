import React, { useState } from 'react';
import { User, Layers, Type, Palette, Sparkles, ArrowLeft, ArrowRight, Upload, X, Check, Loader2 } from 'lucide-react';
import { createOrder, uploadAsset } from '../api/orders';
import useDesignStore from '../store/useDesignStore';

const STEPS = [
  { id: 1, label: 'Client', icon: User },
  { id: 2, label: 'Design', icon: Layers },
  { id: 3, label: 'Content', icon: Type },
  { id: 4, label: 'Style', icon: Palette },
  { id: 5, label: 'Generate', icon: Sparkles },
];

const CATEGORIES = [
  { id: 'political', icon: '🏛️', label: 'Political', color: '#FF9933', description: 'Campaigns, party rallies, election flexes' },
  { id: 'wedding', icon: '💒', label: 'Wedding', color: '#8B0000', description: 'Marriage banners, invitations, family stages' },
  { id: 'business', icon: '💼', label: 'Business', color: '#1E3A5F', description: 'Store openings, product advertisements, shops' },
  { id: 'religious', icon: '🕉️', label: 'Religious', color: '#B22222', description: 'Festivals, temples, sacred events' },
  { id: 'general', icon: '🎯', label: 'General', color: '#6366F1', description: 'Birthdays, generic functions, custom notices' },
];

export function CreateWizard() {
  const { setRoute, loadOrder, routeParams } = useDesignStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Client Information
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [language, setLanguage] = useState('telugu');

  // Step 2: Design configuration
  const [category, setCategory] = useState('political');
  const [width, setWidth] = useState(48);
  const [height, setHeight] = useState(24);
  const [dpi, setDpi] = useState(300);

  // Step 3: Text content & uploads
  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [tagline, setTagline] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]); // items: { name, path, preview }

  // Step 4: Color styling
  const [primaryColor, setPrimaryColor] = useState('#FF9933');
  const [accentColor, setAccentColor] = useState('#008000');

  // Prefill templates effect
  React.useEffect(() => {
    if (routeParams && routeParams.prefill === 'true') {
      if (routeParams.category) setCategory(routeParams.category);
      if (routeParams.primary) setPrimaryColor(routeParams.primary);
      if (routeParams.accent) setAccentColor(routeParams.accent);
      if (routeParams.heading) setHeading(routeParams.heading);
      // Clear URL prefill state without modifying history stack to prevent re-hydrations
      setRoute('create-wizard', {}, true);
    }
  }, [routeParams, setRoute]);

  // Phone validation
  const validatePhone = (p) => {
    const cleaned = p.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  };

  // Upload handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    setErrorMsg('');

    for (const file of files) {
      try {
        const res = await uploadAsset(file);
        if (res.data && res.data.ok) {
          const previewUrl = URL.createObjectURL(file);
          setUploadedImages(prev => [...prev, {
            name: file.name,
            path: res.data.path,
            preview: previewUrl
          }]);
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.detail || `Failed to upload "${file.name}"`);
      }
    }
    setUploadingFiles(false);
  };

  const removeUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit queue trigger
  const handleGenerate = async () => {
    setErrorMsg('');
    setLoading(true);

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!clientName.trim()) {
      setErrorMsg('Client name is required');
      setLoading(false);
      return;
    }
    if (!validatePhone(cleanedPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      setLoading(false);
      return;
    }
    if (!heading.trim()) {
      setErrorMsg('Main heading is required');
      setLoading(false);
      return;
    }

    const orderPayload = {
      client_name: clientName,
      banner_type: category,
      event_type: eventType,
      dimensions: {
        width_inches: Number(width),
        height_inches: Number(height),
      },
      dpi: Number(dpi),
      language,
      colors: {
        primary: primaryColor,
        accent: accentColor,
      },
      text_content: {
        heading,
        subheading,
        phone: cleanedPhone,
        tagline, // optional footer
      },
      phone_numbers: [cleanedPhone],
      images: uploadedImages.map(img => img.path),
    };

    try {
      const res = await createOrder(orderPayload);
      if (res.data && res.data.order_id) {
        const orderId = res.data.order_id;
        setSuccessMsg(`Design generated successfully! Order ID: ${orderId}`);
        // Navigate to the Workspace and load the newly created order
        setTimeout(() => {
          setRoute('workspace', { orderId });
          loadOrder(orderId);
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'We could not submit this design. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const cleanedPhone = phone.replace(/\D/g, '');
    if (step === 1) {
      if (!clientName.trim()) {
        setErrorMsg('Client name is required');
        return;
      }
      if (!validatePhone(cleanedPhone)) {
        setErrorMsg('A valid 10-digit Indian mobile number is required');
        return;
      }
    }
    if (step === 3) {
      if (!heading.trim()) {
        setErrorMsg('Main heading is required');
        return;
      }
    }
    setErrorMsg('');
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] py-8 px-4 flex justify-center scrollbar-thin scrollbar-thumb-white/10">
      <div className="w-full max-w-4xl flex flex-col">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Create Design</h1>
            <p className="text-[11px] text-[#8b8ba3] mt-1">Configure and generate a new banner design using the design intelligence engine</p>
          </div>
          <button
            onClick={() => setRoute('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-white/5 border border-white/10 text-[#8b8ba3] hover:text-white transition-all hover:bg-white/10"
          >
            <ArrowLeft size={12} />
            <span>Cancel</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-8 select-none">
          {STEPS.map(({ id, label, icon: Icon }) => {
            const isCompleted = id < step;
            const isActive = id === step;
            return (
              <div
                key={id}
                onClick={() => id <= step && setStep(id)}
                className={`flex-1 rounded-xl p-3 border transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  isCompleted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' :
                  isActive ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] shadow-lg shadow-[#D4AF37]/5' :
                  'bg-white/[0.02] border-white/5 text-[#55556a] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-500/10' : isActive ? 'bg-[#D4AF37]/10' : 'bg-white/5'}`}>
                  {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className="text-[10px] font-semibold tracking-wide uppercase mt-1">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="mb-6 p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <Check size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="flex-grow bg-[#09090e] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

          {/* STEP 1: Client Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">👤 Client Information</h2>
                <p className="text-[10px] text-[#55556a]">Identify the client and setup their primary event details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Client Name *</label>
                  <input
                    className="sln-input w-full"
                    placeholder="e.g. Sri Lakshmi Enterprises"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Phone Number *</label>
                  <input
                    className="sln-input w-full"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Event / Occasion</label>
                  <input
                    className="sln-input w-full"
                    placeholder="e.g. Grand Opening, Election Campaign"
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Primary Language</label>
                  <select
                    className="sln-input w-full bg-[#050508]"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="telugu">Telugu</option>
                    <option value="english">English</option>
                    <option value="mixed">Mixed (Telugu + English)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Design Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">📐 Design Configuration</h2>
                <p className="text-[10px] text-[#55556a]">Configure dimensions and categorize your new print design</p>
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider block">Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {CATEGORIES.map(cat => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
                            : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className="text-3xl">{cat.icon}</span>
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-[#D4AF37]' : 'text-white/80'}`}>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#55556a] mt-1 italic">
                  {CATEGORIES.find(c => c.id === category)?.description}
                </p>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Width (inches)</label>
                  <input
                    type="number"
                    className="sln-input w-full"
                    min={6}
                    max={240}
                    value={width}
                    onChange={e => setWidth(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Height (inches)</label>
                  <input
                    type="number"
                    className="sln-input w-full"
                    min={6}
                    max={120}
                    value={height}
                    onChange={e => setHeight(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Print DPI</label>
                  <select
                    className="sln-input w-full bg-[#050508]"
                    value={dpi}
                    onChange={e => setDpi(Number(e.target.value))}
                  >
                    <option value={300}>300 (High-definition)</option>
                    <option value={150}>150 (Standard draft)</option>
                    <option value={72}>72 (Web preview only)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Content */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">✍️ Text & Assets</h2>
                <p className="text-[10px] text-[#55556a]">Specify headline texts and upload any key reference assets</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Main Heading Text *</label>
                  <input
                    className="sln-input w-full"
                    placeholder="e.g. జై శ్రీరాం / GRAND OPENING"
                    value={heading}
                    onChange={e => setHeading(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Subheading Text</label>
                    <input
                      className="sln-input w-full"
                      placeholder="e.g. మీ సేవలో మేము"
                      value={subheading}
                      onChange={e => setSubheading(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Tagline / Footer</label>
                    <input
                      className="sln-input w-full"
                      placeholder="e.g. Visit us or Call for reservations"
                      value={tagline}
                      onChange={e => setTagline(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Upload section */}
              <div className="pt-4 space-y-3">
                <label className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider block">Reference Images (Optional)</label>
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] hover:border-[#D4AF37]/30 transition-all relative">
                  <input
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingFiles}
                  />
                  {uploadingFiles ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
                      <span className="text-[10px] text-[#8b8ba3]">Uploading assets...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-[#8b8ba3]" />
                      <span className="text-[11px] text-[#8b8ba3]">Drag and drop images here, or click to browse</span>
                      <span className="text-[9px] text-[#55556a]">JPG or PNG files under 10MB</span>
                    </div>
                  )}
                </div>

                {/* Uploaded previews */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-lg border border-white/5 overflow-hidden aspect-video bg-[#050508] group">
                        <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-950/80 border border-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-0.5 text-[8px] text-[#8b8ba3] truncate">
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Style & Colors */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">🎨 Style & Colors</h2>
                <p className="text-[10px] text-[#55556a]">Define primary and accent color specifications</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/5">
                  <span className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Primary Theme Color</span>
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/10" style={{ backgroundColor: primaryColor }}>
                    <input
                      type="color"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    className="sln-input w-28 text-center !text-[11px] font-mono"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                  />
                </div>

                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/5">
                  <span className="text-[10px] font-semibold text-[#8b8ba3] uppercase tracking-wider">Accent Detail Color</span>
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/10" style={{ backgroundColor: accentColor }}>
                    <input
                      type="color"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    className="sln-input w-28 text-center !text-[11px] font-mono"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                  />
                </div>
              </div>

              {/* Theme Swatch Previews */}
              <div className="p-4 rounded-xl border border-white/5 bg-[#050508]/40 space-y-3">
                <span className="text-[10px] font-semibold text-[#55556a] uppercase tracking-wider block text-center">Interactive Gradient Swatch Preview</span>
                <div className="flex gap-4">
                  <div className="flex-1 h-12 rounded-lg border border-white/5 shadow-inner transition-all duration-300" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}44)` }} />
                  <div className="flex-1 h-12 rounded-lg border border-white/5 shadow-inner transition-all duration-300" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}44)` }} />
                  <div className="flex-1 h-12 rounded-lg border border-white/5 shadow-inner transition-all duration-300" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Generate */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">🚀 Review and Launch Pipeline</h2>
                <p className="text-[10px] text-[#55556a]">Verify order details below and run the LangGraph design agent</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2.5">
                  <div className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wider">Client & Details</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#55556a]">Name:</span> <span className="text-white font-medium">{clientName}</span></div>
                    <div className="flex justify-between"><span className="text-[#55556a]">Phone:</span> <span className="text-white font-mono">{phone}</span></div>
                    <div className="flex justify-between"><span className="text-[#55556a]">Occasion:</span> <span className="text-white">{eventType || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-[#55556a]">Language:</span> <span className="text-white capitalize">{language}</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2.5">
                  <div className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wider">Composition Spec</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#55556a]">Category:</span> <span className="text-white capitalize">{category}</span></div>
                    <div className="flex justify-between"><span className="text-[#55556a]">Size (inches):</span> <span className="text-white font-mono">{width}" × {height}"</span></div>
                    <div className="flex justify-between"><span className="text-[#55556a]">Resolution:</span> <span className="text-white font-mono">{dpi} DPI</span></div>
                    <div className="flex justify-between">
                      <span className="text-[#55556a]">Uploaded Assets:</span>
                      <span className="text-white font-mono">{uploadedImages.length} image(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                <div className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wider">Visual Content Summary</div>
                <div className="text-[11px] space-y-1.5">
                  <div className="flex gap-2"><span className="text-[#55556a] w-16">Heading:</span> <span className="text-white font-medium">{heading}</span></div>
                  {subheading && <div className="flex gap-2"><span className="text-[#55556a] w-16">Subheading:</span> <span className="text-white">{subheading}</span></div>}
                  {tagline && <div className="flex gap-2"><span className="text-[#55556a] w-16">Tagline:</span> <span className="text-white">{tagline}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                step === 1 || loading
                  ? 'opacity-30 cursor-not-allowed text-[#55556a]'
                  : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#D4AF37] text-black hover:bg-[#F3E5AB] transition-all hover:scale-[1.02] shadow-lg shadow-[#D4AF37]/10"
              >
                <span>Continue</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black hover:brightness-110 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/15"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Launching Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Generate Design</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
