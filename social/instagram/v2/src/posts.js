// LoWa Studio, Instagram v2: loose, one-off layouts. Only the palette and the three fonts are fixed.
// Rules kept: no em dashes, no invented facts. Videos: any element with data-src becomes a scrolling site.
const C = { sunset: "#EDB08A", cream: "#F7F0E6", butter: "#F4DFA4", brown: "#4A2415", sky: "#B5D6DF", ink: "#3A1E12", blue: "#2F6F86", muted: "#7A5A4C" };

const phone = (src, crop, x, y, w = 380, h = 790) =>
  `<div class="phone top abs" style="left:${x}px;top:${y}px"><div class="screen" data-src="${src}" data-crop="${crop}" style="width:${w}px;height:${h}px;border-radius:43px"></div></div>`;
const browser = (src, host, x, y, w, h) =>
  `<div class="browser top abs" style="left:${x}px;top:${y}px;width:${w}px"><div class="bar"><i></i><i></i><i></i><span>${host}</span></div><div class="screen" data-src="${src}" style="height:${h}px"></div></div>`;
const tag = (t, css, color) => `<div class="mono abs" style="${css};color:${color || "inherit"}">${t}</div>`;
const handle = (color) => tag("LoWa Studio", "left:56px;bottom:52px;font-size:18px", color);

