"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeartHandshake, EyeOff, FileCheck2, Banknote, Smartphone, Wand2, Gem, LayoutDashboard } from "lucide-react";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } 
  },
} as const;

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-veil-bg text-veil-text font-body overflow-x-hidden">
      <VeilHeader />

      <main className="flex-1 w-full pt-16 relative z-0">
        {/* 1. Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20 md:pb-32 flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full lg:w-[55%] flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-black/5 mb-8 hover:scale-105 transition-transform cursor-default">
              <span className="text-xl animate-bounce">🎉</span>
              <span className="text-sm font-bold text-veil-text">The friendly way to get supported</span>
            </div>
            
            <h1 className="font-heading text-5xl md:text-6xl lg:text-[5rem] font-black leading-[1.05] tracking-tight mb-6 text-veil-text">
              Fund your work. <br />
              <span className="relative inline-block group">
                <span className="relative z-10">Keep it private.</span>
                <span className="absolute bottom-2 left-0 w-full h-4 bg-veil-secondary -z-10 rounded-full transform -rotate-1 group-hover:rotate-2 transition-transform duration-300"></span>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-veil-muted mb-10 max-w-2xl leading-relaxed font-medium">
              Join creators getting tips and growing communities without exposing their fans to the whole internet. We handle the privacy magic, you focus on creating.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/onboard" className="w-full sm:w-auto pill-button-primary px-10 py-4 text-xl flex items-center justify-center gap-2">
                Claim your free page
              </Link>
              <Link href="/explore" className="w-full sm:w-auto pill-button-secondary px-10 py-4 text-xl flex items-center justify-center gap-2">
                Explore creators
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-black/10 bg-white text-veil-text font-bold text-base hover:border-veil-primary hover:text-veil-primary transition-all shadow-sm hover:shadow-md">
                <LayoutDashboard className="w-4 h-4" />
                Creator Login
              </Link>
            </div>
            <p className="text-sm text-veil-muted mt-4 font-semibold flex items-center gap-1">
              <span className="text-yellow-500">⚡</span> 
              Takes less than 2 minutes to set up. Built on Solana.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="w-full lg:w-[45%] relative flex justify-center"
          >
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-veil-secondary rounded-[40px] transform rotate-3 animate-[wiggle_4s_ease-in-out_infinite]"></div>
              <img 
                src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0d868fef-f560-45ca-ab35-5dad4fc29059_3840w.webp" 
                alt="Creator portrait" 
                className="relative z-10 w-full h-full object-cover rounded-[40px] shadow-sm transform -rotate-3 transition-transform duration-500 hover:rotate-0"
              />
              
              <div className="absolute top-12 -left-6 bg-white border border-black/10 pr-5 pl-2 py-2 rounded-full flex items-center gap-3 z-20 shadow-lg transform -rotate-6 animate-[float_6s_ease-in-out_3s_infinite]">
                <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/2f563338-39fa-47ea-9761-658d4f3f84db_1600w.jpg" alt="Fan" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                <span className="font-bold text-veil-text text-sm">Someone tipped $5!</span>
              </div>
              
              <div className="absolute bottom-20 -right-8 bg-veil-primary text-white px-5 py-3 rounded-full flex items-center gap-3 z-20 shadow-lg transform rotate-6 animate-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
                <div className="bg-white/20 p-1.5 rounded-full flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">100% Private</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2. Features Section */}
        <section id="features" className="w-full bg-white border-y border-black/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <h2 className="font-heading text-4xl md:text-5xl font-black mb-6 text-veil-text">Everything you need, without the snooping</h2>
              <p className="text-veil-muted text-xl font-medium">Normal Solana payments expose your supporters. Veil magically protects everyone's privacy behind the scenes.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  icon: <EyeOff className="w-10 h-10" />,
                  title: "Secret Supporters",
                  desc: "When someone tips you, we scramble the payment trail. Only you know who supported you, keeping your fans safe from internet sleuths.",
                  color: "bg-veil-primary",
                  iconColor: "text-white",
                  delay: 0
                },
                {
                  icon: <FileCheck2 className="w-10 h-10" />,
                  title: "Show Your Success",
                  desc: "Need to prove your income for taxes or a big sponsor? Generate a clean, official report without ever revealing who your actual fans are.",
                  color: "bg-white border-4 border-veil-secondary",
                  iconColor: "text-veil-text",
                  delay: 0.1
                },
                {
                  icon: <Banknote className="w-10 h-10" />,
                  title: "Crypto to Cash",
                  desc: "Not a crypto expert? No problem. Receive tips smoothly on Solana and have them automatically routed to real cash in your bank account.",
                  color: "bg-green-400",
                  iconColor: "text-white",
                  delay: 0.2
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ delay: feature.delay }}
                  whileHover={{ y: -8, boxShadow: "0 16px 40px -4px rgba(32, 32, 32, 0.15)" }}
                  className="bg-veil-bg rounded-[32px] p-10 transition-all duration-300 group"
                >
                  <div className={`w-20 h-20 rounded-full ${feature.color} ${feature.iconColor} flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-md`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-heading text-2xl font-black mb-4 text-veil-text">{feature.title}</h3>
                  <p className="text-veil-muted text-lg leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. How It Works Section */}
        <section id="how-it-works" className="w-full bg-veil-bg py-24 md:py-32 relative overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-veil-primary rounded-full blur-3xl opacity-10"></div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <h2 className="font-heading text-4xl md:text-5xl font-black mb-6 text-veil-text">It's as simple as 1, 2, 3</h2>
              <p className="text-veil-muted text-xl font-medium">We handle the complex privacy math so you don't have to.</p>
            </motion.div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-6">
              {[
                {
                  step: 1,
                  icon: <Smartphone className="w-16 h-16 text-veil-primary" />,
                  title: "Fan connects",
                  desc: "Your supporter clicks \"Tip\" and securely connects their wallet.",
                  image: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/eca707cc-a5b7-439a-b4fd-247f6106c2e1_1600w.jpg",
                  bg: "bg-white",
                  rotation: "-rotate-3",
                  delay: 0
                },
                {
                  step: 2,
                  icon: <Wand2 className="w-16 h-16 text-white" />,
                  title: "Veil works its magic",
                  desc: "We scramble the data behind the scenes so the payment trail disappears.",
                  bg: "bg-veil-primary",
                  rotation: "rotate-3",
                  delay: 0.2
                },
                {
                  step: 3,
                  icon: <Gem className="w-16 h-16 text-green-500" />,
                  title: "You get paid",
                  desc: "The funds land in your account. You can hold them or cash out to your bank.",
                  image: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/77415a2e-dcbc-4748-a29d-fced4821881a_1600w.jpg",
                  bg: "bg-white",
                  rotation: "-rotate-3",
                  delay: 0.4
                }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ delay: step.delay }}
                  className="w-full lg:w-1/3 flex flex-col items-center text-center group"
                >
                  <div className={`relative w-32 h-32 rounded-[32px] ${step.bg} shadow-card flex items-center justify-center mb-8 transform ${step.rotation} group-hover:rotate-0 group-hover:scale-105 transition-all duration-300`}>
                    {step.icon}
                    {step.image && (
                      <img src={step.image} alt="User" className="absolute -bottom-4 -right-4 w-14 h-14 rounded-full object-cover border-4 border-white shadow-md" />
                    )}
                  </div>
                  <div className="bg-veil-secondary text-veil-text font-black w-8 h-8 rounded-full flex items-center justify-center mb-4">
                    {step.step}
                  </div>
                  <h4 className="font-heading font-black text-2xl mb-3 text-veil-text">{step.title}</h4>
                  <p className="text-veil-muted text-lg font-medium px-4">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Creator Testimonials Section */}
        <section id="creators" className="w-full bg-white border-y border-black/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6"
            >
              <div className="max-w-2xl">
                <h2 className="font-heading text-4xl md:text-5xl font-black mb-4 text-veil-text">Loved by creators like you</h2>
                <p className="text-veil-muted text-xl font-medium">Join the community of artists, writers, and builders choosing privacy.</p>
              </div>
              <Link href="/explore" className="pill-button-secondary px-6 py-3 flex items-center gap-2 font-bold group">
                See more creators <HeartHandshake className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Jenkins",
                  role: "Fiber Artist",
                  img: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4f5668c5-fc4a-44e0-bc5e-a664189d3c31_1600w.jpg",
                  text: "I used to hate how my earnings were public knowledge on the blockchain. Veil gave me back my peace of mind. Now my fans can tip me, and only I know about it.",
                  bg: "bg-veil-bg",
                  delay: 0
                },
                {
                  name: "Elena R.",
                  role: "Digital Illustrator",
                  img: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c92852bb-a510-405a-85ab-ffa0fde136a4_1600w.jpg",
                  text: "The cash out feature is a total lifesaver. I get all the benefits of fast crypto tips from my international fans, but the money just shows up in my regular bank account.",
                  bg: "bg-[#eef4ff]",
                  delay: 0.1
                },
                {
                  name: "Marcus T.",
                  role: "Tech Educator",
                  img: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/eca707cc-a5b7-439a-b4fd-247f6106c2e1_1600w.jpg",
                  text: "When I applied for an apartment, I needed to prove my creator income. Veil let me generate a completely official report without doxxing a single one of my supporters. Pure magic.",
                  bg: "bg-[#fbf7f1]",
                  delay: 0.2
                }
              ].map((t, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ delay: t.delay }}
                  whileHover={{ y: -16, rotate: i % 2 === 0 ? 1 : -1 }}
                  className={`${t.bg} rounded-[32px] p-8 border border-black/5 flex flex-col h-full transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-4 mb-8">
                    <img src={t.img} alt={t.name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm group-hover:scale-110 transition-transform duration-300" />
                    <div>
                      <p className="font-black text-xl text-veil-text">{t.name}</p>
                      <p className="text-sm text-veil-muted font-bold">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-lg text-veil-text font-medium leading-relaxed flex-1">
                    "{t.text}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Call to Action */}
        <section className="w-full bg-veil-bg py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="relative rounded-[48px] bg-veil-primary text-center py-20 px-6 sm:px-12 shadow-xl overflow-hidden group"
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-blue-900/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/3186f9ea-5f5a-49f7-8fcf-568ad52f515e_3840w.webp" alt="Creator overlay" className="absolute top-10 left-10 w-16 h-16 rounded-full object-cover border-4 border-white/20 opacity-40 animate-float" />
              <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/65695f80-23f9-46ee-8487-cbb6c93cc48b_3840w.webp" alt="Creator overlay" className="absolute bottom-10 right-20 w-12 h-12 rounded-full object-cover border-4 border-white/20 opacity-40 animate-float-delayed" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-heading text-4xl md:text-5xl font-black mb-6 text-white">
                  Ready to start building your community safely?
                </h2>
                <p className="text-blue-100 text-xl mb-12 font-medium">
                  Join thousands of creators getting supported on their own terms. Your free page is just a few clicks away.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/onboard" className="w-full sm:w-auto bg-white text-veil-primary px-10 py-5 rounded-full font-black text-xl hover:bg-veil-secondary hover:text-veil-text active:scale-95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Create Your Page
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <VeilFooter />
    </div>
  );
}
