/** Shared starfield background used on main app pages */
export function AppStarfield() {
  return (
    <>
      <style>{`
        @keyframes star-to-right{0%{background-position:-550px -315px}100%{background-position:550px 315px}}
        .sl{position:absolute;inset:0;background-repeat:repeat;background-size:550px auto;animation:star-to-right 65s linear infinite;pointer-events:none;}
        .sl1{background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_1.png");}
        .sl2{opacity:.5;transform:scale(2);filter:blur(3px);background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png");animation-duration:30s;}
        .sl3{opacity:.3;transform:scale(1.5);filter:blur(1.5px);background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png");animation-duration:40s;}
      `}</style>
      <span className="sl sl1" />
      <span className="sl sl2" />
      <span className="sl sl3" />
    </>
  );
}

export const appPageBg =
  "radial-gradient(ellipse at 30% 60%,rgba(40,170,226,.15),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(219,166,49,.1),transparent 50%),#1C2D5A";
