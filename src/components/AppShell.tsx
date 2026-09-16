/** Shared starfield background used on main app pages */
export function AppStarfield() {
  return (
    <>
      <style>{`
        @keyframes star-to-right{0%{background-position:-550px -315px}100%{background-position:550px 315px}}
        .app-stars{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0;}
        .sl{position:absolute;inset:0;background-repeat:repeat;background-size:550px auto;animation:star-to-right 65s linear infinite;pointer-events:none;}
        .sl1{background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_1.png");}
        .sl2{opacity:.45;background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png");animation-duration:30s;background-size:400px auto;}
        .sl3{opacity:.28;background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png");animation-duration:40s;background-size:480px auto;}
      `}</style>
      <div className="app-stars" aria-hidden>
        <span className="sl sl1" />
        <span className="sl sl2" />
        <span className="sl sl3" />
      </div>
    </>
  );
}

export const appPageBg =
  "radial-gradient(ellipse at 30% 60%,rgba(40,170,226,.15),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(219,166,49,.1),transparent 50%),#1C2D5A";