const POSTS = [
  // 01 BIG TYPE
  { id: "01-we-built", kind: "Big type", slides: [{ bg: C.sunset, fg: C.ink, html: `
    <div class="serif abs" style="left:-24px;top:60px;font-size:420px">We</div>
    <div class="serif abs" style="left:140px;top:380px;font-size:420px">built.</div>
    <div class="serif it abs" style="left:40px;top:830px;font-size:330px;color:${C.cream};white-space:nowrap">You sell.</div>
    ${tag("Production team<br>for US agencies", "right:56px;top:64px;text-align:right;line-height:1.6")}
    ${handle()}` }] },

  // 02 VIDEO, Gampi concept on a phone
  { id: "02-gampi-video", kind: "Video", video: true, slides: [{ bg: C.brown, fg: C.cream, html: `
    <div class="serif it abs" style="left:-30px;top:1330px;transform:rotate(-90deg);transform-origin:0 0;font-size:300px;color:${C.butter};white-space:nowrap">Concept</div>
    ${phone("full/gampi-m.png", 7400, 560, 200)}
    ${tag("A concept for<br>Gampi Casa Criativa,<br>an ad and design agency", "left:300px;top:96px;line-height:1.6", C.butter)}
    ${tag("gampi-site.vercel.app", "right:56px;bottom:52px;font-size:16px", "#D9C3B0")}` }] },

  // 03 ABOUT, carousel
  { id: "03-who-we-are", kind: "About us", slides: [
    { bg: C.cream, html: `
      <img src="img/sarah-bertuol.webp" class="abs" style="left:70px;top:330px;width:500px;height:640px;object-fit:cover;border-radius:260px 260px 24px 24px">
      <img src="img/marco.webp" class="abs" style="right:70px;top:520px;width:430px;height:560px;object-fit:cover;border-radius:24px 24px 220px 220px">
      <div class="serif abs" style="left:56px;top:70px;font-size:150px">Two founders,</div>
      <div class="serif it abs" style="right:56px;top:1100px;font-size:150px;color:${C.blue}">one studio.</div>
      ${tag("Sarah", "left:80px;top:990px", C.muted)}${tag("Marco", "right:80px;top:470px", C.muted)}` },
    { bg: C.sky, html: `
      ${tag("Sarah Bertuol / co-founder", "left:56px;top:64px")}
      <div class="serif abs" style="left:56px;top:170px;font-size:118px;width:960px;line-height:.95">Sarah runs every project, <span class="it" style="color:${C.blue}">from the first brief to the handoff.</span></div>
      <img src="img/sarah-bertuol.webp" class="abs" style="right:56px;bottom:56px;width:380px;height:380px;object-fit:cover;border-radius:50%">` },
    { bg: C.brown, fg: C.cream, html: `
      ${tag("Marco / co-founder", "left:56px;top:64px", C.butter)}
      <img src="img/marco.webp" class="abs" style="left:56px;top:150px;width:420px;height:520px;object-fit:cover;border-radius:24px">
      <div class="serif abs" style="left:56px;top:740px;font-size:118px;width:960px;line-height:.95">Marco is the other half <span class="it" style="color:${C.butter}">of the studio.</span></div>
      ${tag("We build for clients who need their site<br>to work as hard as they do.", "left:56px;bottom:56px;line-height:1.7;font-size:18px", "#D9C3B0")}` },
  ]},

  // 04 BIG TYPE
  { id: "04-social-rented", kind: "Big type", slides: [{ bg: C.brown, fg: C.cream, html: `
    ${tag("A reminder for 2027", "left:56px;top:64px", C.butter)}
    <div class="serif abs" style="left:56px;top:200px;font-size:96px">Social is rented.</div>
    <div class="serif abs" style="left:56px;top:430px;font-size:300px;color:${C.butter}">Your site</div>
    <div class="serif it abs" style="left:56px;top:700px;font-size:300px;color:${C.butter}">is owned.</div>
    ${tag("Platforms change the rules.<br>Your website is where you set them.", "right:56px;bottom:56px;text-align:right;line-height:1.7;font-size:18px", "#D9C3B0")}` }] },

  // 05 VIDEO, Bruna desktop, bleeding off the edge
  { id: "05-bruna-video", kind: "Video", video: true, slides: [{ bg: C.sky, html: `
    <div class="serif abs" style="left:56px;top:70px;font-size:120px;width:900px">An invitation <span class="it" style="color:${C.blue}">you can scroll.</span></div>
    ${browser("full/bruna-d.png", "brunafagundes.com.br", 140, 420, 1000, 960)}
    ${tag("Law graduation / RSVP and gift list", "left:56px;top:330px")}` }] },

  // 06 PRICE POSTER
  { id: "06-920", kind: "Poster", slides: [{ bg: C.butter, html: `
    <div class="serif abs" style="left:-60px;top:250px;font-size:620px;transform:rotate(-8deg);letter-spacing:-.06em">$920</div>
    ${tag("Small website / one time", "left:56px;top:64px")}
    ${tag("Home", "left:640px;top:150px;transform:rotate(6deg)")}
    ${tag("About", "left:120px;top:960px;transform:rotate(-4deg)")}
    ${tag("Contact", "left:760px;top:930px;transform:rotate(3deg)")}
    ${tag("CMS panel included", "left:380px;top:1080px")}
    ${tag("Live in 24 hours", "left:56px;bottom:56px;background:${C.brown};color:${C.butter};padding:14px 22px;border-radius:40px")}
    ${tag("Fixed price,<br>no hourly surprises", "right:56px;bottom:56px;text-align:right;line-height:1.6;font-size:18px")}` }] },

  // 07 TYPE PLAY
  { id: "07-no-ai-look", kind: "Big type", slides: [{ bg: C.cream, html: `
    ${tag("How we build", "left:56px;top:64px", C.blue)}
    <div class="mono abs" style="left:56px;top:200px;font-size:40px;letter-spacing:.06em">AI-built websites</div>
    <div class="serif it abs" style="left:56px;top:300px;font-size:250px;color:${C.blue}">with no</div>
    <div class="serif abs" style="left:56px;top:540px;font-size:420px;text-decoration:line-through;text-decoration-thickness:22px;text-decoration-color:${C.sunset}">AI</div>
    <div class="serif abs" style="left:480px;top:620px;font-size:300px">look.</div>
    <div class="abs" style="left:56px;bottom:56px;width:560px;font-size:28px;line-height:1.35;color:${C.muted}">Directed by a senior designer and a project manager who knows web businesses.</div>` }] },

  // 08 VIDEO, Eduardo on a phone, giant word behind
  { id: "08-eduardo-video", kind: "Video", video: true, slides: [{ bg: C.cream, html: `
    <div class="serif it abs" style="left:-40px;top:120px;font-size:360px;line-height:.82;color:${C.sky}">two<br>audiences,<br>one site.</div>
    ${phone("full/eduardo-m.png", 7400, 610, 300)}
    ${tag("Eduardo Kayser<br>management consulting", "left:56px;bottom:56px;line-height:1.6")}
    ${tag("eduardokayser.com.br", "right:56px;top:64px;font-size:16px", C.muted)}` }] },

  // 09 24h, Walter peeking (only Walter in the series)
  { id: "09-24h", kind: "Poster", slides: [{ bg: C.sunset, html: `
    <div class="serif abs" style="left:30px;top:60px;font-size:760px;letter-spacing:-.07em">24</div>
    <div class="serif it abs" style="left:640px;top:520px;font-size:300px;color:${C.cream}">h</div>
    <div class="abs" style="left:56px;top:900px;width:620px;font-size:44px;line-height:1.2">From brief to a live site <span class="serif it" style="font-size:56px">on your agency's domain.</span></div>
    <img src="img/04.png" class="walter" style="right:-40px;bottom:-60px;width:330px">` }] },

  // 10 VIDEO, Fabiana desktop, cropped hard
  { id: "10-fabiana-video", kind: "Video", video: true, slides: [{ bg: C.butter, html: `
    ${browser("full/fabiana-d.png", "fabianacampos.com.br", -40, 160, 980, 1230)}
    <div class="serif abs" style="left:56px;top:40px;font-size:84px;width:980px;text-align:right">Warm, personal, <span class="it">plain.</span></div>
    ${tag("Psychologist / portfolio site", "right:56px;top:330px;writing-mode:vertical-rl;white-space:nowrap")}` }] },

  // 11 WORK COLLAGE
  { id: "11-recent-work", kind: "Collage", slides: [{ bg: C.brown, fg: C.cream, html: `
    <div class="card" style="left:-60px;top:120px;width:560px;transform:rotate(-6deg)"><img src="img/wottrich-d0.png"></div>
    <div class="card" style="left:470px;top:60px;width:520px;transform:rotate(4deg)"><img src="img/gampi-d0.png"></div>
    <div class="card" style="left:620px;top:430px;width:520px;transform:rotate(-3deg)"><img src="img/simplifique-d0.png"></div>
    <div class="card" style="left:40px;top:520px;width:560px;transform:rotate(3deg)"><img src="img/bruna-d0.png"></div>
    <div class="card" style="left:-80px;top:900px;width:520px;transform:rotate(-2deg)"><img src="img/envvi-d0.png"></div>
    <div class="card" style="left:500px;top:820px;width:560px;transform:rotate(5deg)"><img src="img/fabiana-d0.png"></div>
    <div class="serif it abs" style="left:56px;top:1130px;font-size:150px;color:${C.butter};text-shadow:0 10px 40px rgba(0,0,0,.4)">Recent work.</div>
    ${tag("Legal / Finance / Events / Psychology / Consulting", "left:60px;top:40px;font-size:16px", C.butter)}` }] },

  // 12 BIG TYPE outline
  { id: "12-2027", kind: "Big type", slides: [{ bg: C.sky, html: `
    <div class="serif abs" style="left:-50px;top:-40px;font-size:640px;color:transparent;-webkit-text-stroke:4px ${C.ink}">20</div>
    <div class="serif abs" style="left:300px;top:420px;font-size:640px;color:${C.ink}">27</div>
    <div class="serif it abs" style="left:56px;top:1060px;font-size:150px;color:${C.blue}">starts fresh.</div>
    ${tag("New year,<br>new site?", "right:56px;top:64px;text-align:right;line-height:1.6")}` }] },

  // 13 VIDEO, Fernando
  { id: "13-fernando-video", kind: "Video", video: true, slides: [{ bg: C.sunset, html: `
    <div class="serif abs" style="left:56px;top:60px;font-size:150px">Built around</div>
    <div class="serif it abs" style="left:300px;top:200px;font-size:150px;color:${C.cream}">the family.</div>
    ${browser("full/fernando-d.png", "fernandokayser.com.br", 56, 470, 1080, 900)}
    ${tag("Life insurance and estate planning", "left:56px;top:400px")}` }] },

  // 14 PROCESS panorama, 3 slides cut from one wide canvas
  { id: "14-process", kind: "Panorama", pano: 3, slides: [{ w: 3240, bg: C.cream, html: `
    <svg class="abs" style="left:0;top:0" width="3240" height="1350"><path d="M-20 1120 C 400 900, 700 1290, 1100 1080 S 1900 860, 2300 1060 S 2900 1260, 3260 980" fill="none" stroke="${C.sunset}" stroke-width="10" stroke-linecap="round"/></svg>
    <div class="serif abs" style="left:56px;top:80px;font-size:200px;line-height:.9">From brief<br><span class="it" style="color:${C.blue}">to live.</span></div>
    ${tag("Swipe →", "left:56px;bottom:56px")}
    ${[["0h", "Brief", "A short form: goal, audience, deadline.", 560, 560],
       ["2h", "Structure", "Page outline, timeline and fixed price.", 1150, 520],
       ["8h", "Design", "Layout and copy, reviewed by a senior designer.", 1640, 160],
       ["16h", "Build and check", "Pages built, forms tested, speed and SEO checked.", 2160, 420],
       ["24h", "Live", "On the domain, with a short handoff for your client.", 2700, 130]]
      .map(([h, t, d, x, y]) => `<div class="abs" style="left:${x}px;top:${y}px;width:440px"><div class="serif" style="font-size:230px">${h}</div><div class="serif it" style="font-size:72px;color:${C.blue};margin-top:10px">${t}</div><div style="font-size:28px;line-height:1.35;color:${C.muted};margin-top:12px">${d}</div></div>`).join("")}
    ${tag("LoWa Studio", "right:56px;bottom:56px")}` }] },

  // 15 FOR AGENCIES
  { id: "15-for-agencies", kind: "Big type", slides: [{ bg: C.cream, html: `
    <div class="serif abs" style="left:56px;top:120px;font-size:200px;line-height:.9">Your <span class="ul">agency.</span></div>
    <div class="serif it abs" style="left:56px;top:330px;font-size:200px;line-height:.9;color:${C.blue}">Our build team.</div>
    <div class="serif it abs" style="right:40px;bottom:-60px;font-size:540px;color:${C.sky}">→</div><div class="abs mono" style="left:56px;top:780px;line-height:2.3;font-size:30px">→ You bring the client<br>→ You keep the relationship<br>→ We design, build and launch<br>→ Fixed price, every time</div>
    ${tag("For small US agencies that sell websites", "left:56px;bottom:56px;font-size:16px", C.muted)}` }] },

  // 16 VIDEO, Envvi on a phone, tilted typography
  { id: "16-envvi-video", kind: "Video", video: true, slides: [{ bg: C.sky, html: `
    ${phone("full/envvi-m.png", 7400, 90, 260)}
    <div class="serif abs" style="left:560px;top:300px;font-size:130px;width:480px;line-height:.92">A long list, <span class="it" style="color:${C.blue}">made easy.</span></div>
    <div class="abs" style="left:560px;top:760px;width:440px;font-size:28px;line-height:1.35">A technical site for an environmental consultancy, with climate and risk services easy to scan.</div>
    ${tag("envvi.com.br", "left:560px;bottom:56px", C.blue)}` }] },

  // 17 FIVE SIGNS, one poster
  { id: "17-five-signs", kind: "List", slides: [{ bg: C.brown, fg: C.cream, html: `
    ${tag("Time for a new site?", "left:56px;top:64px", C.butter)}
    <div class="serif abs" style="left:56px;top:150px;font-size:110px">It's slow on a phone.</div>
    <div class="serif it abs" style="left:200px;top:330px;font-size:84px;color:${C.butter}">It looks like another decade.</div>
    <div class="serif abs" style="left:56px;top:500px;font-size:130px">Nobody can edit it.</div>
    <div class="serif it abs" style="left:120px;top:720px;font-size:84px;color:${C.sunset}">There's no clear next step.</div>
    <div class="serif abs" style="left:56px;top:880px;font-size:96px;width:960px">It doesn't show what you do today.</div>
    ${tag("Two or more? We should talk.", "right:56px;bottom:56px", C.butter)}` }] },
];
if (typeof module !== "undefined") module.exports = { POSTS };
