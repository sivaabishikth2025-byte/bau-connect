"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

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
  const phaseLeftRef = useRef<HTMLDivElement>(null);
  const phaseRightRef = useRef<HTMLDivElement>(null);
  const phaseCenterRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const section = parallaxRef.current;
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
      const total = sectionH - viewH;
      const progress = Math.max(0, Math.min(1, scrolled / total));

      // Progress bar
      if (prog) prog.style.width = `${progress * 100}%`;

      // Phase 1 left (0-0.35)
      if (pL) {
        if (progress < 0.35) {
          const p = progress / 0.35;
          pL.style.opacity = String(Math.min(1, p * 3));
          pL.style.transform = `translateX(${(1 - p) * -60}px) translateY(${(1 - p) * 30}px)`;
        } else if (progress < 0.5) {
          const p = (progress - 0.35) / 0.15;
          pL.style.opacity = String(1 - p);
          pL.style.transform = `translateX(${p * 60}px) translateY(${p * -20}px)`;
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
          pR.style.transform = `translateX(${(1 - inP) * 60}px) translateY(${(1 - inP) * 30}px)`;
        } else {
          pR.style.opacity = "0";
        }
      }

      // Phase 3 center (0.75-1)
      if (pC) {
        if (progress > 0.75) {
          const p = (progress - 0.75) / 0.25;
          pC.style.opacity = String(Math.min(1, p * 2.5));
          pC.style.transform = `translateY(${(1 - p) * 40}px) scale(${0.9 + p * 0.1})`;
        } else {
          pC.style.opacity = "0";
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        :root{--navy:#1C2D5A;--gold:#DBA631;--coral:#F15B47;--lime:#CBDB2A;--sky:#28AAE2;--ice:#BBD3EE;}
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{background:var(--navy);overflow-x:hidden;}
        .bau{background:var(--navy);color:#fff;font-family:'Century Gothic','Futura PT',sans-serif;}
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
        .serif{font-family:'Cormorant Garamond',serif;}
        @keyframes star-to-right {
          0% { background-position: -550px -315px; }
          100% { background-position: 550px 315px; }
        }
        .star-layer { position:absolute; inset:0; background-repeat:repeat; background-size:550px auto; animation:star-to-right 65s linear infinite; pointer-events:none; z-index:0; }
        .sl1 { background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_1.png"); background-blend-mode:screen; }
        .sl2 { opacity:.5; transform:scale(2); filter:blur(3px); background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png"); animation-duration:30s; }
        .sl3 { opacity:.3; transform:scale(1.5); filter:blur(1.5px); background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png"); animation-duration:40s; }
        .sl4 { transform:scale(0.95); background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png"); animation-duration:90s; }
        .sl5 { transform:scale(0.9); background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png"); animation-duration:190s; }
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
        .ft{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;color:var(--navy);margin-bottom:16px;transition:color .3s;}
        .fb{font-size:13px;line-height:1.8;color:rgba(28,45,90,.6);transition:color .3s;}
        .tc{background:#fff;padding:48px 40px;position:relative;}
        .tc::before{content:'"';font-family:'Cormorant Garamond',serif;font-size:120px;font-weight:300;position:absolute;top:-20px;left:32px;line-height:1;opacity:.08;color:var(--navy);}
        .sc{width:32px;height:32px;border-radius:50%;border:1px solid rgba(187,211,238,.2);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--ice);opacity:.5;transition:all .3s;text-decoration:none;}
        .sc:hover{opacity:1;border-color:var(--sky);color:var(--sky);}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);animation:glow 4s ease-in-out infinite;}
      `}</style>

      <div className="bau">
        {/* NAV */}
        <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 56px"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(28,45,90,.92),transparent)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:1}}>
            <img src="/bau-logo.png" alt="BAU" style={{height:48,objectFit:"contain"}}/>
          </div>
          <ul style={{display:"flex",gap:40,listStyle:"none",position:"relative",zIndex:1}}>
            <li><a href="#discover" className="nl">Discover</a></li>
            <li><a href="#how" className="nl">How It Works</a></li>
            <li><a href="#stories" className="nl">Stories</a></li>
            <li><Link href="/login" className="nl">Sign In</Link></li>
          </ul>
          <Link href="/signup" style={{position:"relative",zIndex:1}}>
            <button className="bg">Join Free</button>
          </Link>
        </nav>

        {/* HERO */}
        <section style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 60%,rgba(40,170,226,.15),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(219,166,49,.1),transparent 50%),#1C2D5A"}}/>
          {/* Content renders FIRST */}
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,pointerEvents:"none"}}>
            <div style={{textAlign:"center",pointerEvents:"all"}}>
              <p className="a1" style={{fontSize:11,letterSpacing:".5em",textTransform:"uppercase",color:"var(--sky)",marginBottom:24}}>Exclusively for Bay Atlantic University</p>
              <h1 className="serif a2" style={{fontSize:"clamp(64px,10vw,128px)",fontWeight:300,lineHeight:.9,letterSpacing:"-.02em",marginBottom:12,color:"#fff",textShadow:"0 2px 20px rgba(0,0,0,.8)"}}>
                Find your<br/><em style={{fontStyle:"italic",color:"var(--gold)"}}>depth.</em>
              </h1>
              <p className="a3" style={{fontSize:13,letterSpacing:".3em",textTransform:"uppercase",color:"var(--ice)",marginBottom:48}}>BAUdate — Only @stu.bau.edu &amp; @bau.edu</p>
              <div className="a4" style={{display:"inline-flex",gap:16}}>
                <Link href="/signup"><button className="bc">Start Your Journey</button></Link>
                <a href="#how"><button className="bgh">See How It Works</button></a>
              </div>
            </div>
          </div>

          {/* Stars */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
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

        {/* PARALLAX SECTION — 300vh with visual engagement */}
        <section id="discover" ref={parallaxRef} style={{position:"relative",height:"300vh"}}>
          <div style={{position:"sticky",top:0,left:0,right:0,height:"100vh",width:"100%",overflow:"hidden"}}>

            {/* Sketchfab — fullscreen fixed background, interactive */}
            <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
              <iframe
                title="Watashi no Minasoko"
                src="https://sketchfab.com/models/71007d05039a45ffa40c74d5a2ad6ddd/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_stop=0&preload=1&transparent=0&dnt=1"
                frameBorder="0"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
                style={{
                  position:"absolute",
                  top:"-10%",
                  left:"-5%",
                  width:"110%",
                  height:"120%",
                  border:"none",
                  pointerEvents:"none"
                }}
              />
              <div style={{position:"absolute",inset:0,background:"rgba(10,18,40,0.55)"}}/>
            </div>

            {/* Progress indicator */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"rgba(187,211,238,.1)",zIndex:20}}>
              <div ref={progressRef} style={{height:"100%",background:"linear-gradient(90deg,var(--coral),var(--gold),var(--lime),var(--sky))",width:"0%",transition:"width .1s linear"}}/>
            </div>

            {/* Phase indicators */}
            <div style={{position:"absolute",right:40,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:16,zIndex:20}}>
              {[{c:"var(--sky)",l:"01"},{c:"var(--gold)",l:"02"},{c:"var(--lime)",l:"03"}].map((ph,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:9,letterSpacing:".3em",color:"var(--ice)",opacity:.4}}>{ph.l}</span>
                  <div style={{width:32,height:2,background:ph.c,opacity:.3,transition:"opacity .3s"}}/>
                </div>
              ))}
            </div>

            {/* Text phases */}
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 80px",zIndex:10}}>
              <div ref={phaseLeftRef} className="pt" style={{maxWidth:420,opacity:0,transform:"translateX(-60px) translateY(30px)",background:"rgba(10,22,40,.85)",backdropFilter:"blur(24px)",padding:"48px 56px",borderLeft:"4px solid var(--sky)",boxShadow:"0 30px 80px rgba(0,0,0,.5)",borderRadius:4}}>
                <p style={{fontSize:11,letterSpacing:".4em",textTransform:"uppercase",color:"var(--sky)",marginBottom:24,fontWeight:700}}>01 — Discover</p>
                <h2 className="serif" style={{fontSize:"clamp(40px,4.5vw,64px)",fontWeight:300,lineHeight:1.05,marginBottom:24,color:"#fff"}}>Explore the<br/>depths within.</h2>
                <p style={{fontSize:15,lineHeight:1.9,color:"var(--ice)",opacity:.95,letterSpacing:".02em"}}>Connection isn't found on the surface. BAUdate takes you deeper — into shared values, campus life, and the people who truly get you.</p>
              </div>
              <div ref={phaseRightRef} className="pt" style={{maxWidth:420,marginLeft:"auto",textAlign:"right",opacity:0,transform:"translateX(60px) translateY(30px)",background:"rgba(10,22,40,.85)",backdropFilter:"blur(24px)",padding:"48px 56px",borderRight:"4px solid var(--gold)",boxShadow:"0 30px 80px rgba(0,0,0,.5)",borderRadius:4}}>
                <p style={{fontSize:11,letterSpacing:".4em",textTransform:"uppercase",color:"var(--gold)",marginBottom:24,fontWeight:700}}>02 — Connect</p>
                <h2 className="serif" style={{fontSize:"clamp(40px,4.5vw,64px)",fontWeight:300,lineHeight:1.05,marginBottom:24,color:"#fff"}}>Drift toward<br/>someone <em style={{fontStyle:"italic",color:"var(--gold)"}}>real.</em></h2>
                <p style={{fontSize:15,lineHeight:1.9,color:"var(--ice)",opacity:.95,letterSpacing:".02em"}}>Only verified BAU students and staff. No strangers — just your campus community, waiting to connect.</p>
              </div>
              <div ref={phaseCenterRef} style={{position:"absolute",bottom:120,left:"50%",transform:"translateX(-50%) translateY(40px)",textAlign:"center",opacity:0,background:"rgba(10,22,40,.9)",backdropFilter:"blur(24px)",padding:"40px 72px",borderBottom:"4px solid var(--lime)",boxShadow:"0 30px 80px rgba(0,0,0,.6)",borderRadius:4}}>
                <p style={{fontSize:11,letterSpacing:".4em",textTransform:"uppercase",color:"var(--lime)",marginBottom:20,fontWeight:700}}>03 — Begin</p>
                <h2 className="serif" style={{fontSize:"clamp(36px,3.5vw,56px)",fontWeight:300,lineHeight:1.1,color:"#fff"}}>Your story starts<br/>at BAU.</h2>
              </div>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section style={{background:"#fff",color:"var(--navy)",padding:"120px 56px",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,var(--coral),var(--gold),var(--lime),var(--sky))"}}/>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:80,flexWrap:"wrap",gap:40}}>
            <div>
              <p style={{fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"var(--coral)",marginBottom:12}}>Why BAUdate</p>
              <h2 className="serif" style={{fontSize:"clamp(40px,5vw,72px)",fontWeight:300,color:"var(--navy)",lineHeight:1}}>Not swipes.<br/>Soul.</h2>
            </div>
            <p style={{maxWidth:340,fontSize:14,lineHeight:1.8,color:"rgba(28,45,90,.65)"}}>Built exclusively for Bay Atlantic University — every feature designed around your campus experience.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,background:"rgba(28,45,90,.08)"}}>
            {[
              {n:"01",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><circle cx="24" cy="24" r="20" stroke="#F15B47" strokeWidth="1.5"/><path d="M16 24 Q24 12 32 24 Q24 36 16 24Z" fill="#F15B47" opacity=".3"/><circle cx="24" cy="24" r="4" fill="#F15B47"/></svg>,title:"University Verified",body:"Only @stu.bau.edu and @bau.edu emails. Every profile is a real BAU student or staff member."},
              {n:"02",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><path d="M8 36 L24 12 L40 36" stroke="#DBA631" strokeWidth="1.5"/><path d="M14 28 L34 28" stroke="#DBA631" strokeWidth="1.5"/><circle cx="24" cy="12" r="3" fill="#DBA631"/></svg>,title:"Smart Matching",body:"Like profiles, get mutual likes, and create real matches with people on your campus."},
              {n:"03",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><rect x="10" y="10" width="28" height="28" rx="14" stroke="#28AAE2" strokeWidth="1.5"/><path d="M18 24 L22 28 L30 20" stroke="#28AAE2" strokeWidth="1.5" strokeLinecap="round"/></svg>,title:"Real-time Chat",body:"Message your matches instantly with read receipts and push notifications."},
              {n:"04",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><path d="M8 32 Q16 16 24 24 Q32 32 40 16" stroke="#CBDB2A" strokeWidth="1.5"/><circle cx="24" cy="24" r="3" fill="#CBDB2A"/></svg>,title:"Gender Filter",body:"Set your preference and see only the people you're interested in meeting."},
              {n:"05",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><circle cx="16" cy="24" r="8" stroke="#F15B47" strokeWidth="1.5"/><circle cx="32" cy="24" r="8" stroke="#28AAE2" strokeWidth="1.5"/></svg>,title:"Who Liked You",body:"See everyone who liked your profile before you decide to match back."},
              {n:"06",icon:<svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,marginBottom:24}}><path d="M24 10 L28 20 L40 20 L30 27 L34 38 L24 31 L14 38 L18 27 L8 20 L20 20Z" stroke="#DBA631" strokeWidth="1.5" fill="none"/></svg>,title:"Push Notifications",body:"Get notified the moment someone likes your profile or sends you a message."},
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
        <div style={{background:"var(--gold)",padding:"64px 56px",display:"flex",alignItems:"center",justifyContent:"space-around",gap:40,flexWrap:"wrap"}}>
          {[{n:"100%",l:"BAU Verified"},{n:"Free",l:"Always"},{n:"Real",l:"Connections"},{n:"4.9★",l:"Rating"}].map((s,i,arr)=>(
            <div key={s.l} style={{display:"flex",alignItems:"center",gap:40}}>
              <div style={{textAlign:"center"}}>
                <div className="serif" style={{fontSize:72,fontWeight:300,color:"var(--navy)",lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:10,letterSpacing:".3em",textTransform:"uppercase",color:"rgba(28,45,90,.65)",marginTop:8}}>{s.l}</div>
              </div>
              {i<arr.length-1&&<div style={{width:1,height:80,background:"rgba(28,45,90,.2)"}}/>}
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <section id="how" style={{background:"var(--navy)",padding:"120px 56px"}}>
          <div style={{textAlign:"center",marginBottom:96}}>
            <p style={{fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"var(--lime)",marginBottom:16}}>The Process</p>
            <h2 className="serif" style={{fontSize:"clamp(40px,5vw,72px)",fontWeight:300,color:"#fff"}}>Four steps to<br/>something real.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",position:"relative"}}>
            <div style={{position:"absolute",top:32,left:"12.5%",right:"12.5%",height:1,background:"linear-gradient(90deg,var(--coral),var(--gold),var(--lime),var(--sky))"}}/>
            {[
              {bg:"var(--coral)",c:"#fff",n:"1",title:"Sign Up with BAU Email",body:"Use your @stu.bau.edu or @bau.edu email. Verify it and you're in."},
              {bg:"var(--gold)",c:"var(--navy)",n:"2",title:"Build Your Profile",body:"Add up to 6 photos, your major, interests, and a bio."},
              {bg:"var(--lime)",c:"var(--navy)",n:"3",title:"Discover & Like",body:"Browse profiles, like or pass, see who liked you back."},
              {bg:"var(--sky)",c:"#fff",n:"4",title:"Match & Chat",body:"Mutual likes create a match. Chat in real time."},
            ].map(s=>(
              <div key={s.n} style={{padding:"0 32px",textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:s.bg,color:s.c,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 32px",fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:300,position:"relative",zIndex:1}}>{s.n}</div>
                <h3 className="serif" style={{fontSize:24,fontWeight:400,color:"#fff",marginBottom:12}}>{s.title}</h3>
                <p style={{fontSize:12,lineHeight:1.9,color:"var(--ice)",opacity:.7}}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="stories" style={{background:"var(--ice)",padding:"120px 56px"}}>
          <div style={{textAlign:"center",marginBottom:72}}>
            <p style={{fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"var(--navy)",opacity:.5,marginBottom:16}}>Real Stories</p>
            <h2 className="serif" style={{fontSize:"clamp(36px,4vw,60px)",fontWeight:300,color:"var(--navy)"}}>They found<br/>their match.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
            {[
              {text:"I never thought I'd meet someone through an app. BAUdate matched me with someone in my department. We've been together 8 months.",author:"Elif K.",loc:"Computer Science, BAU",accent:"var(--coral)"},
              {text:"Everyone is from BAU which makes it so comfortable. No random strangers — just people I could run into on campus.",author:"James T.",loc:"Business Admin, BAU",accent:"var(--gold)"},
              {text:"I matched with someone from my elective. We'd been sitting three rows apart all semester. BAUdate finally made us talk.",author:"Selin & Omar",loc:"BAU Students",accent:"var(--sky)"},
            ].map(t=>(
              <div key={t.author} className="tc">
                <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:t.accent}}/>
                <p className="serif" style={{fontSize:20,fontStyle:"italic",fontWeight:300,color:"var(--navy)",lineHeight:1.6,marginBottom:32}}>{t.text}</p>
                <div style={{fontSize:10,letterSpacing:".25em",textTransform:"uppercase",color:"rgba(28,45,90,.5)"}}>
                  <strong style={{display:"block",color:"var(--navy)",fontSize:12,marginBottom:4,letterSpacing:".15em"}}>{t.author}</strong>
                  {t.loc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="join" style={{background:"var(--coral)",padding:"120px 56px",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(160px,20vw,320px)",fontWeight:300,color:"rgba(255,255,255,.06)",whiteSpace:"nowrap",pointerEvents:"none",letterSpacing:"-.05em"}}>LOVE</div>
          <p style={{fontSize:10,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(255,255,255,.7)",marginBottom:24,position:"relative"}}>Begin Today</p>
          <h2 className="serif" style={{fontSize:"clamp(48px,7vw,96px)",fontWeight:300,color:"#fff",lineHeight:1,marginBottom:48,position:"relative"}}>Dive in.<br/>Your campus<br/>awaits.</h2>
          <div style={{display:"flex",justifyContent:"center",maxWidth:520,margin:"0 auto",position:"relative"}}>
            <input style={{flex:1,padding:"18px 24px",fontFamily:"inherit",fontSize:13,border:"none",background:"rgba(255,255,255,.15)",color:"#fff",outline:"none"}} type="email" placeholder="Your BAU email"/>
            <Link href="/signup">
              <button style={{background:"var(--navy)",color:"#fff",border:"none",padding:"18px 40px",fontFamily:"inherit",fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",cursor:"pointer"}}>Start Free</button>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{background:"#0a1628",padding:"64px 56px 40px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:64,paddingBottom:48,borderBottom:"1px solid rgba(187,211,238,.1)",flexWrap:"wrap",gap:40}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <img src="/bau-logo.png" alt="BAU" style={{height:40,objectFit:"contain"}}/>
              </div>
              <p className="serif" style={{fontSize:16,fontStyle:"italic",color:"var(--ice)",opacity:.5,marginTop:8}}>Exclusively for Bay Atlantic University</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,120px)",gap:48}}>
              {[
                {title:"Product",links:["How It Works","Discover","Matches","Chat"]},
                {title:"University",links:["BAU Website","Student Portal","Campus","Events"]},
                {title:"Legal",links:["Privacy","Terms","Safety","Cookies"]},
              ].map(col=>(
                <div key={col.title}>
                  <p style={{fontSize:9,letterSpacing:".35em",textTransform:"uppercase",color:"var(--gold)",marginBottom:20}}>{col.title}</p>
                  <ul style={{listStyle:"none"}}>
                    {col.links.map(l=><li key={l} style={{marginBottom:10}}><a href="#" style={{color:"rgba(187,211,238,.5)",textDecoration:"none",fontSize:12}}>{l}</a></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
            <p style={{fontSize:11,color:"rgba(187,211,238,.3)",letterSpacing:".1em"}}>© 2026 BAUdate · Bay Atlantic University</p>
            <div style={{display:"flex",gap:24}}>
              {["ig","tk","tw"].map(s=><a key={s} href="#" className="sc">{s}</a>)}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
