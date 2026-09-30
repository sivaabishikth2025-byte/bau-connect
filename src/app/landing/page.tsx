"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

// Particles rendered only on client to avoid hydration mismatch from Math.random()
function ClientParticles() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const colors = ["#28AAE2","#DBA631","#CBDB2A","#BBD3EE"];
    for (let i = 0; i < 12; i++) {
      const el = document.createElement("div");
      const w = Math.random() * 6 + 2;
      const h = Math.random() * 6 + 2;
      const dur = (Math.random() * 4 + 3).toFixed(2);
      const delay = (Math.random() * 2).toFixed(2);
      el.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;background:${colors[i%4]};left:${(Math.random()*100).toFixed(2)}%;top:${(Math.random()*100).toFixed(2)}%;opacity:0.3;animation:float ${dur}s ease-in-out ${delay}s infinite;`;
      container.appendChild(el);
    }
  }, []);
  return <div ref={ref} style={{position:"absolute",inset:0,pointerEvents:"none"}}/>;
}

export default function Landing() {
  const parallaxRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const phaseLeftRef = useRef<HTMLDivElement>(null);
  const phaseRightRef = useRef<HTMLDivElement>(null);
  const phaseCenterRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const phaseDotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let lastProgress = -1;

    function applyParallax() {
      // Mobile uses a compact static layout — skip scroll-hijack math
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
        return;
      }
      const section = parallaxRef.current;
      const video = videoRef.current;
      const wrap = videoWrapRef.current;
      const overlay = overlayRef.current;
      const pL = phaseLeftRef.current;
      const pR = phaseRightRef.current;
      const pC = phaseCenterRef.current;
      const prog = progressRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const sectionH = section.offsetHeight;
      const viewH = window.innerHeight;
      const scrolled = window.scrollY - sectionTop;
      const total = Math.max(1, sectionH - viewH);
      const progress = Math.max(0, Math.min(1, scrolled / total));

      if (Math.abs(progress - lastProgress) < 0.001) return;
      lastProgress = progress;

      if (prog) prog.style.width = `${progress * 100}%`;

      // Video depth: slow drift + gentle zoom as you scroll through the scene
      if (wrap) {
        const scale = 1.18 - progress * 0.12;
        const y = progress * -8;
        const x = Math.sin(progress * Math.PI) * 2;
        wrap.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${scale})`;
      }

      // Overlay breathes with phases so text stays readable
      if (overlay) {
        const mid = 1 - Math.abs(progress - 0.5) * 0.35;
        overlay.style.opacity = String(0.35 + mid * 0.25);
      }

      // Keep ambient loop playing while the section is in view
      if (video) {
        const inView = progress > 0 && progress < 1;
        if (inView && video.paused) {
          video.play().catch(() => {});
        } else if (!inView && !video.paused) {
          video.pause();
        }
      }

      // Phase dots
      const active = progress < 0.38 ? 0 : progress < 0.72 ? 1 : 2;
      phaseDotsRef.current.forEach((dot, i) => {
        if (!dot) return;
        dot.style.opacity = i === active ? "1" : "0.3";
        const bar = dot.querySelector("[data-bar]") as HTMLElement | null;
        if (bar) bar.style.opacity = i === active ? "1" : "0.3";
      });

      // Phase 1 left (0-0.35)
      if (pL) {
        if (progress < 0.35) {
          const p = progress / 0.35;
          pL.style.opacity = String(Math.min(1, p * 3));
          pL.style.transform = `translate3d(${(1 - p) * -60}px, ${(1 - p) * 30}px, 0)`;
        } else if (progress < 0.5) {
          const p = (progress - 0.35) / 0.15;
          pL.style.opacity = String(1 - p);
          pL.style.transform = `translate3d(${p * 60}px, ${p * -20}px, 0)`;
        } else {
          pL.style.opacity = "0";
        }
      }

      // Phase 2 right (0.4-0.75)
      if (pR) {
        if (progress > 0.4 && progress < 0.75) {
          const inP = Math.min(1, (progress - 0.4) / 0.15);
          const outP = progress > 0.62 ? (progress - 0.62) / 0.13 : 0;
          pR.style.opacity = String(Math.max(0, inP - outP));
          pR.style.transform = `translate3d(${(1 - inP) * 60}px, ${(1 - inP) * 30}px, 0)`;
        } else {
          pR.style.opacity = "0";
        }
      }

      // Phase 3 center (0.75-1)
      if (pC) {
        if (progress > 0.75) {
          const p = (progress - 0.75) / 0.25;
          pC.style.opacity = String(Math.min(1, p * 2.5));
          pC.style.transform = `translateX(-50%) translateY(${(1 - p) * 40}px) scale(${0.9 + p * 0.1})`;
        } else {
          pC.style.opacity = "0";
          pC.style.transform = "translateX(-50%) translateY(40px) scale(0.9)";
        }
      }
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(applyParallax);
    }

    const video = videoRef.current;
    const onMeta = () => applyParallax();
    if (video) {
      video.addEventListener("loadedmetadata", onMeta);
      video.load();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    applyParallax();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      video?.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&display=swap');
        :root{--navy:#1C2D5A;--gold:#DBA631;--coral:#F15B47;--lime:#CBDB2A;--sky:#28AAE2;--ice:#BBD3EE;}
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{background:var(--navy);overflow-x:clip;width:100%;max-width:100%;}
        .bau{background:var(--navy);color:#fff;font-family:'Nunito',sans-serif;overflow-x:clip;width:100%;max-width:100%;}
        .logo{font-size:22px;font-weight:700;letter-spacing:.25em;color:#fff;text-transform:uppercase;}
        .logo span{color:var(--gold);}
        .nl{color:var(--ice);text-decoration:none;font-size:12px;letter-spacing:.2em;text-transform:uppercase;transition:color .3s;}
        .nl:hover{color:var(--gold);}
        .bg{background:var(--gold);color:var(--navy);border:none;padding:12px 28px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:background .3s;font-family:inherit;}
        .bg:hover{background:var(--lime);}
        .bc{background:var(--coral);color:#fff;border:none;padding:16px 40px;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:all .3s;font-family:inherit;}
        .bc:hover{background:var(--lime);color:var(--navy);}
        .bgh{background:transparent;color:#fff;border:1px solid rgba(187,211,238,.4);padding:16px 40px;font-size:12px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:all .3s;font-family:inherit;}
        .bgh:hover{border-color:var(--sky);color:var(--sky);}
        .serif{font-family:'Nunito',sans-serif;}
        @keyframes star-to-right {
          0% { background-position: -550px -315px; }
          100% { background-position: 550px 315px; }
        }
        .star-layer { position:absolute; inset:0; background-repeat:repeat; background-size:550px auto; animation:star-to-right 65s linear infinite; pointer-events:none; z-index:0; }
        .sl1 { background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_1.png"); background-blend-mode:screen; }
        .sl2 { opacity:.5; background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png"); animation-duration:30s; background-size:400px auto; }
        .sl3 { opacity:.3; background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png"); animation-duration:40s; background-size:480px auto; }
        .sl4 { opacity:.55; background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png"); animation-duration:90s; background-size:520px auto; }
        .sl5 { opacity:.4; background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png"); animation-duration:190s; background-size:460px auto; }
        .hero-content { position:relative; z-index:10; text-align:center; isolation:isolate; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.4;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.3)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes glow{0%,100%{opacity:.3}50%{opacity:.7}}
        .a1{opacity:0;animation:fadeUp 1s ease .3s forwards;}
        .a2{opacity:0;animation:fadeUp 1s ease .5s forwards;}
        .a3{opacity:0;animation:fadeUp 1s ease .7s forwards;}
        .a4{opacity:0;animation:fadeUp 1s ease .9s forwards;}
        .a5{opacity:0;animation:fadeUp 1s ease 1.2s forwards;}
        .a4{opacity:0;animation:fadeUp 1s ease .9s forwards;}
        .a5{opacity:0;animation:fadeUp 1s ease 1.2s forwards;}
        .scroll-line{width:1px;height:48px;background:linear-gradient(to bottom,var(--ice),transparent);animation:pulse 2s ease-in-out infinite;}
        .pt{transition:opacity .6s ease,transform .6s ease;}
        .fc{background:#fff;padding:48px 40px;transition:background .3s;cursor:default;}
        .fc:hover{background:var(--navy);}
        .fc:hover .ft{color:#fff;}
        .fc:hover .fb{color:var(--ice);}
        .fc:hover .fn{color:var(--gold);}
        .fn{font-size:11px;letter-spacing:.3em;color:var(--coral);margin-bottom:32px;transition:color .3s;}
        .ft{font-family:'Nunito',sans-serif;font-size:28px;font-weight:700;color:var(--navy);margin-bottom:16px;transition:color .3s;}
        .fb{font-size:13px;line-height:1.8;color:rgba(28,45,90,.6);transition:color .3s;}
        .tc{background:#fff;padding:48px 40px;position:relative;}
        .tc::before{content:'"';font-family:'Nunito',sans-serif;font-size:120px;font-weight:300;position:absolute;top:-20px;left:32px;line-height:1;opacity:.08;color:var(--navy);}
        .sc{width:32px;height:32px;border-radius:50%;border:1px solid rgba(187,211,238,.2);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--ice);opacity:.5;transition:all .3s;text-decoration:none;}
        .sc:hover{opacity:1;border-color:var(--sky);color:var(--sky);}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);animation:glow 4s ease-in-out infinite;}
        @media (min-width:900px){
          .stats-strip > div{grid-template-columns:repeat(4,minmax(0,1fr)) !important;max-width:960px !important;}
        }
        @media (max-width:767px){
          .bau nav{padding:max(12px, env(safe-area-inset-top, 0px)) 16px 12px !important;gap:12px !important;min-height:64px !important;grid-template-columns:1fr auto !important;}
          .bau nav ul{display:none !important;}
          .bau .bg{padding:10px 18px;font-size:10px;}
          .bau .bc,.bau .bgh{padding:14px 22px;font-size:11px;letter-spacing:.12em;}
          .bau .a4{flex-direction:column;gap:12px !important;width:100%;padding:0 20px;box-sizing:border-box;}
          .bau .a4 a,.bau .a4 button{width:100%;}
          .bau .a4 button{width:100%;}
          .fc{padding:32px 24px;}
          .ft{font-size:22px;}
          .tc{padding:32px 24px;}
          .tc::before{font-size:80px;left:16px;}
          .how-line{display:none !important;}
          .cta-form{flex-direction:column !important;}
          .cta-form input,.cta-form a,.cta-form button{width:100% !important;max-width:none !important;}
          /* Kill tall scroll-hijack parallax — sticky breaks under overflow-x on iOS */
          .discover-parallax{height:auto !important;}
          .discover-sticky{position:relative !important;height:auto !important;overflow:visible !important;}
          .discover-media{position:relative !important;height:42vh !important;min-height:220px;max-height:360px;}
          .discover-video-wrap{inset:0 !important;transform:none !important;}
          .discover-progress,.phase-dots{display:none !important;}
          .discover-phases{
            position:relative !important;inset:auto !important;
            display:flex !important;flex-direction:column !important;gap:14px !important;
            padding:20px 16px 40px !important;background:#0a1228;
          }
          .discover-phases .phase-card{
            opacity:1 !important;transform:none !important;position:relative !important;
            left:auto !important;bottom:auto !important;margin:0 !important;
            width:100% !important;max-width:none !important;text-align:left !important;
            border-right:none !important;border-bottom:none !important;
            border-left:4px solid var(--sky);padding:22px 20px !important;
          }
          .discover-phases .phase-card.phase-plan{border-left-color:var(--gold);}
          .discover-phases .phase-card.phase-go{border-left-color:var(--lime);text-align:left !important;}
        }
      `}</style>

      <div className="bau">
        {/* NAV */}
        <nav className="landing-nav" style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:32,padding:"20px 56px",minHeight:88,paddingTop:"max(20px, env(safe-area-inset-top))"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(28,45,90,.92),transparent)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",position:"relative",zIndex:1}}>
            <BauLogo size="landing" tone="dark" />
          </div>
          <ul className="landing-nav-links" style={{display:"flex",gap:40,listStyle:"none",justifyContent:"center",alignItems:"center",position:"relative",zIndex:1,margin:0,padding:0}}>
            <li><a href="#how" className="nl">How It Works</a></li>
            <li><a href="#discover" className="nl">Explore</a></li>
            <li><Link href="/login" className="nl">Sign In</Link></li>
          </ul>
          <Link href="/signup" style={{position:"relative",zIndex:1,justifySelf:"end"}}>
            <button className="bg">Join Free</button>
          </Link>
        </nav>

        {/* HERO */}
        <section style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 60%,rgba(40,170,226,.15),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(219,166,49,.1),transparent 50%),#1C2D5A"}}/>
          {/* Content renders FIRST */}
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,pointerEvents:"none"}}>
            <div style={{textAlign:"center",pointerEvents:"all"}}>
              <p className="a1" style={{fontSize:11,letterSpacing:".5em",textTransform:"uppercase",color:"var(--sky)",marginBottom:24,padding:"0 16px"}}>Bay Atlantic University</p>
              <h1 className="serif a2" style={{fontSize:"clamp(48px,12vw,112px)",fontWeight:800,lineHeight:.9,letterSpacing:"-.02em",marginBottom:12,color:"#fff",textShadow:"0 2px 20px rgba(0,0,0,.8)"}}>
                BAU<br/><span style={{color:"var(--gold)"}}>Connect</span>
              </h1>
              <p className="a3" style={{fontSize:"clamp(11px,3vw,13px)",letterSpacing:".15em",textTransform:"uppercase",color:"var(--ice)",marginBottom:40,padding:"0 20px"}}>Carpools, Study, Hangouts, Explore DC</p>
              <div className="a4" style={{display:"inline-flex",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
                <Link href="/signup"><button className="bc">Join Campus</button></Link>
                <a href="#how"><button className="bgh">See How It Works</button></a>
              </div>
            </div>
          </div>

          {/* Stars */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
            <span className="star-layer sl1"/>
            <span className="star-layer sl2"/>
            <span className="star-layer sl3"/>
            <span className="star-layer sl4"/>
            <span className="star-layer sl5"/>
          </div>

          <div className="a5" style={{position:"absolute",bottom:40,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:8,zIndex:999}}>
            <span style={{fontSize:9,letterSpacing:".4em",textTransform:"uppercase",color:"var(--ice)",opacity:.6}}>Scroll</span>
            <div className="scroll-line"/>
          </div>
        </section>

        {/* PARALLAX SECTION · desktop scroll story; mobile = compact video + cards */}
        <section id="discover" ref={parallaxRef} className="discover-parallax" style={{position:"relative",height:"320vh"}}>
          <div className="discover-sticky" style={{position:"sticky",top:0,left:0,right:0,height:"100vh",width:"100%",overflow:"hidden"}}>

            <div className="discover-media" style={{position:"absolute",inset:0,overflow:"hidden",background:"radial-gradient(ellipse at 40% 50%,rgba(40,170,226,.22),transparent 55%),#0a1228"}}>
              <div
                ref={videoWrapRef}
                className="discover-video-wrap"
                style={{
                  position:"absolute",
                  inset:"-8%",
                  willChange:"transform",
                  transform:"translate3d(0,0,0) scale(1.18)",
                  transition:"transform 80ms linear",
                }}
              >
                <video
                  ref={videoRef}
                  title="BAU Connect blue dolphin mascot"
                  src="/videos/bau-dolphin-mascot.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  style={{
                    width:"100%",
                    height:"100%",
                    objectFit:"cover",
                    border:"none",
                    pointerEvents:"none",
                    display:"block",
                  }}
                />
              </div>
              <div
                ref={overlayRef}
                style={{
                  position:"absolute",
                  inset:0,
                  background:"linear-gradient(180deg,rgba(10,18,40,.55) 0%,rgba(10,18,40,.35) 45%,rgba(10,18,40,.7) 100%)",
                  opacity:0.5,
                  pointerEvents:"none",
                }}
              />
            </div>

            {/* Progress indicator */}
            <div className="discover-progress" style={{position:"absolute",top:0,left:0,right:0,height:2,background:"rgba(187,211,238,.1)",zIndex:20}}>
              <div ref={progressRef} style={{height:"100%",background:"linear-gradient(90deg,var(--coral),var(--gold),var(--lime),var(--sky))",width:"0%",transition:"width .05s linear"}}/>
            </div>

            {/* Phase indicators */}
            <div className="phase-dots" style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:16,zIndex:20}}>
              {[{c:"var(--sky)",l:"01"},{c:"var(--gold)",l:"02"},{c:"var(--lime)",l:"03"}].map((ph,i)=>(
                <div
                  key={i}
                  ref={el => { phaseDotsRef.current[i] = el; }}
                  style={{display:"flex",alignItems:"center",gap:12,opacity:i===0?1:0.3,transition:"opacity .35s ease"}}
                >
                  <span style={{fontSize:9,letterSpacing:".3em",color:"var(--ice)"}}>{ph.l}</span>
                  <div data-bar style={{width:32,height:2,background:ph.c,opacity:i===0?1:0.3,transition:"opacity .35s ease"}}/>
                </div>
              ))}
            </div>

            {/* Text phases */}
            <div className="discover-phases" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 clamp(24px,6vw,80px)",zIndex:10}}>
              <div ref={phaseLeftRef} className="pt phase-card" style={{maxWidth:420,opacity:0,transform:"translate3d(-60px,30px,0)",background:"rgba(10,22,40,.82)",backdropFilter:"blur(24px)",padding:"clamp(28px,4vw,48px) clamp(28px,4vw,56px)",borderLeft:"4px solid var(--sky)",boxShadow:"0 30px 80px rgba(0,0,0,.5)",borderRadius:4,willChange:"transform,opacity"}}>
                <p style={{fontSize:11,letterSpacing:".4em",textTransform:"uppercase",color:"var(--sky)",marginBottom:24,fontWeight:700}}>01 Meet</p>
                <h2 className="serif" style={{fontSize:"clamp(28px,4.5vw,64px)",fontWeight:300,lineHeight:1.05,marginBottom:16,color:"#fff"}}>Find people<br/>on campus.</h2>
                <p style={{fontSize:14,lineHeight:1.8,color:"var(--ice)",opacity:.95,letterSpacing:".02em"}}>Browse classmates open to carpools, study groups, coffee chats, sports, and exploring DC together.</p>
              </div>
              <div ref={phaseRightRef} className="pt phase-card phase-plan" style={{maxWidth:420,marginLeft:"auto",textAlign:"right",opacity:0,transform:"translate3d(60px,30px,0)",background:"rgba(10,22,40,.82)",backdropFilter:"blur(24px)",padding:"clamp(28px,4vw,48px) clamp(28px,4vw,56px)",borderRight:"4px solid var(--gold)",boxShadow:"0 30px 80px rgba(0,0,0,.5)",borderRadius:4,willChange:"transform,opacity"}}>
                <p style={{fontSize:11,letterSpacing:".4em",textTransform:"uppercase",color:"var(--gold)",marginBottom:24,fontWeight:700}}>02 Plan</p>
                <h2 className="serif" style={{fontSize:"clamp(28px,4.5vw,64px)",fontWeight:300,lineHeight:1.05,marginBottom:16,color:"#fff"}}>Post rides,<br/>hangouts &amp; more.</h2>
                <p style={{fontSize:14,lineHeight:1.8,color:"var(--ice)",opacity:.95,letterSpacing:".02em"}}>Share plans on the campus feed and pin meetups to BAU spots with the interactive map.</p>
              </div>
              <div ref={phaseCenterRef} className="phase-card phase-go" style={{position:"absolute",bottom:"clamp(72px,12vh,120px)",left:"50%",transform:"translateX(-50%) translateY(40px) scale(0.9)",textAlign:"center",opacity:0,background:"rgba(10,22,40,.88)",backdropFilter:"blur(24px)",padding:"clamp(28px,4vw,40px) clamp(36px,6vw,72px)",borderBottom:"4px solid var(--lime)",boxShadow:"0 30px 80px rgba(0,0,0,.6)",borderRadius:4,willChange:"transform,opacity",width:"min(92vw,560px)"}}>
                <p style={{fontSize:11,letterSpacing:".4em",textTransform:"uppercase",color:"var(--lime)",marginBottom:16,fontWeight:700}}>03 Go</p>
                <h2 className="serif" style={{fontSize:"clamp(26px,3.5vw,56px)",fontWeight:300,lineHeight:1.1,color:"#fff"}}>Your campus life<br/>starts here.</h2>
              </div>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section style={{background:"#fff",color:"var(--navy)",padding:"clamp(64px,10vw,120px) clamp(20px,4vw,56px)",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,var(--coral),var(--gold),var(--lime),var(--sky))"}}/>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:48,flexWrap:"wrap",gap:24}}>
            <div>
              <p style={{fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"var(--coral)",marginBottom:12}}>Why BAU Connect</p>
              <h2 className="serif" style={{fontSize:"clamp(36px,8vw,72px)",fontWeight:300,color:"var(--navy)",lineHeight:1}}>Friends.<br/>Plans. Campus.</h2>
            </div>
            <p style={{maxWidth:340,fontSize:14,lineHeight:1.8,color:"rgba(28,45,90,.65)"}}>Built for Bay Atlantic University. Meet people for rides, study sessions, hangouts, and getting around DC.</p>
          </div>
          <div className="feat-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:2,background:"rgba(28,45,90,.08)"}}>
            {[
              {n:"01",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><circle cx="24" cy="24" r="20" stroke="#F15B47" strokeWidth="1.5"/><path d="M16 24 Q24 12 32 24 Q24 36 16 24Z" fill="#F15B47" opacity=".3"/><circle cx="24" cy="24" r="4" fill="#F15B47"/></svg>,title:"University Verified",body:"Only @stu.bau.edu and @bau.edu emails. Every profile is a real BAU student or staff member."},
              {n:"02",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><path d="M8 36 L24 12 L40 36" stroke="#DBA631" strokeWidth="1.5"/><path d="M14 28 L34 28" stroke="#DBA631" strokeWidth="1.5"/><circle cx="24" cy="12" r="3" fill="#DBA631"/></svg>,title:"Campus Connections",body:"Connect with classmates for friendship, collaboration, and everyday campus plans."},
              {n:"03",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><rect x="10" y="10" width="28" height="28" rx="14" stroke="#28AAE2" strokeWidth="1.5"/><path d="M18 24 L22 28 L30 20" stroke="#28AAE2" strokeWidth="1.5" strokeLinecap="round"/></svg>,title:"Carpools & Hangouts",body:"Post rides, study sessions, food runs, and explore-DC plans on the campus feed."},
              {n:"04",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><path d="M8 32 Q16 16 24 24 Q32 32 40 16" stroke="#CBDB2A" strokeWidth="1.5"/><circle cx="24" cy="24" r="3" fill="#CBDB2A"/></svg>,title:"Interactive Maps",body:"Browse BAU campus spots and nearby DC landmarks when you plan where to meet."},
              {n:"05",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><circle cx="16" cy="24" r="8" stroke="#F15B47" strokeWidth="1.5"/><circle cx="32" cy="24" r="8" stroke="#28AAE2" strokeWidth="1.5"/></svg>,title:"Connection Requests",body:"See who wants to connect and accept the people you actually want to meet."},
              {n:"06",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><path d="M24 10 L28 20 L40 20 L30 27 L34 38 L24 31 L14 38 L18 27 L8 20 L20 20Z" stroke="#DBA631" strokeWidth="1.5" fill="none"/></svg>,title:"Chat & Notify",body:"Message connections in real time and get notified when someone reaches out."},
            ].map(f=>(
              <div key={f.n} className="fc">
                <p className="fn">{f.n}</p>
                {f.icon}
                <h3 className="ft">{f.title}</h3>
                <p className="fb">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <div className="stats-strip" style={{background:"var(--gold)",padding:"clamp(40px,8vw,64px) clamp(20px,5vw,56px)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"clamp(28px,6vw,48px)",maxWidth:720,margin:"0 auto"}}>
            {[{n:"100%",l:"BAU Verified"},{n:"Free",l:"Always"},{n:"Real",l:"Connections"},{n:"4.9★",l:"Rating"}].map(s=>(
              <div key={s.l} style={{textAlign:"center"}}>
                <div className="serif" style={{fontSize:"clamp(36px,9vw,64px)",fontWeight:300,color:"var(--navy)",lineHeight:1.05,letterSpacing:"-0.02em"}}>{s.n}</div>
                <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(28,45,90,.7)",marginTop:10,fontWeight:700}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section id="how" style={{background:"var(--navy)",padding:"clamp(64px,10vw,120px) clamp(20px,4vw,56px)"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <p style={{fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"var(--lime)",marginBottom:16}}>The Process</p>
            <h2 className="serif" style={{fontSize:"clamp(36px,8vw,72px)",fontWeight:300,color:"#fff"}}>Four steps to<br/>campus life.</h2>
          </div>
          <div className="how-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:32,position:"relative"}}>
            <div className="how-line" style={{position:"absolute",top:32,left:"12.5%",right:"12.5%",height:1,background:"linear-gradient(90deg,var(--coral),var(--gold),var(--lime),var(--sky))"}}/>
            {[
              {bg:"var(--coral)",c:"#fff",n:"1",title:"Sign Up with BAU Email",body:"Use your @stu.bau.edu or @bau.edu email. Verify it and you're in."},
              {bg:"var(--gold)",c:"var(--navy)",n:"2",title:"Say What You're Open To",body:"Carpools, study groups, explore DC, sports. Let people know how you connect."},
              {bg:"var(--lime)",c:"var(--navy)",n:"3",title:"Meet & Post Plans",body:"Browse people, post rides or hangouts, and use the campus map."},
              {bg:"var(--sky)",c:"#fff",n:"4",title:"Connect & Chat",body:"Accept requests, message classmates, and make plans in real time."},
            ].map(s=>(
              <div key={s.n} style={{padding:"0 8px",textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:s.bg,color:s.c,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:18,fontFamily:"'Nunito',sans-serif",fontWeight:300,position:"relative",zIndex:1}}>{s.n}</div>
                <h3 className="serif" style={{fontSize:20,fontWeight:400,color:"#fff",marginBottom:12}}>{s.title}</h3>
                <p style={{fontSize:12,lineHeight:1.9,color:"var(--ice)",opacity:.7}}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="join" style={{background:"var(--coral)",padding:"clamp(64px,10vw,120px) clamp(20px,4vw,56px)",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Nunito',sans-serif",fontSize:"clamp(80px,16vw,260px)",fontWeight:300,color:"rgba(255,255,255,.06)",whiteSpace:"nowrap",pointerEvents:"none",letterSpacing:"-.05em"}}>CONNECT</div>
          <p style={{fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(255,255,255,.7)",marginBottom:24,position:"relative"}}>Begin Today</p>
          <h2 className="serif" style={{fontSize:"clamp(40px,10vw,96px)",fontWeight:300,color:"#fff",lineHeight:1,marginBottom:40,position:"relative"}}>Jump in.<br/>Your campus<br/>awaits.</h2>
          <div className="cta-form" style={{display:"flex",justifyContent:"center",maxWidth:520,margin:"0 auto",position:"relative"}}>
            <input style={{flex:1,minWidth:0,padding:"18px 24px",fontFamily:"inherit",fontSize:13,border:"none",background:"rgba(255,255,255,.15)",color:"#fff",outline:"none"}} type="email" placeholder="Your BAU email"/>
            <Link href="/signup">
              <button style={{background:"var(--navy)",color:"#fff",border:"none",padding:"18px 40px",fontFamily:"inherit",fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap",height:"100%"}}>Start Free</button>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{background:"#0a1628",padding:"48px clamp(20px,4vw,56px) 40px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:48,paddingBottom:40,borderBottom:"1px solid rgba(187,211,238,.1)",flexWrap:"wrap",gap:32}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <BauLogo size="footer" tone="dark" />
              </div>
              <p className="serif" style={{fontSize:16,fontStyle:"italic",color:"var(--ice)",opacity:.5,marginTop:8}}>Exclusively for Bay Atlantic University</p>
            </div>
            <div className="footer-cols" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"clamp(16px,4vw,48px)",width:"100%",maxWidth:420}}>
              {[
                {title:"Product",links:[{label:"How It Works",href:"#how"},{label:"People",href:"/dashboard"},{label:"Campus Feed",href:"/activities"},{label:"Maps",href:"/map"}]},
                {title:"University",links:[{label:"BAU Website",href:"https://bau.edu"},{label:"Student Portal",href:"https://bau.edu"},{label:"Campus",href:"/map"},{label:"Events",href:"/activities"}]},
                {title:"Legal",links:[{label:"Privacy",href:"/privacy"},{label:"Terms",href:"/terms"},{label:"Safety",href:"/terms#safety"},{label:"Cookies",href:"/privacy#cookies"}]},
              ].map(col=>(
                <div key={col.title}>
                  <p style={{fontSize:9,letterSpacing:".35em",textTransform:"uppercase",color:"var(--gold)",marginBottom:20}}>{col.title}</p>
                  <ul style={{listStyle:"none"}}>
                    {col.links.map(l=>(
                      <li key={l.label} style={{marginBottom:10}}>
                        <a href={l.href} style={{color:"rgba(187,211,238,.5)",textDecoration:"none",fontSize:12}}>{l.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
            <p style={{fontSize:11,color:"rgba(187,211,238,.3)",letterSpacing:".1em"}}>© 2026 BAU Connect | Bay Atlantic University</p>
            <div style={{display:"flex",gap:24}}>
              {["ig","tk","tw"].map(s=><a key={s} href="#" className="sc">{s}</a>)}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
