import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const Icon = ({ name, className = "", fill = false }: { name: string; className?: string; fill?: boolean }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
  >
    {name}
  </span>
);

function App() {
  const [dark, setDark] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile responsive menu state control
  const [openCategory, setOpenCategory] = useState<number | null>(0);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  // --- NATIVE CHAT WIDGET STATE ENGINES ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi there! 👋 I'm IRIS, the digital assistant for SGR Dynamics. Looking to scale your business with custom apps or AI workflows? Tell me a bit about your project!",
      sender: "bot",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const WEBHOOK_URL =
  "https://bot.sgrdynamics.com/webhook/b6efb0e3-fde4-469e-b1c2-6b997603cf1b/chat";
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    service: "",
    preferred_contact: "",
    requirements: "",
  });

  const footerSections = [
    {
      title: "Services",
      links: [
        "Web Development",
        "Mobile Applications",
        "AI Agents",
        "Business Automation",
      ],
    },
    {
      title: "Company",
      links: [
        "About Us",
        "Featured Projects",
        "Knowledge Base",
        "Contact Us",
      ],
    },
    {
      title: "Resources",
      links: [
        "FAQ",
        "Privacy Policy",
        "Terms & Conditions",
        "Support",
      ],
    },
  ];

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from("Leads").insert([formData]);
      if (error) throw error;

      try {
        await fetch("https://bot.sgrdynamics.com/webhook/lead-form", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      setSuccess(true);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        industry: "",
        service: "",
        preferred_contact: "",
        requirements: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const getSessionId = (): string => {
    if (typeof window === "undefined") return "";
    let sessionId = localStorage.getItem("waveAiSessionId");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      localStorage.setItem("waveAiSessionId", sessionId);
    }
    return sessionId;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const saved = localStorage.getItem("sgr-theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("sgr-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (trailRef.current) {
        trailRef.current.style.left = e.clientX + "px";
        trailRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    setMessages((prev) => [...prev, { id: `msg_${Date.now()}`, text: trimmedMessage, sender: "user" }]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendMessage",
          chatInput: trimmedMessage,
          sessionId: getSessionId(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let botReply = "I'm having trouble handling requests right now.";
        
        if (data && data.output) {
          botReply = data.output;
        } else if (Array.isArray(data) && data.length > 0) {
          botReply = data[0].output || data[0].text || botReply;
        }

        setMessages((prev) => [...prev, { id: `bot_${Date.now()}`, text: botReply, sender: "bot" }]);
      } else {
        setMessages((prev) => [...prev, { id: `err_${Date.now()}`, text: "Error syncing parameters with cloud backend.", sender: "bot" }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: `err_${Date.now()}`, text: "Connection trace timed out. Verify AWS node statuses.", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const services = [
    {
      icon: "sync_desktop",
      title: "Full-Stack Web Development",
      desc: "We build modern websites, web applications, and custom software solutions that help businesses streamline operations, improve customer experiences, and scale efficiently in a digital-first world.",
      bullets: ["Custom Web Applications", "Business Management Platforms", "Performance & Scalability Optimization"],
    },
    {
      icon: "devices",
      title: "Native Cross-Platform Apps",
      desc: "Create engaging mobile experiences with cross-platform and native-quality applications designed to connect businesses with users across Android and iOS devices.",
      bullets: ["React Native Excellence", "Flutter App Development", "Secure Authentication & Integrations"],
    },
    {
      icon: "smart_toy",
      title: "Intelligent Agents & Automations",
      desc: "Transform repetitive business processes into efficient automated workflows using AI-powered systems that improve productivity, reduce manual effort, and accelerate growth.",
      bullets: ["LLM RAG Pipelines", "Custom n8n Nodes", "AI-Powered Integrations"],
    },
  ];

  const faqCategories = [
    {
      title: "Web Development",
      icon: "language",
      faqs: [
        { q: "What types of websites do you build?", a: "We develop business websites, landing pages, SaaS platforms, customer portals, dashboards, and custom web applications tailored to business requirements." },
        { q: "How long does a website project take?", a: "Timelines depend on complexity. Simple websites may take a few weeks, while larger platforms and software solutions require additional development time." },
        { q: "Will my website work on mobile devices?", a: "Yes. Every website is fully responsive and optimized for desktops, tablets, and smartphones." },
        { q: "Can you redesign my existing website?", a: "Absolutely. We can modernize outdated websites, improve performance, and enhance the overall user experience." },
        { q: "Will I be able to manage content myself?", a: "Yes. We can provide content management functionality so you can update content without technical knowledge." },
        { q: "Do you provide support after launch?", a: "Yes. We offer maintenance, updates, monitoring, and technical support after deployment." },
      ],
    },
    {
      title: "Mobile Applications",
      icon: "phone_iphone",
      faqs: [
        { q: "Do you develop apps for both Android and iOS?", a: "Yes. We build cross-platform mobile applications that work seamlessly across Android and iOS devices." },
        { q: "What types of mobile apps can you build?", a: "We develop business apps, educational apps, booking platforms, fitness applications, e-commerce apps, and more." },
        { q: "Can mobile apps connect with my website?", a: "Yes. Mobile applications can integrate with websites, APIs, databases, payment gateways, and third-party systems." },
        { q: "Will the app be published to app stores?", a: "Yes. We assist with publishing applications to Google Play Store and Apple App Store." },
        { q: "How secure are mobile applications?", a: "We implement secure authentication, encryption, data protection, and industry best practices." },
        { q: "Can existing apps be upgraded?", a: "Yes. We can redesign, optimize, and expand existing mobile applications with new features." },
      ],
    },
    {
      title: "AI & Automation",
      icon: "smart_toy",
      faqs: [
        { q: "What is business automation?", a: "Business automation uses software to eliminate repetitive manual tasks and improve operational efficiency." },
        { q: "How can AI help my business?", a: "AI can automate customer support, lead management, reporting, content generation, and many operational processes." },
        { q: "Do I need technical knowledge to use AI systems?", a: "No. We build solutions that are simple to use and accessible for non-technical teams." },
        { q: "Can AI integrate with my existing tools?", a: "Yes. AI solutions can connect with CRMs, websites, databases, communication platforms, and business software." },
        { q: "Is my business data secure?", a: "Yes. Security and privacy are incorporated into every solution using industry-standard best practices." },
        { q: "What processes can be automated?", a: "Lead management, reporting, notifications, scheduling, customer communication, approvals, and many repetitive workflows." },
      ],
    },
  ];

  const contactMethods = [
    {
      icon: "images/mail.png",
      label: "Email Protocol",
      value: "saiganeshreddy2276@gmail.com",
      href: "https://mail.google.com/mail/?view=cm&fs=1&to=contact@sgrdynamics.com",
    },
    {
      icon: "images/call.png",
      label: "Voice Link",
      value: "+91 83419 61217",
      href: "tel:+918341961217",
    },
    {
      icon: "images/whatsapp.png",
      label: "WhatsApp Direct",
      value: "+91 83419 61217",
      href: "https://wa.me/918341961217?text=Hi%20SGR%20Dynamics,%20I%20am%20interested%20in%20your%20services.",
    },
  ];

  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#services", label: "Services" },
    // { href: "#reviews", label: "Reviews" },
    { href: "#projects", label: "Projects" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="bg-surface text-on-surface dark:bg-slate-deep dark:text-[#f5f0ed] transition-colors duration-500 overflow-x-hidden">
      {/* Motion Layer Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-peach-glow morph-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-coral-vibrant morph-blob" style={{ animationDelay: "-5s" }} />
        <div className="absolute inset-0 grid-overlay" />
        <div ref={trailRef} className="cursor-trail" />
      </div>

      {/* Nav Container */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-container-max z-50">
        <nav className="w-full rounded-full border border-white/10 bg-surface/80 dark:bg-slate-deep/80 backdrop-blur-xl flex justify-between items-center px-6 md:px-8 py-3 shadow-[0_8px_32px_rgba(99,68,50,0.08)]">
          <div className="flex items-center gap-2">
            <span className="text-title-md font-display-lg font-bold text-primary dark:text-peach-glow">SGR Dynamics</span>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex gap-6 items-center">
            {navLinks.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                className={`font-label-md text-label-md transition-colors duration-300 ${
                  i === 0
                    ? "text-primary dark:text-peach-glow font-bold border-b-2 border-coral-vibrant pb-1"
                    : "text-on-surface-variant dark:text-surface-variant hover:text-coral-vibrant"
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setDark((d) => !d)} className="p-2 text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors" aria-label="Toggle theme">
              <Icon name={dark ? "light_mode" : "dark_mode"} />
            </button>
            
            {/* Mobile Burger Menu Button Switcher */}
            <button 
              onClick={() => setIsMenuOpen((prev) => !prev)} 
              className="p-2 text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors flex md:hidden"
              aria-label="Toggle Navigation Menu"
            >
              <Icon name={isMenuOpen ? "close" : "menu"} />
            </button>

            <a href="#contact" className="hidden md:block px-6 py-2 bg-gradient-to-r from-peach-glow to-coral-vibrant text-white font-label-md text-label-md rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg">
              Book Consultation
            </a>
          </div>
        </nav>

        {/* Sliding Responsive Mobile Drawer Panel */}
        <div className={`w-full bg-surface/95 dark:bg-slate-deep/95 backdrop-blur-2xl rounded-3xl mt-2 p-6 border border-white/10 shadow-2xl flex flex-col gap-4 md:hidden transition-all duration-300 origin-top ${isMenuOpen ? "scale-y-100 opacity-100 pointer-events-auto" : "scale-y-0 opacity-0 pointer-events-none h-0 overflow-hidden"}`}>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setIsMenuOpen(false)}
              className="font-medium text-lg px-4 py-2 rounded-xl text-on-surface-variant dark:text-surface-variant hover:bg-black/5 dark:hover:bg-white/5 hover:text-coral-vibrant transition-all"
            >
              {l.label}
            </a>
          ))}
          <hr className="border-white/10 my-1" />
          <a 
            href="#contact" 
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-center px-6 py-3 bg-gradient-to-r from-peach-glow to-coral-vibrant text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            Book Consultation
          </a>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section id="home" className="min-h-screen flex flex-col items-center justify-center pt-32 px-margin-desktop text-center max-w-container-max mx-auto">
          <span className="px-4 py-1 rounded-full border border-outline-variant/30 font-label-md text-label-md mb-8 animate-pulse text-primary dark:text-peach-glow">
            Next-Gen Digital Craftsmanship
          </span>
          <h1 className="font-display-lg text-display-lg mb-8 max-w-4xl gradient-text-shimmer">
            SGR Dynamics.<br />We Code. AI Completes.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-surface-variant max-w-2xl mb-12 leading-relaxed">
            We help businesses transform ideas into powerful digital products through custom software development, modern websites, mobile applications, and AI-powered automation. Our solutions are designed to improve efficiency, enhance customer experiences, and support long-term business growth.
          </p>
          <div className="flex flex-col md:flex-row gap-6">
            <a href="#projects" className="px-10 py-4 bg-gradient-to-r from-peach-glow to-coral-vibrant text-white font-label-md text-title-md rounded-full shadow-xl hover:shadow-coral-vibrant/20 hover:-translate-y-1 transition-all">
              Explore Systems
            </a>
            <a href="#contact" className="px-10 py-4 glass-card border-outline-variant/30 text-on-surface dark:text-[#f5f0ed] font-label-md text-title-md rounded-full hover:bg-surface-container transition-all">
              Initiate Protocol
            </a>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-32 px-margin-desktop max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="font-label-md text-label-md text-coral-vibrant uppercase tracking-widest mb-6">01 / ABOUT OUR ENGINE</h2>
              <h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-[#f5f0ed] mb-8 leading-tight">
                Building Digital Solutions That Solve Real Business Problems
              </h3>
              <div className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl group">
                <img
                  alt="Tech Lab"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src="/images/about_section.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-umber-rich/40 to-transparent" />
              </div>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-surface-variant mb-6">
                At SGR Dynamics, we don't just build software; we create intelligent digital ecosystems designed to solve complex business challenges. Our approach focuses on developing solutions that automate workflows, improve operational efficiency, and empower organizations to scale with confidence.
              </p>
              <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-surface-variant">
                By combining modern software engineering with intelligent automation, we build solutions that reduce manual effort, improve efficiency, and enhance customer experiences. We work as trusted technology partners, helping businesses transform ideas into scalable digital products that deliver real-world impact.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-12">
                <div>
                  <span className="block text-2xl font-semibold text-primary dark:text-peach-glow mb-2 tracking-wide">
                    • Web • Mobile • AI
                  </span>
                  <span className="text-sm uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap">
                    End-to-End Development
                  </span>
                </div>
                <div>
                  <span className="block text-2xl font-semibold text-primary dark:text-peach-glow mb-2 tracking-wide">
                    24/7
                  </span>
                  <span className="text-sm uppercase tracking-[0.2em] text-on-surface-variant">
                    Digital Innovation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-32 bg-surface-container-low dark:bg-slate-deep/30 transition-colors">
          <div className="px-margin-desktop max-w-container-max mx-auto">
            <h2 className="font-label-md text-label-md text-coral-vibrant uppercase tracking-widest mb-12">02 / THE CORE SYSTEM SUITE</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((s) => (
                <div key={s.title} className="glass-card p-10 rounded-3xl light-trail group hover:-translate-y-4 transition-all duration-500">
                  <Icon name={s.icon} className="!text-4xl text-primary dark:text-peach-glow mb-6" />
                  <h4 className="font-title-md text-title-md mb-4">{s.title}</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-8">{s.desc}</p>
                  <ul className="space-y-3 font-label-md text-label-md text-on-surface dark:text-[#f5f0ed]">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2">
                        <Icon name="check_circle" fill className="!text-base text-coral-vibrant" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section (2x2 Grid with Absolute Overlay on Hover) */}
<section id="projects" className="py-32 px-margin-desktop max-w-container-max mx-auto">
  <h2 className="font-label-md text-label-md text-coral-vibrant uppercase tracking-widest mb-12">
    03 / INTERACTIVE LIVE DEMOS
  </h2>
  
  {/* 2 Columns on Desktop, wider cards, 1 Column on Mobile */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
    
    {/* Card 1: Victory High School */}
    <a 
      href="https://school-two-rho-79.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block relative rounded-3xl overflow-hidden border border-white/10 bg-surface/80 shadow-lg transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-coral-vibrant/30 aspect-[16/10] md:aspect-[16/9]"
    >
      {/* Full-card Image Wrapper */}
      <div className="w-full h-full overflow-hidden">
        <img
          alt="Victory High School Premium Portal"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src="/images/school.png"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        <span className="absolute top-6 left-6 px-4 py-1.5 bg-coral-vibrant text-white font-caption text-sm font-medium rounded-full shadow-md z-20">
          Education
        </span>
      </div>

      {/* Slide-up Content Overlay (Desktop: Appears on Hover | Mobile: Displays Naturally Below) */}
      <div className="absolute md:absolute bottom-0 left-0 w-full p-6 bg-white dark:bg-zinc-950 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-20 rounded-t-3xl border-t border-white/10 md:block hidden">
        <p className="font-body-md text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Premium luxury educational gateway featuring asymmetric masonry modules, custom notice metrics, and highly responsive parent inquiry funnels.
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">React</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Tailwind</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Motion</span>
        </div>
      </div>

      {/* Fallback Static Content block for Mobile and Tablets only */}
      <div className="md:hidden p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-white/5">
        <h4 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">Victory High School</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Premium luxury educational gateway featuring asymmetric masonry modules and responsive parent inquiry funnels.</p>
      </div>
    </a>

    {/* Card 2: Apex Athletics */}
    <a 
      href="https://gym-sigma-nine-92.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block relative rounded-3xl overflow-hidden border border-white/10 bg-surface/80 shadow-lg transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-coral-vibrant/30 aspect-[16/10] md:aspect-[16/9]"
    >
      <div className="w-full h-full overflow-hidden">
        <img
          alt="Apex Athletics Luxury Fitness"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src="/images/gym.png"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        <span className="absolute top-6 left-6 px-4 py-1.5 bg-coral-vibrant text-white font-caption text-sm font-medium rounded-full shadow-md z-20">
          Fitness & Gym
        </span>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-white dark:bg-zinc-950 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-20 rounded-t-3xl border-t border-white/10 md:block hidden">
        <h4 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
          Apex Athletics
        </h4>
        <p className="font-body-md text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          An airy high-end physical wellness showcase integrating dynamic tab-swapped timetable calendars and complex interactive pricing panels.
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">React</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Tailwind</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Framer</span>
        </div>
      </div>

      <div className="md:hidden p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-white/5">
        <h4 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">Apex Athletics</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">An airy high-end physical wellness showcase integrating dynamic tab-swapped timetable calendars.</p>
      </div>
    </a>

    {/* Card 3: Saffron & Sage */}
    <a 
      href="https://restaurant-ivory-three.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block relative rounded-3xl overflow-hidden border border-white/10 bg-surface/80 shadow-lg transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-coral-vibrant/30 aspect-[16/10] md:aspect-[16/9]"
    >
      <div className="w-full h-full overflow-hidden">
        <img
          alt="Saffron and Sage Indian Dining"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src="/images/restaurant.png"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        <span className="absolute top-6 left-6 px-4 py-1.5 bg-coral-vibrant text-white font-caption text-sm font-medium rounded-full shadow-md z-20">
          Restaurant
        </span>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-white dark:bg-zinc-950 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-20 rounded-t-3xl border-t border-white/10 md:block hidden">
        <h4 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
          Saffron & Sage
        </h4>
        <p className="font-body-md text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Contemporary fine-dining platform equipped with a fluid culinary category filtration interface and an interactive reservation desk configuration.
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">React</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Tailwind</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Data</span>
        </div>
      </div>

      <div className="md:hidden p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-white/5">
        <h4 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">Saffron & Sage</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Contemporary fine-dining platform equipped with a fluid culinary category filtration interface.</p>
      </div>
    </a>

    {/* Card 4: Aura Spaces */}
    <a 
      href="https://workspace-sigma-seven-83.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block relative rounded-3xl overflow-hidden border border-white/10 bg-surface/80 shadow-lg transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-coral-vibrant/30 aspect-[16/10] md:aspect-[16/9]"
    >
      <div className="w-full h-full overflow-hidden">
        <img
          alt="Aura Spaces Commercial Environments"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src="/images/workspace.png"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        <span className="absolute top-6 left-6 px-4 py-1.5 bg-coral-vibrant text-white font-caption text-sm font-medium rounded-full shadow-md z-20">
          Commercial B2B
        </span>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-white dark:bg-zinc-950 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-20 rounded-t-3xl border-t border-white/10 md:block hidden">
        <h4 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
          Aura Spaces
        </h4>
        <p className="font-body-md text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Minimalist corporate workspace suite featuring cross-parallax scroll-triggered content layers and an asymmetrical digital floor-plan layout engine.
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Next.js</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">Tailwind</span>
          <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white/70 font-caption text-xs rounded-full">B2B</span>
        </div>
      </div>

      <div className="md:hidden p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-white/5">
        <h4 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">Aura Spaces</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Minimalist corporate workspace suite featuring cross-parallax scroll-triggered content layers.</p>
      </div>
    </a>

  </div>
</section>
        {/* Project Engagement */}
        <section className="py-32 px-margin-desktop max-w-container-max mx-auto">
          <h2 className="font-label-md text-label-md text-coral-vibrant uppercase tracking-widest mb-6 text-center">
            04 / PROJECT ENGAGEMENT
          </h2>
          <h3 className="font-display-xl text-display-md text-center max-w-4xl mx-auto mb-6">
            Let's Build Something Meaningful Together
          </h3>
          <p className="font-body-lg text-body-lg text-on-surface-variant text-center max-w-3xl mx-auto mb-20">
            Whether you're launching a new digital product, automating business
            operations, building a mobile application, or scaling an existing
            platform, we help transform ambitious ideas into impactful digital
            solutions tailored to your goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-10 rounded-3xl group hover:scale-[1.02] transition-all">
              <span className="text-coral-vibrant text-5xl font-bold opacity-30">01</span>
              <h4 className="font-display-lg text-headline-md mt-4 mb-4">Discovery & Strategy</h4>
              <p className="text-on-surface-variant leading-relaxed mb-8">
                We begin by understanding your business, objectives, users, and challenges to identify the most effective digital solution.
              </p>
              <a href="#contact" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-coral-vibrant transition-colors">
                Start Discussion →
              </a>
            </div>
            <div className="glass-card p-10 rounded-3xl border-coral-vibrant/30 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 px-5 py-2 bg-coral-vibrant text-white text-xs uppercase tracking-widest rounded-bl-xl">Most Common</div>
              <span className="text-coral-vibrant text-5xl font-bold opacity-30">02</span>
              <h4 className="font-display-lg text-headline-md mt-4 mb-4">Design & Development</h4>
              <p className="text-on-surface-variant leading-relaxed mb-8">
                From concept to deployment, we build scalable web, mobile, software, and automation systems designed for performance and growth.
              </p>
              <a href="#contact" className="inline-flex items-center gap-2 text-coral-vibrant font-semibold">
                Discuss Your Project →
              </a>
            </div>
            <div className="glass-card p-10 rounded-3xl group hover:scale-[1.02] transition-all">
              <span className="text-coral-vibrant text-5xl font-bold opacity-30">03</span>
              <h4 className="font-display-lg text-headline-md mt-4 mb-4">Launch & Growth</h4>
              <p className="text-on-surface-variant leading-relaxed mb-8">
                After launch, we continue optimizing, improving, and supporting your solution to ensure long-term success and measurable business impact.
              </p>
              <a href="#contact" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-coral-vibrant transition-colors">
                Plan Your Launch →
              </a>
            </div>
          </div>
          <div className="mt-20 text-center">
            <h4 className="font-display-lg text-headline-md mb-4">Ready to discuss your next project?</h4>
            <p className="text-on-surface-variant mb-8 max-w-2xl mx-auto">
              Tell us about your idea, challenge, or business goal. We'll help you determine the best path forward.
            </p>
            <a href="#contact" className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-gradient-to-r from-peach-glow to-coral-vibrant text-white font-bold shadow-lg hover:scale-105 transition-all">
              Get a Custom Proposal
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-32 bg-surface-container-low dark:bg-slate-deep/30 transition-colors">
          <div className="px-margin-desktop max-w-container-max mx-auto">
            <div className="flex flex-col md:flex-row gap-16">
              <div className="w-full md:w-1/3">
                <h2 className="font-label-md text-label-md text-coral-vibrant uppercase tracking-widest mb-6">05 / KNOWLEDGE BASE</h2>
                <h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-[#f5f0ed] leading-tight">
                  Everything you need to know about our services.
                </h3>
                <p className="mt-6 text-on-surface-variant">
                  Explore answers related to web development, mobile applications, and AI-powered automation solutions.
                </p>
              </div>
              <div className="w-full md:w-2/3 space-y-5">
                {faqCategories.map((category, categoryIndex) => {
                  const categoryOpen = openCategory === categoryIndex;
                  return (
                    <div key={category.title} className="glass-card rounded-3xl overflow-hidden border border-outline-variant/30">
                      <button
                        onClick={() => setOpenCategory(categoryOpen ? null : categoryIndex)}
                        className="w-full flex items-center justify-between px-8 py-6 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <Icon name={category.icon} className="text-coral-vibrant" />
                          <span className="font-title-md text-title-md">{category.title}</span>
                        </div>
                        <Icon name={categoryOpen ? "expand_less" : "expand_more"} />
                      </button>
                      {categoryOpen && (
                        <div className="px-6 pb-6 space-y-3">
                          {category.faqs.map((faq, faqIndex) => {
                            const faqKey = `${categoryIndex}-${faqIndex}`;
                            const isOpen = openFaq === faqKey;
                            return (
                              <div key={faq.q} className="rounded-2xl bg-surface/40 border border-outline-variant/20">
                                <button
                                  onClick={() => setOpenFaq(isOpen ? null : faqKey)}
                                  className="w-full flex justify-between items-center px-6 py-5 text-left"
                                >
                                  <span className="font-medium">{faq.q}</span>
                                  <Icon name={isOpen ? "remove" : "add"} />
                                </button>
                                {isOpen && (
                                  <div className="px-6 pb-5">
                                    <p className="text-on-surface-variant leading-relaxed">
                                      {faq.a}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-32 px-margin-desktop max-w-container-max mx-auto">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="w-full lg:w-5/12">
              <h2 className="font-label-md text-label-md text-coral-vibrant uppercase tracking-widest mb-6">06 / SYSTEM ENGAGEMENT</h2>
              <h3 className="font-headline-lg text-headline-lg text-on-surface dark:text-[#f5f0ed] mb-6">Ready to evolve your digital presence?</h3>
              <p className="text-on-surface-variant mb-10 leading-relaxed">
                Whether you're planning a new website, mobile application, AI-powered automation, or a complete digital transformation, we're ready to discuss your vision.
              </p>
              <div className="space-y-5">
                {/* {contactMethods.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-6 rounded-2xl flex items-center gap-5 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <div>
                      <img src={c.icon} alt={c.label} className="w-10 h-10" />
                    </div>
                    <div>
                      <span className="block text-sm text-on-surface-variant">{c.label}</span>
                      <span className="font-semibold text-lg">{c.value}</span>
                    </div>
                  </a>
                ))} */}
                {contactMethods.map((c) => (
  <a
    key={c.label}
    href={c.href}
    target="_blank"
    rel="noopener noreferrer"
    className="glass-card p-4 sm:p-6 rounded-2xl flex items-center gap-4 sm:gap-5 hover:scale-[1.02] transition-all cursor-pointer min-w-0 w-full overflow-hidden"
  >
    <div className="shrink-0">
      <img src={c.icon} alt={c.label} className="w-10 h-10 object-contain" />
    </div>

    <div className="min-w-0 flex-1">
      <span className="block text-xs sm:text-sm text-on-surface-variant">
        {c.label}
      </span>

      <span className="font-semibold text-base sm:text-lg block break-all text-on-surface dark:text-[#f5f0ed]">
        {c.value}
      </span>
    </div>
  </a>
))}
              </div>
            </div>
            <div className="w-full lg:w-7/12">
              <form onSubmit={handleSubmit} className="glass-card p-10 rounded-3xl shadow-2xl border border-white/10">
                {success && (
                  <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-500">
                    ✓ Consultation request submitted successfully. A confirmation email has been sent to your inbox. We'll contact you shortly.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block mb-2 text-on-surface-variant">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-peach-glow"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-on-surface-variant">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-peach-glow"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block mb-2 text-on-surface-variant">Phone Number *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 9876543210"
                      className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-peach-glow"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-on-surface-variant">Company / Business</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Your Company"
                      className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-peach-glow"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block mb-2 text-on-surface-variant">Industry</label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3"
                    >
                      <option value="">Select Industry</option>
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Finance</option>
                      <option>Fitness</option>
                      <option>Retail</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-on-surface-variant">Service Required</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3"
                    >
                      <option value="">Select Service</option>
                      <option>Web Development</option>
                      <option>Mobile Application</option>
                      <option>AI Agent Development</option>
                      <option>Business Automation</option>
                      <option>Custom Software</option>
                      <option>SaaS Platform</option>
                    </select>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-on-surface-variant">Preferred Contact Method</label>
                  <select
                    name="preferred_contact"
                    value={formData.preferred_contact}
                    onChange={handleChange}
                    className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3"
                  >
                    <option value="">Select Method</option>
                    <option>WhatsApp</option>
                    <option>Phone Call</option>
                    <option>Email</option>
                  </select>
                </div>
                <div className="mb-8">
                  <label className="block mb-2 text-on-surface-variant">Project Requirements *</label>
                  <textarea
                    rows={5}
                    required
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="Tell us about your project, goals, and requirements..."
                    className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-peach-glow resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-peach-glow to-coral-vibrant text-white font-bold rounded-xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  {loading ? "Submitting..." : "Request Free Consultation"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-surface-container-low dark:bg-slate-deep border-t border-outline-variant dark:border-outline/20 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-20 max-w-container-max mx-auto">
          <div className="md:col-span-1">
            <span className="font-headline-lg text-headline-lg text-primary dark:text-peach-glow block mb-4">SGR Dynamics</span>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant mb-8 leading-relaxed">
              We help businesses build modern websites, mobile applications, AI solutions, and workflow automation systems that drive real growth.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-11 h-11 rounded-full glass-card flex items-center justify-center hover:text-coral-vibrant transition-all"><Icon name="photo_camera" /></a>
              <a href="#" className="w-11 h-11 rounded-full glass-card flex items-center justify-center hover:text-coral-vibrant transition-all"><Icon name="smart_display" /></a>
              <a href="#" className="w-11 h-11 rounded-full glass-card flex items-center justify-center hover:text-coral-vibrant transition-all"><Icon name="thumb_up" /></a>
              <a href="#" className="w-11 h-11 rounded-full glass-card flex items-center justify-center hover:text-coral-vibrant transition-all"><Icon name="business_center" /></a>
            </div>
          </div>
          {footerSections.map((col) => (
            <div key={col.title}>
              <h5 className="font-label-md text-label-md text-primary dark:text-peach-glow uppercase mb-6 tracking-wider">{col.title}</h5>
              <ul className="space-y-4 font-body-md text-body-md text-on-surface-variant dark:text-surface-variant">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-coral-vibrant transition-colors duration-300 flex items-center gap-2 group">
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="px-margin-desktop py-8 border-t border-outline-variant/20 max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center text-on-surface-variant dark:text-surface-variant font-caption text-caption">
          <span>© 2026 SGR Dynamics. All rights reserved.</span>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
          </div>
        </div>
      </footer>

      {/* --- RE-ARCHITECTED NATIVE CHAT INTERFACE WIDGET --- */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <button 
          onClick={() => setChatOpen((o) => !o)} 
          className="w-16 h-16 rounded-full bg-gradient-to-r from-peach-glow to-coral-vibrant text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative"
        >
          <Icon name={chatOpen ? "close" : "smart_toy"} className="!text-3xl" />
          {!chatOpen && <span className="absolute inset-0 rounded-full animate-ping bg-coral-vibrant opacity-20" />}
        </button>
        
        <div className={`absolute bottom-20 right-0 w-[380px] max-w-[90vw] h-[520px] max-h-[70vh] glass-card rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500 origin-bottom-right border border-white/20 flex flex-col ${chatOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}>
          
          {/* Component Header */}
          <div className="bg-surface-container-high dark:bg-slate-deep px-6 py-4 flex justify-between items-center border-b border-outline-variant/30 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-label-md text-label-md font-bold">IRIS Assistant Terminal</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-on-surface-variant hover:text-coral-vibrant transition-colors">
              <Icon name="close" />
            </button>
          </div>
          
          {/* Message Stream Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-black/5 flex flex-col gap-3 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.sender === "user"
                    ? "self-end bg-gradient-to-r from-peach-glow to-coral-vibrant text-white rounded-br-sm shadow-md"
                    : "self-start bg-surface-container-high dark:bg-slate-deep text-on-surface-variant border border-outline-variant/20 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {/* Bouncing Triple-Dot Typing Bubble */}
            {isTyping && (
              <div className="self-start bg-surface-container-high dark:bg-slate-deep border border-outline-variant/20 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Controller Form */}
          <form onSubmit={handleSend} className="p-3 bg-surface-container-high dark:bg-slate-deep border-t border-outline-variant/20 flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 bg-black/10 border border-outline-variant/30 rounded-full text-sm outline-none focus:border-coral-vibrant dark:text-white transition-colors"
            />
            <button
              type="submit"
              className="w-10 h-10 bg-gradient-to-r from-peach-glow to-coral-vibrant hover:brightness-110 active:scale-95 text-white rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-md shrink-0"
            >
              ➤
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default App;